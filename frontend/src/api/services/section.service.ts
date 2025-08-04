/**
 * =============================================================================
 * Section Service
 * =============================================================================
 * Service for managing section-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import type { ApiResponse } from '../types/common';

// ============================================================================
// Types based on backend DTOs
// ============================================================================

export interface CreateSectionRequest {
  name: string; // e.g. "Section A"
  classId: string; // UUID of the class
}

export interface UpdateSectionRequest {
  name?: string;
}

export interface SectionResponse {
  id: string;
  name: string;
  classId: string;
  class?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
  createdById?: string;
  updatedById?: string;
}

// ============================================================================
// Section Service
// ============================================================================

export class SectionService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Section Operations
  // ========================================================================

  /**
   * Create a new section
   */
  async createSection(
    data: CreateSectionRequest,
  ): Promise<ApiResponse<SectionResponse>> {
    return this.httpClient.post<SectionResponse>('api/v1/sections', data);
  }

  /**
   * Get all sections
   */
  async getAllSections(): Promise<ApiResponse<SectionResponse[]>> {
    return this.httpClient.get<SectionResponse[]>('api/v1/sections');
  }

  /**
   * Get a specific section by ID
   */
  async getSectionById(id: string): Promise<ApiResponse<SectionResponse>> {
    return this.httpClient.get<SectionResponse>(`api/v1/sections/${id}`);
  }

  /**
   * Update a section
   */
  async updateSection(
    id: string,
    data: UpdateSectionRequest,
  ): Promise<ApiResponse<SectionResponse>> {
    return this.httpClient.patch<SectionResponse>(
      `api/v1/sections/${id}`,
      data,
    );
  }

  /**
   * Delete a section
   */
  async deleteSection(id: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(`api/v1/sections/${id}`);
  }

  /**
   * Get sections by class ID
   */
  async getSectionsByClassId(
    classId: string,
  ): Promise<ApiResponse<SectionResponse[]>> {
    return this.httpClient.get<SectionResponse[]>(
      `api/v1/sections?classId=${classId}`,
    );
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const sectionService = new SectionService();
