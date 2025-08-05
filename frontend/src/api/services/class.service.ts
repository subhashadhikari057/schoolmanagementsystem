/**
 * =============================================================================
 * Class Service
 * =============================================================================
 * Service for managing class-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import type { ApiResponse } from '../types/common';

// ============================================================================
// Types based on backend DTOs
// ============================================================================

export interface CreateClassRequest {
  name: string; // e.g. "Grade 10"
}

export interface UpdateClassRequest {
  name?: string;
}

export interface ClassResponse {
  id: string;
  name: string;
  sections: SectionResponse[];
  createdAt: string;
  updatedAt?: string;
  createdById?: string;
  updatedById?: string;
}

export interface SectionResponse {
  id: string;
  name: string;
  classId: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// Class Service
// ============================================================================

export class ClassService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Class Operations
  // ========================================================================

  /**
   * Create a new class
   */
  async createClass(
    data: CreateClassRequest,
  ): Promise<ApiResponse<ClassResponse>> {
    return this.httpClient.post<ClassResponse>('api/v1/classes', data);
  }

  /**
   * Get all classes with their sections
   */
  async getAllClasses(): Promise<ApiResponse<ClassResponse[]>> {
    return this.httpClient.get<ClassResponse[]>('api/v1/classes');
  }

  /**
   * Get a specific class by ID
   */
  async getClassById(id: string): Promise<ApiResponse<ClassResponse>> {
    return this.httpClient.get<ClassResponse>(`api/v1/classes/${id}`);
  }

  /**
   * Update a class
   */
  async updateClass(
    id: string,
    data: UpdateClassRequest,
  ): Promise<ApiResponse<ClassResponse>> {
    return this.httpClient.patch<ClassResponse>(`api/v1/classes/${id}`, data);
  }

  /**
   * Delete a class
   */
  async deleteClass(id: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(`api/v1/classes/${id}`);
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const classService = new ClassService();
