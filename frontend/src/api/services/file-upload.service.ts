/**
 * =============================================================================
 * File Upload Service
 * =============================================================================
 * Generic service for handling file uploads
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

// ============================================================================
// Types
// ============================================================================

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface FileUploadResponse {
  message: string;
  attachments: UploadedFile[]; // Changed from 'files' to 'attachments' to match backend
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface AttachmentValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// File Upload Service
// ============================================================================

export class FileUploadService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // File Validation
  // ========================================================================

  /**
   * Validate a single file
   */
  validateFile(file: File): AttachmentValidationResult {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File ${file.name} is too large. Maximum size is 10MB.`,
      };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed for ${file.name}.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: File[]): AttachmentValidationResult {
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return validation;
      }
    }
    return { isValid: true };
  }

  // ========================================================================
  // File Upload Operations
  // ========================================================================

  /**
   * Upload files to a generic endpoint
   */
  async uploadFiles(
    endpoint: string,
    files: File[],
    onProgress?: (progress: FileUploadProgress[]) => void,
  ): Promise<ApiResponse<FileUploadResponse>> {
    try {
      // Validate all files before upload
      const validation = this.validateFiles(files);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const formData = new FormData();
      files.forEach(file => {
        formData.append('attachments', file); // Changed from 'files' to 'attachments' to match backend
      });

      // Initialize progress tracking
      const progress: FileUploadProgress[] = files.map(file => ({
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }));

      // Update progress to uploading
      if (onProgress) {
        onProgress(progress.map(p => ({ ...p, status: 'uploading' as const })));
      }

      // Upload files
      const response = await this.httpClient.post<FileUploadResponse>(
        endpoint,
        formData,
        {
          requiresAuth: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      // Update progress to completed
      if (onProgress) {
        onProgress(
          progress.map(p => ({
            ...p,
            status: 'completed' as const,
            progress: 100,
          })),
        );
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
      throw error;
    }
  }

  /**
   * Upload files for assignment submission
   */
  async uploadAssignmentFiles(
    assignmentId: string,
    files: File[],
    onProgress?: (progress: FileUploadProgress[]) => void,
  ): Promise<ApiResponse<FileUploadResponse>> {
    const endpoint = `/api/v1/assignments/${assignmentId}/attachments`;
    return this.uploadFiles(endpoint, files, onProgress);
  }

  /**
   * Upload files for submission
   */
  async uploadSubmissionFiles(
    submissionId: string,
    files: File[],
    onProgress?: (progress: FileUploadProgress[]) => void,
  ): Promise<ApiResponse<FileUploadResponse>> {
    console.log('=== FILE UPLOAD SERVICE: uploadSubmissionFiles ===');
    console.log('Submission ID:', submissionId);
    console.log(
      'Files to upload:',
      files.map(f => ({ name: f.name, size: f.size, type: f.type })),
    );
    console.log('Total files:', files.length);

    const endpoint = `/api/v1/submissions/${submissionId}/attachments`;
    console.log('Upload endpoint:', endpoint);

    const response = await this.uploadFiles(endpoint, files, onProgress);
    console.log('File upload response:', response);
    return response;
  }

  // ========================================================================
  // File Management
  // ========================================================================

  /**
   * Delete a file
   */
  async deleteFile(
    endpoint: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.delete<{ message: string }>(endpoint, {
      requiresAuth: true,
    });
  }

  /**
   * Get file information
   */
  async getFileInfo(endpoint: string): Promise<ApiResponse<UploadedFile>> {
    return this.httpClient.get<UploadedFile>(endpoint, undefined, {
      requiresAuth: true,
    });
  }
}

// ============================================================================
// Service Instance
// ============================================================================

export const fileUploadService = new FileUploadService();
