import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// Attachment endpoints
export const COMPLAINT_ATTACHMENT_ENDPOINTS = {
  UPLOAD: (complaintId: string) =>
    `/api/v1/complaints/${complaintId}/attachments`,
  GET: (complaintId: string) => `/api/v1/complaints/${complaintId}/attachments`,
  DELETE: (complaintId: string, attachmentId: string) =>
    `/api/v1/complaints/${complaintId}/attachments/${attachmentId}`,
} as const;

// =============================================================================
// Attachment Types
// =============================================================================

export interface ComplaintAttachment {
  id: string;
  complaintId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface UploadAttachmentResponse {
  message: string;
  attachments: ComplaintAttachment[];
}

export interface AttachmentValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// =============================================================================
// Complaint Attachment Service
// =============================================================================

export class ComplaintAttachmentService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Core Attachment Operations
  // ========================================================================

  /**
   * Upload attachments to a complaint
   */
  async uploadAttachments(
    complaintId: string,
    files: File[],
    onProgress?: (progress: FileUploadProgress[]) => void,
  ): Promise<ApiResponse<UploadAttachmentResponse>> {
    try {
      // Validate all files before upload
      const validationResults = files.map(file => ({
        file,
        validation: this.validateFile(file),
      }));

      const invalidFiles = validationResults.filter(
        result => !result.validation.isValid,
      );
      if (invalidFiles.length > 0) {
        throw new Error(
          invalidFiles.map(result => result.validation.error).join(', '),
        );
      }

      const formData = new FormData();
      files.forEach(file => {
        formData.append('attachments', file);
      });

      // Initialize progress tracking
      const progress: FileUploadProgress[] = files.map(file => ({
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }));

      // Simulate progress updates (in a real implementation, you'd use XMLHttpRequest or fetch with progress)
      if (onProgress) {
        onProgress(progress);

        // Update progress to uploading
        progress.forEach(p => {
          p.status = 'uploading';
          p.progress = 50;
        });
        onProgress([...progress]);
      }

      const response = await this.httpClient.post<UploadAttachmentResponse>(
        COMPLAINT_ATTACHMENT_ENDPOINTS.UPLOAD(complaintId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      // Update progress to completed
      if (onProgress) {
        progress.forEach(p => {
          p.status = 'completed';
          p.progress = 100;
        });
        onProgress([...progress]);
      }

      return response;
    } catch (error) {
      // Update progress to error
      if (onProgress) {
        const progress: FileUploadProgress[] = files.map(file => ({
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        }));
        onProgress(progress);
      }

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
        COMPLAINT_ATTACHMENT_ENDPOINTS.GET(complaintId),
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
        COMPLAINT_ATTACHMENT_ENDPOINTS.DELETE(complaintId, attachmentId),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete attachment');
    }
  }

  // ========================================================================
  // File Validation and Utilities
  // ========================================================================

  /**
   * Validate a single file for upload
   */
  validateFile(file: File): AttachmentValidationResult {
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
    const maxFilesPerUpload = 5;

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File "${file.name}" has unsupported type. Allowed types: images (jpg, jpeg, png, gif, webp), PDF, DOC, DOCX`,
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File "${file.name}" is too large. Maximum size is 10MB`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate multiple files for upload
   */
  validateFiles(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxFilesPerUpload = 5;

    if (files.length > maxFilesPerUpload) {
      errors.push(
        `Too many files. Maximum ${maxFilesPerUpload} files allowed per upload.`,
      );
    }

    files.forEach(file => {
      const validation = this.validateFile(file);
      if (!validation.isValid && validation.error) {
        errors.push(validation.error);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
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
   * Get file type label for display
   */
  getFileTypeLabel(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'Image';
    } else if (mimeType === 'application/pdf') {
      return 'PDF Document';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'Word Document';
    } else {
      return 'File';
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
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file is an image
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file is a PDF
   */
  isPDF(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  /**
   * Check if file is a document
   */
  isDocument(mimeType: string): boolean {
    return mimeType.includes('word') || mimeType.includes('document');
  }

  /**
   * Generate a preview URL for images
   */
  generatePreviewUrl(file: File): string {
    if (this.isImage(file.type)) {
      return URL.createObjectURL(file);
    }
    return '';
  }

  /**
   * Revoke object URL to free memory
   */
  revokePreviewUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  // ========================================================================
  // File Download and Display
  // ========================================================================

  /**
   * Download an attachment
   */
  async downloadAttachment(attachment: ComplaintAttachment): Promise<void> {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Failed to download attachment');
    }
  }

  /**
   * Open attachment in new tab
   */
  openAttachmentInNewTab(attachment: ComplaintAttachment): void {
    window.open(attachment.url, '_blank');
  }

  /**
   * Get attachment display component type
   */
  getAttachmentDisplayType(
    mimeType: string,
  ): 'image' | 'pdf' | 'document' | 'download' {
    if (this.isImage(mimeType)) {
      return 'image';
    } else if (this.isPDF(mimeType)) {
      return 'pdf';
    } else if (this.isDocument(mimeType)) {
      return 'document';
    } else {
      return 'download';
    }
  }

  // ========================================================================
  // Error Handling
  // ========================================================================

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    console.error('Attachment service error:', error);

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
export const complaintAttachmentService = new ComplaintAttachmentService();
