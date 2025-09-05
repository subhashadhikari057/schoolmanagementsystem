/**
 * =============================================================================
 * School Information Service
 * =============================================================================
 * Frontend API service for managing school information settings.
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

export interface SchoolInformation {
  id: string;
  schoolName: string;
  schoolCode: string;
  establishedYear: number;
  address: string;
  website?: string | null;
  emails: string[];
  contactNumbers: string[];
  logo?: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdById: string | null;
  updatedById: string | null;
}

export interface CreateSchoolInformationRequest {
  schoolName: string;
  schoolCode: string;
  establishedYear: number;
  address: string;
  website?: string;
  emails?: string[];
  contactNumbers?: string[];
  logo?: string;
}

export interface UpdateSchoolInformationRequest {
  schoolName?: string;
  schoolCode?: string;
  establishedYear?: number;
  address?: string;
  website?: string;
  emails?: string[];
  contactNumbers?: string[];
  logo?: string;
}

export interface SchoolInformationExistsResponse {
  exists: boolean;
}

export class SchoolInformationService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Create school information
   */
  async createSchoolInformation(
    data: CreateSchoolInformationRequest,
  ): Promise<ApiResponse<SchoolInformation>> {
    return this.httpClient.post<SchoolInformation>(
      'api/v1/school-information',
      data,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Get school information
   */
  async getSchoolInformation(): Promise<ApiResponse<SchoolInformation | null>> {
    return this.httpClient.get<SchoolInformation | null>(
      'api/v1/school-information',
      undefined,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Update school information
   */
  async updateSchoolInformation(
    data: UpdateSchoolInformationRequest,
  ): Promise<ApiResponse<SchoolInformation>> {
    return this.httpClient.put<SchoolInformation>(
      'api/v1/school-information',
      data,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Create or update school information (upsert)
   */
  async createOrUpdateSchoolInformation(
    data: CreateSchoolInformationRequest,
  ): Promise<ApiResponse<SchoolInformation>> {
    return this.httpClient.post<SchoolInformation>(
      'api/v1/school-information/upsert',
      data,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Check if school information exists
   */
  async checkSchoolInformationExists(): Promise<
    ApiResponse<SchoolInformationExistsResponse>
  > {
    return this.httpClient.get<SchoolInformationExistsResponse>(
      'api/v1/school-information/exists',
      undefined,
      {
        requiresAuth: true,
      },
    );
  }
}

// Export singleton instance
export const schoolInformationService = new SchoolInformationService();
