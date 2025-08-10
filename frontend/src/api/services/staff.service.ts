/**
 * =============================================================================
 * Staff Service
 * =============================================================================
 * Service for handling staff-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import { CreateStaffRequest } from '../types/staff';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const STAFF_ENDPOINTS = {
  CREATE: 'api/v1/staff',
  LIST: 'api/v1/staff',
  GET_BY_ID: (id: string) => `api/v1/staff/${id}`,
  UPDATE_BY_ADMIN: (id: string) => `api/v1/staff/${id}`,
  UPDATE_SELF: (id: string) => `api/v1/staff/${id}/self`,
  DELETE: (id: string) => `api/v1/staff/${id}`,
  GET_BY_DEPARTMENT: (department: string) =>
    `api/v1/staff/department/${department}`,
  GET_DASHBOARD_STATS: 'api/v1/staff/stats/dashboard',
  UPDATE_STATUS: (id: string) => `api/v1/staff/${id}/status`,
} as const;

// ============================================================================
// Staff Service
// ============================================================================

export class StaffService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Create a new staff member
   */
  async createStaff(data: CreateStaffRequest): Promise<ApiResponse<any>> {
    return this.httpClient.post<any>(STAFF_ENDPOINTS.CREATE, data, {
      requiresAuth: true,
    });
  }

  /**
   * Get all staff members
   */
  async getAllStaff(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    employmentStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<any>> {
    return this.httpClient.get<any>(STAFF_ENDPOINTS.LIST, params, {
      requiresAuth: true,
    });
  }

  /**
   * Get a specific staff member by ID
   */
  async getStaffById(id: string): Promise<ApiResponse<any>> {
    return this.httpClient.get<any>(STAFF_ENDPOINTS.GET_BY_ID(id), undefined, {
      requiresAuth: true,
    });
  }

  /**
   * Update staff member (admin only)
   */
  async updateStaffByAdmin(id: string, data: any): Promise<ApiResponse<any>> {
    return this.httpClient.patch<any>(
      STAFF_ENDPOINTS.UPDATE_BY_ADMIN(id),
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Update own profile (staff self-update)
   */
  async updateStaffSelf(id: string, data: any): Promise<ApiResponse<any>> {
    return this.httpClient.patch<any>(STAFF_ENDPOINTS.UPDATE_SELF(id), data, {
      requiresAuth: true,
    });
  }

  /**
   * Delete staff member (soft delete)
   */
  async deleteStaff(id: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(STAFF_ENDPOINTS.DELETE(id), {
      requiresAuth: true,
    });
  }

  /**
   * Get staff by department
   */
  async getStaffByDepartment(
    department: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<ApiResponse<any>> {
    return this.httpClient.get<any>(
      STAFF_ENDPOINTS.GET_BY_DEPARTMENT(department),
      params,
      { requiresAuth: true },
    );
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.httpClient.get<any>(
      STAFF_ENDPOINTS.GET_DASHBOARD_STATS,
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Update employment status
   */
  async updateEmploymentStatus(
    id: string,
    employmentStatus: string,
  ): Promise<ApiResponse<any>> {
    return this.httpClient.patch<any>(
      STAFF_ENDPOINTS.UPDATE_STATUS(id),
      { employmentStatus },
      { requiresAuth: true },
    );
  }
}

// ============================================================================
// Export singleton instance and methods for backward compatibility
// ============================================================================

export const staffService = new StaffService();

// Export the create function for backward compatibility
export const createStaff = (data: CreateStaffRequest) =>
  staffService.createStaff(data);
