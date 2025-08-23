import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// Leave Request endpoints
export const LEAVE_REQUEST_ENDPOINTS = {
  CREATE: '/api/v1/leave-requests',
  GET_ALL: '/api/v1/leave-requests',
  GET_BY_ID: (id: string) => `/api/v1/leave-requests/${id}`,
  UPDATE: (id: string) => `/api/v1/leave-requests/${id}`,
  DELETE: (id: string) => `/api/v1/leave-requests/${id}`,
  UPLOAD_ATTACHMENTS: (id: string) =>
    `/api/v1/leave-requests/${id}/attachments`,
  APPROVE_PARENT: (id: string) => `/api/v1/leave-requests/${id}/approve-parent`,
  APPROVE_TEACHER: (id: string) =>
    `/api/v1/leave-requests/${id}/approve-teacher`,
  REJECT_PARENT: (id: string) => `/api/v1/leave-requests/${id}/reject-parent`,
  REJECT_TEACHER: (id: string) => `/api/v1/leave-requests/${id}/reject-teacher`,
  CANCEL: (id: string) => `/api/v1/leave-requests/${id}/cancel`,
} as const;

// =============================================================================
// Leave Request Types
// =============================================================================

export interface CreateLeaveRequestRequest {
  title: string;
  description?: string;
  type: 'SICK' | 'PERSONAL' | 'VACATION' | 'EMERGENCY' | 'MEDICAL' | 'FAMILY';
  start_date: string;
  end_date: string;
  attachments?: File[];
}

export interface UpdateLeaveRequestRequest {
  title?: string;
  description?: string;
  type?: 'SICK' | 'PERSONAL' | 'VACATION' | 'EMERGENCY' | 'MEDICAL' | 'FAMILY';
  start_date?: string;
  end_date?: string;
}

export interface LeaveRequestQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'SICK' | 'PERSONAL' | 'VACATION' | 'EMERGENCY' | 'MEDICAL' | 'FAMILY';
  status?:
    | 'PENDING_PARENT_APPROVAL'
    | 'PENDING_TEACHER_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED';
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface LeaveRequestAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface LeaveRequestAuditLog {
  id: string;
  leaveRequestId: string;
  action: string;
  details?: any;
  performedBy?: string;
  performedAt: string;
  performer?: {
    fullName: string;
    email: string;
  };
}

export interface LeaveRequest {
  id: string;
  title: string;
  description?: string;
  type: 'SICK' | 'PERSONAL' | 'VACATION' | 'EMERGENCY' | 'MEDICAL' | 'FAMILY';
  status:
    | 'PENDING_PARENT_APPROVAL'
    | 'PENDING_TEACHER_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED';
  startDate: string;
  endDate: string;
  days: number;
  studentId: string;
  parentId?: string;
  teacherId?: string;
  parentApprovedAt?: string;
  teacherApprovedAt?: string;
  parentRejectedAt?: string;
  teacherRejectedAt?: string;
  parentRejectionReason?: string;
  teacherRejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
  student: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
    class: {
      name: string;
      grade: number;
      section: string;
    };
  };
  parent?: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  teacher?: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  attachments: LeaveRequestAttachment[];
  auditLogs: LeaveRequestAuditLog[];
}

export interface LeaveRequestListResponse {
  leaveRequests: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RejectLeaveRequestRequest {
  reason: string;
}

// =============================================================================
// Leave Request Service
// =============================================================================

export class LeaveRequestService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Create a new leave request
   */
  async createLeaveRequest(
    data: CreateLeaveRequestRequest,
  ): Promise<ApiResponse<LeaveRequest>> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('type', data.type);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);

    if (data.attachments) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    return this.httpClient.post<LeaveRequest>(
      LEAVE_REQUEST_ENDPOINTS.CREATE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  }

  /**
   * Get all leave requests with pagination and filters
   */
  async getLeaveRequests(
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const url = `${LEAVE_REQUEST_ENDPOINTS.GET_ALL}?${queryParams.toString()}`;
    return this.httpClient.get<LeaveRequestListResponse>(url);
  }

  /**
   * Get a specific leave request by ID
   */
  async getLeaveRequest(id: string): Promise<ApiResponse<LeaveRequest>> {
    return this.httpClient.get<LeaveRequest>(
      LEAVE_REQUEST_ENDPOINTS.GET_BY_ID(id),
    );
  }

  /**
   * Update a leave request
   */
  async updateLeaveRequest(
    id: string,
    data: UpdateLeaveRequestRequest,
  ): Promise<ApiResponse<LeaveRequest>> {
    return this.httpClient.patch<LeaveRequest>(
      LEAVE_REQUEST_ENDPOINTS.UPDATE(id),
      data,
    );
  }

  /**
   * Delete a leave request
   */
  async deleteLeaveRequest(
    id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.delete<{ message: string }>(
      LEAVE_REQUEST_ENDPOINTS.DELETE(id),
    );
  }

  /**
   * Approve leave request by parent
   */
  async approveByParent(id: string): Promise<ApiResponse<LeaveRequest>> {
    return this.httpClient.post<LeaveRequest>(
      LEAVE_REQUEST_ENDPOINTS.APPROVE_PARENT(id),
      {},
    );
  }

  /**
   * Approve leave request by teacher
   */
  async approveByTeacher(id: string): Promise<ApiResponse<LeaveRequest>> {
    return this.httpClient.post<LeaveRequest>(
      LEAVE_REQUEST_ENDPOINTS.APPROVE_TEACHER(id),
      {},
    );
  }

  /**
   * Reject leave request by parent
   */
  async rejectByParent(
    id: string,
    reason: string,
  ): Promise<ApiResponse<LeaveRequest>> {
    const data: RejectLeaveRequestRequest = { reason };
    return this.httpClient.post<LeaveRequest>(
      LEAVE_REQUEST_ENDPOINTS.REJECT_PARENT(id),
      data,
    );
  }

  /**
   * Reject leave request by teacher
   */
  async rejectByTeacher(
    id: string,
    reason: string,
  ): Promise<ApiResponse<LeaveRequest>> {
    const data: RejectLeaveRequestRequest = { reason };
    return this.httpClient.post<LeaveRequest>(
      LEAVE_REQUEST_ENDPOINTS.REJECT_TEACHER(id),
      data,
    );
  }

  /**
   * Cancel leave request
   */
  async cancelLeaveRequest(id: string): Promise<ApiResponse<LeaveRequest>> {
    return this.httpClient.post<LeaveRequest>(
      LEAVE_REQUEST_ENDPOINTS.CANCEL(id),
      {},
    );
  }

  /**
   * Upload attachments to a leave request
   */
  async uploadAttachments(
    id: string,
    files: File[],
  ): Promise<ApiResponse<{ message: string; fileCount: number }>> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('attachments', file);
    });

    return this.httpClient.post<{ message: string; fileCount: number }>(
      LEAVE_REQUEST_ENDPOINTS.UPLOAD_ATTACHMENTS(id),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  }

  /**
   * Get attachments for a leave request
   */
  async getAttachments(
    id: string,
  ): Promise<ApiResponse<LeaveRequestAttachment[]>> {
    return this.httpClient.get<LeaveRequestAttachment[]>(
      `${LEAVE_REQUEST_ENDPOINTS.GET_BY_ID(id)}/attachments`,
    );
  }

  /**
   * Get leave requests for current user based on their role
   */
  async getMyLeaveRequests(
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    return this.getLeaveRequests(params);
  }

  /**
   * Get pending leave requests that need approval
   */
  async getPendingApprovals(
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const approvalParams = {
      ...params,
      status: 'PENDING_PARENT_APPROVAL' as const,
    };
    return this.getLeaveRequests(approvalParams);
  }

  /**
   * Get leave requests pending teacher approval
   */
  async getPendingTeacherApprovals(
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const approvalParams = {
      ...params,
      status: 'PENDING_TEACHER_APPROVAL' as const,
    };
    return this.getLeaveRequests(approvalParams);
  }

  /**
   * Get approved leave requests
   */
  async getApprovedLeaveRequests(
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const approvedParams = { ...params, status: 'APPROVED' as const };
    return this.getLeaveRequests(approvedParams);
  }

  /**
   * Get rejected leave requests
   */
  async getRejectedLeaveRequests(
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const rejectedParams = { ...params, status: 'REJECTED' as const };
    return this.getLeaveRequests(rejectedParams);
  }

  /**
   * Get cancelled leave requests
   */
  async getCancelledLeaveRequests(
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const cancelledParams = { ...params, status: 'CANCELLED' as const };
    return this.getLeaveRequests(cancelledParams);
  }

  /**
   * Get leave requests by type
   */
  async getLeaveRequestsByType(
    type: CreateLeaveRequestRequest['type'],
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const typeParams = { ...params, type };
    return this.getLeaveRequests(typeParams);
  }

  /**
   * Get leave requests for a specific student
   */
  async getLeaveRequestsByStudent(
    studentId: string,
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const studentParams = { ...params, studentId };
    return this.getLeaveRequests(studentParams);
  }

  /**
   * Get leave requests within a date range
   */
  async getLeaveRequestsByDateRange(
    startDate: string,
    endDate: string,
    params?: LeaveRequestQueryParams,
  ): Promise<ApiResponse<LeaveRequestListResponse>> {
    const dateParams = { ...params, startDate, endDate };
    return this.getLeaveRequests(dateParams);
  }

  /**
   * Get leave request statistics
   */
  async getLeaveRequestStats(): Promise<
    ApiResponse<{
      total: number;
      pendingParentApproval: number;
      pendingTeacherApproval: number;
      approved: number;
      rejected: number;
      cancelled: number;
      byType: Record<string, number>;
    }>
  > {
    const response = await this.getLeaveRequests({ limit: 1000 });
    const leaveRequests = response.data?.leaveRequests || [];

    const stats = {
      total: leaveRequests.length,
      pendingParentApproval: leaveRequests.filter(
        lr => lr.status === 'PENDING_PARENT_APPROVAL',
      ).length,
      pendingTeacherApproval: leaveRequests.filter(
        lr => lr.status === 'PENDING_TEACHER_APPROVAL',
      ).length,
      approved: leaveRequests.filter(lr => lr.status === 'APPROVED').length,
      rejected: leaveRequests.filter(lr => lr.status === 'REJECTED').length,
      cancelled: leaveRequests.filter(lr => lr.status === 'CANCELLED').length,
      byType: leaveRequests.reduce(
        (acc, lr) => {
          acc[lr.type] = (acc[lr.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return {
      success: true,
      data: stats,
      message: 'Leave request statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
