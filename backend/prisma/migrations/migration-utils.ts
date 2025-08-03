/**
 * =============================================================================
 * Migration Utilities & Rollback Scripts
 * =============================================================================
 * Comprehensive migration management for the School Management System
 * Supports VPS database operations and rollback functionality
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface MigrationInfo {
  id: string;
  checksum: string;
  finished_at: Date | null;
  migration_name: string;
  logs: string | null;
  rolled_back_at: Date | null;
  started_at: Date;
  applied_steps_count: number;
}

interface RollbackOptions {
  targetMigration?: string;
  steps?: number;
  dryRun?: boolean;
  backup?: boolean;
  force?: boolean;
}

interface BackupInfo {
  filename: string;
  path: string;
  timestamp: Date;
  size: number;
  checksum: string;
}

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

class MigrationLogger {
  private static log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [MIGRATION-${level.toUpperCase()}]`;

    if (data) {
      console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  static info(message: string, data?: any) {
    this.log('info', `✅ ${message}`, data);
  }

  static warn(message: string, data?: any) {
    this.log('warn', `⚠️  ${message}`, data);
  }

  static error(message: string, data?: any) {
    this.log('error', `❌ ${message}`, data);
  }

  static debug(message: string, data?: any) {
    this.log('debug', `🔍 ${message}`, data);
  }

  static success(message: string, data?: any) {
    this.log('success', `🎉 ${message}`, data);
  }
}

// =============================================================================
// MIGRATION MANAGEMENT CLASS
// =============================================================================

export class MigrationManager {
  private static readonly MIGRATIONS_DIR = path.join(__dirname, '..');
  private static readonly BACKUPS_DIR = path.join(__dirname, '../backups');

  // Initialize backup directory
  static async initialize(): Promise<void> {
    if (!fs.existsSync(this.BACKUPS_DIR)) {
      fs.mkdirSync(this.BACKUPS_DIR, { recursive: true });
      MigrationLogger.info('Created backups directory');
    }
  }

  // Get current migration status
  static async getCurrentMigrationStatus(): Promise<MigrationInfo[]> {
    try {
      const migrations = await prisma.$queryRaw<MigrationInfo[]>`
        SELECT * FROM "_prisma_migrations" 
        ORDER BY started_at DESC
      `;

      MigrationLogger.info(`Found ${migrations.length} migrations in database`);
      return migrations;
    } catch (error) {
      MigrationLogger.error('Failed to get migration status:', error);
      throw error;
    }
  }

  // Get available migration files
  static getAvailableMigrations(): string[] {
    try {
      const migrationsPath = this.MIGRATIONS_DIR;
      const entries = fs.readdirSync(migrationsPath, { withFileTypes: true });

      const migrations = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => name.match(/^\d{14}_/))
        .sort();

      MigrationLogger.info(`Found ${migrations.length} migration directories`);
      return migrations;
    } catch (error) {
      MigrationLogger.error('Failed to read migration directories:', error);
      throw error;
    }
  }

  // Create database backup
  static async createBackup(name?: string): Promise<BackupInfo> {
    await this.initialize();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name || `backup-${timestamp}`;
    const filename = `${backupName}.sql`;
    const backupPath = path.join(this.BACKUPS_DIR, filename);

    try {
      MigrationLogger.info(`Creating database backup: ${filename}`);

      // Get database URL from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      // Parse database URL to extract connection details
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      // Set PGPASSWORD environment variable for pg_dump
      const env = { ...process.env, PGPASSWORD: password };

      // Create backup using pg_dump
      const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password --verbose --clean --if-exists --create > "${backupPath}"`;

      MigrationLogger.debug('Executing backup command', {
        command: command.replace(password, '***'),
      });

      execSync(command, {
        env,
        stdio: 'pipe',
        cwd: this.BACKUPS_DIR,
      });

      // Get backup file stats
      const stats = fs.statSync(backupPath);
      const checksum = this.calculateFileChecksum(backupPath);

      const backupInfo: BackupInfo = {
        filename,
        path: backupPath,
        timestamp: new Date(),
        size: stats.size,
        checksum,
      };

      MigrationLogger.success(`Backup created successfully`, {
        filename,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        checksum,
      });

      return backupInfo;
    } catch (error) {
      MigrationLogger.error('Failed to create backup:', error);
      throw error;
    }
  }

  // Restore database from backup
  static async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      MigrationLogger.info(
        `Restoring database from backup: ${path.basename(backupPath)}`,
      );

      // Get database URL from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      // Set PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: password };

      // Restore using psql
      const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} --no-password -f "${backupPath}"`;

      MigrationLogger.debug('Executing restore command');

      execSync(command, {
        env,
        stdio: 'pipe',
      });

      MigrationLogger.success('Database restored successfully');
    } catch (error) {
      MigrationLogger.error('Failed to restore backup:', error);
      throw error;
    }
  }

  // Execute migration rollback
  static async rollback(options: RollbackOptions = {}): Promise<void> {
    try {
      MigrationLogger.info('Starting migration rollback process');

      // Validate options
      if (options.targetMigration && options.steps) {
        throw new Error('Cannot specify both targetMigration and steps');
      }

      // Create backup before rollback
      if (options.backup !== false) {
        const backupInfo = await this.createBackup(
          `pre-rollback-${Date.now()}`,
        );
        MigrationLogger.info('Pre-rollback backup created', {
          filename: backupInfo.filename,
        });
      }

      // Get current migration status
      const currentMigrations = await this.getCurrentMigrationStatus();
      const appliedMigrations = currentMigrations.filter(
        m => m.finished_at && !m.rolled_back_at,
      );

      if (appliedMigrations.length === 0) {
        MigrationLogger.warn('No migrations to rollback');
        return;
      }

      // Determine rollback target
      let targetMigrations: MigrationInfo[] = [];

      if (options.targetMigration) {
        const targetIndex = appliedMigrations.findIndex(
          m => m.migration_name === options.targetMigration,
        );
        if (targetIndex === -1) {
          throw new Error(
            `Target migration not found: ${options.targetMigration}`,
          );
        }
        targetMigrations = appliedMigrations.slice(0, targetIndex);
      } else if (options.steps) {
        targetMigrations = appliedMigrations.slice(0, options.steps);
      } else {
        // Default: rollback last migration
        targetMigrations = [appliedMigrations[0]];
      }

      MigrationLogger.info(
        `Planning to rollback ${targetMigrations.length} migration(s)`,
        {
          migrations: targetMigrations.map(m => m.migration_name),
        },
      );

      // Dry run mode
      if (options.dryRun) {
        MigrationLogger.info('Dry run mode - no actual changes will be made');
        return;
      }

      // Confirm rollback unless forced
      if (!options.force) {
        MigrationLogger.warn(
          'This operation will modify the database. Use --force to proceed without confirmation.',
        );
        return;
      }

      // Execute rollback
      for (const migration of targetMigrations) {
        await this.rollbackSingleMigration(migration);
      }

      MigrationLogger.success(
        `Successfully rolled back ${targetMigrations.length} migration(s)`,
      );
    } catch (error) {
      MigrationLogger.error('Rollback failed:', error);
      throw error;
    }
  }

  // Rollback a single migration
  private static async rollbackSingleMigration(
    migration: MigrationInfo,
  ): Promise<void> {
    try {
      MigrationLogger.info(
        `Rolling back migration: ${migration.migration_name}`,
      );

      // Look for rollback script
      const migrationDir = path.join(
        this.MIGRATIONS_DIR,
        migration.migration_name,
      );
      const rollbackScript = path.join(migrationDir, 'rollback.sql');

      if (fs.existsSync(rollbackScript)) {
        // Execute custom rollback script
        const rollbackSql = fs.readFileSync(rollbackScript, 'utf8');
        MigrationLogger.debug('Executing custom rollback script');

        await prisma.$executeRawUnsafe(rollbackSql);
      } else {
        // Try to generate automatic rollback
        MigrationLogger.warn(
          `No rollback script found for ${migration.migration_name}, attempting automatic rollback`,
        );
        await this.attemptAutomaticRollback(migration);
      }

      // Mark migration as rolled back
      await prisma.$executeRaw`
        UPDATE "_prisma_migrations" 
        SET rolled_back_at = NOW() 
        WHERE migration_name = ${migration.migration_name}
      `;

      MigrationLogger.success(
        `Rolled back migration: ${migration.migration_name}`,
      );
    } catch (error) {
      MigrationLogger.error(
        `Failed to rollback migration ${migration.migration_name}:`,
        error,
      );
      throw error;
    }
  }

  // Attempt automatic rollback (limited functionality)
  private static async attemptAutomaticRollback(
    migration: MigrationInfo,
  ): Promise<void> {
    MigrationLogger.warn(
      'Automatic rollback has limited functionality. Consider creating manual rollback scripts.',
    );

    // This is a placeholder for automatic rollback logic
    // In practice, automatic rollback is complex and error-prone
    // It's better to create manual rollback scripts for each migration

    throw new Error(
      `No rollback script available for migration: ${migration.migration_name}. Please create a rollback.sql file in the migration directory.`,
    );
  }

  // Validate migration integrity
  static async validateMigrations(): Promise<boolean> {
    try {
      MigrationLogger.info('Validating migration integrity...');

      const dbMigrations = await this.getCurrentMigrationStatus();
      const fileMigrations = this.getAvailableMigrations();

      // Check for missing migrations
      const missingInDb = fileMigrations.filter(
        file => !dbMigrations.some(db => db.migration_name === file),
      );

      const missingInFiles = dbMigrations.filter(
        db => !fileMigrations.includes(db.migration_name),
      );

      if (missingInDb.length > 0) {
        MigrationLogger.warn(
          'Migrations found in files but not in database:',
          missingInDb,
        );
      }

      if (missingInFiles.length > 0) {
        MigrationLogger.warn(
          'Migrations found in database but not in files:',
          missingInFiles.map(m => m.migration_name),
        );
      }

      const isValid = missingInDb.length === 0 && missingInFiles.length === 0;

      if (isValid) {
        MigrationLogger.success('Migration integrity validation passed');
      } else {
        MigrationLogger.error('Migration integrity validation failed');
      }

      return isValid;
    } catch (error) {
      MigrationLogger.error('Failed to validate migrations:', error);
      return false;
    }
  }

  // Calculate file checksum for backup verification
  private static calculateFileChecksum(filePath: string): string {
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  // List available backups
  static listBackups(): BackupInfo[] {
    try {
      if (!fs.existsSync(this.BACKUPS_DIR)) {
        return [];
      }

      const backupFiles = fs
        .readdirSync(this.BACKUPS_DIR)
        .filter(file => file.endsWith('.sql'))
        .map(filename => {
          const filePath = path.join(this.BACKUPS_DIR, filename);
          const stats = fs.statSync(filePath);
          return {
            filename,
            path: filePath,
            timestamp: stats.mtime,
            size: stats.size,
            checksum: this.calculateFileChecksum(filePath),
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return backupFiles;
    } catch (error) {
      MigrationLogger.error('Failed to list backups:', error);
      return [];
    }
  }

  // Clean old backups
  static async cleanOldBackups(keepCount: number = 10): Promise<void> {
    try {
      const backups = this.listBackups();

      if (backups.length <= keepCount) {
        MigrationLogger.info(
          `Found ${backups.length} backups, no cleanup needed`,
        );
        return;
      }

      const toDelete = backups.slice(keepCount);

      for (const backup of toDelete) {
        fs.unlinkSync(backup.path);
        MigrationLogger.debug(`Deleted old backup: ${backup.filename}`);
      }

      MigrationLogger.success(
        `Cleaned ${toDelete.length} old backups, kept ${keepCount} most recent`,
      );
    } catch (error) {
      MigrationLogger.error('Failed to clean old backups:', error);
      throw error;
    }
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    await prisma.$connect();

    switch (command) {
      case 'status':
        const migrations = await MigrationManager.getCurrentMigrationStatus();
        console.table(
          migrations.map(m => ({
            name: m.migration_name,
            applied: m.finished_at ? 'Yes' : 'No',
            rolled_back: m.rolled_back_at ? 'Yes' : 'No',
            started: m.started_at.toISOString(),
          })),
        );
        break;

      case 'backup':
        const backupName = args[1];
        const backup = await MigrationManager.createBackup(backupName);
        console.log(`Backup created: ${backup.filename}`);
        break;

      case 'restore':
        const backupPath = args[1];
        if (!backupPath) {
          throw new Error('Backup path required');
        }
        await MigrationManager.restoreFromBackup(backupPath);
        break;

      case 'rollback':
        const options: RollbackOptions = {
          targetMigration: args
            .find(arg => arg.startsWith('--target='))
            ?.split('=')[1],
          steps: args.find(arg => arg.startsWith('--steps='))?.split('=')[1]
            ? parseInt(
                args.find(arg => arg.startsWith('--steps='))!.split('=')[1],
              )
            : undefined,
          dryRun: args.includes('--dry-run'),
          backup: !args.includes('--no-backup'),
          force: args.includes('--force'),
        };
        await MigrationManager.rollback(options);
        break;

      case 'validate':
        const isValid = await MigrationManager.validateMigrations();
        process.exit(isValid ? 0 : 1);
        break;

      case 'list-backups':
        const backups = MigrationManager.listBackups();
        console.table(
          backups.map(b => ({
            filename: b.filename,
            size: `${(b.size / 1024 / 1024).toFixed(2)} MB`,
            created: b.timestamp.toISOString(),
          })),
        );
        break;

      case 'clean-backups':
        const keepCount = args[1] ? parseInt(args[1]) : 10;
        await MigrationManager.cleanOldBackups(keepCount);
        break;

      default:
        console.log(`
Usage: npm run migration:utils <command> [options]

Commands:
  status                    - Show migration status
  backup [name]            - Create database backup
  restore <path>           - Restore from backup
  rollback [options]       - Rollback migrations
    --target=<migration>   - Rollback to specific migration
    --steps=<number>       - Rollback number of steps
    --dry-run             - Show what would be done
    --no-backup           - Skip backup creation
    --force               - Execute without confirmation
  validate                 - Validate migration integrity
  list-backups            - List available backups
  clean-backups [keep]    - Clean old backups (default: keep 10)
        `);
    }
  } catch (error) {
    MigrationLogger.error('Command failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

// Exports are already declared above as export class
