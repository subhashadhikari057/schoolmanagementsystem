/**
 * =============================================================================
 * Backup Settings Service
 * =============================================================================
 * Manages backup system configuration and settings
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Client as SSHClient } from 'ssh2';

const execAsync = promisify(exec);

export interface BackupSettings {
  encryption: {
    enableEncryption: boolean;
    clientEncryptionKey?: string;
    keyRotationEnabled: boolean;
    keyRotationDays: number;
    keyCreatedAt?: Date;
    keyUpdatedAt?: Date;
  };
  offsite: {
    enableOffsiteBackup: boolean;
    provider: 'ssh' | 's3' | 'azure' | 'gcp';
    remoteHost?: string;
    username?: string;
    remotePath?: string;
    sshKeyPath?: string;
    sshConfig?: {
      keyType: 'password' | 'privateKey';
      privateKey?: string;
      passphrase?: string;
      password?: string;
      keyName?: string;
      keyFingerprint?: string;
      createdAt?: string;
    };
    encryptInTransit: boolean;
    syncFrequency: 'immediate' | 'hourly' | 'daily';
    backupLocation?: 'local' | 'offsite' | 'both';
    lastSync?: Date;
    connectionStatus: 'connected' | 'disconnected' | 'error';
  };
  advanced: {
    compressionLevel: 'none' | 'low' | 'medium' | 'high';
    parallelOperations: number;
    backupNotifications: string[];
    enableProgressTracking: boolean;
    enablePreRestoreSnapshot: boolean;
    maxRetryAttempts: number;
    backupTimeout: number; // seconds
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    updatedBy?: string;
    version: string;
  };
}

export interface EncryptionKeyData {
  key: string;
  keyId: string;
  algorithm: string;
  createdAt: Date;
  warning: string;
}

export interface ConnectionTestResult {
  connected: boolean;
  responseTime?: number;
  error?: string;
  details: {
    host: string;
    port: number;
    authentication: 'success' | 'failed' | 'not_tested';
    path_accessible: boolean;
    permissions: 'read' | 'write' | 'read_write' | 'none';
    diskSpace?: string;
  };
}

export interface SettingsValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

@Injectable()
export class BackupSettingsService {
  private readonly logger = new Logger(BackupSettingsService.name);
  private readonly settingsFilePath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.settingsFilePath = this.configService.get<string>(
      'BACKUP_SETTINGS_PATH',
      path.join(process.cwd(), 'config', 'backup-settings.json'),
    );
  }

  /**
   * Get current backup settings
   */
  async getSettings(): Promise<BackupSettings> {
    try {
      // Load from database ONLY
      const dbSettings = await this.loadSettingsFromDatabase();

      if (dbSettings) {
        this.logger.log('✅ Settings loaded from DATABASE');
        this.logger.log(
          `Encryption enabled: ${dbSettings.encryption.enableEncryption}`,
        );
        this.logger.log(
          `Encryption key exists: ${!!dbSettings.encryption.clientEncryptionKey}`,
        );
        return dbSettings;
      }

      // Return default settings if nothing in DB
      this.logger.log('⚠️ No settings in database, returning defaults');
      return this.getDefaultSettings();
    } catch (error) {
      this.logger.error('❌ Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Update backup settings
   */
  async updateSettings(
    updates: Partial<BackupSettings>,
    userId: string,
  ): Promise<BackupSettings> {
    try {
      const currentSettings = await this.getSettings();

      const updatedSettings: BackupSettings = {
        ...currentSettings,
        ...updates,
        metadata: {
          ...currentSettings.metadata,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      };

      // Validate settings
      const validation = await this.validateSettingsData(updatedSettings);
      if (!validation.valid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
      }

      // Save to database ONLY (no file fallback)
      await this.saveSettingsToDatabase(updatedSettings);

      this.logger.log(`✅ Settings saved to DATABASE by user ${userId}`);
      this.logger.log(
        `Encryption enabled: ${updatedSettings.encryption.enableEncryption}`,
      );
      this.logger.log(
        `Encryption key exists: ${!!updatedSettings.encryption.clientEncryptionKey}`,
      );
      return updatedSettings;
    } catch (error) {
      this.logger.error('Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Generate new encryption key
   */
  async generateEncryptionKey(userId: string): Promise<EncryptionKeyData> {
    try {
      const keyId = crypto.randomUUID();
      const key = crypto.randomBytes(32).toString('hex');
      const algorithm = 'AES-256-GCM';
      const createdAt = new Date();

      // Update settings with new key
      const currentSettings = await this.getSettings();
      await this.updateSettings(
        {
          encryption: {
            ...currentSettings.encryption,
            clientEncryptionKey: key,
            keyCreatedAt: createdAt,
            keyUpdatedAt: createdAt,
          },
        },
        userId,
      );

      this.logger.log(
        `New AES-256-GCM encryption key generated by user ${userId}`,
      );

      return {
        key,
        keyId,
        algorithm,
        createdAt,
        warning:
          'Store this key securely. It cannot be recovered if lost. Uses AES-256-GCM with authenticated encryption.',
      };
    } catch (error) {
      this.logger.error('Failed to generate encryption key:', error);
      throw error;
    }
  }

  /**
   * Test offsite backup connection
   */
  async testOffsiteConnection(
    providedSettings?: any,
  ): Promise<ConnectionTestResult> {
    try {
      // Use provided settings or load from database
      let offsite: any;

      if (providedSettings) {
        // Use settings from the request (not yet saved)
        offsite = {
          provider: providedSettings.provider || 'ssh',
          remoteHost: providedSettings.remoteHost,
          username: providedSettings.username,
          remotePath: providedSettings.remotePath || '/backups',
          sshConfig: providedSettings.sshConfig || {},
          ...providedSettings,
        };
      } else {
        // Load from database
        const settings = await this.getSettings();
        offsite = settings.offsite;
      }

      // Validate required connection settings
      if (!offsite.remoteHost) {
        throw new Error('Remote host is required for connection test');
      }

      if (!offsite.username) {
        throw new Error('Username is required for connection test');
      }

      const startTime = Date.now();
      let result: ConnectionTestResult = {
        connected: false,
        details: {
          host: offsite.remoteHost,
          port: 22, // Default SSH port
          authentication: 'not_tested',
          path_accessible: false,
          permissions: 'none',
        },
      };

      if (offsite.provider === 'ssh') {
        result = await this.testSSHConnection(offsite);
      } else {
        throw new Error(`Provider ${offsite.provider} not yet implemented`);
      }

      result.responseTime = Date.now() - startTime;

      // Only update connection status in settings if using saved settings
      if (!providedSettings) {
        await this.updateSettings(
          {
            offsite: {
              ...offsite,
              connectionStatus: result.connected ? 'connected' : 'error',
              lastSync: result.connected ? new Date() : offsite.lastSync,
            },
          },
          'system',
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to test offsite connection:', error);
      return {
        connected: false,
        error: error.message,
        details: {
          host: '',
          port: 22,
          authentication: 'failed',
          path_accessible: false,
          permissions: 'none',
        },
      };
    }
  }

  /**
   * Create remote backup folder on offsite server
   */
  async createRemoteFolder(
    remoteHost: string,
    username: string,
    password: string,
    remotePath: string,
  ): Promise<{ success: boolean; message: string; created: boolean }> {
    return new Promise(resolve => {
      const conn = new SSHClient();
      const connectionTimeout = setTimeout(() => {
        conn.end();
        resolve({
          success: false,
          message: 'Connection timeout (10 seconds)',
          created: false,
        });
      }, 10000);

      conn.on('ready', () => {
        clearTimeout(connectionTimeout);
        this.logger.log(
          `✅ Connected to ${remoteHost}, creating folder: ${remotePath}`,
        );

        // Create the directory with proper permissions
        const createCmd = `mkdir -p "${remotePath}" && chmod 755 "${remotePath}" && echo "CREATED"`;

        conn.exec(createCmd, (err, stream) => {
          if (err) {
            conn.end();
            resolve({
              success: false,
              message: `Failed to create folder: ${err.message}`,
              created: false,
            });
            return;
          }

          let output = '';
          let errorOutput = '';

          stream.on('data', (data: Buffer) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });

          stream.on('close', (code: number) => {
            conn.end();

            if (code === 0 && output.trim() === 'CREATED') {
              this.logger.log(`✅ Folder created successfully: ${remotePath}`);
              resolve({
                success: true,
                message: `Backup folder created successfully at ${remotePath}`,
                created: true,
              });
            } else {
              this.logger.error(
                `❌ Failed to create folder. Exit code: ${code}, Error: ${errorOutput}`,
              );
              resolve({
                success: false,
                message: errorOutput || 'Failed to create folder',
                created: false,
              });
            }
          });
        });
      });

      conn.on('error', (err: Error) => {
        clearTimeout(connectionTimeout);
        this.logger.error('SSH connection error:', err.message);
        resolve({
          success: false,
          message: `Connection failed: ${err.message}`,
          created: false,
        });
      });

      // Connect with password authentication
      conn.connect({
        host: remoteHost,
        port: 22,
        username: username,
        password: password,
        readyTimeout: 10000,
      });
    });
  }

  /**
   * Configure SSH key for offsite backup
   */
  async configureSSHKey(
    config: { publicKey: string; privateKeyPath?: string },
    userId: string,
  ): Promise<{ success: boolean; keyFingerprint: string }> {
    try {
      const settings = await this.getSettings();
      const sshDir = path.join(process.cwd(), '.ssh');

      // Ensure SSH directory exists
      await fs.mkdir(sshDir, { recursive: true, mode: 0o700 });

      // Generate key pair if not provided
      let privateKeyPath = config.privateKeyPath;
      if (!privateKeyPath) {
        const keyName = `backup_key_${Date.now()}`;
        privateKeyPath = path.join(sshDir, keyName);

        // Generate SSH key pair
        await execAsync(
          `ssh-keygen -t rsa -b 4096 -f "${privateKeyPath}" -N "" -C "backup@school-system"`,
        );
      }

      // Calculate key fingerprint
      const { stdout } = await execAsync(
        `ssh-keygen -lf "${privateKeyPath}.pub"`,
      );
      const keyFingerprint = stdout.split(' ')[1];

      // Update settings
      await this.updateSettings(
        {
          offsite: {
            ...settings.offsite,
            sshKeyPath: privateKeyPath,
          },
        },
        userId,
      );

      this.logger.log(`SSH key configured by user ${userId}`);

      return {
        success: true,
        keyFingerprint,
      };
    } catch (error) {
      this.logger.error('Failed to configure SSH key:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(userId: string): Promise<BackupSettings> {
    try {
      const defaultSettings = this.getDefaultSettings();
      defaultSettings.metadata.updatedBy = userId;
      defaultSettings.metadata.updatedAt = new Date();

      await Promise.all([
        this.saveSettingsToDatabase(defaultSettings),
        this.saveSettingsToFile(defaultSettings),
      ]);

      this.logger.log(`Settings reset to defaults by user ${userId}`);
      return defaultSettings;
    } catch (error) {
      this.logger.error('Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * Validate current settings
   */
  async validateSettings(): Promise<SettingsValidation> {
    try {
      const settings = await this.getSettings();
      return await this.validateSettingsData(settings);
    } catch (error) {
      this.logger.error('Failed to validate settings:', error);
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
        recommendations: [],
      };
    }
  }

  /**
   * Private methods
   */

  private async testSSHConnection(
    offsiteConfig: BackupSettings['offsite'],
  ): Promise<ConnectionTestResult> {
    const result: ConnectionTestResult = {
      connected: false,
      details: {
        host: offsiteConfig.remoteHost || '',
        port: 22,
        authentication: 'not_tested',
        path_accessible: false,
        permissions: 'none',
      },
    };

    return new Promise(resolve => {
      const conn = new SSHClient();
      const connectionTimeout = setTimeout(() => {
        conn.end();
        result.details.authentication = 'failed';
        result.error = 'Connection timeout (10 seconds)';
        resolve(result);
      }, 10000);

      conn.on('ready', async () => {
        clearTimeout(connectionTimeout);
        this.logger.log(
          `✅ SSH connection successful to ${offsiteConfig.remoteHost}`,
        );
        result.connected = true;
        result.details.authentication = 'success';

        // Test remote path if provided
        if (offsiteConfig.remotePath) {
          try {
            const pathTests = await this.testRemotePath(
              conn,
              offsiteConfig.remotePath,
            );
            result.details.path_accessible = pathTests.exists;
            result.details.permissions = pathTests.writable
              ? 'read_write'
              : 'read';
            result.details.diskSpace = pathTests.diskSpace;
          } catch (pathError) {
            this.logger.warn('Path test failed:', pathError.message);
          }
        }

        conn.end();
        resolve(result);
      });

      conn.on('error', (err: Error) => {
        clearTimeout(connectionTimeout);
        this.logger.error('SSH connection error:', err.message);
        result.details.authentication = 'failed';
        result.error = err.message;
        resolve(result);
      });

      // Get SSH configuration
      const sshConfig = offsiteConfig.sshConfig as
        | {
            password?: string;
            privateKey?: string;
            passphrase?: string;
            keyType?: 'password' | 'privateKey';
            keyName?: string;
            keyFingerprint?: string;
            createdAt?: string;
          }
        | undefined;

      // Prepare connection config
      const connConfig: {
        host: string;
        port: number;
        username: string;
        readyTimeout: number;
        password?: string;
        privateKey?: string;
        passphrase?: string;
      } = {
        host: offsiteConfig.remoteHost || '',
        port: 22,
        username: offsiteConfig.username || '',
        readyTimeout: 10000,
      };

      // Use password authentication if provided
      if (sshConfig?.password) {
        connConfig.password = sshConfig.password;
        this.logger.log(
          `🔑 Connecting with password authentication to ${offsiteConfig.remoteHost}`,
        );
      }
      // Use private key authentication if provided
      else if (sshConfig?.privateKey) {
        connConfig.privateKey = sshConfig.privateKey;
        if (sshConfig.passphrase) {
          connConfig.passphrase = sshConfig.passphrase;
        }
        this.logger.log(
          `🔑 Connecting with key authentication to ${offsiteConfig.remoteHost}`,
        );
      } else {
        clearTimeout(connectionTimeout);
        result.details.authentication = 'failed';
        result.error =
          'No authentication method provided (password or private key required)';
        resolve(result);
        return;
      }

      // Attempt connection
      try {
        conn.connect(connConfig);
      } catch (error) {
        clearTimeout(connectionTimeout);
        this.logger.error('Failed to initiate SSH connection:', error);
        result.details.authentication = 'failed';
        result.error = error.message;
        resolve(result);
      }
    });
  }

  /**
   * Test remote path accessibility and permissions via SSH
   */
  private async testRemotePath(
    conn: SSHClient,
    remotePath: string,
  ): Promise<{ exists: boolean; writable: boolean; diskSpace?: string }> {
    return new Promise((resolve, reject) => {
      let exists = false;
      let writable = false;
      let diskSpace: string | undefined;

      // Test if path exists
      conn.exec(
        `test -d "${remotePath}" && echo "EXISTS" || echo "NOT_EXISTS"`,
        (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          let output = '';
          stream.on('data', (data: Buffer) => {
            output += data.toString();
          });

          stream.on('close', () => {
            exists = output.trim() === 'EXISTS';

            if (!exists) {
              resolve({ exists: false, writable: false });
              return;
            }

            // Test write permissions
            conn.exec(
              `test -w "${remotePath}" && echo "WRITABLE" || echo "READONLY"`,
              (err2, stream2) => {
                if (err2) {
                  resolve({ exists, writable: false });
                  return;
                }

                let output2 = '';
                stream2.on('data', (data: Buffer) => {
                  output2 += data.toString();
                });

                stream2.on('close', () => {
                  writable = output2.trim() === 'WRITABLE';

                  // Get disk space
                  conn.exec(
                    `df -h "${remotePath}" | tail -1 | awk '{print $4}'`,
                    (err3, stream3) => {
                      if (err3) {
                        resolve({ exists, writable });
                        return;
                      }

                      let output3 = '';
                      stream3.on('data', (data: Buffer) => {
                        output3 += data.toString();
                      });

                      stream3.on('close', () => {
                        diskSpace = output3.trim();
                        resolve({ exists, writable, diskSpace });
                      });
                    },
                  );
                });
              },
            );
          });
        },
      );
    });
  }

  private async validateSettingsData(
    settings: BackupSettings,
  ): Promise<SettingsValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate encryption settings
    if (settings.encryption.enableEncryption) {
      // Allow empty key initially - will be generated via modal
      if (
        settings.encryption.clientEncryptionKey &&
        settings.encryption.clientEncryptionKey.length > 0 &&
        settings.encryption.clientEncryptionKey.length < 32
      ) {
        warnings.push('Encryption key should be at least 32 characters long');
      }
    }

    // Validate offsite settings
    if (settings.offsite.enableOffsiteBackup) {
      if (!settings.offsite.remoteHost) {
        errors.push(
          'Offsite backup is enabled but no remote host is specified',
        );
      }
      if (!settings.offsite.username) {
        errors.push('Offsite backup is enabled but no username is specified');
      }
      if (!settings.offsite.remotePath) {
        warnings.push('No remote path specified for offsite backup');
      }
    }

    // Validate advanced settings
    if (settings.advanced.parallelOperations > 8) {
      warnings.push(
        'High parallel operations count may impact system performance',
      );
    }
    if (settings.advanced.backupTimeout < 300) {
      warnings.push('Backup timeout is very low and may cause backup failures');
    }

    // Recommendations
    if (!settings.encryption.enableEncryption) {
      recommendations.push('Consider enabling encryption for better security');
    }
    if (!settings.offsite.enableOffsiteBackup) {
      recommendations.push(
        'Consider enabling offsite backup for disaster recovery',
      );
    }
    if (settings.advanced.compressionLevel === 'none') {
      recommendations.push(
        'Consider enabling compression to reduce backup size',
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  private getDefaultSettings(): BackupSettings {
    return {
      encryption: {
        enableEncryption: false,
        keyRotationEnabled: false,
        keyRotationDays: 90,
      },
      offsite: {
        enableOffsiteBackup: false,
        provider: 'ssh',
        encryptInTransit: true,
        syncFrequency: 'daily',
        backupLocation: 'both',
        connectionStatus: 'disconnected',
      },
      advanced: {
        compressionLevel: 'medium',
        parallelOperations: 2,
        backupNotifications: [],
        enableProgressTracking: true,
        enablePreRestoreSnapshot: true,
        maxRetryAttempts: 3,
        backupTimeout: 3600, // 1 hour
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
      },
    };
  }

  private async loadSettingsFromDatabase(): Promise<BackupSettings | null> {
    try {
      const dbSettings = await (this.prisma as any).backupSettings.findFirst();

      this.logger.log(`🔍 DATABASE QUERY - Found: ${!!dbSettings}`);
      if (dbSettings) {
        this.logger.log(`DB Record - ID: ${dbSettings.id}`);
        this.logger.log(
          `DB Record - Encryption: ${dbSettings.enableEncryption}, Key: ${dbSettings.clientEncryptionKey ? 'EXISTS' : 'NULL'}`,
        );
      }

      if (!dbSettings) {
        return null;
      }

      // Map database record to BackupSettings interface
      const settings: BackupSettings = {
        encryption: {
          enableEncryption: dbSettings.enableEncryption,
          clientEncryptionKey: dbSettings.clientEncryptionKey || undefined,
          keyRotationEnabled: false, // Not used
          keyRotationDays: 90, // Not used
          keyCreatedAt: dbSettings.keyCreatedAt || undefined,
          keyUpdatedAt: dbSettings.keyUpdatedAt || undefined,
        },
        offsite: {
          enableOffsiteBackup: dbSettings.enableOffsiteBackup,
          provider: dbSettings.offsiteProvider as
            | 'ssh'
            | 's3'
            | 'azure'
            | 'gcp',
          remoteHost: dbSettings.remoteHost || undefined,
          username: dbSettings.username || undefined,
          remotePath: dbSettings.remotePath || undefined,
          sshKeyPath: dbSettings.sshKeyPath || undefined,
          sshConfig: dbSettings.sshConfig as any,
          encryptInTransit: dbSettings.encryptInTransit,
          syncFrequency: dbSettings.syncFrequency as
            | 'immediate'
            | 'hourly'
            | 'daily',
          backupLocation: dbSettings.backupLocation as
            | 'local'
            | 'offsite'
            | 'both',
          lastSync: dbSettings.lastSync || undefined,
          connectionStatus: dbSettings.connectionStatus as
            | 'connected'
            | 'disconnected'
            | 'error',
        },
        advanced: {
          compressionLevel: dbSettings.compressionLevel as
            | 'none'
            | 'low'
            | 'medium'
            | 'high',
          parallelOperations: dbSettings.parallelOperations,
          backupNotifications: dbSettings.backupNotifications,
          enableProgressTracking: dbSettings.enableProgressTracking,
          enablePreRestoreSnapshot: dbSettings.enablePreRestoreSnapshot,
          maxRetryAttempts: dbSettings.maxRetryAttempts,
          backupTimeout: dbSettings.backupTimeout,
        },
        metadata: {
          createdAt: dbSettings.createdAt,
          updatedAt: dbSettings.updatedAt,
          updatedBy: dbSettings.updatedBy || undefined,
          version: dbSettings.version,
        },
      };

      this.logger.debug('Settings loaded from database');
      return settings;
    } catch (error) {
      this.logger.warn('Failed to load settings from database:', error);
      return null;
    }
  }

  private async saveSettingsToDatabase(
    settings: BackupSettings,
  ): Promise<void> {
    try {
      // Check if a settings record exists
      const existing = await (this.prisma as any).backupSettings.findFirst();

      const data = {
        enableEncryption: settings.encryption.enableEncryption,
        clientEncryptionKey: settings.encryption.clientEncryptionKey,
        keyRotationEnabled: false, // Not used in UI
        keyRotationDays: 90, // Not used in UI
        keyCreatedAt: settings.encryption.keyCreatedAt || null,
        keyUpdatedAt: settings.encryption.keyUpdatedAt || null,
        enableOffsiteBackup: settings.offsite.enableOffsiteBackup,
        offsiteProvider: settings.offsite.provider,
        remoteHost: settings.offsite.remoteHost,
        username: settings.offsite.username,
        remotePath: settings.offsite.remotePath,
        sshKeyPath: settings.offsite.sshKeyPath,
        sshConfig: settings.offsite.sshConfig,
        encryptInTransit: settings.offsite.encryptInTransit,
        syncFrequency: settings.offsite.syncFrequency,
        backupLocation: settings.offsite.backupLocation,
        lastSync: settings.offsite.lastSync,
        connectionStatus: settings.offsite.connectionStatus,
        compressionLevel: settings.advanced.compressionLevel,
        parallelOperations: settings.advanced.parallelOperations,
        backupNotifications: settings.advanced.backupNotifications,
        enableProgressTracking: settings.advanced.enableProgressTracking,
        enablePreRestoreSnapshot: settings.advanced.enablePreRestoreSnapshot,
        maxRetryAttempts: settings.advanced.maxRetryAttempts,
        backupTimeout: settings.advanced.backupTimeout,
        updatedBy: settings.metadata.updatedBy,
        version: settings.metadata.version,
      };

      if (existing) {
        // Update existing record
        await (this.prisma as any).backupSettings.update({
          where: { id: existing.id },
          data,
        });
        this.logger.log(`✅ DATABASE UPDATED - ID: ${existing.id}`);
        this.logger.log(
          `Encryption: ${data.enableEncryption}, Key: ${data.clientEncryptionKey ? 'EXISTS' : 'NULL'}`,
        );
      } else {
        // Create new record
        const created = await (this.prisma as any).backupSettings.create({
          data,
        });
        this.logger.log(`✅ DATABASE CREATED - ID: ${created.id}`);
        this.logger.log(
          `Encryption: ${data.enableEncryption}, Key: ${data.clientEncryptionKey ? 'EXISTS' : 'NULL'}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to save settings to database:', error);
      throw error;
    }
  }

  private async loadSettingsFromFile(): Promise<BackupSettings | null> {
    try {
      const data = await fs.readFile(this.settingsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.warn('Failed to load settings from file:', error);
      }
      return null;
    }
  }

  private async saveSettingsToFile(settings: BackupSettings): Promise<void> {
    try {
      const dir = path.dirname(this.settingsFilePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        this.settingsFilePath,
        JSON.stringify(settings, null, 2),
      );
    } catch (error) {
      this.logger.error('Failed to save settings to file:', error);
      throw error;
    }
  }
}
