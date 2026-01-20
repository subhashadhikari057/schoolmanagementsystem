/**
 * =============================================================================
 * Staff Service
 * =============================================================================
 * Service for handling staff-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import {
  CreateStaffRequest,
  StaffSalaryHistoryResponse,
  UpdateStaffSalaryRequest,
  UpdateStaffSalaryResponse,
  StaffSalaryHistory,
} from '../types/staff';
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
  GET_COUNT: 'api/v1/staff/count',
  // Salary history endpoints
  GET_SALARY_HISTORY: (id: string) => `api/v1/staff/${id}/salary-history`,
  UPDATE_SALARY: (id: string) => `api/v1/staff/${id}/salary`,
  GET_CURRENT_SALARY: (id: string) => `api/v1/staff/${id}/salary`,
  GET_SALARY_FOR_MONTH: (id: string, month: string) =>
    `api/v1/staff/${id}/salary-for-month?month=${month}`,
  // Import/Export endpoints
  IMPORT_CSV: 'api/v1/staff-import/import',
  EXPORT_CSV: 'api/v1/staff-import/export',
  GET_IMPORT_TEMPLATE: 'api/v1/staff-import/import/template',

  // Update endpoint
  UPDATE: (id: string) => `api/v1/staff/${id}`,
} as const;

// ============================================================================
// Staff Service
// ============================================================================

export class StaffService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Salary History Operations
  // ========================================================================

  /**
   * Get a staff member's salary history
   */
  async getStaffSalaryHistory(
    staffId: string,
  ): Promise<ApiResponse<StaffSalaryHistoryResponse>> {
    return this.httpClient.get<StaffSalaryHistoryResponse>(
      STAFF_ENDPOINTS.GET_SALARY_HISTORY(staffId),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Update a staff member's salary
   */
  async updateStaffSalary(
    staffId: string,
    data: UpdateStaffSalaryRequest,
  ): Promise<ApiResponse<UpdateStaffSalaryResponse>> {
    return this.httpClient.post<UpdateStaffSalaryResponse>(
      STAFF_ENDPOINTS.UPDATE_SALARY(staffId),
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Get a staff member's current salary
   */
  async getStaffCurrentSalary(
    staffId: string,
  ): Promise<ApiResponse<StaffSalaryHistory>> {
    return this.httpClient.get<StaffSalaryHistory>(
      STAFF_ENDPOINTS.GET_CURRENT_SALARY(staffId),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get a staff member's salary for a specific month
   */
  async getStaffSalaryForMonth(
    staffId: string,
    month: string,
  ): Promise<ApiResponse<StaffSalaryHistory>> {
    return this.httpClient.get<StaffSalaryHistory>(
      STAFF_ENDPOINTS.GET_SALARY_FOR_MONTH(staffId, month),
      undefined,
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Staff Operations
  // ========================================================================

  /**
   * Create a new staff member
   */
  async createStaff(data: CreateStaffRequest): Promise<ApiResponse<any>> {
    // For multipart form data with file upload
    const formData = new FormData();

    // User data
    const userData = {
      firstName: data.user.firstName,
      middleName: data.user.middleName,
      lastName: data.user.lastName,
      fullName:
        data.user.fullName ||
        `${data.user.firstName} ${data.user.middleName} ${data.user.lastName}`,
      email: data.user.email,
      phone: data.user.phone,
      password: data.user.password,
      createLoginAccount: data.user.createLoginAccount,
    };
    formData.append('user', JSON.stringify(userData));

    // Profile data
    formData.append('profile', JSON.stringify(data.profile));

    // Salary data if provided
    if (data.salary) {
      formData.append('salary', JSON.stringify(data.salary));
    }

    // Bank details if provided
    if (data.bankDetails) {
      formData.append('bankDetails', JSON.stringify(data.bankDetails));
    }

    // Permissions if provided
    if (data.permissions) {
      formData.append('permissions', JSON.stringify(data.permissions));
    }

    // Photo if provided (would be handled by the component)
    // formData.append('photo', file);

    return this.httpClient.post<any>(STAFF_ENDPOINTS.CREATE, formData, {
      requiresAuth: true,
      isMultipart: true,
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

  /**
   * Get staff count
   */
  async getStaffCount(): Promise<ApiResponse<{ count: number }>> {
    return this.httpClient.get<{ count: number }>(
      STAFF_ENDPOINTS.GET_COUNT,
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Generate next employee ID in the frontend
   */
  async getNextEmployeeId(): Promise<ApiResponse<{ employeeId: string }>> {
    try {
      const response = await this.getStaffCount();
      if (response.success) {
        const currentYear = new Date().getFullYear();
        const count = response.data?.count || 0;
        const employeeId = `S-${currentYear}-${(count + 1).toString().padStart(4, '0')}`;
        return {
          success: true,
          data: { employeeId },
          message: 'Employee ID generated successfully',
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error('Failed to get staff count');
    } catch (_) {
      // Fallback: Generate a simple employee ID if API fails
      const currentYear = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      const fallbackId = `S-${currentYear}-${randomNum}`;

      return {
        success: true,
        data: { employeeId: fallbackId },
        message: 'Generated fallback employee ID',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========================================================================
  // Import/Export Operations
  // ========================================================================

  /**
   * Import staff from XLSX file
   */
  async importStaffFromCSV(
    file: File,
    options: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
    } = {},
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      totalProcessed: number;
      successfulImports: number;
      failedImports: number;
      errors: Array<{
        row: number;
        staff: string;
        error: string;
      }>;
      importedStaff: Array<{
        id: string;
        fullName: string;
        email: string;
        employeeId: string;
        designation: string;
      }>;
    }>
  > {
    const formData = new FormData();
    formData.append('file', file);

    if (options.skipDuplicates !== undefined) {
      formData.append('skipDuplicates', options.skipDuplicates.toString());
    }

    if (options.updateExisting !== undefined) {
      formData.append('updateExisting', options.updateExisting.toString());
    }

    return this.httpClient.post(STAFF_ENDPOINTS.IMPORT_CSV, formData, {
      requiresAuth: true,
      isMultipart: true,
    });
  }

  /**
   * Export staff to XLSX
   */
  async exportStaffToCSV(params?: {
    department?: string;
    search?: string;
    designation?: string;
    employmentStatus?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();

    if (params?.department) {
      queryParams.append('department', params.department);
    }

    if (params?.search) {
      queryParams.append('search', params.search);
    }

    if (params?.designation) {
      queryParams.append('designation', params.designation);
    }

    if (params?.employmentStatus) {
      queryParams.append('employmentStatus', params.employmentStatus);
    }

    const endpoint = queryParams.toString()
      ? `${STAFF_ENDPOINTS.EXPORT_CSV}?${queryParams.toString()}`
      : STAFF_ENDPOINTS.EXPORT_CSV;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const normalizedBase = base ? base.replace(/\/$/, '') : '';
    const fullUrl = normalizedBase
      ? `${normalizedBase}/${endpoint}`
      : `/${endpoint}`;

    // Get CSRF token
    const { csrfService } = await import('../services/csrf.service');
    const csrfHeaders = await csrfService.addTokenToHeaders();

    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...csrfHeaders,
        Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Export failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.blob();
  }

  /**
   * Download XLSX template for staff import
   */
  async downloadImportTemplate(): Promise<Blob> {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const normalizedBase = base ? base.replace(/\/$/, '') : '';
    const fullUrl = normalizedBase
      ? `${normalizedBase}/${STAFF_ENDPOINTS.GET_IMPORT_TEMPLATE}`
      : `/${STAFF_ENDPOINTS.GET_IMPORT_TEMPLATE}`;

    // Get CSRF token
    const { csrfService } = await import('../services/csrf.service');
    const csrfHeaders = await csrfService.addTokenToHeaders();

    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...csrfHeaders,
        Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Template download failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.blob();
  }

  /**
   * Update staff information
   */
  async updateStaff(
    staffId: string,
    updateData: any,
  ): Promise<ApiResponse<any>> {
    console.log('🔄 Updating staff:', { staffId, updateData });

    try {
      const response = await this.httpClient.put<any>(
        STAFF_ENDPOINTS.UPDATE(staffId),
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('✅ Staff update response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update staff:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export singleton instance and methods for backward compatibility
// ============================================================================

export const staffService = new StaffService();

// Export the create function for backward compatibility
export const createStaff = (data: CreateStaffRequest) =>
  staffService.createStaff(data);
