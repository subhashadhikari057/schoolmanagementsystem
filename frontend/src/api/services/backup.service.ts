/**
 * =============================================================================
 * Backup Service
 * =============================================================================
 * Frontend API service for backup operations
 * =============================================================================
 */

import { apiClient } from '../client/apiClient';

// Types
export interface BackupStats {
  totalBackups: number;
  totalSize: string;
  lastBackupDate: string;
  successRate: number;
}

export interface ServiceStatus {
  backupService: 'Running' | 'Stopped' | 'Error';
  lastBackup: string;
  storageUsed: string;
  offsiteStatus: 'Connected' | 'Disconnected' | 'Error';
}

export interface StorageUsage {
  totalStorage: string;
  databaseBackups: string;
  fileBackups: string;
  available: string;
  usagePercentage: number;
}

export interface BackupItem {
  id: string;
  type: 'Full Backup' | 'Database Backup' | 'Files Backup';
  date: string;
  time: string;
  size: string;
  status: 'Both' | 'Local' | 'Offsite';
  encrypted: boolean;
  location: string;
}

export interface CreateBackupRequest {
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  encrypt?: boolean;
  clientKey?: string;
  backupName?: string;
}

export interface RestoreBackupRequest {
  backupId?: string;
  clientKey?: string;
  overwrite?: boolean;
  restoreDatabase?: boolean;
  restoreFiles?: boolean;
  restoreConfig?: boolean;
  dropExisting?: boolean;
  detectedType?: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  isEncrypted?: boolean;
  originalFilename?: string;
}

export interface BackupDashboard {
  stats: BackupStats;
  serviceStatus: ServiceStatus;
  storageUsage: StorageUsage;
  recentBackups: BackupItem[];
  offsiteStatus: Record<string, unknown>;
  lastUpdated: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class BackupService {
  private readonly baseUrl = 'api/v1/backup';

  /**
   * Get backup dashboard overview
   */
  async getDashboard(): Promise<ApiResponse<BackupDashboard>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupDashboard>>(
        `${this.baseUrl}/dashboard`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching backup dashboard:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getStats(): Promise<ApiResponse<BackupStats>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupStats>>(
        `${this.baseUrl}/stats`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching backup stats:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<ApiResponse<ServiceStatus>> {
    try {
      const response = await apiClient.get<ApiResponse<ServiceStatus>>(
        `${this.baseUrl}/service/status`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching service status:', error);
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
      console.error('Error fetching storage usage:', error);
      throw error;
    }
  }

  /**
   * Get recent backups
   */
  async getRecentBackups(
    limit: number = 10,
  ): Promise<ApiResponse<BackupItem[]>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupItem[]>>(
        `${this.baseUrl}/recent`,
        { limit },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recent backups:', error);
      throw error;
    }
  }

  /**
   * List all backups
   */
  async listBackups(params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<BackupItem[]>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupItem[]>>(
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
   * Create a new backup
   */
  async createBackup(
    request: CreateBackupRequest,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.post<Record<string, unknown>>(
        `${this.baseUrl}/create`,
        request,
      );
      return response;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(
    request: RestoreBackupRequest,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.post<Record<string, unknown>>(
        `${this.baseUrl}/restore`,
        request,
      );
      return response;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  /**
   * Upload and restore from file
   */
  async uploadAndRestore(
    file: File,
    options: {
      clientKey?: string;
      overwrite?: boolean;
      restoreDatabase?: boolean;
      restoreFiles?: boolean;
      restoreConfig?: boolean;
      detectedType?: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
      isEncrypted?: boolean;
      originalFilename?: string;
    },
  ): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const formData = new FormData();
      formData.append('backupFile', file);

      // Add options as form fields
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await apiClient.post<Record<string, unknown>>(
        `${this.baseUrl}/restore/upload`,
        formData,
      );
      return response;
    } catch (error) {
      console.error('Error uploading and restoring backup:', error);
      throw error;
    }
  }

  async getActiveOperations(): Promise<ApiResponse<string[]>> {
    try {
      const response = await apiClient.get<string[]>(
        `${this.baseUrl}/progress/active`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching active operations:', error);
      throw error;
    }
  }

  async getCurrentProgress(
    operationId: string,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `${this.baseUrl}/progress/current/${operationId}`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching progress snapshot:', error);
      throw error;
    }
  }

  async getProgressHistory(
    operationId: string,
  ): Promise<ApiResponse<Record<string, unknown>[]>> {
    try {
      const response = await apiClient.get<Record<string, unknown>[]>(
        `${this.baseUrl}/progress/history/${operationId}`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching progress history:', error);
      throw error;
    }
  }

  /**
   * Get backup details
   */
  async getBackupDetails(backupId: string): Promise<ApiResponse<BackupItem>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupItem>>(
        `${this.baseUrl}/${backupId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching backup details:', error);
      throw error;
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(
    backupId: string,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.delete<Record<string, unknown>>(
        `${this.baseUrl}/${backupId}`,
      );
      return response;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(
    backupId: string,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `${this.baseUrl}/${backupId}/validate`,
      );
      return response;
    } catch (error) {
      console.error('Error validating backup:', error);
      throw error;
    }
  }

  /**
   * Download backup
   */
  async downloadBackup(
    backupId: string,
    clientKey?: string,
  ): Promise<{ blob: Blob; filename: string }> {
    try {
      const params = clientKey ? { clientKey } : undefined;
      const response = await fetch(
        `${window.location.origin}/api/v1/backup/${backupId}/download${params ? `?clientKey=${clientKey}` : ''}`,
        {
          method: 'GET',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || `backup-${backupId}.enc`;

      const blob = await response.blob();

      return { blob, filename };
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  }

  /**
   * Test offsite connection
   */
  async testOffsiteConnection(): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.post<Record<string, unknown>>(
        `${this.baseUrl}/test-connection`,
      );
      return response;
    } catch (error) {
      console.error('Error testing offsite connection:', error);
      throw error;
    }
  }

  /**
   * Get offsite status
   */
  async getOffsiteStatus(): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `${this.baseUrl}/offsite/status`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching offsite status:', error);
      throw error;
    }
  }

  /**
   * Cleanup old backups
   */
  async cleanupBackups(options?: {
    retentionDays?: number;
    maxBackups?: number;
    type?: string;
  }): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.post<Record<string, unknown>>(
        `${this.baseUrl}/cleanup`,
        options,
      );
      return response;
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      throw error;
    }
  }

  /**
   * Get restore preview
   */
  async getRestorePreview(
    backupId: string,
    clientKey?: string,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `${this.baseUrl}/${backupId}/preview`,
        clientKey ? { clientKey } : undefined,
      );
      return response;
    } catch (error) {
      console.error('Error getting restore preview:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backupService = new BackupService();
