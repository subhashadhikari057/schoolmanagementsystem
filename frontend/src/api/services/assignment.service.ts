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
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const assignmentService = new AssignmentService();
