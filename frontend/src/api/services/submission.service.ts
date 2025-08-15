/**
 * =============================================================================
 * Submission Service
 * =============================================================================
 * Service for handling submission-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import {
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  SubmissionResponse,
  CreateSubmissionResponse,
  UpdateSubmissionResponse,
} from '../types/assignment';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const SUBMISSION_ENDPOINTS = {
  CREATE_OR_UPDATE: 'api/v1/submissions',
  GET_BY_ID: (id: string) => `api/v1/submissions/${id}`,
  GRADE: (id: string) => `api/v1/submissions/${id}/grade`,
  DELETE: (id: string) => `api/v1/submissions/${id}`,
  GET_BY_ASSIGNMENT: (assignmentId: string) =>
    `api/v1/submissions/assignment/${assignmentId}`,
  GET_BY_STUDENT: (studentId: string) =>
    `api/v1/submissions/student/${studentId}`,
} as const;

// ============================================================================
// Submission Service
// ============================================================================

export class SubmissionService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Submission CRUD Operations
  // ========================================================================

  /**
   * Create or update a submission
   */
  async createOrUpdateSubmission(
    data: CreateSubmissionRequest,
  ): Promise<ApiResponse<CreateSubmissionResponse>> {
    return this.httpClient.post<CreateSubmissionResponse>(
      SUBMISSION_ENDPOINTS.CREATE_OR_UPDATE,
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(
    id: string,
  ): Promise<ApiResponse<SubmissionResponse>> {
    return this.httpClient.get<SubmissionResponse>(
      SUBMISSION_ENDPOINTS.GET_BY_ID(id),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Grade a submission (teachers and admins only)
   */
  async gradeSubmission(
    id: string,
    data: UpdateSubmissionRequest,
  ): Promise<ApiResponse<UpdateSubmissionResponse>> {
    return this.httpClient.put<UpdateSubmissionResponse>(
      SUBMISSION_ENDPOINTS.GRADE(id),
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Delete submission (soft delete)
   */
  async deleteSubmission(
    id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.delete<{ message: string }>(
      SUBMISSION_ENDPOINTS.DELETE(id),
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Submission Query Operations
  // ========================================================================

  /**
   * Get all submissions for an assignment (teachers and admins only)
   */
  async getSubmissionsByAssignment(
    assignmentId: string,
  ): Promise<ApiResponse<SubmissionResponse[]>> {
    return this.httpClient.get<SubmissionResponse[]>(
      SUBMISSION_ENDPOINTS.GET_BY_ASSIGNMENT(assignmentId),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get all submissions by a student
   */
  async getSubmissionsByStudent(
    studentId: string,
  ): Promise<ApiResponse<SubmissionResponse[]>> {
    return this.httpClient.get<SubmissionResponse[]>(
      SUBMISSION_ENDPOINTS.GET_BY_STUDENT(studentId),
      undefined,
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Student Operations
  // ========================================================================

  /**
   * Submit assignment (student operation)
   */
  async submitAssignment(
    assignmentId: string,
    studentId: string,
    files?: string[],
    feedback?: string,
  ): Promise<ApiResponse<CreateSubmissionResponse>> {
    const submissionData: CreateSubmissionRequest = {
      assignmentId,
      studentId,
      submittedAt: new Date().toISOString(),
      isCompleted: false, // Initially not graded
      feedback,
      fileLinks: files || [],
    };

    return this.createOrUpdateSubmission(submissionData);
  }

  /**
   * Update student submission
   */
  async updateStudentSubmission(
    assignmentId: string,
    studentId: string,
    files?: string[],
    feedback?: string,
  ): Promise<ApiResponse<CreateSubmissionResponse>> {
    const submissionData: CreateSubmissionRequest = {
      assignmentId,
      studentId,
      submittedAt: new Date().toISOString(),
      isCompleted: false, // Keep as not graded when student updates
      feedback,
      fileLinks: files || [],
    };

    return this.createOrUpdateSubmission(submissionData);
  }

  // ========================================================================
  // Teacher Operations
  // ========================================================================

  /**
   * Grade submission as complete
   */
  async markSubmissionComplete(
    submissionId: string,
    feedback?: string,
  ): Promise<ApiResponse<UpdateSubmissionResponse>> {
    return this.gradeSubmission(submissionId, {
      isCompleted: true,
      feedback,
    });
  }

  /**
   * Mark submission as incomplete
   */
  async markSubmissionIncomplete(
    submissionId: string,
    feedback?: string,
  ): Promise<ApiResponse<UpdateSubmissionResponse>> {
    return this.gradeSubmission(submissionId, {
      isCompleted: false,
      feedback,
    });
  }

  /**
   * Add feedback to submission
   */
  async addFeedbackToSubmission(
    submissionId: string,
    feedback: string,
    isCompleted?: boolean,
  ): Promise<ApiResponse<UpdateSubmissionResponse>> {
    return this.gradeSubmission(submissionId, {
      feedback,
      isCompleted,
    });
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Check if submission is late
   */
  isSubmissionLate(submission: SubmissionResponse): boolean {
    if (!submission.assignment?.dueDate || !submission.submittedAt)
      return false;

    const dueDate = new Date(submission.assignment.dueDate);
    const submittedAt = new Date(submission.submittedAt);

    return submittedAt > dueDate;
  }

  /**
   * Get submission status
   */
  getSubmissionStatus(
    submission: SubmissionResponse,
  ): 'submitted' | 'graded' | 'late' | 'pending' {
    if (!submission.submittedAt) return 'pending';

    if (submission.isCompleted) return 'graded';

    if (this.isSubmissionLate(submission)) return 'late';

    return 'submitted';
  }

  /**
   * Calculate submission statistics for an assignment
   */
  calculateSubmissionStats(submissions: SubmissionResponse[]) {
    const stats = {
      total: submissions.length,
      submitted: 0,
      graded: 0,
      pending: 0,
      late: 0,
      onTime: 0,
    };

    submissions.forEach(submission => {
      if (submission.submittedAt) {
        stats.submitted++;

        if (this.isSubmissionLate(submission)) {
          stats.late++;
        } else {
          stats.onTime++;
        }

        if (submission.isCompleted) {
          stats.graded++;
        }
      } else {
        stats.pending++;
      }
    });

    return stats;
  }

  /**
   * Format submission for display
   */
  formatSubmissionForDisplay(submission: SubmissionResponse) {
    return {
      ...submission,
      status: this.getSubmissionStatus(submission),
      isLate: this.isSubmissionLate(submission),
      submittedAtFormatted: submission.submittedAt
        ? new Date(submission.submittedAt).toLocaleDateString()
        : 'Not submitted',
      studentName: submission.student.user.fullName,
      studentRollNumber: submission.student.rollNumber,
      assignmentTitle: submission.assignment?.title || 'Unknown Assignment',
      hasFiles: submission.fileLinks.length > 0,
      fileCount: submission.fileLinks.length,
    };
  }

  /**
   * Group submissions by status
   */
  groupSubmissionsByStatus(submissions: SubmissionResponse[]) {
    return submissions.reduce(
      (groups, submission) => {
        const status = this.getSubmissionStatus(submission);
        if (!groups[status]) {
          groups[status] = [];
        }
        groups[status].push(submission);
        return groups;
      },
      {} as Record<string, SubmissionResponse[]>,
    );
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const submissionService = new SubmissionService();
