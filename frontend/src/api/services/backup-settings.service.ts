/**
 * =============================================================================
 * Backup Settings Service
 * =============================================================================
 * Frontend API service for backup settings management
 * =============================================================================
 */

import { apiClient } from '../client/apiClient';

// Types
export interface EncryptionSettings {
  enableEncryption: boolean;
  clientEncryptionKey?: string;
  keyRotationEnabled: boolean;
  keyRotationDays: number;
  keyCreatedAt?: Date;
  keyUpdatedAt?: Date;
}

export interface SSHConfig {
  keyType: 'password' | 'privateKey';
  privateKey?: string;
  passphrase?: string;
  password?: string;
  keyName?: string;
  keyFingerprint?: string;
  createdAt?: string;
}

export interface OffsiteSettings {
  enableOffsiteBackup: boolean;
  provider: 'ssh' | 's3' | 'azure' | 'gcp';
  remoteHost?: string;
  username?: string;
  remotePath?: string;
  sshKeyPath?: string;
  sshConfig?: SSHConfig;
  encryptInTransit: boolean;
  syncFrequency: 'immediate' | 'hourly' | 'daily';
  backupLocation?: 'local' | 'offsite' | 'both';
  lastSync?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export interface AdvancedSettings {
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  parallelOperations: number;
  backupNotifications: string[];
  enableProgressTracking: boolean;
  enablePreRestoreSnapshot: boolean;
  maxRetryAttempts: number;
  backupTimeout: number;
}

export interface BackupSettings {
  encryption: EncryptionSettings;
  offsite: OffsiteSettings;
  advanced: AdvancedSettings;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    updatedBy?: string;
    version: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface EncryptionKeyData {
  key: string;
  keyId: string;
  algorithm?: string;
  createdAt: Date | string;
  expiresAt?: Date;
  warning?: string;
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
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export class BackupSettingsService {
  private readonly baseUrl = 'api/v1/backup/settings';

  /**
   * Get current backup settings
   */
  async getSettings(): Promise<ApiResponse<BackupSettings>> {
    try {
      const response = await apiClient.get<any>(this.baseUrl);
      const apiResponse = response.data;

      // Check if response.data is already wrapped with success/data
      // If not, wrap it (backend returns {success, data} but axios strips outer wrapper)
      if (apiResponse.success !== undefined && apiResponse.data !== undefined) {
        // Already wrapped: {success: true, data: {...}}
        return apiResponse as ApiResponse<BackupSettings>;
      } else {
        // Backend returned settings directly: {encryption: {...}, offsite: {...}, ...}
        // Wrap it
        return {
          success: true,
          data: apiResponse as BackupSettings,
        };
      }
    } catch (error: any) {
      console.error('Error fetching backup settings:', error);
      throw error;
    }
  }

  /**
   * Update backup settings
   */
  async updateSettings(
    settings: Partial<BackupSettings>,
  ): Promise<ApiResponse<BackupSettings>> {
    try {
      const response = await apiClient.put<ApiResponse<BackupSettings>>(
        this.baseUrl,
        settings,
      );

      // Backend returns settings directly, not wrapped in { success, data }
      const data = response.data as unknown;

      // If response doesn't have 'success' field, wrap it
      if (
        typeof (data as ApiResponse<BackupSettings>).success === 'undefined'
      ) {
        return {
          success: true,
          data: data as BackupSettings,
        };
      }

      return data as ApiResponse<BackupSettings>;
    } catch (error) {
      console.error('Error updating backup settings:', error);
      throw error;
    }
  }

  /**
   * Generate new encryption key
   */
  async generateEncryptionKey(): Promise<ApiResponse<EncryptionKeyData>> {
    try {
      const response = await apiClient.post<ApiResponse<EncryptionKeyData>>(
        `${this.baseUrl}/encryption/generate-key`,
      );
      return response.data;
    } catch (error) {
      console.error('Error generating encryption key:', error);
      throw error;
    }
  }

  /**
   * Rotate encryption key
   */
  async rotateEncryptionKey(): Promise<ApiResponse<EncryptionKeyData>> {
    try {
      const response = await apiClient.post<ApiResponse<EncryptionKeyData>>(
        `${this.baseUrl}/encryption/rotate-key`,
      );
      return response.data;
    } catch (error) {
      console.error('Error rotating encryption key:', error);
      throw error;
    }
  }

  /**
   * Test offsite connection
   */
  async testOffsiteConnection(
    settings?: Partial<OffsiteSettings>,
  ): Promise<ApiResponse<ConnectionTestResult>> {
    try {
      const response = await apiClient.post<ApiResponse<ConnectionTestResult>>(
        `${this.baseUrl}/offsite/test-connection`,
        settings,
      );
      return response.data;
    } catch (error) {
      console.error('Error testing offsite connection:', error);
      throw error;
    }
  }

  /**
   * Create remote backup folder
   */
  async createRemoteFolder(
    remoteHost: string,
    username: string,
    password: string,
    remotePath: string,
  ): Promise<
    ApiResponse<{ success: boolean; message: string; created: boolean }>
  > {
    try {
      const response = await apiClient.post<
        ApiResponse<{ success: boolean; message: string; created: boolean }>
      >(`${this.baseUrl}/offsite/create-folder`, {
        remoteHost,
        username,
        password,
        remotePath,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating remote folder:', error);
      throw error;
    }
  }

  /**
   * Configure SSH key
   */
  async configureSSHKey(sshConfig: SSHConfig): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/offsite/configure-ssh`,
        sshConfig,
      );
      return response.data;
    } catch (error) {
      console.error('Error configuring SSH key:', error);
      throw error;
    }
  }

  /**
   * Generate SSH key pair
   */
  async generateSSHKey(
    keyName: string,
    passphrase?: string,
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/offsite/generate-ssh-key`,
        { keyName, passphrase },
      );
      return response.data;
    } catch (error) {
      console.error('Error generating SSH key:', error);
      throw error;
    }
  }

  /**
   * Validate settings configuration
   */
  async validateSettings(
    settings: Partial<BackupSettings>,
  ): Promise<ApiResponse<SettingsValidation>> {
    try {
      const response = await apiClient.post<ApiResponse<SettingsValidation>>(
        `${this.baseUrl}/validate`,
        settings,
      );
      return response.data;
    } catch (error) {
      console.error('Error validating settings:', error);
      throw error;
    }
  }

  /**
   * Export settings configuration
   */
  async exportSettings(): Promise<Blob> {
    try {
      const response = await fetch(
        `${window.location.origin}/${this.baseUrl}/export`,
        {
          method: 'GET',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to export settings');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings configuration
   */
  async importSettings(file: File): Promise<ApiResponse<BackupSettings>> {
    try {
      const formData = new FormData();
      formData.append('settingsFile', file);

      const response = await apiClient.post<ApiResponse<BackupSettings>>(
        `${this.baseUrl}/import`,
        formData,
      );
      return response.data;
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Update encryption settings
   */
  async updateEncryptionSettings(
    settings: Partial<EncryptionSettings>,
  ): Promise<ApiResponse<EncryptionSettings>> {
    try {
      const response = await apiClient.put<ApiResponse<EncryptionSettings>>(
        `${this.baseUrl}/encryption`,
        settings,
      );
      return response.data;
    } catch (error) {
      console.error('Error updating encryption settings:', error);
      throw error;
    }
  }

  /**
   * Update offsite settings
   */
  async updateOffsiteSettings(
    settings: Partial<OffsiteSettings>,
  ): Promise<ApiResponse<OffsiteSettings>> {
    try {
      const response = await apiClient.put<ApiResponse<OffsiteSettings>>(
        `${this.baseUrl}/offsite`,
        settings,
      );
      return response.data;
    } catch (error) {
      console.error('Error updating offsite settings:', error);
      throw error;
    }
  }

  /**
   * Update advanced settings
   */
  async updateAdvancedSettings(
    settings: Partial<AdvancedSettings>,
  ): Promise<ApiResponse<AdvancedSettings>> {
    try {
      const response = await apiClient.put<ApiResponse<AdvancedSettings>>(
        `${this.baseUrl}/advanced`,
        settings,
      );
      return response.data;
    } catch (error) {
      console.error('Error updating advanced settings:', error);
      throw error;
    }
  }

  /**
   * Get encryption key status
   */
  async getEncryptionKeyStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/encryption/key-status`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching encryption key status:', error);
      throw error;
    }
  }

  /**
   * Get offsite connection history
   */
  async getOffsiteConnectionHistory(): Promise<
    ApiResponse<ConnectionTestResult[]>
  > {
    try {
      const response = await apiClient.get<ApiResponse<ConnectionTestResult[]>>(
        `${this.baseUrl}/offsite/connection-history`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching offsite connection history:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<ApiResponse<BackupSettings>> {
    try {
      const response = await apiClient.post<ApiResponse<BackupSettings>>(
        '/api/v1/backup/settings/reset-defaults',
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reset settings',
      };
    }
  }
}

// Export singleton instance
export const backupSettingsService = new BackupSettingsService();
