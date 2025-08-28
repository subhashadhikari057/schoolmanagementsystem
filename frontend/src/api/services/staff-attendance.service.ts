/**
 * =============================================================================
 * Staff Attendance Service
 * =============================================================================
 * Frontend service for staff attendance API operations
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import {
  MarkStaffAttendanceRequest,
  StaffForAttendanceResponse,
  MarkStaffAttendanceResponse,
  StaffAttendanceSessionResponse,
  StaffAttendanceStatsResponse,
  StaffAttendanceDetailResponse,
  StaffAttendanceApiResponse,
} from '../types/staff-attendance';

// API endpoints
const STAFF_ATTENDANCE_ENDPOINTS = {
  MARK_ATTENDANCE: '/api/v1/staff-attendance/mark',
  GET_STAFF: '/api/v1/staff-attendance/staff',
  GET_SESSION: '/api/v1/staff-attendance/session',
  GET_STAFF_ATTENDANCE: '/api/v1/staff-attendance/staff',
  GET_STATS: '/api/v1/staff-attendance/stats',
} as const;

export class StaffAttendanceService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Mark attendance for staff
   */
  async markAttendance(
    data: MarkStaffAttendanceRequest,
  ): Promise<MarkStaffAttendanceResponse> {
    const response = await this.httpClient.post(
      STAFF_ATTENDANCE_ENDPOINTS.MARK_ATTENDANCE,
      data,
    );
    return response as StaffAttendanceApiResponse<
      MarkStaffAttendanceResponse['data']
    >;
  }

  /**
   * Get all staff for attendance marking
   */
  async getStaffForAttendance(
    date?: string,
  ): Promise<StaffForAttendanceResponse> {
    const params: Record<string, string> = {};
    if (date) {
      params.date = date;
    }

    const response = await this.httpClient.get(
      STAFF_ATTENDANCE_ENDPOINTS.GET_STAFF,
      params,
    );
    return response as StaffAttendanceApiResponse<
      StaffForAttendanceResponse['data']
    >;
  }

  /**
   * Get staff attendance session for a specific date
   */
  async getStaffAttendanceSession(
    date: string,
    sessionType?: string,
  ): Promise<StaffAttendanceSessionResponse> {
    const params: Record<string, string> = {};
    if (sessionType) {
      params.sessionType = sessionType;
    }

    const response = await this.httpClient.get(
      `${STAFF_ATTENDANCE_ENDPOINTS.GET_SESSION}/${date}`,
      params,
    );
    return response as StaffAttendanceApiResponse<
      StaffAttendanceSessionResponse['data']
    >;
  }

  /**
   * Get individual staff attendance
   */
  async getStaffAttendance(
    staffId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      month?: string;
      year?: string;
      page?: string;
      limit?: string;
    },
  ): Promise<StaffAttendanceDetailResponse> {
    const queryParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = value;
        }
      });
    }

    const response = await this.httpClient.get(
      `${STAFF_ATTENDANCE_ENDPOINTS.GET_STAFF_ATTENDANCE}/${staffId}`,
      queryParams,
    );
    return response as StaffAttendanceApiResponse<
      StaffAttendanceDetailResponse['data']
    >;
  }

  /**
   * Get staff attendance statistics
   */
  async getStaffAttendanceStats(
    staffId: string,
    month?: number,
    year?: number,
  ): Promise<StaffAttendanceStatsResponse> {
    const params: Record<string, string> = {};
    if (month !== undefined) {
      params.month = month.toString();
    }
    if (year !== undefined) {
      params.year = year.toString();
    }

    const response = await this.httpClient.get(
      `${STAFF_ATTENDANCE_ENDPOINTS.GET_STATS}/${staffId}`,
      params,
    );
    return response as StaffAttendanceApiResponse<
      StaffAttendanceStatsResponse['data']
    >;
  }
}

// Create and export singleton instance
export const staffAttendanceService = new StaffAttendanceService();
