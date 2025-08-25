/**
 * =============================================================================
 * Attendance Service
 * =============================================================================
 * Frontend service for attendance management operations
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';

export interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface MarkAttendanceRequest {
  classId: string;
  date: string;
  sessionType?: string;
  students: AttendanceRecord[];
  notes?: string;
}

export interface AttendanceStats {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export interface StudentAttendanceResponse {
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  stats: AttendanceStats;
  records: Array<{
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    remarks?: string;
    sessionType: string;
  }>;
}

export class AttendanceService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Mark attendance for students in a class
   */
  async markAttendance(data: MarkAttendanceRequest) {
    const response = await this.httpClient.post(
      '/api/v1/attendance/mark',
      data,
    );
    console.log('HttpClient response:', response);
    console.log('Backend data:', response.data);

    // Return both the HttpClient wrapper and the backend response
    const result = {
      ...response,
      // Also include backend response data for compatibility
      ...(response.data as object),
    };

    console.log('Final merged response:', result);
    return result;
  }

  /**
   * Get student attendance details
   */
  async getStudentAttendance(
    studentId: string,
    params?: {
      month?: number;
      year?: number;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<StudentAttendanceResponse> {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.httpClient.get<StudentAttendanceResponse>(
      `/api/v1/attendance/student/${studentId}?${queryParams.toString()}`,
    );
    return response.data;
  }

  /**
   * Get student attendance statistics
   */
  async getStudentAttendanceStats(
    studentId: string,
    month?: number,
    year?: number,
  ): Promise<AttendanceStats> {
    const queryParams = new URLSearchParams();
    if (month) queryParams.append('month', month.toString());
    if (year) queryParams.append('year', year.toString());

    const response = await this.httpClient.get<AttendanceStats>(
      `/api/v1/attendance/student/${studentId}/stats?${queryParams.toString()}`,
    );
    return response.data;
  }

  /**
   * Get class attendance for a specific date
   */
  async getClassAttendance(
    classId: string,
    date: string,
    sessionType?: string,
  ) {
    const queryParams = new URLSearchParams();
    queryParams.append('date', date);
    if (sessionType) queryParams.append('sessionType', sessionType);

    const response = await this.httpClient.get(
      `/api/v1/attendance/class/${classId}?${queryParams.toString()}`,
    );
    return response.data;
  }

  /**
   * Calculate working days for a month
   */
  async calculateWorkingDays(month: number, year: number) {
    const response = await this.httpClient.post(
      '/api/v1/attendance/working-days/calculate',
      {
        month,
        year,
      },
    );
    return response.data;
  }

  /**
   * Get working days tracker for a month
   */
  async getWorkingDaysTracker(month: number, year: number) {
    const response = await this.httpClient.get(
      `/api/v1/attendance/working-days/${month}/${year}`,
    );
    return response.data;
  }

  /**
   * Check if a date is a holiday, event, or working day
   */
  async checkDateStatus(date: string): Promise<{
    isHoliday: boolean;
    isEvent: boolean;
    isExam: boolean;
    isSaturday: boolean;
    isWorkingDay: boolean;
    eventDetails?: {
      title: string;
      type: string;
      description?: string;
    };
  }> {
    const response = await this.httpClient.get(
      `/api/v1/attendance/date-status/${date}`,
    );
    return response.data as {
      isHoliday: boolean;
      isEvent: boolean;
      isExam: boolean;
      isSaturday: boolean;
      isWorkingDay: boolean;
      eventDetails?: {
        title: string;
        type: string;
        description?: string;
      };
    };
  }

  /**
   * Get class-wise attendance statistics for today or a specific date
   */
  async getClassWiseAttendanceStats(date?: string): Promise<{
    date: string;
    classes: Array<{
      id: string;
      grade: string;
      section: string;
      totalStudents: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendancePercentage: number;
      status: 'completed' | 'partial' | 'pending';
    }>;
    overall: {
      totalStudents: number;
      totalPresent: number;
      totalAbsent: number;
      totalLate: number;
      totalExcused: number;
      overallAttendanceRate: number;
      completedClasses: number;
      pendingClasses: number;
      partialClasses: number;
    };
  }> {
    const params = date ? `?date=${date}` : '';
    const response = await this.httpClient.get(
      `/api/v1/attendance/class-wise-stats${params}`,
    );
    return response.data as {
      date: string;
      classes: Array<{
        id: string;
        grade: string;
        section: string;
        totalStudents: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
        attendancePercentage: number;
        status: 'completed' | 'partial' | 'pending';
      }>;
      overall: {
        totalStudents: number;
        totalPresent: number;
        totalAbsent: number;
        totalLate: number;
        totalExcused: number;
        overallAttendanceRate: number;
        completedClasses: number;
        pendingClasses: number;
        partialClasses: number;
      };
    };
  }
}

// Export singleton instance
export const attendanceService = new AttendanceService();
