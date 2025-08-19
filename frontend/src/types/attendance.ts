/**
 * =============================================================================
 * Attendance Types
 * =============================================================================
 * Type definitions for attendance management
 * =============================================================================
 */

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email?: string;
  classId?: string;
}

export interface Class {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  currentEnrollment: number;
  shift: 'MORNING' | 'DAY';
  status: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  attendance: { [studentId: string]: 'present' | 'absent' };
  remarks?: { [studentId: string]: string };
  takenAt: string;
  isLocked: boolean;
  classId?: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface AttendanceFormData {
  classId: string;
  date: string;
  entries: Array<{
    student_id: string;
    status: 'present' | 'absent';
    remarks?: string;
  }>;
}

export interface AttendanceUpdateData {
  attendance_id: string;
  status: 'present' | 'absent';
  remarks: string;
}
