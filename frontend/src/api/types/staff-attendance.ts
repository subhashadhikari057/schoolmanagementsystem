/**
 * =============================================================================
 * Staff Attendance Types
 * =============================================================================
 * TypeScript interfaces for staff attendance operations
 * =============================================================================
 */

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface StaffAttendanceRecord {
  staffId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface MarkStaffAttendanceRequest {
  date: string;
  sessionType: string;
  staff: StaffAttendanceRecord[];
  notes?: string;
}

export interface StaffForAttendance {
  id: string;
  name: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  status?: AttendanceStatus;
  lastAttendance?: string;
  hasUserAccount: boolean; // Indicates if staff has login access
}

export interface StaffAttendanceSession {
  sessionId: string;
  date: string;
  sessionType: string;
  isCompleted: boolean;
  markedAt: string;
  markedBy: string;
  totalStaff: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  staff: StaffForAttendance[];
}

export interface StaffAttendanceStats {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export interface StaffAttendanceResponse {
  staffId: string;
  staffName: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  hasUserAccount: boolean;
  stats: StaffAttendanceStats;
  records: {
    date: string;
    status: AttendanceStatus;
    remarks?: string;
    sessionType: string;
  }[];
}

// API Response types
export interface StaffForAttendanceResponse {
  success: boolean;
  message: string;
  data: StaffForAttendance[];
}

export interface MarkStaffAttendanceResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    recordsCreated: number;
    recordsUpdated: number;
    totalRecords: number;
  };
}

export interface StaffAttendanceSessionResponse {
  success: boolean;
  message: string;
  data: StaffAttendanceSession | null;
}

export interface StaffAttendanceStatsResponse {
  success: boolean;
  message: string;
  data: StaffAttendanceStats;
}

export interface StaffAttendanceDetailResponse {
  success: boolean;
  message: string;
  data: StaffAttendanceResponse;
}

// Generic API response wrapper
export type StaffAttendanceApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
