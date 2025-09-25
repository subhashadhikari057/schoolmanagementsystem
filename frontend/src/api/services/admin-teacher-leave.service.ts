import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

// Types for teacher leave management by admin
export interface AdminTeacherLeaveRequest {
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
  teacher: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  adminId?: string;
  admin?: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  attachments: AdminTeacherLeaveRequestAttachment[];
}

export interface AdminTeacherLeaveRequestAttachment {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface AdminActionDto {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface TeacherLeaveStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
}

export interface CreateTeacherLeaveRequestByAdminDto {
  teacherId: string;
  title: string;
  description?: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  adminCreationReason: string;
  attachments?: File[];
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
  isPaid: boolean;
  maxDays: number;
}

// Admin Teacher Leave Service
export class AdminTeacherLeaveService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // =====================
  // Teacher Leave Request Management Methods
  // =====================

  /**
   * Get all teacher leave requests (for admin)
   */
  async getAllTeacherLeaveRequests(teacherId?: string): Promise<{
    teacherLeaveRequests: AdminTeacherLeaveRequest[];
  }> {
    try {
      const params = teacherId ? { teacherId } : {};
      const response = await this.httpClient.get<{
        teacherLeaveRequests: AdminTeacherLeaveRequest[];
      }>('api/v1/leave-requests/teacher', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher leave requests:', error);
      throw error;
    }
  }

  /**
   * Get a specific teacher leave request by ID
   */
  async getTeacherLeaveRequestById(id: string): Promise<{
    teacherLeaveRequest: AdminTeacherLeaveRequest;
  }> {
    try {
      const response = await this.httpClient.get<{
        teacherLeaveRequest: AdminTeacherLeaveRequest;
      }>(`api/v1/leave-requests/teacher/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher leave request:', error);
      throw error;
    }
  }

  /**
   * Approve or reject a teacher leave request
   */
  async adminActionOnTeacherLeaveRequest(
    id: string,
    actionData: AdminActionDto,
  ): Promise<{
    message: string;
    teacherLeaveRequest: AdminTeacherLeaveRequest;
  }> {
    try {
      const response = await this.httpClient.post<{
        message: string;
        teacherLeaveRequest: AdminTeacherLeaveRequest;
      }>(`api/v1/leave-requests/teacher/${id}/admin-action`, actionData);
      return response.data;
    } catch (error) {
      console.error(
        'Error performing admin action on teacher leave request:',
        error,
      );
      throw error;
    }
  }

  /**
   * Create teacher leave request by admin
   */
  async createTeacherLeaveRequestByAdmin(
    data: CreateTeacherLeaveRequestByAdminDto,
  ): Promise<{
    message: string;
    teacherLeaveRequest: AdminTeacherLeaveRequest;
  }> {
    try {
      const response = await this.httpClient.post<{
        message: string;
        teacherLeaveRequest: AdminTeacherLeaveRequest;
      }>('api/v1/leave-requests/teacher/admin-create', data);
      return response.data;
    } catch (error) {
      console.error('Error creating teacher leave request by admin:', error);
      throw error;
    }
  }

  /**
   * Get all teachers for admin to select from
   */
  async getAllTeachers(): Promise<{ teachers: Teacher[] }> {
    try {
      const response = await this.httpClient.get<Teacher[]>('api/v1/teachers');
      return { teachers: response.data };
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  }

  /**
   * Get all leave types
   */
  async getAllLeaveTypes(): Promise<{ leaveTypes: LeaveType[] }> {
    try {
      const response =
        await this.httpClient.get<LeaveType[]>('api/v1/leave-types');
      return { leaveTypes: response.data };
    } catch (error) {
      console.error('Error fetching leave types:', error);
      throw error;
    }
  }

  /**
   * Get teacher's leave usage for a specific leave type
   */
  async getTeacherLeaveUsage(
    teacherId: string,
    leaveTypeId: string,
  ): Promise<{
    totalUsage: number;
    yearlyUsage: number;
    monthlyUsage: number;
  }> {
    try {
      const response = await this.httpClient.get<{
        usage: {
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
        };
      }>(`api/v1/leave-usage/teacher/${teacherId}`);

      // Find the specific leave type usage
      const leaveTypeUsage = response.data.usage.usageData.find(
        item => item.leaveType.id === leaveTypeId,
      );

      if (!leaveTypeUsage) {
        return {
          totalUsage: 0,
          yearlyUsage: 0,
          monthlyUsage: 0,
        };
      }

      return leaveTypeUsage.usage;
    } catch (error) {
      console.error('Error fetching teacher leave usage:', error);
      throw error;
    }
  }

  // =====================
  // Utility Methods
  // =====================

  /**
   * Calculate statistics from teacher leave requests
   */
  calculateStatistics(
    requests: AdminTeacherLeaveRequest[],
  ): TeacherLeaveStatistics {
    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(
        r => r.status === 'PENDING_ADMINISTRATION',
      ).length,
      approvedRequests: requests.filter(r => r.status === 'APPROVED').length,
      rejectedRequests: requests.filter(r => r.status === 'REJECTED').length,
      cancelledRequests: requests.filter(r => r.status === 'CANCELLED').length,
    };
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
   * Get status display info
   */
  getStatusInfo(status: string): {
    color: string;
    bgColor: string;
    label: string;
  } {
    switch (status) {
      case 'APPROVED':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Approved',
        };
      case 'REJECTED':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Rejected',
        };
      case 'CANCELLED':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Cancelled',
        };
      case 'PENDING_ADMINISTRATION':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Pending Review',
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
        };
    }
  }

  /**
   * Check if admin can take action on the request
   */
  canTakeAction(request: AdminTeacherLeaveRequest): boolean {
    return request.status === 'PENDING_ADMINISTRATION';
  }

  /**
   * Validate admin action
   */
  validateAdminAction(actionData: AdminActionDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!actionData.status) {
      errors.push('Action status is required');
    }

    if (!['APPROVED', 'REJECTED'].includes(actionData.status)) {
      errors.push('Invalid action status');
    }

    if (actionData.status === 'REJECTED') {
      if (
        !actionData.rejectionReason ||
        actionData.rejectionReason.trim().length === 0
      ) {
        errors.push('Rejection reason is required when rejecting a request');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export a default instance
export const adminTeacherLeaveService = new AdminTeacherLeaveService();
