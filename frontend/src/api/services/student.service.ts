/**
 * =============================================================================
 * Student Service
 * =============================================================================
 * Service for handling student-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const STUDENT_ENDPOINTS = {
  CREATE_WITH_NEW_PARENTS: 'api/v1/students/with-new-parents',
  CREATE_WITH_EXISTING_PARENTS: 'api/v1/students/with-existing-parents',
  CREATE_SIBLING: 'api/v1/students/sibling',
  LIST: 'api/v1/students',
  GET_BY_ID: (id: string) => `api/v1/students/${id}`,
  UPDATE: (id: string) => `api/v1/students/${id}`,
  DELETE: (id: string) => `api/v1/students/${id}`,
  SET_PRIMARY_PARENT: (id: string) => `api/v1/students/${id}/primary-parent`,
  UPSERT_PROFILE: (id: string) => `api/v1/students/${id}/profile`,
  GET_BY_CLASS: (classId: string) => `api/v1/students/class/${classId}`,
  GET_BY_PARENT: (parentId: string) => `api/v1/students/parent/${parentId}`,
} as const;

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateStudentRequest {
  user: {
    fullName: string;
    email: string;
    phone?: string;
  };
  classId: string;
  rollNumber: string;
  admissionDate: string;
  email: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  imageUrl?: string;

  // Parent information
  fatherName: string;
  motherName: string;
  fatherPhone?: string;
  motherPhone?: string;
  fatherEmail: string;
  motherEmail: string;
  fatherOccupation?: string;
  motherOccupation?: string;

  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };

  // Guardians
  guardians?: Array<{
    fullName: string;
    phone: string;
    email: string;
    relation: string;
  }>;

  // Parents for user account creation
  parents: Array<{
    fullName: string;
    email: string;
    phone?: string;
    relationship: string;
    isPrimary: boolean;
    createUserAccount?: boolean;
  }>;

  // Profile
  profile?: {
    emergencyContact?: any;
    interests?: any;
    additionalData?: any;
    profilePhotoUrl?: string;
  };
}

export interface UpdateStudentRequest {
  fullName?: string;
  phone?: string;
  email?: string;
  classId?: string;
  rollNumber?: string;
  admissionDate?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  imageUrl?: string;

  // Parent information
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  fatherEmail?: string;
  motherEmail?: string;
  fatherOccupation?: string;
  motherOccupation?: string;

  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
}

export interface StudentResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  classId: string;
  rollNumber: string;
  admissionDate: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  imageUrl?: string;

  // Parent information
  fatherName: string;
  motherName: string;
  fatherPhone?: string;
  motherPhone?: string;
  fatherEmail: string;
  motherEmail: string;
  fatherOccupation?: string;
  motherOccupation?: string;

  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface StudentListResponse {
  students: StudentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  sectionId?: string;
}

// ============================================================================
// Student Service
// ============================================================================

export class StudentService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Create a new student with new parents
   */
  async createStudentWithNewParents(
    data: CreateStudentRequest,
    profilePicture?: File,
  ): Promise<ApiResponse<StudentResponse>> {
    const formData = new FormData();

    // Append student data as JSON strings
    formData.append('user', JSON.stringify(data.user));
    formData.append('classId', data.classId);
    formData.append('rollNumber', data.rollNumber);
    formData.append('admissionDate', data.admissionDate);
    formData.append('email', data.email);
    formData.append('dob', data.dob);
    formData.append('gender', data.gender);

    if (data.bloodGroup) formData.append('bloodGroup', data.bloodGroup);
    if (data.imageUrl) formData.append('imageUrl', data.imageUrl);

    // Parent information
    formData.append('fatherName', data.fatherName);
    formData.append('motherName', data.motherName);
    formData.append('fatherEmail', data.fatherEmail);
    formData.append('motherEmail', data.motherEmail);

    if (data.fatherPhone) formData.append('fatherPhone', data.fatherPhone);
    if (data.motherPhone) formData.append('motherPhone', data.motherPhone);
    if (data.fatherOccupation)
      formData.append('fatherOccupation', data.fatherOccupation);
    if (data.motherOccupation)
      formData.append('motherOccupation', data.motherOccupation);

    // Address
    if (data.address) formData.append('address', JSON.stringify(data.address));

    // Guardians
    if (data.guardians)
      formData.append('guardians', JSON.stringify(data.guardians));

    // Parents
    formData.append('parents', JSON.stringify(data.parents));

    // Profile
    if (data.profile) formData.append('profile', JSON.stringify(data.profile));

    // Profile picture
    if (profilePicture) {
      formData.append('photo', profilePicture);
    }

    return this.httpClient.post<StudentResponse>(
      STUDENT_ENDPOINTS.CREATE_WITH_NEW_PARENTS,
      formData,
      {
        requiresAuth: true,
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
      },
    );
  }

  /**
   * Create a new student with existing parents
   */
  async createStudentWithExistingParents(
    data: CreateStudentRequest,
    profilePicture?: File,
  ): Promise<ApiResponse<StudentResponse>> {
    const formData = new FormData();

    // Similar to above but for existing parents endpoint
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (profilePicture) {
      formData.append('photo', profilePicture);
    }

    return this.httpClient.post<StudentResponse>(
      STUDENT_ENDPOINTS.CREATE_WITH_EXISTING_PARENTS,
      formData,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Create a sibling student
   */
  async createSiblingStudent(
    data: CreateStudentRequest,
    profilePicture?: File,
  ): Promise<ApiResponse<StudentResponse>> {
    return this.createStudentWithExistingParents(data, profilePicture);
  }

  /**
   * Get all students with optional filtering
   */
  async getAllStudents(
    params?: StudentQueryParams,
  ): Promise<ApiResponse<StudentListResponse>> {
    const queryString = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)]),
        ).toString()
      : '';

    const url = queryString
      ? `${STUDENT_ENDPOINTS.LIST}?${queryString}`
      : STUDENT_ENDPOINTS.LIST;

    return this.httpClient.get<StudentListResponse>(url, {
      requiresAuth: true,
    });
  }

  /**
   * Get student by ID
   */
  async getStudentById(id: string): Promise<ApiResponse<StudentResponse>> {
    return this.httpClient.get<StudentResponse>(
      STUDENT_ENDPOINTS.GET_BY_ID(id),
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Update student
   */
  async updateStudent(
    id: string,
    data: UpdateStudentRequest,
  ): Promise<ApiResponse<StudentResponse>> {
    return this.httpClient.patch<StudentResponse>(
      STUDENT_ENDPOINTS.UPDATE(id),
      data,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Delete student (soft delete)
   */
  async deleteStudent(id: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(STUDENT_ENDPOINTS.DELETE(id), {
      requiresAuth: true,
    });
  }

  /**
   * Set primary parent for student
   */
  async setPrimaryParent(
    studentId: string,
    parentId: string,
  ): Promise<ApiResponse<void>> {
    return this.httpClient.patch<void>(
      STUDENT_ENDPOINTS.SET_PRIMARY_PARENT(studentId),
      { parentId },
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Upsert student profile
   */
  async upsertStudentProfile(
    studentId: string,
    profileData: any,
  ): Promise<ApiResponse<any>> {
    return this.httpClient.put<any>(
      STUDENT_ENDPOINTS.UPSERT_PROFILE(studentId),
      profileData,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Get students by class
   */
  async getStudentsByClass(
    classId: string,
  ): Promise<ApiResponse<StudentResponse[]>> {
    return this.httpClient.get<StudentResponse[]>(
      STUDENT_ENDPOINTS.GET_BY_CLASS(classId),
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Get students by parent
   */
  async getStudentsByParent(
    parentId: string,
  ): Promise<ApiResponse<StudentResponse[]>> {
    return this.httpClient.get<StudentResponse[]>(
      STUDENT_ENDPOINTS.GET_BY_PARENT(parentId),
      {
        requiresAuth: true,
      },
    );
  }
}

// Export singleton instance
export const studentService = new StudentService();
