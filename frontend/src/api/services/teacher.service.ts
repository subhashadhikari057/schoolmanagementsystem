/**
 * =============================================================================
 * Teacher Service
 * =============================================================================
 * Service for handling teacher-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import {
  CreateTeacherResponse,
  TeacherListResponse,
  UpdateTeacherByAdminRequest,
  UpdateTeacherSelfRequest,
  UpdateTeacherResponse,
  TeacherFormData,
} from '../types/teacher';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const TEACHER_ENDPOINTS = {
  CREATE: 'api/v1/teachers',
  LIST: 'api/v1/teachers',
  GET_ME: 'api/v1/teachers/me',
  GET_MY_SUBJECTS: 'api/v1/teachers/me/subjects',
  GET_MY_CLASSES: 'api/v1/teachers/me/classes',
  GET_CLASS_TEACHER_STATUS: 'api/v1/teachers/me/class-teacher-status',
  GET_MY_SUBJECTS_FOR_CLASS: (classId: string) =>
    `api/v1/teachers/me/classes/${classId}/subjects`,
  GET_BY_ID: (id: string) => `api/v1/teachers/${id}`,
  UPDATE_BY_ADMIN: (id: string) => `api/v1/teachers/${id}`,
  UPDATE_SELF: 'api/v1/teachers/profile',
  DELETE: (id: string) => `api/v1/teachers/${id}`,
  GET_SUBJECTS: (id: string) => `api/v1/teachers/${id}/subjects`,
  ASSIGN_SUBJECTS: (id: string) => `api/v1/teachers/${id}/subjects`,
  GET_CLASSES: (id: string) => `api/v1/teachers/${id}/classes`,
  ASSIGN_CLASSES: (id: string) => `api/v1/teachers/${id}/classes`,
  GET_STUDENTS: (id: string) => `api/v1/teachers/${id}/students`,
  NEXT_EMPLOYEE_ID: 'api/v1/teachers/next-employee-id',
  CALCULATE_SALARY: 'api/v1/teachers/calculate-salary',
  // Salary history endpoints
  GET_SALARY_HISTORY: (id: string) => `api/v1/teachers/${id}/salary-history`,
  UPDATE_SALARY: (id: string) => `api/v1/teachers/${id}/salary`,
  GET_CURRENT_SALARY: (id: string) => `api/v1/teachers/${id}/salary`,
  GET_SALARY_FOR_MONTH: (id: string, month: string) =>
    `api/v1/teachers/${id}/salary-for-month?month=${month}`,
} as const;

// ============================================================================
// Teacher Service
// ============================================================================

// Salary history types
export interface TeacherSalaryHistory {
  id: string;
  teacherId: string;
  effectiveMonth: string;
  basicSalary: number;
  allowances: number;
  totalSalary: number;
  changeType: 'INITIAL' | 'PROMOTION' | 'DEMOTION' | 'ADJUSTMENT';
  changeReason?: string;
  approvedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

export interface UpdateTeacherSalaryRequest {
  basicSalary: number;
  allowances: number;
  changeType?: 'INITIAL' | 'PROMOTION' | 'DEMOTION' | 'ADJUSTMENT';
  changeReason?: string;
  effectiveMonth?: string;
}

export interface UpdateTeacherSalaryResponse {
  message: string;
  data: {
    teacher: {
      id: string;
      basicSalary: number;
      allowances: number;
      totalSalary: number;
    };
    salaryHistory: TeacherSalaryHistory;
  };
}

export interface TeacherSalaryHistoryResponse {
  message: string;
  data: TeacherSalaryHistory[];
}

export class TeacherService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Teacher Operations
  // ========================================================================

  // ========================================================================
  // Salary History Operations
  // ========================================================================

  /**
   * Get a teacher's salary history
   */
  async getTeacherSalaryHistory(
    teacherId: string,
  ): Promise<ApiResponse<TeacherSalaryHistoryResponse>> {
    return this.httpClient.get<TeacherSalaryHistoryResponse>(
      TEACHER_ENDPOINTS.GET_SALARY_HISTORY(teacherId),
    );
  }

  /**
   * Update a teacher's salary
   */
  async updateTeacherSalary(
    teacherId: string,
    data: UpdateTeacherSalaryRequest,
  ): Promise<ApiResponse<UpdateTeacherSalaryResponse>> {
    return this.httpClient.post<UpdateTeacherSalaryResponse>(
      TEACHER_ENDPOINTS.UPDATE_SALARY(teacherId),
      data,
    );
  }

  /**
   * Get a teacher's current salary
   */
  async getTeacherCurrentSalary(
    teacherId: string,
  ): Promise<ApiResponse<TeacherSalaryHistory>> {
    return this.httpClient.get<TeacherSalaryHistory>(
      TEACHER_ENDPOINTS.GET_CURRENT_SALARY(teacherId),
    );
  }

  /**
   * Get a teacher's salary for a specific month
   */
  async getTeacherSalaryForMonth(
    teacherId: string,
    month: string,
  ): Promise<ApiResponse<TeacherSalaryHistory>> {
    return this.httpClient.get<TeacherSalaryHistory>(
      TEACHER_ENDPOINTS.GET_SALARY_FOR_MONTH(teacherId, month),
    );
  }

  // Get salary for specific month
  async getSalaryForMonth(
    teacherId: string,
    month: string,
  ): Promise<ApiResponse<TeacherSalaryHistoryResponse>> {
    return this.httpClient.get<TeacherSalaryHistoryResponse>(
      TEACHER_ENDPOINTS.GET_SALARY_FOR_MONTH(teacherId, month),
      undefined,
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Import/Export Operations
  // ========================================================================

  /**
   * Import teachers from XLSX file
   */
  async importTeachersFromCSV(
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
        teacher: string;
        error: string;
      }>;
      importedTeachers: Array<{
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

    return this.httpClient.post('api/v1/teacher-import/import', formData, {
      requiresAuth: true,
      isMultipart: true,
    });
  }

  /**
   * Export teachers to XLSX
   */
  async exportTeachersToCSV(params?: {
    department?: string;
    search?: string;
    designation?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();

    if (params?.department) {
      queryParams.set('department', params.department);
    }

    if (params?.search) {
      queryParams.set('search', params.search);
    }

    if (params?.designation) {
      queryParams.set('designation', params.designation);
    }

    const url = `api/v1/teacher-import/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // For blob responses, we need to use fetch directly
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const fullUrl = `${baseURL}/${url}`;

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

    return await response.blob();
  }

  /**
   * Get XLSX template for teacher import
   */
  async getImportTemplate(): Promise<Blob> {
    // For blob responses, we need to use fetch directly
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const fullUrl = `${baseURL}/api/v1/teacher-import/import/template`;

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
   * Create a new teacher with profile picture
   */
  async createTeacher(
    data: TeacherFormData,
  ): Promise<ApiResponse<CreateTeacherResponse>> {
    // Convert form data to the structure expected by backend
    const formData = new FormData();

    // User data
    const userData = {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    };
    formData.append('user', JSON.stringify(userData));

    // Personal data (only if provided)
    if (
      data.dateOfBirth ||
      data.gender ||
      data.bloodGroup ||
      data.address ||
      data.maritalStatus ||
      data.street ||
      data.city ||
      data.state ||
      data.pinCode
    ) {
      const personalData: Record<string, string> = {};
      if (data.dateOfBirth) personalData.dateOfBirth = data.dateOfBirth;
      if (data.gender) personalData.gender = data.gender;
      if (data.bloodGroup) personalData.bloodGroup = data.bloodGroup;
      if (data.maritalStatus) personalData.maritalStatus = data.maritalStatus;

      // Address fields
      if (data.street) personalData.street = data.street;
      if (data.city) personalData.city = data.city;
      if (data.state) personalData.state = data.state;
      if (data.pinCode) personalData.pinCode = data.pinCode;

      // Legacy address field
      if (data.address) personalData.address = data.address;

      formData.append('personal', JSON.stringify(personalData));
    }

    // Professional data
    const professionalData: Record<string, string | number> = {
      joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      highestQualification: data.highestQualification || '',
    };
    if (data.employeeId) professionalData.employeeId = data.employeeId;
    if (data.experienceYears)
      professionalData.experienceYears = Number(data.experienceYears);
    if (data.specialization)
      professionalData.specialization = data.specialization;
    if (data.designation) professionalData.designation = data.designation;
    if (data.department) professionalData.department = data.department;
    formData.append('professional', JSON.stringify(professionalData));

    // Subject data (only if provided)
    if (data.subjects || data.isClassTeacher !== undefined) {
      const subjectData: Record<string, string[] | boolean> = {};
      if (data.subjects) subjectData.subjects = data.subjects;
      if (data.isClassTeacher !== undefined)
        subjectData.isClassTeacher = data.isClassTeacher;
      formData.append('subjects', JSON.stringify(subjectData));
    }

    // Salary data (only if provided)
    if (data.basicSalary || data.allowances || data.totalSalary) {
      const salaryData: Record<string, number> = {};
      if (data.basicSalary)
        salaryData.basicSalary = parseFloat(data.basicSalary);
      if (data.allowances) salaryData.allowances = parseFloat(data.allowances);
      if (data.totalSalary)
        salaryData.totalSalary = parseFloat(data.totalSalary);
      formData.append('salary', JSON.stringify(salaryData));
    }

    // Bank and legal details (only if provided)
    if (
      data.bankName ||
      data.bankAccountNumber ||
      data.bankBranch ||
      data.panNumber ||
      data.citizenshipNumber
    ) {
      const bankData: Record<string, string> = {};
      if (data.bankName) bankData.bankName = data.bankName;
      if (data.bankAccountNumber)
        bankData.bankAccountNumber = data.bankAccountNumber;
      if (data.bankBranch) bankData.bankBranch = data.bankBranch;
      if (data.panNumber) bankData.panNumber = data.panNumber;
      if (data.citizenshipNumber)
        bankData.citizenshipNumber = data.citizenshipNumber;
      formData.append('bankDetails', JSON.stringify(bankData));
    }

    // Additional data (only if provided)
    if (data.languagesKnown || data.certifications || data.previousExperience) {
      const additionalData: Record<string, string | string[]> = {};
      if (data.languagesKnown)
        additionalData.languagesKnown = data.languagesKnown;
      if (data.certifications)
        additionalData.certifications = data.certifications;
      if (data.previousExperience)
        additionalData.previousExperience = data.previousExperience;
      formData.append('additional', JSON.stringify(additionalData));
    }

    // Add photo file if provided
    if (data.photo) {
      formData.append('photo', data.photo);
    }

    return this.httpClient.post<CreateTeacherResponse>(
      TEACHER_ENDPOINTS.CREATE,
      formData,
      { requiresAuth: true },
    );
  }

  /**
   * Get all teachers (supports optional pagination and filters)
   */
  async getAllTeachers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    designation?: string;
    department?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<
    ApiResponse<
      | TeacherListResponse[]
      | {
          data: TeacherListResponse[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }
    >
  > {
    return this.httpClient.get(
      TEACHER_ENDPOINTS.LIST,
      params as Record<string, unknown>,
      { requiresAuth: true },
    );
  }

  /**
   * Get current teacher's profile (for logged-in teacher users)
   */
  async getCurrentTeacher(): Promise<
    ApiResponse<{
      id: string;
      userId: string;
      user: { fullName: string; email: string };
    }>
  > {
    return this.httpClient.get<{
      id: string;
      userId: string;
      user: { fullName: string; email: string };
    }>(TEACHER_ENDPOINTS.GET_ME, undefined, { requiresAuth: true });
  }

  /**
   * Get a specific teacher by ID
   */
  async getTeacherById(id: string): Promise<ApiResponse<TeacherListResponse>> {
    return this.httpClient.get<TeacherListResponse>(
      TEACHER_ENDPOINTS.GET_BY_ID(id),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Update teacher (admin only)
   */
  async updateTeacherByAdmin(
    id: string,
    data: UpdateTeacherByAdminRequest,
  ): Promise<ApiResponse<UpdateTeacherResponse>> {
    return this.httpClient.patch<UpdateTeacherResponse>(
      TEACHER_ENDPOINTS.UPDATE_BY_ADMIN(id),
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Update own profile (teacher self-update)
   */
  async updateTeacherSelf(
    data: UpdateTeacherSelfRequest,
  ): Promise<ApiResponse<UpdateTeacherResponse>> {
    return this.httpClient.patch<UpdateTeacherResponse>(
      TEACHER_ENDPOINTS.UPDATE_SELF,
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Delete teacher (soft delete)
   */
  async deleteTeacher(id: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(TEACHER_ENDPOINTS.DELETE(id), {
      requiresAuth: true,
    });
  }

  // ========================================================================
  // Subject and Class Assignment Operations
  // ========================================================================

  /**
   * Get current teacher's own assigned subjects
   */
  async getMySubjects(): Promise<
    ApiResponse<Array<{ subject: { id: string; name: string; code: string } }>>
  > {
    return this.httpClient.get<
      Array<{ subject: { id: string; name: string; code: string } }>
    >(TEACHER_ENDPOINTS.GET_MY_SUBJECTS, undefined, {
      requiresAuth: true,
    });
  }

  /**
   * Get current teacher's own assigned classes
   */
  async getMyClasses(): Promise<
    ApiResponse<
      Array<{
        class: {
          id: string;
          grade: number;
          section: string;
          currentEnrollment?: number;
        };
      }>
    >
  > {
    return this.httpClient.get<
      Array<{
        class: {
          id: string;
          grade: number;
          section: string;
          currentEnrollment?: number;
        };
      }>
    >(TEACHER_ENDPOINTS.GET_MY_CLASSES, undefined, {
      requiresAuth: true,
    });
  }

  /**
   * Get current teacher's subjects for a specific class
   */
  async getMySubjectsForClass(
    classId: string,
  ): Promise<
    ApiResponse<Array<{ subject: { id: string; name: string; code: string } }>>
  > {
    return this.httpClient.get<
      Array<{ subject: { id: string; name: string; code: string } }>
    >(TEACHER_ENDPOINTS.GET_MY_SUBJECTS_FOR_CLASS(classId), undefined, {
      requiresAuth: true,
    });
  }

  /**
   * Check if current teacher is a class teacher and get attendance status
   */
  async getClassTeacherStatus(): Promise<
    ApiResponse<{
      isClassTeacher: boolean;
      classDetails: {
        id: string;
        grade: number;
        section: string;
        currentEnrollment: number;
      } | null;
      attendanceTakenToday: boolean;
      message: string;
    }>
  > {
    return this.httpClient.get<{
      isClassTeacher: boolean;
      classDetails: {
        id: string;
        grade: number;
        section: string;
        currentEnrollment: number;
      } | null;
      attendanceTakenToday: boolean;
      message: string;
    }>(TEACHER_ENDPOINTS.GET_CLASS_TEACHER_STATUS, undefined, {
      requiresAuth: true,
    });
  }

  /**
   * Get teacher's assigned subjects (admin only)
   */
  async getTeacherSubjects(
    teacherId: string,
  ): Promise<
    ApiResponse<Array<{ subject: { id: string; name: string; code: string } }>>
  > {
    return this.httpClient.get<
      Array<{ subject: { id: string; name: string; code: string } }>
    >(TEACHER_ENDPOINTS.GET_SUBJECTS(teacherId), undefined, {
      requiresAuth: true,
    });
  }

  /**
   * Get teacher's assigned classes (admin only)
   */
  async getTeacherClasses(teacherId: string): Promise<
    ApiResponse<
      Array<{
        class: {
          id: string;
          grade: number;
          section: string;
          currentEnrollment?: number;
        };
      }>
    >
  > {
    return this.httpClient.get<
      Array<{
        class: {
          id: string;
          grade: number;
          section: string;
          currentEnrollment?: number;
        };
      }>
    >(TEACHER_ENDPOINTS.GET_CLASSES(teacherId), undefined, {
      requiresAuth: true,
    });
  }

  /**
   * Assign subjects to teacher
   */
  async assignSubjects(
    teacherId: string,
    subjectIds: string[],
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.post<{ message: string }>(
      TEACHER_ENDPOINTS.ASSIGN_SUBJECTS(teacherId),
      { subjectIds },
      { requiresAuth: true },
    );
  }

  /**
   * Assign classes to teacher
   */
  async assignClasses(
    teacherId: string,
    classAssignments: Array<{
      classId: string;
      isClassTeacher?: boolean;
    }>,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.post<{ message: string }>(
      TEACHER_ENDPOINTS.ASSIGN_CLASSES(teacherId),
      { classAssignments },
      { requiresAuth: true },
    );
  }

  /**
   * Get next auto-generated employee ID
   */
  async getNextEmployeeId(): Promise<
    ApiResponse<{
      employeeId: string;
      sequence: number;
      year: number;
    }>
  > {
    return this.httpClient.get(TEACHER_ENDPOINTS.NEXT_EMPLOYEE_ID, {
      requiresAuth: true,
    });
  }

  /**
   * Get students for a teacher where they are the class teacher
   * This is used for complaint creation to restrict which students' parents a teacher can complain to
   */
  async getStudentsForClassTeacher(teacherId: string): Promise<
    ApiResponse<
      Array<{
        id: string;
        rollNumber: string;
        className: string;
        classId: string;
        user: {
          id: string;
          fullName: string;
          email: string;
        };
        parents: Array<{
          parent: {
            user: {
              id: string;
              fullName: string;
              email: string;
              phone: string;
            };
          };
        }>;
      }>
    >
  > {
    return this.httpClient.get(
      TEACHER_ENDPOINTS.GET_STUDENTS(teacherId),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Calculate total salary from basic salary and allowances
   */
  async calculateSalary(
    basicSalary: number,
    allowances: number,
  ): Promise<
    ApiResponse<{
      basicSalary: number;
      allowances: number;
      totalSalary: number;
    }>
  > {
    return this.httpClient.post(
      TEACHER_ENDPOINTS.CALCULATE_SALARY,
      {
        basicSalary,
        allowances,
      },
      {
        requiresAuth: true,
      },
    );
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const teacherService = new TeacherService();
