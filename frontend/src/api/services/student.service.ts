import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// Student endpoints
export const STUDENT_ENDPOINTS = {
  CREATE: 'api/v1/students',
  GET_ALL: 'api/v1/students',
  GET_BY_ID: (id: string) => `api/v1/students/${id}`,
  GET_BY_USER_ID: (userId: string) => `api/v1/students/user/${userId}`,
  UPDATE_BY_ADMIN: (id: string) => `api/v1/students/${id}`,
  UPDATE_SELF: 'api/v1/students/profile/self',
  DELETE: (id: string) => `api/v1/students/${id}`,
  GET_PARENTS: (id: string) => `api/v1/students/${id}/parents`,
  GET_GUARDIANS: (id: string) => `api/v1/students/${id}/guardians`,
  GET_COUNT: 'api/v1/students/stats/count',
  GET_STATS: 'api/v1/students/stats',
} as const;

// Types based on the backend DTOs
export interface CreateStudentRequest {
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
  };
  personal?: {
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    ethnicity?: string;
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
  academic: {
    classId: string;
    rollNumber?: string; // Optional - will be auto-generated if not provided
    admissionDate: string;
    studentId?: string;
    academicStatus?: 'active' | 'suspended' | 'graduated' | 'transferred';
    feeStatus?: 'paid' | 'pending' | 'overdue' | 'partial';
    transportMode?: string;
  };
  parentInfo?: {
    fatherFirstName: string;
    fatherMiddleName?: string;
    fatherLastName: string;
    fatherEmail: string;
    fatherPhone?: string;
    fatherOccupation?: string;
    motherFirstName: string;
    motherMiddleName?: string;
    motherLastName: string;
    motherEmail: string;
    motherPhone?: string;
    motherOccupation?: string;
  };
  parents?: Array<{
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
    createUserAccount: boolean;
    occupation?: string;
  }>;
  existingParents?: Array<{
    parentId: string;
    relationship: string;
    isPrimary: boolean;
  }>;
  guardians?: Array<{
    firstName: string;
    middleName?: string;
    lastName: string;
    phone: string;
    email: string;
    relation: string;
  }>;
  additional?: {
    medicalConditions?: string;
    allergies?: string;
    interests?: string;
    specialNeeds?: string;
    bio?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  profile?: {
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    interests?: {
      interests: string;
    };
    additionalData?: {
      medicalConditions?: string;
      allergies?: string;
      specialNeeds?: string;
    };
  };
}

export interface UpdateStudentByAdminRequest {
  user?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  personal?: {
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    ethnicity?: string;
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
  academic?: {
    classId?: string;
    rollNumber?: string;
    admissionDate?: string;
    studentId?: string;
    academicStatus?: 'active' | 'suspended' | 'graduated' | 'transferred';
    feeStatus?: 'paid' | 'pending' | 'overdue' | 'partial';
    transportMode?: string;
  };
  parentInfo?: {
    fatherFirstName?: string;
    fatherMiddleName?: string;
    fatherLastName?: string;
    fatherEmail?: string;
    fatherPhone?: string;
    fatherOccupation?: string;
    motherFirstName?: string;
    motherMiddleName?: string;
    motherLastName?: string;
    motherEmail?: string;
    motherPhone?: string;
    motherOccupation?: string;
  };
  additional?: {
    medicalConditions?: string;
    allergies?: string;
    interests?: string;
    specialNeeds?: string;
    bio?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
}

export interface UpdateStudentSelfRequest {
  user?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phone?: string;
  };
  personal?: {
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
  additional?: {
    interests?: string;
    bio?: string;
  };
}

export interface StudentQueryParams {
  limit?: number;
  page?: number;
  search?: string;
  classId?: string;
  ethnicity?: string;
  academicStatus?: 'active' | 'suspended' | 'graduated' | 'transferred';
  feeStatus?: 'paid' | 'pending' | 'overdue' | 'partial';
  sortBy?: 'name' | 'rollNumber' | 'admissionDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface StudentResponse {
  id: string;
  fullName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  rollNumber: string;
  studentId?: string;
  classId: string;
  className?: string;

  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  ethnicity?: string;
  maritalStatus?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  // Academic Information
  admissionDate: string;
  academicStatus: string;
  feeStatus: string;
  transportMode?: string;

  // Parent Information
  fatherFirstName: string;
  fatherMiddleName?: string;
  fatherLastName: string;
  motherFirstName: string;
  motherMiddleName?: string;
  motherLastName: string;
  fatherPhone?: string;
  motherPhone?: string;
  fatherEmail: string;
  motherEmail: string;
  fatherOccupation?: string;
  motherOccupation?: string;

  // Medical Information
  medicalConditions?: string;
  allergies?: string;

  // Additional Information
  interests?: string;
  specialNeeds?: string;

  // Profile Information
  profilePhotoUrl?: string;
  bio?: string;

  // System fields
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;

  // Relations
  parents?: Array<{
    id: string;
    fullName: string;
    email: string;
    relationship: string;
    isPrimary: boolean;
  }>;

  guardians?: Array<{
    id: string;
    fullName: string;
    phone: string;
    email: string;
    relation: string;
    occupation?: string;
  }>;
}

export interface StudentListResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  rollNumber: string;
  studentId?: string;
  className: string;
  admissionDate: string;
  academicStatus: string;
  feeStatus: string;
  profilePhotoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStudentResponse {
  student: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    rollNumber: string;
    studentId?: string;
    profilePhotoUrl?: string;
  };
  temporaryPassword?: string;
  parentCredentials?: Array<{
    id: string;
    fullName: string;
    email: string;
    relationship: string;
    temporaryPassword: string;
  }>;
}

export interface StudentCountResponse {
  count: number;
}

export interface StudentStatsResponse {
  total: number;
  active: number;
  suspended: number;
  warning: number;
  graduated: number;
  transferred: number;
}

export interface ParentInfo {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  relationship: string;
  isPrimary: boolean;
}

export interface GuardianInfo {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  relation: string;
  createdAt: string;
}

export class StudentService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // Create student
  async createStudent(
    data: CreateStudentRequest,
    profilePicture?: File,
  ): Promise<ApiResponse<CreateStudentResponse>> {
    const formData = new FormData();

    // Structure data for backend (matching the controller's expected format)
    formData.append('user', JSON.stringify(data.user));

    if (data.personal) {
      formData.append('personal', JSON.stringify(data.personal));
    }

    formData.append('academic', JSON.stringify(data.academic));

    if (data.parentInfo) {
      formData.append('parentInfo', JSON.stringify(data.parentInfo));
    }

    if (data.parents) {
      formData.append('parents', JSON.stringify(data.parents));
    }

    if (data.existingParents) {
      formData.append('existingParents', JSON.stringify(data.existingParents));
    }

    if (data.guardians) {
      formData.append('guardians', JSON.stringify(data.guardians));
    }

    if (data.additional) {
      formData.append('additional', JSON.stringify(data.additional));
    }

    if (data.profile) {
      formData.append('profile', JSON.stringify(data.profile));
    }

    if (profilePicture) {
      formData.append('photo', profilePicture);
    }

    return this.httpClient.post<CreateStudentResponse>(
      STUDENT_ENDPOINTS.CREATE,
      formData,
      { requiresAuth: true },
    );
  }

  // Get all students with filtering and pagination
  async getAllStudents(params?: StudentQueryParams): Promise<
    ApiResponse<{
      data: StudentListResponse[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    return this.httpClient.get(
      STUDENT_ENDPOINTS.GET_ALL,
      params as Record<string, unknown>,
      {
        requiresAuth: true,
      },
    );
  }

  // Get student by ID
  async getStudentById(id: string): Promise<ApiResponse<StudentResponse>> {
    return this.httpClient.get<StudentResponse>(
      STUDENT_ENDPOINTS.GET_BY_ID(id),
      undefined,
      { requiresAuth: true },
    );
  }

  // Get student by user ID
  async getStudentByUserId(
    userId: string,
  ): Promise<ApiResponse<StudentResponse>> {
    return this.httpClient.get<StudentResponse>(
      STUDENT_ENDPOINTS.GET_BY_USER_ID(userId),
      undefined,
      { requiresAuth: true },
    );
  }

  // Update student by admin
  async updateStudentByAdmin(
    id: string,
    data: UpdateStudentByAdminRequest,
  ): Promise<ApiResponse<{ message: string; id: string }>> {
    return this.httpClient.patch(STUDENT_ENDPOINTS.UPDATE_BY_ADMIN(id), data, {
      requiresAuth: true,
    });
  }

  // Update student profile (self)
  async updateStudentSelf(
    data: UpdateStudentSelfRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.patch(STUDENT_ENDPOINTS.UPDATE_SELF, data, {
      requiresAuth: true,
    });
  }

  // Soft delete student
  async deleteStudent(
    id: string,
  ): Promise<ApiResponse<{ message: string; id: string }>> {
    return this.httpClient.delete(STUDENT_ENDPOINTS.DELETE(id), {
      requiresAuth: true,
    });
  }

  // Get student parents
  async getStudentParents(id: string): Promise<ApiResponse<ParentInfo[]>> {
    return this.httpClient.get<ParentInfo[]>(
      STUDENT_ENDPOINTS.GET_PARENTS(id),
      undefined,
      { requiresAuth: true },
    );
  }

  // Get student guardians
  async getStudentGuardians(id: string): Promise<ApiResponse<GuardianInfo[]>> {
    return this.httpClient.get<GuardianInfo[]>(
      STUDENT_ENDPOINTS.GET_GUARDIANS(id),
      undefined,
      { requiresAuth: true },
    );
  }

  // Add guardian to existing student
  async addGuardianToStudent(
    studentId: string,
    guardianData: {
      guardians: Array<{
        firstName: string;
        middleName?: string;
        lastName: string;
        phone: string;
        email: string;
        relation: string;
        occupation?: string;
        createUserAccount: boolean;
      }>;
    },
  ): Promise<
    ApiResponse<{
      message: string;
      guardianCredentials?: Array<{
        id: string;
        fullName: string;
        email: string;
        relationship: string;
        temporaryPassword: string;
      }>;
    }>
  > {
    try {
      const response = await this.httpClient.post<{
        message: string;
        guardianCredentials?: Array<{
          id: string;
          fullName: string;
          email: string;
          relationship: string;
          temporaryPassword: string;
        }>;
      }>(`/api/v1/students/${studentId}/guardians`, guardianData, {
        requiresAuth: true,
      });

      return response;
    } catch (error) {
      console.error('Add guardian error:', error);
      throw error;
    }
  }

  // Update existing guardian
  async updateGuardian(
    studentId: string,
    guardianId: string,
    guardianData: {
      fullName: string;
      phone: string;
      email: string;
      relation: string;
      occupation?: string;
    },
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.httpClient.patch<{ message: string }>(
        `/api/v1/students/${studentId}/guardians/${guardianId}`,
        guardianData,
        { requiresAuth: true },
      );

      return response;
    } catch (error) {
      console.error('Update guardian error:', error);
      throw error;
    }
  }

  // Cleanup duplicate guardians
  async cleanupDuplicateGuardians(
    studentId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.httpClient.post<{ message: string }>(
        `/api/v1/students/${studentId}/guardians/cleanup-duplicates`,
        {},
        { requiresAuth: true },
      );

      return response;
    } catch (error) {
      console.error('Cleanup duplicate guardians error:', error);
      throw error;
    }
  }

  // Get student count
  async getStudentCount(): Promise<ApiResponse<StudentCountResponse>> {
    return this.httpClient.get<StudentCountResponse>(
      STUDENT_ENDPOINTS.GET_COUNT,
      undefined,
      { requiresAuth: true },
    );
  }

  // Get student statistics
  async getStudentStats(): Promise<ApiResponse<StudentStatsResponse>> {
    return this.httpClient.get<StudentStatsResponse>(
      STUDENT_ENDPOINTS.GET_STATS,
      undefined,
      { requiresAuth: true },
    );
  }

  // Helper method to calculate next student ID (used in frontend)
  async getNextStudentId(): Promise<{
    success: boolean;
    data: { studentId: string };
    message: string;
  }> {
    try {
      const response = await this.getStudentCount();
      if (response.success) {
        const currentYear = new Date().getFullYear();
        const count = response.data.count;
        const studentId = `S-${currentYear}-${(count + 1).toString().padStart(4, '0')}`;
        return {
          success: true,
          data: { studentId },
          message: 'Student ID generated successfully',
        };
      }
      throw new Error('Failed to get student count');
    } catch {
      return {
        success: false,
        data: { studentId: '' },
        message: 'Failed to generate student ID',
      };
    }
  }

  // Get available classes with capacity information
  async getAvailableClasses(): Promise<
    ApiResponse<{
      classes: Array<{
        id: string;
        name: string;
        grade: number;
        section: string;
        capacity: number;
        currentStudents: number;
        availableSpots: number;
        isFull: boolean;
        roomNo: string;
      }>;
    }>
  > {
    return this.httpClient.get(
      `/api/v1/classes/available-classes`,
      {},
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Import/Export Operations
  // ========================================================================

  /**
   * Import students from Excel file
   */
  async importStudentsFromExcel(
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
        student: string;
        error: string;
      }>;
      importedStudents: Array<{
        id: string;
        fullName: string;
        email: string;
        rollNumber: string;
        className: string;
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

    return this.httpClient.post('api/v1/student-import/import', formData, {
      requiresAuth: true,
      isMultipart: true,
    });
  }

  /**
   * Export students to Excel
   */
  async exportStudentsToExcel(params?: {
    classId?: string;
    search?: string;
    academicStatus?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();

    if (params?.classId) {
      queryParams.set('classId', params.classId);
    }

    if (params?.search) {
      queryParams.set('search', params.search);
    }

    if (params?.academicStatus) {
      queryParams.set('academicStatus', params.academicStatus);
    }

    const url = `api/v1/student-import/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

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
   * Get Excel template for student import
   */
  async getImportTemplate(): Promise<Blob> {
    // For blob responses, we need to use fetch directly
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const fullUrl = `${baseURL}/api/v1/student-import/import/template`;

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
}

// Export a singleton instance
export const studentService = new StudentService();
