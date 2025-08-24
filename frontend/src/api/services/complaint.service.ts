import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// Complaint endpoints
export const COMPLAINT_ENDPOINTS = {
  CREATE: '/api/v1/complaints',
  GET_ALL: '/api/v1/complaints',
  GET_BY_ID: (id: string) => `/api/v1/complaints/${id}`,
  UPDATE: (id: string) => `/api/v1/complaints/${id}`,
  DELETE: (id: string) => `/api/v1/complaints/${id}`,
  ASSIGN: (id: string) => `/api/v1/complaints/${id}/assign`,
  RESOLVE: (id: string) => `/api/v1/complaints/${id}/resolve`,
  // Attachment endpoints
  UPLOAD_ATTACHMENTS: (id: string) => `/api/v1/complaints/${id}/attachments`,
  GET_ATTACHMENTS: (id: string) => `/api/v1/complaints/${id}/attachments`,
  DELETE_ATTACHMENT: (id: string, attachmentId: string) =>
    `/api/v1/complaints/${id}/attachments/${attachmentId}`,
  // Response endpoints
  CREATE_RESPONSE: (id: string) => `/api/v1/complaints/${id}/responses`,
  GET_RESPONSES: (id: string) => `/api/v1/complaints/${id}/responses`,
} as const;

// =============================================================================
// Complaint Types
// =============================================================================

export interface CreateComplaintRequest {
  title: string;
  description: string;
  type:
    | 'ACADEMIC'
    | 'BEHAVIORAL'
    | 'FACILITY'
    | 'SAFETY'
    | 'BULLYING'
    | 'DISCIPLINARY'
    | 'FINANCIAL'
    | 'ADMINISTRATIVE'
    | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recipientType: 'CLASS_TEACHER' | 'ADMINISTRATION' | 'PARENT';
  recipientId?: string;
}

export interface UpdateComplaintRequest {
  title?: string;
  description?: string;
  type?:
    | 'ACADEMIC'
    | 'BEHAVIORAL'
    | 'FACILITY'
    | 'SAFETY'
    | 'BULLYING'
    | 'DISCIPLINARY'
    | 'FINANCIAL'
    | 'ADMINISTRATIVE'
    | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recipientType?: 'CLASS_TEACHER' | 'ADMINISTRATION' | 'PARENT';
  recipientId?: string;
  assignedToId?: string;
  resolution?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
}

export interface ComplaintQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?:
    | 'ACADEMIC'
    | 'BEHAVIORAL'
    | 'FACILITY'
    | 'SAFETY'
    | 'BULLYING'
    | 'DISCIPLINARY'
    | 'FINANCIAL'
    | 'ADMINISTRATIVE'
    | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  recipientType?: 'CLASS_TEACHER' | 'ADMINISTRATION' | 'PARENT';
  startDate?: string;
  endDate?: string;
}

// =============================================================================
// Attachment Types
// =============================================================================

// Import from attachment service
import type {
  ComplaintAttachment,
  UploadAttachmentResponse,
} from './complaint-attachment.service';

// =============================================================================
// Response Types
// =============================================================================

// Import from response service
import type {
  CreateComplaintResponseRequest,
  ComplaintResponse,
} from './complaint-response.service';

// =============================================================================
// Complaint Entity Types
// =============================================================================

export interface Complaint {
  id: string;
  title: string;
  description: string;
  type:
    | 'ACADEMIC'
    | 'BEHAVIORAL'
    | 'FACILITY'
    | 'SAFETY'
    | 'BULLYING'
    | 'DISCIPLINARY'
    | 'FINANCIAL'
    | 'ADMINISTRATIVE'
    | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  recipientType: 'CLASS_TEACHER' | 'ADMINISTRATION' | 'PARENT';
  recipientId?: string;
  complainantId: string;
  complainantType: string;
  assignedToId?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  // Related data
  complainant: {
    id: string;
    fullName: string;
    email: string;
  };
  recipient?: {
    id: string;
    fullName: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
  attachments: ComplaintAttachment[];
  responses: ComplaintResponse[];
  _count?: {
    attachments: number;
    responses: number;
  };
}

export interface ComplaintListResponse {
  complaints: Complaint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Complaint Service
// =============================================================================

export class ComplaintService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Complaint Operations
  // ========================================================================

  /**
   * Create a new complaint
   */
  async createComplaint(
    data: CreateComplaintRequest,
  ): Promise<ApiResponse<Complaint>> {
    try {
      return await this.httpClient.post<Complaint>(
        COMPLAINT_ENDPOINTS.CREATE,
        data,
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to create complaint');
    }
  }

  /**
   * Get all complaints with pagination and filters
   */
  async getAllComplaints(
    params?: ComplaintQueryParams,
  ): Promise<ApiResponse<ComplaintListResponse>> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = queryParams.toString()
        ? `${COMPLAINT_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
        : COMPLAINT_ENDPOINTS.GET_ALL;

      return await this.httpClient.get<ComplaintListResponse>(url);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch complaints');
    }
  }

  /**
   * Get a single complaint by ID
   */
  async getComplaintById(id: string): Promise<ApiResponse<Complaint>> {
    try {
      return await this.httpClient.get<Complaint>(
        COMPLAINT_ENDPOINTS.GET_BY_ID(id),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch complaint');
    }
  }

  /**
   * Update a complaint
   */
  async updateComplaint(
    id: string,
    updateData: UpdateComplaintRequest,
  ): Promise<ApiResponse<Complaint>> {
    try {
      return await this.httpClient.patch<Complaint>(
        COMPLAINT_ENDPOINTS.UPDATE(id),
        updateData,
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to update complaint');
    }
  }

  /**
   * Assign a complaint to someone
   */
  async assignComplaint(
    id: string,
    assignedToId: string,
  ): Promise<ApiResponse<Complaint>> {
    try {
      return await this.httpClient.post<Complaint>(
        COMPLAINT_ENDPOINTS.ASSIGN(id),
        { assignedToId },
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to assign complaint');
    }
  }

  /**
   * Resolve a complaint
   */
  async resolveComplaint(
    id: string,
    resolution: string,
  ): Promise<ApiResponse<Complaint>> {
    try {
      return await this.httpClient.post<Complaint>(
        COMPLAINT_ENDPOINTS.RESOLVE(id),
        { resolution },
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to resolve complaint');
    }
  }

  /**
   * Delete a complaint
   */
  async deleteComplaint(
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.httpClient.delete<{ success: boolean }>(
        COMPLAINT_ENDPOINTS.DELETE(id),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete complaint');
    }
  }

  // ========================================================================
  // Attachment Operations
  // ========================================================================

  /**
   * Upload attachments to a complaint
   */
  async uploadAttachments(
    complaintId: string,
    files: File[],
  ): Promise<ApiResponse<UploadAttachmentResponse>> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('attachments', file);
      });

      return await this.httpClient.post<UploadAttachmentResponse>(
        COMPLAINT_ENDPOINTS.UPLOAD_ATTACHMENTS(complaintId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to upload attachments');
    }
  }

  /**
   * Get attachments for a complaint
   */
  async getAttachments(
    complaintId: string,
  ): Promise<ApiResponse<ComplaintAttachment[]>> {
    try {
      return await this.httpClient.get<ComplaintAttachment[]>(
        COMPLAINT_ENDPOINTS.GET_ATTACHMENTS(complaintId),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch attachments');
    }
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(
    complaintId: string,
    attachmentId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.httpClient.delete<{ message: string }>(
        COMPLAINT_ENDPOINTS.DELETE_ATTACHMENT(complaintId, attachmentId),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete attachment');
    }
  }

  // ========================================================================
  // Response Operations
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
        COMPLAINT_ENDPOINTS.CREATE_RESPONSE(complaintId),
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
        COMPLAINT_ENDPOINTS.GET_RESPONSES(complaintId),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch responses');
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Get complaint type label for UI
   */
  getTypeLabel(type: string): string {
    const labels = {
      ACADEMIC: 'Academic',
      BEHAVIORAL: 'Behavioral',
      FACILITY: 'Facility',
      SAFETY: 'Safety',
      BULLYING: 'Bullying',
      DISCIPLINARY: 'Disciplinary',
      FINANCIAL: 'Financial',
      ADMINISTRATIVE: 'Administrative',
      OTHER: 'Other',
    };
    return labels[type as keyof typeof labels] || type;
  }

  /**
   * Get priority label for UI
   */
  getPriorityLabel(priority: string): string {
    const labels = {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      URGENT: 'Urgent',
    };
    return labels[priority as keyof typeof labels] || priority;
  }

  /**
   * Get status label for UI
   */
  getStatusLabel(status: string): string {
    const labels = {
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed',
      CANCELLED: 'Cancelled',
    };
    return labels[status as keyof typeof labels] || status;
  }

  /**
   * Get recipient type label for UI
   */
  getRecipientTypeLabel(recipientType: string): string {
    const labels = {
      CLASS_TEACHER: 'Class Teacher',
      ADMINISTRATION: 'Administration',
      PARENT: 'Parent',
    };
    return labels[recipientType as keyof typeof labels] || recipientType;
  }

  /**
   * Get file type icon based on MIME type
   */
  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return '📷';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else {
      return '📎';
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file for upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          'File type not supported. Allowed types: images (jpg, jpeg, png, gif, webp), PDF, DOC, DOCX',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File is too large. Maximum size is 10MB',
      };
    }

    return { isValid: true };
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    console.error('Full error object:', error);

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
export const complaintService = new ComplaintService();

// Re-export types for external use
export type {
  ComplaintAttachment,
  UploadAttachmentResponse,
} from './complaint-attachment.service';
export type {
  CreateComplaintResponseRequest,
  ComplaintResponse,
} from './complaint-response.service';
