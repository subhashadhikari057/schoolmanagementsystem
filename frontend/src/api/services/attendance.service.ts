/**
 * =============================================================================
 * Attendance Service
 * =============================================================================
 * Service for handling attendance-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// ============================================================================
// API Endpoints
// ============================================================================

const ATTENDANCE_ENDPOINTS = {
  MARK_ATTENDANCE: 'api/v1/attendance/mark',
  GET_ATTENDANCE: 'api/v1/attendance',
  UPDATE_ATTENDANCE: (id: string) => `api/v1/attendance/${id}`,
  GET_CLASS_ATTENDANCE: (classId: string, date: string) =>
    `api/v1/attendance/class/${classId}/date/${date}`,
  GET_CLASS_STATS: (classId: string) =>
    `api/v1/attendance/stats/class/${classId}`,
  GET_STUDENT_ATTENDANCE: (studentId: string) =>
    `api/v1/attendance/student/${studentId}`,
  GET_STUDENT_STATS: (studentId: string) =>
    `api/v1/attendance/stats/student/${studentId}`,
  MARK_TODAY_ATTENDANCE: 'api/v1/attendance/mark/today',
  BULK_UPDATE: 'api/v1/attendance/bulk-update',
} as const;

// ============================================================================
// Types
// ============================================================================

export interface MarkAttendanceRequest {
  class_id: string;
  date?: string;
  entries: Array<{
    student_id: string;
    status: 'present' | 'absent';
  }>;
}

export interface UpdateAttendanceRequest {
  status: 'present' | 'absent';
  remarks: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent';
  remarks?: string;
  takenAt: string;
  takenBy: string;
}

export interface AttendanceResponse {
  id: string;
  student_id: string; // Changed from studentId to match backend
  class_id: string; // Changed from classId to match backend
  date: string;
  status: 'present' | 'absent';
  remarks?: string;
  created_at: string; // Changed from takenAt to match backend
  updated_at?: string; // Added to match backend
  created_by?: string; // Changed from takenBy to match backend
  updated_by?: string; // Added to match backend
  student_name?: string;
  student_email?: string;
  class_name?: string;
  class_grade?: number;
  class_section?: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface ClassAttendanceSummary {
  totalStudents: number;
  markedCount: number;
  unmarkedCount: number;
  summary: {
    present: number;
    absent: number;
  };
}

// ============================================================================
// Attendance Service
// ============================================================================

export class AttendanceService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Attendance Operations
  // ========================================================================

  /**
   * Mark attendance for a class on a specific date
   */
  async markAttendance(
    data: MarkAttendanceRequest,
  ): Promise<ApiResponse<AttendanceResponse[]>> {
    return this.httpClient.post<AttendanceResponse[]>(
      ATTENDANCE_ENDPOINTS.MARK_ATTENDANCE,
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Get attendance records with optional filtering
   */
  async getAttendance(params?: {
    class_id?: string;
    start_date?: string;
    end_date?: string;
    student_id?: string;
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{
      data: AttendanceResponse[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    return this.httpClient.get<{
      data: AttendanceResponse[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(ATTENDANCE_ENDPOINTS.GET_ATTENDANCE, params, {
      requiresAuth: true,
    });
  }

  /**
   * Update an attendance record
   */
  async updateAttendance(
    attendanceId: string,
    data: UpdateAttendanceRequest,
  ): Promise<ApiResponse<AttendanceResponse>> {
    return this.httpClient.patch<AttendanceResponse>(
      ATTENDANCE_ENDPOINTS.UPDATE_ATTENDANCE(attendanceId),
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Get attendance for a specific class and date
   */
  async getClassAttendance(
    classId: string,
    date: string,
  ): Promise<ApiResponse<AttendanceResponse[]>> {
    return this.httpClient.get<AttendanceResponse[]>(
      ATTENDANCE_ENDPOINTS.GET_CLASS_ATTENDANCE(classId, date),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get attendance statistics for a class
   */
  async getClassStats(
    classId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<ClassAttendanceSummary>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.httpClient.get<ClassAttendanceSummary>(
      ATTENDANCE_ENDPOINTS.GET_CLASS_STATS(classId),
      params,
      { requiresAuth: true },
    );
  }

  /**
   * Get attendance records for a specific student
   */
  async getStudentAttendance(
    studentId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<AttendanceResponse[]>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.httpClient.get<AttendanceResponse[]>(
      ATTENDANCE_ENDPOINTS.GET_STUDENT_ATTENDANCE(studentId),
      params,
      { requiresAuth: true },
    );
  }

  /**
   * Get attendance statistics for a student
   */
  async getStudentStats(
    studentId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<AttendanceStats>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.httpClient.get<AttendanceStats>(
      ATTENDANCE_ENDPOINTS.GET_STUDENT_STATS(studentId),
      params,
      { requiresAuth: true },
    );
  }

  /**
   * Mark today's attendance for a class
   */
  async markTodayAttendance(data: {
    class_id: string;
    entries: Array<{ student_id: string; status: 'present' | 'absent' }>;
  }): Promise<ApiResponse<AttendanceResponse[]>> {
    return this.httpClient.post<AttendanceResponse[]>(
      ATTENDANCE_ENDPOINTS.MARK_TODAY_ATTENDANCE,
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Bulk update attendance records
   */
  async bulkUpdateAttendance(
    updates: Array<{
      attendanceId: string;
      status: 'present' | 'absent';
      remarks: string;
    }>,
  ): Promise<ApiResponse<AttendanceResponse[]>> {
    return this.httpClient.patch<AttendanceResponse[]>(
      ATTENDANCE_ENDPOINTS.BULK_UPDATE,
      { updates },
      { requiresAuth: true },
    );
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const attendanceService = new AttendanceService();
