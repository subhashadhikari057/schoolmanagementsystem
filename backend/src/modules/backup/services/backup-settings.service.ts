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
      // Try to load from database first
      const dbSettings = await this.loadSettingsFromDatabase();
      if (dbSettings) {
        return dbSettings;
      }

      // Fallback to file system
      const fileSettings = await this.loadSettingsFromFile();
      if (fileSettings) {
        // Migrate to database
        await this.saveSettingsToDatabase(fileSettings);
        return fileSettings;
      }

      // Return default settings
      return this.getDefaultSettings();
    } catch (error) {
      this.logger.error('Failed to get settings:', error);
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

      // Save to database and file
      await Promise.all([
        this.saveSettingsToDatabase(updatedSettings),
        this.saveSettingsToFile(updatedSettings),
      ]);

      this.logger.log(`Settings updated by user ${userId}`);
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
      const algorithm = 'aes-256-gcm';
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

      this.logger.log(`New encryption key generated by user ${userId}`);

      return {
        key,
        keyId,
        algorithm,
        createdAt,
        warning: 'Store this key securely. It cannot be recovered if lost.',
      };
    } catch (error) {
      this.logger.error('Failed to generate encryption key:', error);
      throw error;
    }
  }

  /**
   * Test offsite backup connection
   */
  async testOffsiteConnection(): Promise<ConnectionTestResult> {
    try {
      const settings = await this.getSettings();
      const { offsite } = settings;

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

      // Update connection status in settings
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

    try {
      // Get SSH configuration from database
      const sshConfig = offsiteConfig.sshConfig;
      if (!sshConfig) {
        throw new Error(
          'SSH configuration not found. Please configure SSH authentication first.',
        );
      }

      let sshCmd: string;
      const authOptions: string[] = [
        '-o ConnectTimeout=10',
        '-o StrictHostKeyChecking=no',
        '-o UserKnownHostsFile=/dev/null',
        '-o LogLevel=ERROR',
      ];

      if (sshConfig.keyType === 'privateKey' && sshConfig.privateKey) {
        // Use SSH key authentication
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');

        // Create temporary key file
        const tempKeyPath = path.join(os.tmpdir(), `ssh_key_${Date.now()}`);
        fs.writeFileSync(tempKeyPath, sshConfig.privateKey, { mode: 0o600 });

        try {
          authOptions.push(`-i ${tempKeyPath}`);
          authOptions.push('-o BatchMode=yes'); // No password prompts for key auth

          sshCmd = `ssh ${authOptions.join(' ')} ${offsiteConfig.username}@${offsiteConfig.remoteHost} 'echo "connection_test"'`;
          const { stdout } = await execAsync(sshCmd);

          if (stdout.trim() === 'connection_test') {
            result.details.authentication = 'success';
            result.connected = true;
          }
        } finally {
          // Clean up temporary key file
          if (fs.existsSync(tempKeyPath)) {
            fs.unlinkSync(tempKeyPath);
          }
        }
      } else if (sshConfig.keyType === 'password' && sshConfig.password) {
        // Use password authentication with sshpass
        try {
          // Check if sshpass is available
          await execAsync('which sshpass');

          authOptions.push('-o BatchMode=no'); // Allow password prompts
          authOptions.push('-o PasswordAuthentication=yes');

          sshCmd = `sshpass -p '${sshConfig.password}' ssh ${authOptions.join(' ')} ${offsiteConfig.username}@${offsiteConfig.remoteHost} 'echo "connection_test"'`;
          const { stdout } = await execAsync(sshCmd);

          if (stdout.trim() === 'connection_test') {
            result.details.authentication = 'success';
            result.connected = true;
          }
        } catch (_sshpassError) {
          // Fallback: Try expect script for password authentication
          const expectScript = `
            spawn ssh ${authOptions.join(' ')} ${offsiteConfig.username}@${offsiteConfig.remoteHost} "echo connection_test"
            expect {
              "password:" {
                send "${sshConfig.password}\\r"
                expect "connection_test"
                send "exit\\r"
              }
              "Connection refused" { exit 1 }
              "Permission denied" { exit 1 }
              timeout { exit 1 }
            }
          `;

          try {
            const { stdout } = await execAsync(`expect -c '${expectScript}'`);
            if (stdout.includes('connection_test')) {
              result.details.authentication = 'success';
              result.connected = true;
            }
          } catch (_expectError) {
            throw new Error(
              `Password authentication failed. Please ensure sshpass or expect is installed, or use SSH key authentication instead.`,
            );
          }
        }
      } else {
        throw new Error(
          'Invalid SSH configuration. Please configure either SSH key or password authentication.',
        );
      }

      // If authentication succeeded, test path and permissions
      if (result.connected && offsiteConfig.remotePath) {
        const baseCmd =
          sshConfig.keyType === 'privateKey'
            ? `ssh ${authOptions.join(' ')} ${offsiteConfig.username}@${offsiteConfig.remoteHost}`
            : `sshpass -p '${sshConfig.password}' ssh ${authOptions.join(' ')} ${offsiteConfig.username}@${offsiteConfig.remoteHost}`;

        try {
          // Test path accessibility
          const pathCmd = `${baseCmd} 'test -d "${offsiteConfig.remotePath}" && echo "path_exists"'`;
          const { stdout: pathResult } = await execAsync(pathCmd);
          result.details.path_accessible = pathResult.trim() === 'path_exists';

          // Test write permissions
          const permCmd = `${baseCmd} 'test -w "${offsiteConfig.remotePath}" && echo "write" || echo "read"'`;
          const { stdout: permResult } = await execAsync(permCmd);
          result.details.permissions =
            permResult.trim() === 'write' ? 'read_write' : 'read';

          // Get actual disk space
          const spaceCmd = `${baseCmd} 'df -h "${offsiteConfig.remotePath}" | tail -1 | awk "{print \\$4}"'`;
          const { stdout: spaceResult } = await execAsync(spaceCmd);
          const availableSpace = spaceResult.trim();
          if (availableSpace) {
            result.details.diskSpace = availableSpace;
          }
        } catch (pathError) {
          this.logger.warn('Path/permission test failed:', pathError.message);
          // Don't fail the entire test if path tests fail
        }
      }
    } catch (error) {
      this.logger.error('SSH connection test failed:', error);
      result.details.authentication = 'failed';
      result.error = error.message;
    }

    return result;
  }

  private async validateSettingsData(
    settings: BackupSettings,
  ): Promise<SettingsValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate encryption settings
    if (settings.encryption.enableEncryption) {
      if (!settings.encryption.clientEncryptionKey) {
        errors.push('Encryption is enabled but no key is provided');
      } else if (settings.encryption.clientEncryptionKey.length < 32) {
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
      // Implementation would depend on your database schema
      // For now, return null to fallback to file system
      return null;
    } catch (error) {
      this.logger.warn('Failed to load settings from database:', error);
      return null;
    }
  }

  private async saveSettingsToDatabase(
    _settings: BackupSettings,
  ): Promise<void> {
    try {
      // Implementation would depend on your database schema
      // This is a placeholder for future database storage
      this.logger.debug('Settings saved to database');
    } catch (error) {
      this.logger.warn('Failed to save settings to database:', error);
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
