import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

// Types
export interface CreateTeacherLeaveRequestDto {
  title: string;
  description?: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  attachments?: File[];
}

export interface TeacherLeaveRequest {
  id: string;
  title: string;
  description?: string;
  leaveTypeId: string;
  leaveType: {
    id: string;
    name: string;
    description?: string;
    isPaid: boolean;
  };
  status: 'PENDING_ADMINISTRATION' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  days: number;
  teacherId: string;
  adminId?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  attachments: TeacherLeaveRequestAttachment[];
  teacher: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  admin?: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
}

export interface TeacherLeaveRequestAttachment {
  id: string;
  teacherLeaveRequestId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface LeaveUsage {
  teacherId: string;
  usageData: Array<{
    leaveType: {
      id: string;
      name: string;
      description?: string;
      isPaid: boolean;
      maxDays: number;
    };
    usage: {
      totalUsage: number;
      yearlyUsage: number;
      monthlyUsage: number;
    };
  }>;
}

export interface AllTeachersLeaveUsage {
  teachersUsage: Array<{
    teacher: {
      id: string;
      fullName: string;
      email: string;
    };
    usageData: Array<{
      leaveType: {
        id: string;
        name: string;
      };
      usage: {
        totalUsage: number;
        yearlyUsage: number;
        monthlyUsage: number;
      };
    }>;
  }>;
  leaveTypes: Array<{
    id: string;
    name: string;
  }>;
}

export interface LeaveUsageStatistics {
  overview: {
    totalTeachers: number;
    yearlyRequests: number;
    yearlyDays: number;
    monthlyRequests: number;
    monthlyDays: number;
  };
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  typeBreakdown: Array<{
    leaveTypeName: string;
    count: number;
    totalDays: number;
  }>;
}

export interface CurrentUsage {
  totalUsage: number;
  yearlyUsage: number;
  monthlyUsage: number;
}

export interface AdminLeaveRequestActionDto {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface ResetLeaveUsageDto {
  leaveTypeId: string;
  resetType: 'YEARLY' | 'MONTHLY' | 'ALL';
}

// Teacher Leave Request Service
export class TeacherLeaveService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // =====================
  // Teacher Leave Request Methods
  // =====================

  /**
   * Create a new teacher leave request
   */
  async createTeacherLeaveRequest(
    data: CreateTeacherLeaveRequestDto,
  ): Promise<{ message: string; teacherLeaveRequest: TeacherLeaveRequest }> {
    const formData = new FormData();

    // Add text fields
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('leaveTypeId', data.leaveTypeId);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('days', data.days.toString());

    // Add attachments if any
    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await this.httpClient.post<{
      message: string;
      teacherLeaveRequest: TeacherLeaveRequest;
    }>('api/v1/leave-requests/teacher', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get teacher's leave requests
   */
  async getTeacherLeaveRequests(
    teacherId?: string,
  ): Promise<{ teacherLeaveRequests: TeacherLeaveRequest[] }> {
    const params = teacherId ? { teacherId } : {};
    const response = await this.httpClient.get<{
      teacherLeaveRequests: TeacherLeaveRequest[];
    }>('api/v1/leave-requests/teacher', params);
    return response.data;
  }

  /**
   * Get specific teacher leave request by ID
   */
  async getTeacherLeaveRequestById(
    id: string,
  ): Promise<{ teacherLeaveRequest: TeacherLeaveRequest }> {
    const response = await this.httpClient.get<{
      teacherLeaveRequest: TeacherLeaveRequest;
    }>(`api/v1/leave-requests/teacher/${id}`);
    return response.data;
  }

  /**
   * Admin action on teacher leave request (approve/reject)
   */
  async adminActionOnTeacherLeaveRequest(
    id: string,
    action: AdminLeaveRequestActionDto,
  ): Promise<{ message: string; teacherLeaveRequest: TeacherLeaveRequest }> {
    const response = await this.httpClient.post<{
      message: string;
      teacherLeaveRequest: TeacherLeaveRequest;
    }>(`api/v1/leave-requests/teacher/${id}/admin-action`, action);
    return response.data;
  }

  /**
   * Cancel teacher leave request
   */
  async cancelTeacherLeaveRequest(
    id: string,
  ): Promise<{ message: string; teacherLeaveRequest: TeacherLeaveRequest }> {
    const response = await this.httpClient.post<{
      message: string;
      teacherLeaveRequest: TeacherLeaveRequest;
    }>(`api/v1/leave-requests/teacher/${id}/cancel`);
    return response.data;
  }

  // =====================
  // Teacher Leave Request Attachment Methods
  // =====================

  /**
   * Upload attachments to teacher leave request
   */
  async uploadTeacherLeaveRequestAttachments(
    id: string,
    files: File[],
  ): Promise<{ message: string; fileCount: number }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });

    const response = await this.httpClient.post<{
      message: string;
      fileCount: number;
    }>(`api/v1/leave-requests/teacher/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get teacher leave request attachments
   */
  async getTeacherLeaveRequestAttachments(
    id: string,
  ): Promise<{ attachments: TeacherLeaveRequestAttachment[] }> {
    const response = await this.httpClient.get<{
      attachments: TeacherLeaveRequestAttachment[];
    }>(`api/v1/leave-requests/teacher/${id}/attachments`);
    return response.data;
  }

  /**
   * Delete teacher leave request attachment
   */
  async deleteTeacherLeaveRequestAttachment(
    attachmentId: string,
  ): Promise<{ message: string }> {
    const response = await this.httpClient.delete<{ message: string }>(
      `api/v1/leave-requests/teacher/attachments/${attachmentId}`,
    );
    return response.data;
  }

  // =====================
  // Leave Usage Methods
  // =====================

  /**
   * Get current user's leave usage (for teachers)
   */
  async getMyLeaveUsage(): Promise<{ message: string; usage: LeaveUsage }> {
    const response = await this.httpClient.get<{
      message: string;
      usage: LeaveUsage;
    }>('api/v1/leave-usage/my-usage');
    return response.data;
  }

  /**
   * Get specific teacher's leave usage
   */
  async getTeacherLeaveUsage(
    teacherId: string,
  ): Promise<{ message: string; usage: LeaveUsage }> {
    const response = await this.httpClient.get<{
      message: string;
      usage: LeaveUsage;
    }>(`api/v1/leave-usage/teacher/${teacherId}`);
    return response.data;
  }

  /**
   * Get all teachers' leave usage (admin only)
   */
  async getAllTeachersLeaveUsage(): Promise<{
    message: string;
    usage: AllTeachersLeaveUsage;
  }> {
    const response = await this.httpClient.get<{
      message: string;
      usage: AllTeachersLeaveUsage;
    }>('api/v1/leave-usage/all-teachers');
    return response.data;
  }

  /**
   * Get current usage for specific teacher and leave type
   */
  async getCurrentUsage(
    teacherId: string,
    leaveTypeId: string,
  ): Promise<{ message: string; usage: CurrentUsage }> {
    const response = await this.httpClient.get<{
      message: string;
      usage: CurrentUsage;
    }>(`api/v1/leave-usage/teacher/${teacherId}/leave-type/${leaveTypeId}`);
    return response.data;
  }

  /**
   * Reset teacher's leave usage (admin only)
   */
  async resetTeacherLeaveUsage(
    teacherId: string,
    data: ResetLeaveUsageDto,
  ): Promise<{ message: string; result: any }> {
    const response = await this.httpClient.post<{
      message: string;
      result: any;
    }>(`api/v1/leave-usage/teacher/${teacherId}/reset`, data);
    return response.data;
  }

  /**
   * Get leave usage statistics (admin only)
   */
  async getLeaveUsageStatistics(): Promise<{
    message: string;
    statistics: LeaveUsageStatistics;
  }> {
    const response = await this.httpClient.get<{
      message: string;
      statistics: LeaveUsageStatistics;
    }>('api/v1/leave-usage/statistics');
    return response.data;
  }

  // =====================
  // Leave Type Methods (if needed)
  // =====================

  /**
   * Get all leave types
   */
  async getLeaveTypes(): Promise<{
    leaveTypes: Array<{
      id: string;
      name: string;
      description?: string;
      isPaid: boolean;
      maxDays: number;
    }>;
  }> {
    const response = await this.httpClient.get<
      Array<{
        id: string;
        name: string;
        description?: string;
        isPaid: boolean;
        maxDays: number;
      }>
    >('api/v1/leave-types');
    return { leaveTypes: response.data };
  }

  // =====================
  // Utility Methods
  // =====================

  /**
   * Calculate days between two dates (inclusive)
   * This method exactly matches the backend calculation logic
   */
  calculateDays(startDateStr: string, endDateStr: string): number {
    try {
      // Validate date format - expect YYYY-MM-DD
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(startDateStr) || !datePattern.test(endDateStr)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }

      // Parse dates consistently - exact same logic as backend
      const startDateMatch = startDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const endDateMatch = endDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (!startDateMatch || !endDateMatch) {
        throw new Error('Failed to parse date format');
      }

      const [, startYear, startMonth, startDay] = startDateMatch.map(Number);
      const [, endYear, endMonth, endDay] = endDateMatch.map(Number);

      // Create dates in local timezone to avoid UTC issues - same as backend
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);

      // Validate date objects
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date values');
      }

      // Calculate difference in milliseconds and convert to days - exact same as backend
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive

      return daysDiff > 0 ? daysDiff : 0;
    } catch (error) {
      console.error('Date calculation error:', error);
      throw error;
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      case 'PENDING_ADMINISTRATION':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Validate leave request data
   */
  validateLeaveRequest(data: CreateTeacherLeaveRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    // Validate leave type
    if (!data.leaveTypeId) {
      errors.push('Leave type is required');
    }

    // Validate date format first
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!data.startDate) {
      errors.push('Start date is required');
    } else if (!datePattern.test(data.startDate)) {
      errors.push('Start date must be in YYYY-MM-DD format');
    }

    if (!data.endDate) {
      errors.push('End date is required');
    } else if (!datePattern.test(data.endDate)) {
      errors.push('End date must be in YYYY-MM-DD format');
    }

    // Validate days
    if (!data.days || data.days <= 0) {
      errors.push('Days must be greater than 0');
    }

    // Validate date logic if dates are provided and valid format
    if (
      data.startDate &&
      data.endDate &&
      datePattern.test(data.startDate) &&
      datePattern.test(data.endDate)
    ) {
      try {
        // Create dates for validation - same logic as backend
        const startDate = new Date(data.startDate + 'T00:00:00.000');
        const endDate = new Date(data.endDate + 'T00:00:00.000');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push('Invalid date values');
        } else {
          // Validate start date is not in the past
          if (startDate < today) {
            errors.push('Start date cannot be in the past');
          }

          // Validate end date is not before start date
          if (startDate > endDate) {
            errors.push('Start date cannot be after end date');
          }

          // Calculate and validate days
          try {
            const calculatedDays = this.calculateDays(
              data.startDate,
              data.endDate,
            );

            if (calculatedDays <= 0) {
              errors.push('End date must be after or equal to start date');
            } else if (calculatedDays !== data.days) {
              errors.push(
                `Days calculation mismatch. Expected: ${calculatedDays}, received: ${data.days}`,
              );
            }
          } catch (calcError) {
            errors.push('Error calculating days between dates');
          }
        }
      } catch (dateError) {
        errors.push('Error validating dates');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export a default instance
export const teacherLeaveService = new TeacherLeaveService();
