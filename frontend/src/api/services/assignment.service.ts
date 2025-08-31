/**
 * =============================================================================
 * Assignment Service
 * =============================================================================
 * Service for handling assignment-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentFilters,
  AssignmentResponse,
  CreateAssignmentResponse,
  UpdateAssignmentResponse,
  TeacherAssignmentOverview,
  AssignmentStats,
  AssignmentAttachment,
  SubmissionAttachment,
} from '../types/assignment';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const ASSIGNMENT_ENDPOINTS = {
  CREATE: 'api/v1/assignments',
  LIST: 'api/v1/assignments',
  GET_BY_ID: (id: string) => `api/v1/assignments/${id}`,
  UPDATE: (id: string) => `api/v1/assignments/${id}`,
  DELETE: (id: string) => `api/v1/assignments/${id}`,
  GET_BY_TEACHER: (teacherId: string) =>
    `api/v1/assignments/teacher/${teacherId}`,
  GET_BY_CLASS: (classId: string) => `api/v1/assignments/class/${classId}`,
  GET_BY_SUBJECT: (subjectId: string) =>
    `api/v1/assignments/subject/${subjectId}`,

  // Assignment Attachment Endpoints
  UPLOAD_ASSIGNMENT_ATTACHMENTS: (id: string) =>
    `api/v1/assignments/${id}/attachments`,
  GET_ASSIGNMENT_ATTACHMENTS: (id: string) =>
    `api/v1/assignments/${id}/attachments`,
  DELETE_ASSIGNMENT_ATTACHMENT: (id: string, attachmentId: string) =>
    `api/v1/assignments/${id}/attachments/${attachmentId}`,

  // Submission Attachment Endpoints
  UPLOAD_SUBMISSION_ATTACHMENTS: (id: string) =>
    `api/v1/submissions/${id}/attachments`,
  GET_SUBMISSION_ATTACHMENTS: (id: string) =>
    `api/v1/submissions/${id}/attachments`,
  DELETE_SUBMISSION_ATTACHMENT: (id: string, attachmentId: string) =>
    `api/v1/submissions/${id}/attachments/${attachmentId}`,
} as const;

// ============================================================================
// Assignment Service
// ============================================================================

export class AssignmentService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Assignment CRUD Operations
  // ========================================================================

  /**
   * Create a new assignment
   */
  async createAssignment(
    data: CreateAssignmentRequest,
  ): Promise<ApiResponse<CreateAssignmentResponse>> {
    return this.httpClient.post<CreateAssignmentResponse>(
      ASSIGNMENT_ENDPOINTS.CREATE,
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Get all assignments with optional filtering
   */
  async getAllAssignments(
    filters?: AssignmentFilters,
  ): Promise<ApiResponse<AssignmentResponse[]>> {
    return this.httpClient.get<AssignmentResponse[]>(
      ASSIGNMENT_ENDPOINTS.LIST,
      filters as Record<string, unknown>,
      { requiresAuth: true },
    );
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(
    id: string,
  ): Promise<ApiResponse<AssignmentResponse>> {
    return this.httpClient.get<AssignmentResponse>(
      ASSIGNMENT_ENDPOINTS.GET_BY_ID(id),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Update assignment
   */
  async updateAssignment(
    id: string,
    data: UpdateAssignmentRequest,
  ): Promise<ApiResponse<UpdateAssignmentResponse>> {
    return this.httpClient.put<UpdateAssignmentResponse>(
      ASSIGNMENT_ENDPOINTS.UPDATE(id),
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Delete assignment (soft delete)
   */
  async deleteAssignment(
    id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.delete<{ message: string }>(
      ASSIGNMENT_ENDPOINTS.DELETE(id),
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Assignment Query Operations
  // ========================================================================

  /**
   * Get assignments by teacher
   */
  async getAssignmentsByTeacher(
    teacherId: string,
  ): Promise<ApiResponse<AssignmentResponse[]>> {
    return this.httpClient.get<AssignmentResponse[]>(
      ASSIGNMENT_ENDPOINTS.GET_BY_TEACHER(teacherId),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get assignments by class
   */
  async getAssignmentsByClass(
    classId: string,
  ): Promise<ApiResponse<AssignmentResponse[]>> {
    return this.httpClient.get<AssignmentResponse[]>(
      ASSIGNMENT_ENDPOINTS.GET_BY_CLASS(classId),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get assignments by subject
   */
  async getAssignmentsBySubject(
    subjectId: string,
  ): Promise<ApiResponse<AssignmentResponse[]>> {
    return this.httpClient.get<AssignmentResponse[]>(
      ASSIGNMENT_ENDPOINTS.GET_BY_SUBJECT(subjectId),
      undefined,
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Teacher Dashboard Operations
  // ========================================================================

  /**
   * Get teacher assignment overview with statistics
   */
  async getTeacherAssignmentOverview(
    teacherId: string,
  ): Promise<ApiResponse<TeacherAssignmentOverview>> {
    // Get assignments by teacher
    const assignmentsResponse = await this.getAssignmentsByTeacher(teacherId);
    const assignments = assignmentsResponse.data;

    // Calculate statistics
    const now = new Date();
    const stats: AssignmentStats = {
      totalAssignments: assignments.length,
      completedAssignments: 0,
      upcomingAssignments: 0,
      overdueAssignments: 0,
      totalSubmissions: 0,
      pendingSubmissions: 0,
      gradedSubmissions: 0,
    };

    assignments.forEach(assignment => {
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
      const submissionCount = assignment._count?.submissions || 0;

      stats.totalSubmissions += submissionCount;

      if (dueDate) {
        if (dueDate < now) {
          stats.overdueAssignments++;
        } else {
          stats.upcomingAssignments++;
        }
      } else {
        stats.upcomingAssignments++;
      }

      // Count graded vs pending submissions
      if (assignment.submissions) {
        assignment.submissions.forEach(submission => {
          if (submission.isCompleted) {
            stats.gradedSubmissions++;
          } else {
            stats.pendingSubmissions++;
          }
        });
      }
    });

    stats.completedAssignments =
      stats.totalAssignments -
      stats.upcomingAssignments -
      stats.overdueAssignments;

    return {
      success: true,
      data: {
        assignments,
        stats,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Get assignment statistics for a teacher
   */
  async getAssignmentStats(
    teacherId: string,
  ): Promise<ApiResponse<AssignmentStats>> {
    const overview = await this.getTeacherAssignmentOverview(teacherId);
    return {
      success: true,
      data: overview.data.stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if assignment is overdue
   */
  isAssignmentOverdue(assignment: AssignmentResponse): boolean {
    if (!assignment.dueDate) return false;
    return new Date(assignment.dueDate) < new Date();
  }

  /**
   * Get assignment status
   */
  getAssignmentStatus(
    assignment: AssignmentResponse,
  ): 'upcoming' | 'overdue' | 'completed' {
    if (!assignment.dueDate) return 'upcoming';

    const dueDate = new Date(assignment.dueDate);
    const now = new Date();

    if (dueDate < now) {
      return 'overdue';
    }

    return 'upcoming';
  }

  /**
   * Format assignment for display
   */
  formatAssignmentForDisplay(assignment: AssignmentResponse) {
    return {
      ...assignment,
      dueDateFormatted: assignment.dueDate
        ? new Date(assignment.dueDate).toLocaleDateString()
        : 'No due date',
      status: this.getAssignmentStatus(assignment),
      isOverdue: this.isAssignmentOverdue(assignment),
      classInfo: `${assignment.class.grade} ${assignment.class.section}`,
      subjectInfo: `${assignment.subject.name} (${assignment.subject.code})`,
      teacherName: assignment.teacher.user.fullName,
      submissionCount: assignment._count?.submissions || 0,
    };
  }

  // ========================================================================
  // Assignment Attachment Operations
  // ========================================================================

  /**
   * Upload attachments to assignment
   */
  async uploadAssignmentAttachments(
    assignmentId: string,
    files: File[],
  ): Promise<
    ApiResponse<{ message: string; attachments: AssignmentAttachment[] }>
  > {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });

    return this.httpClient.post<{
      message: string;
      attachments: AssignmentAttachment[];
    }>(
      ASSIGNMENT_ENDPOINTS.UPLOAD_ASSIGNMENT_ATTACHMENTS(assignmentId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        requiresAuth: true,
      },
    );
  }

  /**
   * Get attachments for assignment
   */
  async getAssignmentAttachments(
    assignmentId: string,
  ): Promise<ApiResponse<AssignmentAttachment[]>> {
    return this.httpClient.get<AssignmentAttachment[]>(
      ASSIGNMENT_ENDPOINTS.GET_ASSIGNMENT_ATTACHMENTS(assignmentId),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Delete attachment from assignment
   */
  async deleteAssignmentAttachment(
    assignmentId: string,
    attachmentId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.delete<{ message: string }>(
      ASSIGNMENT_ENDPOINTS.DELETE_ASSIGNMENT_ATTACHMENT(
        assignmentId,
        attachmentId,
      ),
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Submission Attachment Operations
  // ========================================================================

  /**
   * Upload attachments to submission
   */
  async uploadSubmissionAttachments(
    submissionId: string,
    files: File[],
  ): Promise<ApiResponse<SubmissionAttachment[]>> {
    console.log('=== ASSIGNMENT SERVICE: uploadSubmissionAttachments ===');
    console.log('Submission ID:', submissionId);
    console.log(
      'Files to upload:',
      files.map(f => ({ name: f.name, size: f.size, type: f.type })),
    );
    console.log(
      'Endpoint:',
      ASSIGNMENT_ENDPOINTS.UPLOAD_SUBMISSION_ATTACHMENTS(submissionId),
    );

    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });

    console.log('FormData created with', files.length, 'files');

    try {
      const response = await this.httpClient.post<SubmissionAttachment[]>(
        ASSIGNMENT_ENDPOINTS.UPLOAD_SUBMISSION_ATTACHMENTS(submissionId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          requiresAuth: true,
        },
      );

      console.log('Upload response:', response);
      return response;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Get attachments for submission
   */
  async getSubmissionAttachments(
    submissionId: string,
  ): Promise<ApiResponse<SubmissionAttachment[]>> {
    return this.httpClient.get<SubmissionAttachment[]>(
      ASSIGNMENT_ENDPOINTS.GET_SUBMISSION_ATTACHMENTS(submissionId),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Delete attachment from submission
   */
  async deleteSubmissionAttachment(
    submissionId: string,
    attachmentId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.delete<{ message: string }>(
      ASSIGNMENT_ENDPOINTS.DELETE_SUBMISSION_ATTACHMENT(
        submissionId,
        attachmentId,
      ),
      { requiresAuth: true },
    );
  }

  // ========================================================================
  // Enhanced Statistics and Counting Methods
  // ========================================================================

  /**
   * Get detailed submission statistics for an assignment
   */
  async getAssignmentSubmissionStats(assignmentId: string) {
    const assignment = await this.getAssignmentById(assignmentId);

    if (!assignment.success || !assignment.data.submissions) {
      return {
        totalStudents: 0,
        submittedStudents: 0,
        pendingStudents: 0,
        gradedSubmissions: 0,
        pendingSubmissions: 0,
        submissionRate: 0,
        gradingRate: 0,
      };
    }

    const submissions = assignment.data.submissions;
    const totalStudents = assignment.data.class.students?.length || 0;
    const submittedStudents = submissions.length;
    const pendingStudents = totalStudents - submittedStudents;
    const gradedSubmissions = submissions.filter(s => s.isCompleted).length;
    const pendingSubmissions = submissions.filter(s => !s.isCompleted).length;

    return {
      totalStudents,
      submittedStudents,
      pendingStudents,
      gradedSubmissions,
      pendingSubmissions,
      submissionRate:
        totalStudents > 0 ? (submittedStudents / totalStudents) * 100 : 0,
      gradingRate:
        submittedStudents > 0
          ? (gradedSubmissions / submittedStudents) * 100
          : 0,
    };
  }

  /**
   * Get student submission status for an assignment
   */
  async getStudentSubmissionStatus(assignmentId: string, studentId: string) {
    const assignment = await this.getAssignmentById(assignmentId);

    if (!assignment.success || !assignment.data.submissions) {
      return {
        hasSubmitted: false,
        submission: null,
        isGraded: false,
        isLate: false,
        daysLate: 0,
      };
    }

    const submission = assignment.data.submissions.find(
      s => s.studentId === studentId,
    );

    if (!submission) {
      return {
        hasSubmitted: false,
        submission: null,
        isGraded: false,
        isLate: false,
        daysLate: 0,
      };
    }

    const dueDate = assignment.data.dueDate
      ? new Date(assignment.data.dueDate)
      : null;
    const submittedAt = submission.submittedAt
      ? new Date(submission.submittedAt)
      : null;

    let isLate = false;
    let daysLate = 0;

    if (dueDate && submittedAt && submittedAt > dueDate) {
      isLate = true;
      daysLate = Math.ceil(
        (submittedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      hasSubmitted: true,
      submission,
      isGraded: submission.isCompleted,
      isLate,
      daysLate,
    };
  }

  /**
   * Get all students who haven't submitted an assignment
   */
  async getStudentsWithoutSubmission(assignmentId: string) {
    const assignment = await this.getAssignmentById(assignmentId);

    if (!assignment.success || !assignment.data.class.students) {
      return [];
    }

    const submittedStudentIds =
      assignment.data.submissions?.map(s => s.studentId) || [];
    const allStudents = assignment.data.class.students;

    return allStudents.filter(
      student => !submittedStudentIds.includes(student.id),
    );
  }

  /**
   * Get all students who have submitted an assignment
   */
  async getStudentsWithSubmission(assignmentId: string) {
    const assignment = await this.getAssignmentById(assignmentId);

    if (!assignment.success || !assignment.data.submissions) {
      return [];
    }

    return assignment.data.submissions.map(submission => ({
      student: submission.student,
      submission,
      isGraded: submission.isCompleted,
      submittedAt: submission.submittedAt,
    }));
  }

  // ========================================================================
  // File Validation Methods
  // ========================================================================

  /**
   * Validate file for upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'text/plain',
      'application/rtf',
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          'File type not supported. Allowed: Images, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF',
      };
    }

    return { isValid: true };
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
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const assignmentService = new AssignmentService();
