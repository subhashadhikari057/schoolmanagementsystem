/**
 * =============================================================================
 * Teacher Attendance Service
 * =============================================================================
 * Service for handling teacher attendance-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import {
  MarkTeacherAttendanceRequest,
  GetTeacherAttendanceQuery,
  TeacherAttendanceApiResponse,
  MarkTeacherAttendanceResponse,
  TeachersForAttendanceResponse,
  TeacherAttendanceSessionResponse,
  TeacherAttendanceResponse,
  TeacherAttendanceStatsResponse,
} from '../types/teacher-attendance';

// ============================================================================
// API Endpoints
// ============================================================================

const TEACHER_ATTENDANCE_ENDPOINTS = {
  MARK: '/api/v1/teacher-attendance/mark',
  GET_TEACHERS: '/api/v1/teacher-attendance/teachers',
  GET_SESSION: (date: string) => `/api/v1/teacher-attendance/session/${date}`,
  GET_TEACHER_ATTENDANCE: (teacherId: string) =>
    `/api/v1/teacher-attendance/teacher/${teacherId}`,
  GET_TEACHER_STATS: (teacherId: string) =>
    `/api/v1/teacher-attendance/stats/${teacherId}`,
} as const;

// ============================================================================
// Teacher Attendance Service Class
// ============================================================================

export class TeacherAttendanceService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Mark attendance for teachers
   */
  async markAttendance(
    data: MarkTeacherAttendanceRequest,
  ): Promise<TeacherAttendanceApiResponse<MarkTeacherAttendanceResponse>> {
    const response = await this.httpClient.post(
      TEACHER_ATTENDANCE_ENDPOINTS.MARK,
      data,
    );

    console.log('Teacher attendance HttpClient response:', response);
    console.log('Teacher attendance backend data:', response.data);

    // Return both the HttpClient wrapper and the backend response
    const result = {
      ...response,
      // Also include backend response data for compatibility
      ...(response.data as object),
    };

    console.log('Final merged teacher attendance response:', result);
    return result as TeacherAttendanceApiResponse<MarkTeacherAttendanceResponse>;
  }

  /**
   * Get all teachers for attendance marking
   */
  async getTeachersForAttendance(
    date?: string,
  ): Promise<TeacherAttendanceApiResponse<TeachersForAttendanceResponse>> {
    const params = date ? { date } : undefined;

    const response = await this.httpClient.get(
      TEACHER_ATTENDANCE_ENDPOINTS.GET_TEACHERS,
      params,
    );

    return response as TeacherAttendanceApiResponse<TeachersForAttendanceResponse>;
  }

  /**
   * Get teacher attendance session for a specific date
   */
  async getTeacherAttendanceForDate(
    date: string,
    sessionType: string = 'daily',
  ): Promise<
    TeacherAttendanceApiResponse<TeacherAttendanceSessionResponse | null>
  > {
    const response = await this.httpClient.get(
      TEACHER_ATTENDANCE_ENDPOINTS.GET_SESSION(date),
      { sessionType },
    );

    return response as TeacherAttendanceApiResponse<TeacherAttendanceSessionResponse | null>;
  }

  /**
   * Get detailed teacher attendance
   */
  async getTeacherAttendance(
    teacherId: string,
    query?: GetTeacherAttendanceQuery,
  ): Promise<TeacherAttendanceApiResponse<TeacherAttendanceResponse>> {
    const params = query || undefined;

    const response = await this.httpClient.get(
      TEACHER_ATTENDANCE_ENDPOINTS.GET_TEACHER_ATTENDANCE(teacherId),
      params as Record<string, unknown>,
    );

    return response as TeacherAttendanceApiResponse<TeacherAttendanceResponse>;
  }

  /**
   * Get teacher attendance statistics
   */
  async getTeacherAttendanceStats(
    teacherId: string,
    month?: number,
    year?: number,
  ): Promise<TeacherAttendanceApiResponse<TeacherAttendanceStatsResponse>> {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;

    const response = await this.httpClient.get(
      TEACHER_ATTENDANCE_ENDPOINTS.GET_TEACHER_STATS(teacherId),
      Object.keys(params).length > 0 ? params : undefined,
    );

    return response as TeacherAttendanceApiResponse<TeacherAttendanceStatsResponse>;
  }
}

// ============================================================================
// Export Service Instance
// ============================================================================

export const teacherAttendanceService = new TeacherAttendanceService();
