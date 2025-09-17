/**
 * =============================================================================
 * Backup Service
 * =============================================================================
 * Service for handling backup and restore operations
 * =============================================================================
 */

import { apiClient } from '../client/apiClient';
import { httpClient } from '../client/http-client';

// Types
export interface CreateBackupRequest {
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  clientId?: string;
  encrypt?: boolean;
  clientKey?: string;
  outputDir?: string;
  backupName?: string;
  includePaths?: string[];
  excludePaths?: string[];
}

export interface BackupMetadata {
  id: string;
  backupId: string;
  clientId?: string;
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  size: string; // BigInt as string
  location: string;
  encrypted: boolean;
  encryptionKey?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  metadata?: any;
  createdAt: string;
  updatedAt?: string;
  createdById?: string;
}

export interface RestoreBackupRequest {
  backupId?: string;
  clientKey?: string;
  targetDir?: string;
  overwrite?: boolean;
  restoreDatabase?: boolean;
  restoreFiles?: boolean;
  restoreConfig?: boolean;
  dropExisting?: boolean;
}

export interface BackupStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalSize: string; // BigInt as string
  oldestBackup?: string;
  newestBackup?: string;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RestorePreview {
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  size: number;
  contents: string[];
  willRestore: {
    database: boolean;
    files: string[];
    config: string[];
  };
}

export interface CleanupBackupsRequest {
  clientId?: string;
  retentionDays?: number;
  maxBackups?: number;
  type?: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
}

export interface CleanupResult {
  deleted: number;
  errors: string[];
}

export interface CreateScheduleRequest {
  name: string;
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  clientId?: string;
  encrypt?: boolean;
  clientKey?: string;
  retentionDays?: number;
  maxBackups?: number;
  enabled?: boolean;
}

export interface BackupScheduleMetadata {
  id: string;
  name: string;
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  enabled: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  clientId?: string;
  encrypt: boolean;
  clientKey?: string;
  retentionDays: number;
  maxBackups: number;
  lastRun?: string;
  nextRun?: string;
  lastStatus?: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  lastBackupId?: string;
  createdAt: string;
  updatedAt?: string;
  createdById?: string;
}

// Dashboard-specific interfaces
export interface BackupServiceStatus {
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  lastBackup?: string;
  activeBackups: number;
  scheduledBackups: number;
  errors: string[];
}

export interface StorageUsage {
  total: number;
  used: number;
  free: number;
  breakdown: {
    database: number;
    files: number;
    fullSystem: number;
  };
  percentUsed: number;
}

export interface OffsiteStatus {
  connected: boolean;
  lastSync?: string;
  syncedBackups: number;
  pendingSync: number;
  errors: string[];
  provider?: string;
}

export interface OffsiteConnectionTest {
  connected: boolean;
  message: string;
  responseTime?: number;
  lastTested: string;
}

// Settings interfaces
export interface BackupSettings {
  encryption: {
    enableEncryption: boolean;
    clientEncryptionKey?: string;
    keyRotationEnabled: boolean;
    keyRotationDays: number;
    keyCreatedAt?: string;
    keyUpdatedAt?: string;
  };
  offsite: {
    enableOffsiteBackup: boolean;
    provider: 'ssh' | 's3' | 'azure' | 'gcp';
    remoteHost?: string;
    username?: string;
    remotePath?: string;
    sshKeyPath?: string;
    encryptInTransit: boolean;
    syncFrequency: 'immediate' | 'hourly' | 'daily';
    lastSync?: string;
    connectionStatus: 'connected' | 'disconnected' | 'error';
  };
  advanced: {
    compressionLevel: 'none' | 'low' | 'medium' | 'high';
    parallelOperations: number;
    backupNotifications: string[];
    enableProgressTracking: boolean;
    enablePreRestoreSnapshot: boolean;
    maxRetryAttempts: number;
    backupTimeout: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    updatedBy?: string;
    version: string;
  };
}

export interface EncryptionKeyData {
  key: string;
  keyId: string;
  algorithm: string;
  createdAt: string;
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

export interface SSHKeyConfig {
  success: boolean;
  keyFingerprint: string;
}

export interface BackupDashboardData {
  stats: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalSize: string; // BigInt converted to string
    oldestBackup?: string;
    newestBackup?: string;
  };
  serviceStatus: BackupServiceStatus;
  storageUsage: StorageUsage;
  recentBackups: BackupMetadata[];
  offsiteStatus: OffsiteStatus;
  lastUpdated: string;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Backup Service Class
 */
export class BackupService {
  private readonly baseUrl = '/api/v1/backup';
  private readonly scheduleUrl = '/api/v1/backup/schedule';
  private readonly settingsUrl = '/api/v1/backup/settings';

  /**
   * Create a new backup
   */
  async createBackup(
    request: CreateBackupRequest,
  ): Promise<ApiResponse<BackupMetadata>> {
    try {
      // Set timeout based on backup type - full system backups take much longer
      const timeout =
        request.type === 'FULL_SYSTEM'
          ? 15 * 60 * 1000 // 15 minutes for full system backup
          : request.type === 'FILES'
            ? 5 * 60 * 1000 // 5 minutes for files backup
            : 2 * 60 * 1000; // 2 minutes for database backup

      const response = await httpClient.post<BackupMetadata>(
        `${this.baseUrl}/create`,
        request,
        { timeout },
      );
      return response;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * List all backups
   */
  async listBackups(params?: {
    clientId?: string;
    type?: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<BackupMetadata[]>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupMetadata[]>>(
        `${this.baseUrl}/list`,
        params,
      );
      return response.data;
    } catch (error) {
      console.error('Error listing backups:', error);
      throw error;
    }
  }

  /**
   * Get backup details
   */
  async getBackupDetails(
    backupId: string,
  ): Promise<ApiResponse<BackupMetadata>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupMetadata>>(
        `${this.baseUrl}/${backupId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting backup details:', error);
      throw error;
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(
    backupId: string,
  ): Promise<ApiResponse<BackupValidationResult>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupValidationResult>>(
        `${this.baseUrl}/${backupId}/validate`,
      );
      return response.data;
    } catch (error) {
      console.error('Error validating backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(
    request: RestoreBackupRequest,
  ): Promise<ApiResponse<void>> {
    try {
      // Use httpClient directly for better timeout control
      const response = await httpClient.post<void>(
        `${this.baseUrl}/restore`,
        request,
        {
          timeout: 10 * 60 * 1000, // 10 minutes timeout for restore operations
        },
      );
      return response;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  /**
   * Restore from uploaded file
   */
  async restoreFromUploadedFile(
    file: File,
    request: RestoreBackupRequest,
  ): Promise<ApiResponse<void>> {
    try {
      const formData = new FormData();
      formData.append('backupFile', file);

      // Append other fields
      Object.entries(request).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Use httpClient for proper CSRF token handling and authentication
      const response = await httpClient.post<void>(
        `${this.baseUrl}/restore/upload`,
        formData,
        {
          timeout: 10 * 60 * 1000, // 10 minutes timeout for restore operations
          headers: {
            // Let browser set Content-Type for FormData with boundary
          },
        },
      );

      return response;
    } catch (error) {
      console.error('Error restoring from uploaded file:', error);
      throw error;
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `${this.baseUrl}/${backupId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  /**
   * Cleanup old backups
   */
  async cleanupBackups(
    request: CleanupBackupsRequest,
  ): Promise<ApiResponse<CleanupResult>> {
    try {
      const response = await apiClient.post<ApiResponse<CleanupResult>>(
        `${this.baseUrl}/cleanup`,
        request,
      );
      return response.data;
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(clientId?: string): Promise<ApiResponse<BackupStats>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupStats>>(
        `${this.baseUrl}/stats`,
        clientId ? { clientId } : undefined,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting backup stats:', error);
      throw error;
    }
  }

  /**
   * Get restore preview
   */
  async getRestorePreview(
    backupId: string,
    clientKey?: string,
  ): Promise<ApiResponse<RestorePreview>> {
    try {
      // Use httpClient with proper timeout and parameter handling
      const params = clientKey ? { clientKey } : {};
      const response = await httpClient.get<RestorePreview>(
        `${this.baseUrl}/${backupId}/preview`,
        params,
        {
          timeout: 30 * 1000, // 30 seconds timeout for preview
        },
      );
      return response;
    } catch (error) {
      console.error('Error getting restore preview:', error);
      throw error;
    }
  }

  /**
   * Download backup file
   */
  async downloadBackup(backupId: string, clientKey?: string): Promise<void> {
    try {
      // Create download URL with proper base URL
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const downloadUrl = new URL(
        `${baseUrl}${this.baseUrl}/${backupId}/download`,
      );

      if (clientKey) {
        downloadUrl.searchParams.set('clientKey', clientKey);
      }

      // Use credentials: 'include' to send authentication cookies
      const response = await fetch(downloadUrl.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Backup not found');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else {
          throw new Error(`Download failed: ${response.statusText}`);
        }
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const filename =
        response.headers
          .get('content-disposition')
          ?.split('filename=')[1]
          ?.replace(/"/g, '') || `backup-${backupId}.tar.gz`;

      // Create temporary link to trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: string | number): string {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hrs ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Create a backup schedule
   */
  async createSchedule(
    request: CreateScheduleRequest,
  ): Promise<ApiResponse<BackupScheduleMetadata>> {
    try {
      const response = await apiClient.post<
        ApiResponse<BackupScheduleMetadata>
      >(`${this.scheduleUrl}`, request);
      return response.data;
    } catch (error) {
      console.error('Error creating backup schedule:', error);
      throw error;
    }
  }

  /**
   * Get all backup schedules
   */
  async getSchedules(): Promise<ApiResponse<BackupScheduleMetadata[]>> {
    try {
      const response = await apiClient.get<
        ApiResponse<BackupScheduleMetadata[]>
      >(`${this.scheduleUrl}`);
      return response.data;
    } catch (error) {
      console.error('Error getting backup schedules:', error);
      throw error;
    }
  }

  /**
   * Update a backup schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<CreateScheduleRequest>,
  ): Promise<ApiResponse<BackupScheduleMetadata>> {
    try {
      const response = await apiClient.put<ApiResponse<BackupScheduleMetadata>>(
        `${this.scheduleUrl}/${scheduleId}`,
        updates,
      );
      return response.data;
    } catch (error) {
      console.error('Error updating backup schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a backup schedule
   */
  async deleteSchedule(scheduleId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `${this.scheduleUrl}/${scheduleId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting backup schedule:', error);
      throw error;
    }
  }

  /**
   * Toggle schedule enabled/disabled
   */
  async toggleSchedule(
    scheduleId: string,
    enabled: boolean,
  ): Promise<ApiResponse<BackupScheduleMetadata>> {
    try {
      const response = await apiClient.post<
        ApiResponse<BackupScheduleMetadata>
      >(`${this.scheduleUrl}/${scheduleId}/toggle`, { enabled });
      return response.data;
    } catch (error) {
      console.error('Error toggling backup schedule:', error);
      throw error;
    }
  }

  /**
   * Run a schedule immediately
   */
  async runScheduleNow(scheduleId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        `${this.scheduleUrl}/${scheduleId}/run-now`,
      );
      return response.data;
    } catch (error) {
      console.error('Error running backup schedule:', error);
      throw error;
    }
  }

  /**
   * Get backup dashboard overview
   */
  async getDashboard(
    clientId?: string,
  ): Promise<ApiResponse<BackupDashboardData>> {
    try {
      const queryParams = clientId ? `?clientId=${clientId}` : '';
      const response = await apiClient.get<ApiResponse<BackupDashboardData>>(
        `${this.baseUrl}/dashboard${queryParams}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get backup service status
   */
  async getServiceStatus(): Promise<ApiResponse<BackupServiceStatus>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupServiceStatus>>(
        `${this.baseUrl}/service/status`,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting service status:', error);
      throw error;
    }
  }

  /**
   * Get storage usage breakdown
   */
  async getStorageUsage(): Promise<ApiResponse<StorageUsage>> {
    try {
      const response = await apiClient.get<ApiResponse<StorageUsage>>(
        `${this.baseUrl}/storage/usage`,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting storage usage:', error);
      throw error;
    }
  }

  /**
   * Get recent backups for dashboard
   */
  async getRecentBackupsForDashboard(
    limit?: number,
    clientId?: string,
  ): Promise<ApiResponse<BackupMetadata[]>> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (clientId) params.append('clientId', clientId);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<ApiResponse<BackupMetadata[]>>(
        `${this.baseUrl}/recent${queryString}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting recent backups:', error);
      throw error;
    }
  }

  /**
   * Get offsite backup status
   */
  async getOffsiteStatus(): Promise<ApiResponse<OffsiteStatus>> {
    try {
      const response = await apiClient.get<ApiResponse<OffsiteStatus>>(
        `${this.baseUrl}/offsite/status`,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting offsite status:', error);
      throw error;
    }
  }

  /**
   * Test offsite connection
   */
  async testOffsiteConnection(): Promise<ApiResponse<OffsiteConnectionTest>> {
    try {
      const response = await apiClient.post<ApiResponse<OffsiteConnectionTest>>(
        `${this.baseUrl}/test-connection`,
      );
      return response.data;
    } catch (error) {
      console.error('Error testing offsite connection:', error);
      throw error;
    }
  }

  /**
   * Reset backup settings to defaults
   */
  async resetToDefaults(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        `${this.baseUrl}/settings/reset`,
      );
      return response.data;
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      throw error;
    }
  }

  /**
   * Get scheduler health status
   */
  async getSchedulerHealth(): Promise<
    ApiResponse<{
      isInitialized: boolean;
      activeJobs: number;
      enabledSchedules: number;
      lastCleanup?: string;
      uptime: number;
      errors: string[];
    }>
  > {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/schedule/health`,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting scheduler health:', error);
      throw error;
    }
  }

  /**
   * Perform scheduler maintenance
   */
  async performSchedulerMaintenance(): Promise<
    ApiResponse<{
      reloadedJobs: number;
      cleanedBackups: number;
      updatedNextRuns: number;
    }>
  > {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/schedule/maintenance`,
      );
      return response.data;
    } catch (error) {
      console.error('Error performing scheduler maintenance:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policies
   */
  async cleanupOldBackups(): Promise<
    ApiResponse<{
      totalSchedules: number;
      cleanedBackups: number;
      errors: string[];
    }>
  > {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(
        `${this.baseUrl}/schedule/cleanup`,
      );
      return response.data;
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      throw error;
    }
  }

  /**
   * Settings Management Methods
   */

  /**
   * Get backup settings
   */
  async getBackupSettings(): Promise<ApiResponse<BackupSettings>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupSettings>>(
        this.settingsUrl,
      );
      return response.data;
    } catch (error) {
      console.error('Error getting backup settings:', error);
      throw error;
    }
  }

  /**
   * Update backup settings
   */
  async updateBackupSettings(
    settings: Partial<BackupSettings>,
  ): Promise<ApiResponse<BackupSettings>> {
    try {
      const response = await apiClient.put<ApiResponse<BackupSettings>>(
        this.settingsUrl,
        settings,
      );
      return response.data;
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
        `${this.settingsUrl}/encryption/generate-key`,
      );
      return response.data;
    } catch (error) {
      console.error('Error generating encryption key:', error);
      throw error;
    }
  }

  /**
   * Test offsite backup connection
   */
  async testOffsiteBackupConnection(): Promise<
    ApiResponse<ConnectionTestResult>
  > {
    try {
      const response = await apiClient.post<ApiResponse<ConnectionTestResult>>(
        `${this.settingsUrl}/offsite/test-connection`,
      );
      return response.data;
    } catch (error) {
      console.error('Error testing offsite connection:', error);
      throw error;
    }
  }

  /**
   * Configure SSH key for offsite backup
   */
  async configureSSHKey(config: {
    publicKey: string;
    privateKeyPath?: string;
  }): Promise<ApiResponse<SSHKeyConfig>> {
    try {
      const response = await apiClient.post<ApiResponse<SSHKeyConfig>>(
        `${this.settingsUrl}/offsite/configure-ssh`,
        config,
      );
      return response.data;
    } catch (error) {
      console.error('Error configuring SSH key:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettingsToDefaults(): Promise<ApiResponse<BackupSettings>> {
    try {
      const response = await apiClient.post<ApiResponse<BackupSettings>>(
        `${this.settingsUrl}/reset-defaults`,
      );
      return response.data;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Validate current settings
   */
  async validateBackupSettings(): Promise<ApiResponse<SettingsValidation>> {
    try {
      const response = await apiClient.get<ApiResponse<SettingsValidation>>(
        `${this.settingsUrl}/validation`,
      );
      return response.data;
    } catch (error) {
      console.error('Error validating settings:', error);
      throw error;
    }
  }

  formatScheduleFrequency(frequency: string): string {
    switch (frequency) {
      case 'DAILY':
        return 'Daily';
      case 'WEEKLY':
        return 'Weekly';
      case 'MONTHLY':
        return 'Monthly';
      default:
        return frequency;
    }
  }

  formatNextRun(nextRun?: string): string {
    if (!nextRun) return 'Not scheduled';
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMs > 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `In ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Overdue';
    }
  }
}

// Export singleton instance
export const backupService = new BackupService();
