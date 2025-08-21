import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// Notice endpoints
export const NOTICE_ENDPOINTS = {
  CREATE: '/api/v1/notices',
  GET_ALL: '/api/v1/notices',
  GET_BY_ID: (id: string) => `/api/v1/notices/${id}`,
  UPDATE: (id: string) => `/api/v1/notices/${id}`,
  DELETE: (id: string) => `/api/v1/notices/${id}`,
  GET_MY_NOTICES: '/api/v1/notices/my-notices',
  GET_AVAILABLE_CLASSES: '/api/v1/notices/classes',
  MARK_AS_READ: (id: string) => `/api/v1/notices/${id}/read`,
} as const;

// Types based on the backend DTOs
export interface CreateNoticeRequest {
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recipientType: 'ALL' | 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'CLASS';
  selectedClassId?: string;
  category?:
    | 'GENERAL'
    | 'ACADEMIC'
    | 'EXAMINATION'
    | 'FEE'
    | 'EVENT'
    | 'HOLIDAY'
    | 'MEETING'
    | 'ANNOUNCEMENT'
    | 'URGENT'
    | 'OTHER';
  publishDate: string;
  expiryDate: string;
  sendEmailNotification: boolean;
}

export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recipientType?: 'ALL' | 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'CLASS';
  selectedClassId?: string;
  category?:
    | 'GENERAL'
    | 'ACADEMIC'
    | 'EXAMINATION'
    | 'FEE'
    | 'EVENT'
    | 'HOLIDAY'
    | 'MEETING'
    | 'ANNOUNCEMENT'
    | 'URGENT'
    | 'OTHER';
  publishDate?: string;
  expiryDate?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'EXPIRED';
  sendEmailNotification?: boolean;
}

export interface NoticeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recipientType?: 'ALL' | 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'CLASS';
  category?:
    | 'GENERAL'
    | 'ACADEMIC'
    | 'EXAMINATION'
    | 'FEE'
    | 'EVENT'
    | 'HOLIDAY'
    | 'MEETING'
    | 'ANNOUNCEMENT'
    | 'URGENT'
    | 'OTHER';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'EXPIRED';
  startDate?: string;
  endDate?: string;
}

export interface NoticeAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface NoticeRecipient {
  id: string;
  userId: string;
  readAt?: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recipientType: 'ALL' | 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'CLASS';
  selectedClassId?: string;
  category?:
    | 'GENERAL'
    | 'ACADEMIC'
    | 'EXAMINATION'
    | 'FEE'
    | 'EVENT'
    | 'HOLIDAY'
    | 'MEETING'
    | 'ANNOUNCEMENT'
    | 'URGENT'
    | 'OTHER';
  publishDate: string;
  expiryDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'EXPIRED';
  sendEmailNotification: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  selectedClass?: {
    id: string;
    name: string;
    grade: number;
    section: string;
  };
  attachments: NoticeAttachment[];
  recipients: NoticeRecipient[];
  recipientCount: number;
}

export interface NoticeListResponse {
  notices: Notice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AvailableClass {
  id: string;
  name: string;
  grade: number;
  section: string;
  shift: 'MORNING' | 'DAY';
  currentEnrollment: number;
}

// Notice Service Class
export class NoticeService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Create a new notice with optional attachments
   */
  async createNotice(
    noticeData: CreateNoticeRequest,
    attachments?: File[],
  ): Promise<ApiResponse<Notice>> {
    try {
      // Always use FormData because backend controller expects `notice` field
      // and is wrapped with FilesInterceptor even if there are no attachments
      const formData = new FormData();
      formData.append('notice', JSON.stringify(noticeData));

      if (attachments && attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      return await this.httpClient.post<Notice>(
        NOTICE_ENDPOINTS.CREATE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to create notice');
    }
  }

  /**
   * Get all notices with pagination and filters
   */
  async getAllNotices(
    params?: NoticeQueryParams,
  ): Promise<ApiResponse<NoticeListResponse>> {
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
        ? `${NOTICE_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
        : NOTICE_ENDPOINTS.GET_ALL;

      return await this.httpClient.get<NoticeListResponse>(url);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch notices');
    }
  }

  /**
   * Get a single notice by ID
   */
  async getNoticeById(id: string): Promise<ApiResponse<Notice>> {
    try {
      return await this.httpClient.get<Notice>(NOTICE_ENDPOINTS.GET_BY_ID(id));
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch notice');
    }
  }

  /**
   * Update a notice
   */
  async updateNotice(
    id: string,
    updateData: UpdateNoticeRequest,
  ): Promise<ApiResponse<Notice>> {
    try {
      return await this.httpClient.patch<Notice>(
        NOTICE_ENDPOINTS.UPDATE(id),
        updateData,
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to update notice');
    }
  }

  /**
   * Delete a notice
   */
  async deleteNotice(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.httpClient.delete<{ message: string }>(
        NOTICE_ENDPOINTS.DELETE(id),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete notice');
    }
  }

  /**
   * Get notices for the current user
   */
  async getMyNotices(
    params?: NoticeQueryParams,
  ): Promise<ApiResponse<NoticeListResponse>> {
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
        ? `${NOTICE_ENDPOINTS.GET_MY_NOTICES}?${queryParams.toString()}`
        : NOTICE_ENDPOINTS.GET_MY_NOTICES;

      return await this.httpClient.get<NoticeListResponse>(url);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch your notices');
    }
  }

  /**
   * Get available classes for notice recipients
   */
  async getAvailableClasses(): Promise<ApiResponse<AvailableClass[]>> {
    try {
      return await this.httpClient.get<AvailableClass[]>(
        NOTICE_ENDPOINTS.GET_AVAILABLE_CLASSES,
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch available classes');
    }
  }

  /**
   * Mark a notice as read for the current user
   */
  async markNoticeAsRead(
    id: string,
  ): Promise<ApiResponse<{ message: string; readAt: string }>> {
    try {
      return await this.httpClient.post<{ message: string; readAt: string }>(
        NOTICE_ENDPOINTS.MARK_AS_READ(id),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to mark notice as read');
    }
  }

  /**
   * Download attachment file
   */
  async downloadAttachment(url: string): Promise<Blob> {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.httpClient.getAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download attachment');
      }

      return await response.blob();
    } catch (error) {
      throw this.handleError(error, 'Failed to download attachment');
    }
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return imageExtensions.includes(this.getFileExtension(filename));
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
   * Get priority color for UI
   */
  getPriorityColor(priority: string): string {
    const colors = {
      LOW: '#10B981', // green
      MEDIUM: '#F59E0B', // yellow
      HIGH: '#EF4444', // red
      URGENT: '#DC2626', // dark red
    };
    return colors[priority as keyof typeof colors] || '#6B7280';
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
   * Get recipient type label for UI
   */
  getRecipientTypeLabel(recipientType: string): string {
    const labels = {
      ALL: 'All',
      STUDENT: 'Student',
      PARENT: 'Parent',
      TEACHER: 'Teacher',
      STAFF: 'Staff',
      CLASS: 'Class',
    };
    return labels[recipientType as keyof typeof labels] || recipientType;
  }

  /**
   * Get category label for UI
   */
  getCategoryLabel(category: string): string {
    const labels = {
      GENERAL: 'General',
      ACADEMIC: 'Academic',
      EXAMINATION: 'Examination',
      FEE: 'Fee',
      EVENT: 'Event',
      HOLIDAY: 'Holiday',
      MEETING: 'Meeting',
      ANNOUNCEMENT: 'Announcement',
      URGENT: 'Urgent',
      OTHER: 'Other',
    };
    return labels[category as keyof typeof labels] || category;
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
export const noticeService = new NoticeService(new HttpClient());
