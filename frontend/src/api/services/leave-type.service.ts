// =============================================================================
// Leave Type Service
// =============================================================================

export const LEAVE_TYPE_ENDPOINTS = {
  BASE: '/api/v1/leave-types',
  STATS: '/api/v1/leave-types/stats',
  TOGGLE_STATUS: (id: string) => `/api/v1/leave-types/${id}/toggle-status`,
} as const;

// =============================================================================
// Leave Type Types
// =============================================================================

export interface CreateLeaveTypeRequest {
  name: string;
  description?: string;
  maxDays: number;
  isPaid: boolean;
}

export interface UpdateLeaveTypeRequest {
  name?: string;
  description?: string;
  maxDays?: number;
  isPaid?: boolean;
}

export interface QueryLeaveTypeRequest {
  name?: string;
  isPaid?: boolean;
  status?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
  maxDays: number;
  isPaid: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface LeaveTypeStats {
  totalTypes: number;
  paidTypes: number;
  activeTypes: number;
  inactiveTypes: number;
}

export interface LeaveTypeListResponse {
  leaveTypes: LeaveType[];
  total: number;
  page: number;
  limit: number;
}

// =============================================================================
// Leave Type Service Class
// =============================================================================

import { httpClient } from '../client';

class LeaveTypeService {
  // =============================================================================
  // CRUD Operations
  // =============================================================================

  async createLeaveType(data: CreateLeaveTypeRequest): Promise<LeaveType> {
    const response = await httpClient.post<LeaveType>(
      LEAVE_TYPE_ENDPOINTS.BASE,
      data,
    );
    return response.data;
  }

  async getAllLeaveTypes(query?: QueryLeaveTypeRequest): Promise<LeaveType[]> {
    const params = new URLSearchParams();

    if (query?.name) params.append('name', query.name);
    if (query?.isPaid !== undefined)
      params.append('isPaid', query.isPaid.toString());
    if (query?.status) params.append('status', query.status);

    const endpoint = params.toString()
      ? `${LEAVE_TYPE_ENDPOINTS.BASE}?${params.toString()}`
      : LEAVE_TYPE_ENDPOINTS.BASE;

    const response = await httpClient.get<LeaveType[]>(endpoint);
    return response.data;
  }

  async getLeaveTypeById(id: string): Promise<LeaveType> {
    const response = await httpClient.get<LeaveType>(
      `${LEAVE_TYPE_ENDPOINTS.BASE}/${id}`,
    );
    return response.data;
  }

  async updateLeaveType(
    id: string,
    data: UpdateLeaveTypeRequest,
  ): Promise<LeaveType> {
    const response = await httpClient.patch<LeaveType>(
      `${LEAVE_TYPE_ENDPOINTS.BASE}/${id}`,
      data,
    );
    return response.data;
  }

  async deleteLeaveType(id: string): Promise<void> {
    await httpClient.delete<void>(`${LEAVE_TYPE_ENDPOINTS.BASE}/${id}`);
  }

  async toggleLeaveTypeStatus(id: string): Promise<LeaveType> {
    const response = await httpClient.patch<LeaveType>(
      LEAVE_TYPE_ENDPOINTS.TOGGLE_STATUS(id),
    );
    return response.data;
  }

  // =============================================================================
  // Statistics
  // =============================================================================

  async getLeaveTypeStats(): Promise<LeaveTypeStats> {
    const response = await httpClient.get<LeaveTypeStats>(
      LEAVE_TYPE_ENDPOINTS.STATS,
    );
    return response.data;
  }
}

// =============================================================================
// Export Service Instance
// =============================================================================

export const leaveTypeService = new LeaveTypeService();
