import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { EncryptionService } from './encryption.service';

const execAsync = promisify(exec);

export interface DatabaseBackupOptions {
  clientId?: string;
  encrypt?: boolean;
  clientKey?: string;
  outputDir?: string;
  backupName?: string;
}

export interface DatabaseBackupResult {
  backupId: string;
  location: string;
  size: number;
  encrypted: boolean;
  timestamp: Date;
}

@Injectable()
export class DatabaseBackupService {
  private readonly logger = new Logger(DatabaseBackupService.name);
  private readonly backupDir: string;

  constructor(private readonly encryptionService: EncryptionService) {
    this.backupDir = path.join(process.cwd(), 'backups', 'database');
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Create a database backup using pg_dump
   */
  async createBackup(
    options: DatabaseBackupOptions = {},
  ): Promise<DatabaseBackupResult> {
    const backupId = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    try {
      this.logger.log(`Starting database backup: ${backupId}`);

      // Get database connection details from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      const url = new URL(databaseUrl);
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbName = url.pathname.slice(1); // Remove leading slash
      const dbUser = url.username;
      const dbPassword = url.password;

      // Create backup file paths
      const outputDir = options.outputDir || this.backupDir;
      const backupName = options.backupName || `${backupId}.sql`;

      // Handle case where backupName already includes .gz extension
      let sqlFilePath: string;
      let gzFilePath: string;

      if (backupName.endsWith('.gz')) {
        // backupName is already the final compressed filename
        gzFilePath = path.join(outputDir, backupName);
        sqlFilePath = gzFilePath.replace('.gz', '');
      } else {
        // backupName is the SQL filename, add .gz for compressed version
        sqlFilePath = path.join(outputDir, backupName);
        gzFilePath = `${sqlFilePath}.gz`;
      }

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Set PGPASSWORD environment variable for pg_dump
      const env = { ...process.env, PGPASSWORD: dbPassword };

      // Create pg_dump command
      const pgDumpCmd = [
        'pg_dump',
        `--host=${dbHost}`,
        `--port=${dbPort}`,
        `--username=${dbUser}`,
        '--verbose',
        '--clean',
        '--no-owner',
        '--no-privileges',
        '--format=plain',
        `--file=${sqlFilePath}`,
        dbName,
      ].join(' ');

      this.logger.log(`Executing pg_dump command for database: ${dbName}`);

      // Execute pg_dump
      const { stderr } = await execAsync(pgDumpCmd, {
        env,
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      });

      if (stderr && !stderr.includes('NOTICE')) {
        this.logger.warn(`pg_dump stderr: ${stderr}`);
      }

      this.logger.log('Database dump completed, compressing...');

      // Compress the SQL file
      await pipeline(
        createReadStream(sqlFilePath),
        zlib.createGzip({ level: 9 }),
        createWriteStream(gzFilePath),
      );

      // Remove uncompressed SQL file
      await fs.unlink(sqlFilePath);

      let finalPath = gzFilePath;
      let encrypted = false;

      // Encrypt if requested
      if (options.encrypt && options.clientKey) {
        const encryptedPath = `${gzFilePath}.enc`;
        await this.encryptionService.encryptFile(
          gzFilePath,
          encryptedPath,
          options.clientKey,
        );
        await fs.unlink(gzFilePath); // Remove unencrypted file
        finalPath = encryptedPath;
        encrypted = true;
        this.logger.log('Database backup encrypted');
      }

      // Get final file size
      const stats = await fs.stat(finalPath);
      const size = stats.size;

      this.logger.log(
        `Database backup completed: ${finalPath} (${size} bytes)`,
      );

      return {
        backupId,
        location: finalPath,
        size,
        encrypted,
        timestamp,
      };
    } catch (error) {
      this.logger.error(`Database backup failed for ${backupId}:`, error);
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(
    backupFilePath: string,
    options: { clientKey?: string; dropExisting?: boolean } = {},
  ): Promise<void> {
    try {
      this.logger.log(`Starting database restore from: ${backupFilePath}`);

      let sqlFilePath = backupFilePath;

      // Decrypt if needed
      if (backupFilePath.endsWith('.enc') && options.clientKey) {
        const decryptedPath = backupFilePath.replace('.enc', '');
        await this.encryptionService.decryptFile(
          backupFilePath,
          decryptedPath,
          options.clientKey,
        );
        sqlFilePath = decryptedPath;
        this.logger.log('Backup file decrypted');
      }

      // Decompress if needed
      if (sqlFilePath.endsWith('.gz')) {
        const uncompressedPath = sqlFilePath.replace('.gz', '');
        await pipeline(
          createReadStream(sqlFilePath),
          zlib.createGunzip(),
          createWriteStream(uncompressedPath),
        );
        sqlFilePath = uncompressedPath;
        this.logger.log('Backup file decompressed');
      }

      // Get database connection details
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      const url = new URL(databaseUrl);
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbPassword = url.password;

      const env = { ...process.env, PGPASSWORD: dbPassword };

      // Drop existing database if requested
      if (options.dropExisting) {
        this.logger.log('Dropping existing database...');
        const dropCmd = `psql --host=${dbHost} --port=${dbPort} --username=${dbUser} --command="DROP DATABASE IF EXISTS ${dbName};"`;
        await execAsync(dropCmd, { env });

        const createCmd = `psql --host=${dbHost} --port=${dbPort} --username=${dbUser} --command="CREATE DATABASE ${dbName};"`;
        await execAsync(createCmd, { env });
      }

      // Restore database
      this.logger.log('Restoring database...');
      const restoreCmd = `psql --host=${dbHost} --port=${dbPort} --username=${dbUser} --dbname=${dbName} --file=${sqlFilePath}`;

      const { stderr } = await execAsync(restoreCmd, {
        env,
        maxBuffer: 1024 * 1024 * 100,
      });

      if (stderr && !stderr.includes('NOTICE')) {
        this.logger.warn(`psql stderr: ${stderr}`);
      }

      // Clean up temporary files
      if (sqlFilePath !== backupFilePath) {
        await fs.unlink(sqlFilePath);
      }
      if (backupFilePath.endsWith('.enc') && sqlFilePath.endsWith('.gz')) {
        await fs.unlink(sqlFilePath.replace('.sql', '.sql.gz'));
      }

      this.logger.log('Database restore completed successfully');
    } catch (error) {
      this.logger.error(`Database restore failed:`, error);
      throw new Error(`Database restore failed: ${error.message}`);
    }
  }

  /**
   * Validate if a backup file is a valid database backup
   */
  async validateBackup(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<boolean> {
    try {
      let sqlFilePath = backupFilePath;

      // Decrypt if needed
      if (backupFilePath.endsWith('.enc') && clientKey) {
        const tempDecryptPath = `${backupFilePath}.temp_decrypt`;
        await this.encryptionService.decryptFile(
          backupFilePath,
          tempDecryptPath,
          clientKey,
        );
        sqlFilePath = tempDecryptPath;
      }

      // Decompress and read first few lines to validate
      if (sqlFilePath.endsWith('.gz')) {
        const readStream = createReadStream(sqlFilePath).pipe(
          zlib.createGunzip(),
        );
        const chunks: Buffer[] = [];

        for await (const chunk of readStream) {
          chunks.push(chunk);
          if (chunks.length > 10) break; // Read first few chunks
        }

        const content = Buffer.concat(chunks).toString();
        const isValid =
          content.includes('PostgreSQL database dump') ||
          content.includes('CREATE TABLE') ||
          content.includes('INSERT INTO');

        // Clean up temp file
        if (sqlFilePath !== backupFilePath) {
          await fs.unlink(sqlFilePath);
        }

        return isValid;
      }

      return false;
    } catch (error) {
      this.logger.error('Backup validation failed:', error);
      return false;
    }
  }

  /**
   * List available database backups
   */
  async listBackups(): Promise<
    Array<{ path: string; size: number; created: Date; encrypted: boolean }>
  > {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: Array<{
        path: string;
        size: number;
        created: Date;
        encrypted: boolean;
      }> = [];

      for (const file of files) {
        if (
          file.includes('db_') &&
          (file.endsWith('.sql.gz') || file.endsWith('.sql.gz.enc'))
        ) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);

          backups.push({
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            encrypted: file.endsWith('.enc'),
          });
        }
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      this.logger.error('Failed to list backups:', error);
      return [];
    }
  }
}
