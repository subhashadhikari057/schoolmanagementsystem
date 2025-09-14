/**
 * =============================================================================
 * Subject Service
 * =============================================================================
 * Service for handling subject-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import {
  SubjectResponse,
  CreateSubjectRequest,
  UpdateSubjectRequest,
} from '../types/subject';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const SUBJECT_ENDPOINTS = {
  LIST: 'api/v1/subjects',
  GET_BY_ID: (id: string) => `api/v1/subjects/${id}`,
  CREATE: 'api/v1/subjects',
  UPDATE: (id: string) => `api/v1/subjects/${id}`,
  DELETE: (id: string) => `api/v1/subjects/${id}`,
  GET_COUNT: 'api/v1/subjects/count',
} as const;

// ============================================================================
// Subject Service
// ============================================================================

export class SubjectService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Subject Operations
  // ========================================================================

  /**
   * Get all subjects
   */
  async getAllSubjects(): Promise<ApiResponse<SubjectResponse[]>> {
    return this.httpClient.get<SubjectResponse[]>(
      SUBJECT_ENDPOINTS.LIST,
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get a specific subject by ID
   */
  async getSubjectById(id: string): Promise<ApiResponse<SubjectResponse>> {
    return this.httpClient.get<SubjectResponse>(
      SUBJECT_ENDPOINTS.GET_BY_ID(id),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Create a new subject
   */
  async createSubject(
    data: CreateSubjectRequest,
  ): Promise<ApiResponse<SubjectResponse>> {
    return this.httpClient.post<SubjectResponse>(
      SUBJECT_ENDPOINTS.CREATE,
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Update subject
   */
  async updateSubject(
    id: string,
    data: UpdateSubjectRequest,
  ): Promise<ApiResponse<SubjectResponse>> {
    return this.httpClient.patch<SubjectResponse>(
      SUBJECT_ENDPOINTS.UPDATE(id),
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Delete subject (with foreign key constraint handling)
   */
  async deleteSubject(
    id: string,
  ): Promise<ApiResponse<{ message: string; affectedRelations?: string[] }>> {
    return this.httpClient.delete<{
      message: string;
      affectedRelations?: string[];
    }>(SUBJECT_ENDPOINTS.DELETE(id), { requiresAuth: true });
  }

  /**
   * Get subject count
   */
  async getSubjectCount(): Promise<ApiResponse<{ count: number }>> {
    return this.httpClient.get<{ count: number }>(
      SUBJECT_ENDPOINTS.GET_COUNT,
      undefined,
      { requiresAuth: true },
    );
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const subjectService = new SubjectService();
