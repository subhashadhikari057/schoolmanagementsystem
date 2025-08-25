import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// Response endpoints
export const COMPLAINT_RESPONSE_ENDPOINTS = {
  CREATE: (complaintId: string) =>
    `/api/v1/complaints/${complaintId}/responses`,
  GET: (complaintId: string) => `/api/v1/complaints/${complaintId}/responses`,
} as const;

// =============================================================================
// Response Types
// =============================================================================

export interface CreateComplaintResponseRequest {
  content: string;
}

export interface ComplaintResponse {
  id: string;
  complaintId: string;
  responderId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  responder: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface ComplaintResponseListResponse {
  responses: ComplaintResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Complaint Response Service
// =============================================================================

export class ComplaintResponseService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Core Response Operations
  // ========================================================================

  /**
   * Create a response to a complaint
   */
  async createResponse(
    complaintId: string,
    data: CreateComplaintResponseRequest,
  ): Promise<ApiResponse<ComplaintResponse>> {
    try {
      return await this.httpClient.post<ComplaintResponse>(
        COMPLAINT_RESPONSE_ENDPOINTS.CREATE(complaintId),
        data,
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to create response');
    }
  }

  /**
   * Get responses for a complaint
   */
  async getResponses(
    complaintId: string,
  ): Promise<ApiResponse<ComplaintResponse[]>> {
    try {
      return await this.httpClient.get<ComplaintResponse[]>(
        COMPLAINT_RESPONSE_ENDPOINTS.GET(complaintId),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch responses');
    }
  }

  // ========================================================================
  // Response Validation and Utilities
  // ========================================================================

  /**
   * Validate response content
   */
  validateResponseContent(content: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!content || content.trim().length === 0) {
      return {
        isValid: false,
        error: 'Response content is required',
      };
    }

    if (content.trim().length < 10) {
      return {
        isValid: false,
        error: 'Response content must be at least 10 characters long',
      };
    }

    if (content.trim().length > 5000) {
      return {
        isValid: false,
        error: 'Response content must be less than 5000 characters',
      };
    }

    return { isValid: true };
  }

  /**
   * Format response content for display
   */
  formatResponseContent(content: string): string {
    // Convert line breaks to HTML
    return content.replace(/\n/g, '<br>');
  }

  // ========================================================================
  // Response Filtering and Sorting
  // ========================================================================

  /**
   * Sort responses by date
   */
  sortResponsesByDate(
    responses: ComplaintResponse[],
    ascending: boolean = true,
  ): ComplaintResponse[] {
    return [...responses].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Group responses by date
   */
  groupResponsesByDate(
    responses: ComplaintResponse[],
  ): Record<string, ComplaintResponse[]> {
    const grouped: Record<string, ComplaintResponse[]> = {};

    responses.forEach(response => {
      const date = new Date(response.createdAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(response);
    });

    return grouped;
  }

  // ========================================================================
  // Response Statistics
  // ========================================================================

  /**
   * Get response statistics
   */
  getResponseStats(responses: ComplaintResponse[]): {
    total: number;
    averageLength: number;
  } {
    const total = responses.length;
    const totalLength = responses.reduce((sum, r) => sum + r.content.length, 0);
    const averageLength = total > 0 ? Math.round(totalLength / total) : 0;

    return {
      total,
      averageLength,
    };
  }

  // ========================================================================
  // Error Handling
  // ========================================================================

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    console.error('Complaint response service error:', error);

    // Handle validation errors from the ApiError object
    if (
      error &&
      typeof error === 'object' &&
      'validationErrors' in error &&
      typeof (error as { validationErrors: unknown }).validationErrors ===
        'object'
    ) {
      const validationErrors = Object.entries(
        (error as { validationErrors: Record<string, string> })
          .validationErrors,
      )
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      return new Error(`Validation failed: ${validationErrors}`);
    }

    // Handle Zod validation errors (array format)
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      Array.isArray((error as { message: unknown }).message)
    ) {
      const validationErrors = (
        error as { message: Array<{ path?: string[]; message?: string }> }
      ).message
        .map(err => `${err.path?.join('.') || 'field'}: ${err.message}`)
        .join(', ');
      return new Error(`Validation failed: ${validationErrors}`);
    }

    // Handle direct error message
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      return new Error((error as { message: string }).message);
    }

    return new Error(defaultMessage);
  }
}

// Export singleton instance
export const complaintResponseService = new ComplaintResponseService();
