import { httpClient } from '@/api/client';

export interface Person {
  id: string;
  name: string;
  type: 'student' | 'teacher' | 'staff';
  info: string;
  rollNumber?: string;
  employeeId?: string;
  email?: string;
  avatar?: string;
}

export interface PersonSearchParams {
  type: 'student' | 'teacher' | 'staff';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PersonSearchResponse {
  persons: Person[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IDCardGenerationRequest {
  personId: string;
  personType: 'student' | 'teacher' | 'staff';
  templateId: string;
  expiryDate: string;
  notes?: string;
}

export interface BulkIDCardGenerationRequest {
  type: 'class' | 'all-teachers' | 'all-staff';
  classId?: string;
  templateId: string;
  expiryDate: string;
  notes?: string;
}

import {
  GenerationResult,
  BulkGenerationResult,
} from '@/types/generation-results.types';

export interface IDCardGenerationResult extends GenerationResult {}

export interface BulkIDCardGenerationResult extends BulkGenerationResult {}

export interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  section: string;
  currentEnrollment: number;
}

export interface BulkGenerationStats {
  students: number;
  teachers: number;
  staff: number;
  classes: number;
}

export const personSearchService = {
  /**
   * Search for persons (students, teachers, staff)
   */
  async searchPersons(
    params: PersonSearchParams,
  ): Promise<PersonSearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('type', params.type);

    if (params.search) {
      searchParams.append('search', params.search);
    }
    if (params.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const response = await httpClient.get<PersonSearchResponse>(
      `/api/id-card-generation/search-persons?${searchParams.toString()}`,
      undefined,
      { requiresAuth: true },
    );
    return response.data;
  },

  /**
   * Generate an individual ID card
   */
  async generateIndividualIDCard(
    request: IDCardGenerationRequest,
  ): Promise<IDCardGenerationResult> {
    const response = await httpClient.post<IDCardGenerationResult>(
      '/api/id-card-generation/generate-individual',
      request,
      { requiresAuth: true },
    );
    return response.data;
  },

  /**
   * Generate ID cards in bulk
   */
  async generateBulkIDCards(
    request: BulkIDCardGenerationRequest,
  ): Promise<BulkIDCardGenerationResult> {
    const response = await httpClient.post<BulkIDCardGenerationResult>(
      '/api/id-card-generation/generate-bulk',
      request,
      { requiresAuth: true },
    );
    return response.data;
  },

  /**
   * Get available classes for bulk generation
   */
  async getAvailableClasses(): Promise<ClassInfo[]> {
    const response = await httpClient.get<ClassInfo[]>(
      '/api/id-card-generation/available-classes',
      undefined,
      { requiresAuth: true },
    );
    return response.data;
  },

  /**
   * Get statistics for bulk generation
   */
  async getBulkGenerationStats(): Promise<BulkGenerationStats> {
    const response = await httpClient.get<BulkGenerationStats>(
      '/api/id-card-generation/bulk-stats',
      undefined,
      { requiresAuth: true },
    );
    return response.data;
  },
};
