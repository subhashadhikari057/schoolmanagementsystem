/**
 * =============================================================================
 * Backup Schedule Service
 * =============================================================================
 * Frontend API service for backup schedule management
 * =============================================================================
 */

import { apiClient } from '../client/apiClient';

// Types
export interface BackupSchedule {
  id: string;
  name: string;
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  enabled: boolean;
  encrypt: boolean;
  clientKey?: string;
  retentionDays: number;
  maxBackups: number;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
}

export interface CreateScheduleRequest {
  name: string;
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  encrypt?: boolean;
  clientKey?: string;
  retentionDays?: number;
  maxBackups?: number;
  enabled?: boolean;
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {
  id: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  scheduleName: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  backupId?: string;
  error?: string;
  duration?: number;
  size?: string;
}

export interface SchedulerHealth {
  isRunning: boolean;
  activeSchedules: number;
  runningJobs: number;
  lastMaintenanceAt: Date;
  uptime: number;
  memoryUsage: number;
  errors: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class BackupScheduleService {
  private readonly baseUrl = 'api/v1/backup/schedule';

  /**
   * Get all backup schedules
   */
  async getSchedules(): Promise<ApiResponse<BackupSchedule[]>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupSchedule[]>>(
        this.baseUrl,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching backup schedules:', error);
      throw error;
    }
  }

  /**
   * Get a specific backup schedule
   */
  async getSchedule(id: string): Promise<ApiResponse<BackupSchedule>> {
    try {
      const response = await apiClient.get<ApiResponse<BackupSchedule>>(
        `${this.baseUrl}/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching backup schedule:', error);
      throw error;
    }
  }

  /**
   * Create a new backup schedule
   */
  async createSchedule(
    schedule: CreateScheduleRequest,
  ): Promise<ApiResponse<BackupSchedule>> {
    try {
      const response = await apiClient.post<ApiResponse<BackupSchedule>>(
        this.baseUrl,
        schedule,
      );
      return response.data;
    } catch (error) {
      console.error('Error creating backup schedule:', error);
      throw error;
    }
  }

  /**
   * Update a backup schedule
   */
  async updateSchedule(
    id: string,
    schedule: Partial<CreateScheduleRequest>,
  ): Promise<ApiResponse<BackupSchedule>> {
    try {
      const response = await apiClient.put<ApiResponse<BackupSchedule>>(
        `${this.baseUrl}/${id}`,
        schedule,
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
  async deleteSchedule(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(
        `${this.baseUrl}/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting backup schedule:', error);
      throw error;
    }
  }

  /**
   * Enable or disable a backup schedule
   */
  async toggleSchedule(
    id: string,
    enabled: boolean,
  ): Promise<ApiResponse<BackupSchedule>> {
    try {
      const response = await apiClient.post<ApiResponse<BackupSchedule>>(
        `${this.baseUrl}/${id}/toggle`,
        { enabled },
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling backup schedule:', error);
      throw error;
    }
  }

  /**
   * Run a backup schedule immediately
   */
  async runScheduleNow(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/${id}/run-now`,
      );
      return response.data;
    } catch (error) {
      console.error('Error running backup schedule:', error);
      throw error;
    }
  }

  /**
   * Get schedule execution history
   */
  async getScheduleHistory(
    id: string,
    limit?: number,
  ): Promise<ApiResponse<ScheduleExecution[]>> {
    try {
      const params = limit ? { limit } : undefined;
      const response = await apiClient.get<ApiResponse<ScheduleExecution[]>>(
        `${this.baseUrl}/${id}/history`,
        params,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule history:', error);
      throw error;
    }
  }

  /**
   * Get all schedule executions
   */
  async getAllExecutions(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ScheduleExecution[]>> {
    try {
      const response = await apiClient.get<ApiResponse<ScheduleExecution[]>>(
        `${this.baseUrl}/executions`,
        params,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule executions:', error);
      throw error;
    }
  }

  /**
   * Cancel a running schedule execution
   */
  async cancelExecution(executionId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/executions/${executionId}/cancel`,
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling schedule execution:', error);
      throw error;
    }
  }

  /**
   * Run backup cleanup based on retention policies
   */
  async cleanupBackups(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/cleanup`,
      );
      return response.data;
    } catch (error) {
      console.error('Error running backup cleanup:', error);
      throw error;
    }
  }

  /**
   * Get backup scheduler health status
   */
  async getSchedulerHealth(): Promise<ApiResponse<SchedulerHealth>> {
    try {
      const response = await apiClient.get<ApiResponse<SchedulerHealth>>(
        `${this.baseUrl}/health`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching scheduler health:', error);
      throw error;
    }
  }

  /**
   * Perform scheduler maintenance tasks
   */
  async performMaintenance(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/maintenance`,
      );
      return response.data;
    } catch (error) {
      console.error('Error performing maintenance:', error);
      throw error;
    }
  }

  /**
   * Get next scheduled runs
   */
  async getUpcomingRuns(limit?: number): Promise<ApiResponse<any[]>> {
    try {
      const params = limit ? { limit } : undefined;
      const response = await apiClient.get<ApiResponse<any[]>>(
        `${this.baseUrl}/upcoming`,
        params,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming runs:', error);
      throw error;
    }
  }

  /**
   * Validate schedule configuration
   */
  async validateSchedule(
    schedule: CreateScheduleRequest,
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/validate`,
        schedule,
      );
      return response.data;
    } catch (error) {
      console.error('Error validating schedule:', error);
      throw error;
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/stats`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule stats:', error);
      throw error;
    }
  }

  /**
   * Export schedule configuration
   */
  async exportSchedules(): Promise<Blob> {
    try {
      const response = await fetch(
        `${window.location.origin}/${this.baseUrl}/export`,
        {
          method: 'GET',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to export schedules');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting schedules:', error);
      throw error;
    }
  }

  /**
   * Import schedule configuration
   */
  async importSchedules(file: File): Promise<ApiResponse<BackupSchedule[]>> {
    try {
      const formData = new FormData();
      formData.append('schedulesFile', file);

      const response = await apiClient.post<ApiResponse<BackupSchedule[]>>(
        `${this.baseUrl}/import`,
        formData,
      );
      return response.data;
    } catch (error) {
      console.error('Error importing schedules:', error);
      throw error;
    }
  }

  /**
   * Pause all schedules
   */
  async pauseAllSchedules(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/pause-all`,
      );
      return response.data;
    } catch (error) {
      console.error('Error pausing all schedules:', error);
      throw error;
    }
  }

  /**
   * Resume all schedules
   */
  async resumeAllSchedules(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/resume-all`,
      );
      return response.data;
    } catch (error) {
      console.error('Error resuming all schedules:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backupScheduleService = new BackupScheduleService();
