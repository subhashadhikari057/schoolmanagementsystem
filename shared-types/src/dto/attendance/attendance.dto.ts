import { AttendanceStatus } from '../../enums/attendance/attendance-status.enum';
import { z } from 'zod';

// Basic attendance interface
export interface AttendanceDto {
  id: string;
  student_id: string;
  date: Date;
  status: AttendanceStatus;
}

// Extended attendance response interface
export interface AttendanceResponseDtoType {
  id: string;
  student_id: string;
  class_id: string;
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
  created_at: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
  // Additional fields for better frontend integration
  student_name?: string;
  student_email?: string;
  class_name?: string;
  class_grade?: number;
  class_section?: string;
}

// Mark attendance entry interface
export interface AttendanceEntryDtoType {
  student_id: string;
  status: AttendanceStatus;
  remarks?: string;
}

// Daily attendance record interface
export interface DailyAttendanceRecordDtoType {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  status: AttendanceStatus;
  remarks?: string;
  created_at: Date;
  updated_at?: Date;
}

// Mark attendance request interface
export interface MarkAttendanceRequestDtoType {
  class_id: string;
  date: Date;
  entries: AttendanceEntryDtoType[];
}

// Daily attendance request interface (for marking today's attendance)
export interface DailyAttendanceRequestDtoType {
  class_id: string;
  entries: AttendanceEntryDtoType[];
}

// Get attendance query interface
export interface GetAttendanceQueryDtoType {
  class_id?: string;
  student_id?: string;
  start_date: Date;
  end_date: Date;
  status?: AttendanceStatus;
}

// Update attendance interface
export interface UpdateAttendanceDtoType {
  status: AttendanceStatus;
  remarks: string;
}

// Bulk update attendance interface
export interface BulkUpdateAttendanceDtoType {
  attendance_id: string;
  status: AttendanceStatus;
  remarks: string;
}

// Bulk update attendance request interface
export interface BulkUpdateAttendanceRequestDtoType {
  updates: BulkUpdateAttendanceDtoType[];
}

// Attendance summary interface
export interface AttendanceSummaryDtoType {
  date: Date;
  classId: string;
  totalStudents: number;
  markedCount: number;
  unmarkedCount: number;
  summary: Array<{
    status: AttendanceStatus;
    count: number;
  }>;
}

// Student attendance summary interface
export interface StudentAttendanceSummaryDtoType {
  studentId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
  summary: Array<{
    status: AttendanceStatus;
    count: number;
  }>;
}

// Class attendance stats interface
export interface ClassAttendanceStatsDtoType {
  date: Date;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

// Daily attendance status interface
export interface DailyAttendanceStatusDtoType {
  class_id: string;
  date: Date;
  total_students: number;
  marked_count: number;
  unmarked_count: number;
  is_completed: boolean;
  last_updated?: Date;
}

// Attendance dashboard summary interface
export interface AttendanceDashboardSummaryDtoType {
  today: {
    total_classes: number;
    completed_classes: number;
    pending_classes: number;
  };
  this_week: {
    total_attendance_days: number;
    average_attendance_percentage: number;
  };
  this_month: {
    total_attendance_days: number;
    average_attendance_percentage: number;
  };
}

// Zod schemas for validation

// Mark attendance entry schema
export const AttendanceEntrySchema = z.object({
  student_id: z.string().uuid(),
  status: z.nativeEnum(AttendanceStatus),
  remarks: z.string().optional(),
});

// Mark attendance request schema
export const MarkAttendanceRequestSchema = z.object({
  class_id: z.string().uuid(),
  date: z.coerce.date(),
  entries: z.array(AttendanceEntrySchema).min(1),
});

// Get attendance query schema
export const GetAttendanceQuerySchema = z.object({
  class_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  status: z.nativeEnum(AttendanceStatus).optional(),
});

// Update attendance schema
export const UpdateAttendanceSchema = z.object({
  status: z.nativeEnum(AttendanceStatus),
  remarks: z.string().min(1, 'Remarks are required when updating attendance'),
});

// Daily attendance request schema
export const DailyAttendanceRequestSchema = z.object({
  class_id: z.string().uuid(),
  entries: z.array(AttendanceEntrySchema).min(1),
});

// Bulk update attendance schema
export const BulkUpdateAttendanceSchema = z.object({
  attendance_id: z.string().uuid(),
  status: z.nativeEnum(AttendanceStatus),
  remarks: z.string().min(1, 'Remarks are required when updating attendance'),
});

// Bulk update attendance request schema
export const BulkUpdateAttendanceRequestSchema = z.object({
  updates: z.array(BulkUpdateAttendanceSchema).min(1),
});

// Export DTO types from schemas
export type MarkAttendanceRequestDto = z.infer<typeof MarkAttendanceRequestSchema>;
export type GetAttendanceQueryDto = z.infer<typeof GetAttendanceQuerySchema>;
export type UpdateAttendanceDto = z.infer<typeof UpdateAttendanceSchema>;
export type DailyAttendanceRequestDto = z.infer<typeof DailyAttendanceRequestSchema>;
export type BulkUpdateAttendanceDto = z.infer<typeof BulkUpdateAttendanceSchema>;
export type BulkUpdateAttendanceRequestDto = z.infer<typeof BulkUpdateAttendanceRequestSchema>;
