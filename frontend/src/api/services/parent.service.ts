/**
 * =============================================================================
 * Parent Service
 * =============================================================================
 * Service for handling parent-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const PARENT_ENDPOINTS = {
  CREATE: 'api/v1/parents',
  LIST: 'api/v1/parents',
  GET_BY_ID: (id: string) => `api/v1/parents/${id}`,
  UPDATE: (id: string) => `api/v1/parents/${id}`,
  DELETE: (id: string) => `api/v1/parents/${id}`,
  GET_CHILDREN: (id: string) => `api/v1/parents/${id}/children`,
  ADD_CHILD: (id: string) => `api/v1/parents/${id}/children`,
  REMOVE_CHILD: (parentId: string, childId: string) =>
    `api/v1/parents/${parentId}/children/${childId}`,
  UPDATE_PROFILE: (id: string) => `api/v1/parents/${id}/profile`,
} as const;

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateParentRequest {
  user: {
    fullName: string;
    email: string;
    phone: string;
  };
  profile: {
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
    workPlace?: string;
    workPhone?: string;
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      country?: string;
    };
    notes?: string;
    specialInstructions?: string;
  };
  children?: Array<{
    fullName: string;
    classId?: string;
    rollNumber?: string;
    relationship: string;
  }>;
}

export interface UpdateParentRequest {
  user?: {
    fullName?: string;
    phone?: string;
  };
  profile?: {
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
    workPlace?: string;
    workPhone?: string;
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      country?: string;
    };
    notes?: string;
    specialInstructions?: string;
  };
}

export interface ParentResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  profile?: {
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
    workPlace?: string;
    workPhone?: string;
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      country?: string;
    };
    notes?: string;
    specialInstructions?: string;
  };
  children?: Array<{
    id: string;
    fullName: string;
    classId?: string;
    rollNumber?: string;
    relationship: string;
  }>;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ParentListResponse {
  parents: ParentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ParentSearchResult {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  occupation?: string;
  existingChildren: {
    id: string;
    name: string;
    class: string;
    relationship: string;
  }[];
}

export interface AddChildRequest {
  studentId: string;
  relationship: string;
}

// ============================================================================
// Parent Service
// ============================================================================

export class ParentService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Create a new parent account
   */
  async createParent(
    data: CreateParentRequest,
    profilePicture?: File,
  ): Promise<ApiResponse<ParentResponse>> {
    const formData = new FormData();

    // Append parent data as JSON strings
    formData.append('user', JSON.stringify(data.user));
    formData.append('profile', JSON.stringify(data.profile));

    if (data.children) {
      formData.append('children', JSON.stringify(data.children));
    }

    // Profile picture
    if (profilePicture) {
      formData.append('photo', profilePicture);
    }

    return this.httpClient.post<ParentResponse>(
      PARENT_ENDPOINTS.CREATE,
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
   * Get all parents with optional filtering
   */
  async getAllParents(
    params?: ParentQueryParams,
  ): Promise<ApiResponse<ParentListResponse>> {
    const queryString = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)]),
        ).toString()
      : '';

    const url = queryString
      ? `${PARENT_ENDPOINTS.LIST}?${queryString}`
      : PARENT_ENDPOINTS.LIST;

    return this.httpClient.get<ParentListResponse>(url, {
      requiresAuth: true,
    });
  }

  /**
   * Get parent by ID
   */
  async getParentById(id: string): Promise<ApiResponse<ParentResponse>> {
    return this.httpClient.get<ParentResponse>(PARENT_ENDPOINTS.GET_BY_ID(id), {
      requiresAuth: true,
    });
  }

  /**
   * Update parent
   */
  async updateParent(
    id: string,
    data: UpdateParentRequest,
  ): Promise<ApiResponse<ParentResponse>> {
    return this.httpClient.patch<ParentResponse>(
      PARENT_ENDPOINTS.UPDATE(id),
      data,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Delete parent (soft delete)
   */
  async deleteParent(id: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(PARENT_ENDPOINTS.DELETE(id), {
      requiresAuth: true,
    });
  }

  /**
   * Get parent's children
   */
  async getParentChildren(parentId: string): Promise<ApiResponse<any[]>> {
    return this.httpClient.get<any[]>(PARENT_ENDPOINTS.GET_CHILDREN(parentId), {
      requiresAuth: true,
    });
  }

  /**
   * Add child to parent
   */
  async addChildToParent(
    parentId: string,
    childData: AddChildRequest,
  ): Promise<ApiResponse<void>> {
    return this.httpClient.post<void>(
      PARENT_ENDPOINTS.ADD_CHILD(parentId),
      childData,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Remove child from parent
   */
  async removeChildFromParent(
    parentId: string,
    childId: string,
  ): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(
      PARENT_ENDPOINTS.REMOVE_CHILD(parentId, childId),
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Update parent profile
   */
  async updateParentProfile(
    parentId: string,
    profileData: any,
    profilePicture?: File,
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();

    formData.append('profile', JSON.stringify(profileData));

    if (profilePicture) {
      formData.append('photo', profilePicture);
    }

    return this.httpClient.put<any>(
      PARENT_ENDPOINTS.UPDATE_PROFILE(parentId),
      formData,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Set primary parent for student
   */
  async setPrimaryParent(
    parentId: string,
    studentId: string,
  ): Promise<ApiResponse<void>> {
    return this.httpClient.post<void>(
      'api/v1/parents/set-primary',
      { parentId, studentId },
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Get available students for linking
   */
  async getAvailableStudents(): Promise<ApiResponse<any[]>> {
    return this.httpClient.get<any[]>('api/v1/parents/available-students', {
      requiresAuth: true,
    });
  }

  /**
   * Search parents for linking to students
   */
  async searchForLinking(
    searchTerm: string,
    limit: number = 20,
  ): Promise<ApiResponse<ParentSearchResult[]>> {
    return this.httpClient.get<ParentSearchResult[]>(
      `api/v1/parents/search-for-linking?search=${encodeURIComponent(searchTerm)}&limit=${limit}`,
      {
        requiresAuth: true,
      },
    );
  }
}

// Export singleton instance
export const parentService = new ParentService();
