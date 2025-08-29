/**
 * =============================================================================
 * Teacher Attendance API Types
 * =============================================================================
 * TypeScript type definitions for teacher attendance API operations
 * =============================================================================
 */

// ============================================================================
// Attendance Status Types
// ============================================================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

// ============================================================================
// Teacher Attendance Request Types
// ============================================================================

export interface TeacherAttendanceRecord {
  teacherId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface MarkTeacherAttendanceRequest {
  date: string;
  sessionType?: string;
  teachers: TeacherAttendanceRecord[];
  notes?: string;
}

export interface GetTeacherAttendanceQuery {
  teacherId?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// Teacher Data Types
// ============================================================================

export interface TeacherForAttendance {
  id: string;
  name: string;
  employeeId?: string;
  department?: string;
  designation: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  status?: AttendanceStatus;
  lastAttendance?: string;
}

// ============================================================================
// Teacher Attendance Response Types
// ============================================================================

export interface TeacherAttendanceStats {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export interface TeacherAttendanceSessionResponse {
  sessionId: string;
  date: string;
  sessionType: string;
  isCompleted: boolean;
  markedAt: string;
  markedBy: string;
  totalTeachers: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  teachers: TeacherForAttendance[];
}

export interface TeacherAttendanceResponse {
  teacherId: string;
  teacherName: string;
  employeeId?: string;
  department?: string;
  designation: string;
  stats: TeacherAttendanceStats;
  records: Array<{
    date: string;
    status: AttendanceStatus;
    remarks?: string;
    sessionType: string;
  }>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface TeacherAttendanceApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface MarkTeacherAttendanceResponse {
  sessionId: string;
  recordsCreated: number;
  recordsUpdated: number;
  totalRecords: number;
}

export interface TeachersForAttendanceResponse
  extends Array<TeacherForAttendance> {}

export interface TeacherAttendanceStatsResponse
  extends TeacherAttendanceStats {}
