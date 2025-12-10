/**
 * =============================================================================
 * Backup Stats Service
 * =============================================================================
 * Frontend API service for backup statistics and overview
 * =============================================================================
 */

import { apiClient } from '../client/apiClient';

// Types
export interface BackupOverviewStats {
  summary: {
    totalBackups: number;
    manualBackups: number;
    scheduledBackups: number;
    encryptedBackups: number;
    offsiteBackups: number;
    lastBackupTime: Date | null;
    nextScheduledBackup: {
      time: Date;
      type: string;
      name: string;
    } | null;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    percentUsed: number;
    breakdown: {
      database: number;
      files: number;
      fullSystem: number;
    };
  };
  byType: {
    DATABASE: number;
    FILES: number;
    FULL_SYSTEM: number;
  };
  byStatus: {
    COMPLETED: number;
    IN_PROGRESS: number;
    FAILED: number;
  };
  recentActivities: Array<{
    id: string;
    type: 'backup' | 'restore';
    operation: string;
    status: string;
    timestamp: Date;
    size: number;
    encrypted: boolean;
    offsite: boolean;
  }>;
  scheduler: {
    isInitialized: boolean;
    activeJobs: number;
    enabledSchedules: number;
    errors: string[];
  };
  service: {
    status: string;
    uptime: number;
    activeBackups: number;
    errors: string[];
  };
  settings: {
    encryptionEnabled: boolean;
    offsiteEnabled: boolean;
    offsiteProvider: string;
    offsiteConnectionStatus: string;
    backupLocation: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class BackupStatsService {
  private readonly baseUrl = 'api/v1/backup/stats';

  /**
   * Get comprehensive overview statistics
   */
  async getOverviewStats(
    clientId?: string,
  ): Promise<ApiResponse<BackupOverviewStats>> {
    try {
      const params = clientId ? { clientId } : undefined;
      const response = await apiClient.get<ApiResponse<BackupOverviewStats>>(
        `${this.baseUrl}/overview`,
        params,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      throw error;
    }
  }

  /**
   * Get backup summary
   */
  async getSummary(clientId?: string): Promise<ApiResponse<any>> {
    try {
      const params = clientId ? { clientId } : undefined;
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/summary`,
        params,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(
    limit?: number,
    clientId?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      const params: any = {};
      if (limit) params.limit = limit;
      if (clientId) params.clientId = clientId;

      const response = await apiClient.get<ApiResponse<any[]>>(
        `${this.baseUrl}/recent-activities`,
        params,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/storage`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      throw error;
    }
  }

  /**
   * Get scheduler health
   */
  async getSchedulerHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/scheduler-health`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching scheduler health:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/service-status`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching service status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backupStatsService = new BackupStatsService();
