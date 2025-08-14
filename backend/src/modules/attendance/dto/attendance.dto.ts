import { z } from 'zod';

// ---------------------------
// Attendance Status Enum
// ---------------------------
export const AttendanceStatusSchema = z.enum([
  'PRESENT',
  'ABSENT',
  'LATE',
  'EXCUSED',
  'UNKNOWN',
]);

export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;

// ---------------------------
// Mark Attendance DTO
// ---------------------------
export const MarkAttendanceDto = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  classId: z.string().uuid('Invalid class ID'),
  attendanceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  status: AttendanceStatusSchema,
  remarks: z.string().optional(),
  additionalMetadata: z.record(z.any()).optional(),
});

export type MarkAttendanceDtoType = z.infer<typeof MarkAttendanceDto>;

// ---------------------------
// Bulk Mark Attendance DTO
// ---------------------------
export const BulkMarkAttendanceDto = z.object({
  classId: z.string().uuid('Invalid class ID'),
  attendanceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  attendanceRecords: z
    .array(
      z.object({
        studentId: z.string().uuid('Invalid student ID'),
        status: AttendanceStatusSchema,
        remarks: z.string().optional(),
        additionalMetadata: z.record(z.any()).optional(),
      }),
    )
    .min(1, 'At least one attendance record is required'),
});

export type BulkMarkAttendanceDtoType = z.infer<typeof BulkMarkAttendanceDto>;

// ---------------------------
// Update Attendance DTO
// ---------------------------
export const UpdateAttendanceDto = z.object({
  status: AttendanceStatusSchema.optional(),
  remarks: z.string().min(1, 'Remarks are mandatory when updating attendance'),
  additionalMetadata: z.record(z.any()).optional(),
});

export type UpdateAttendanceDtoType = z.infer<typeof UpdateAttendanceDto>;

// ---------------------------
// Attendance Query DTO
// ---------------------------
export const AttendanceQueryDto = z.object({
  limit: z.number().min(1).max(100).default(10),
  page: z.number().min(1).default(1),
  studentId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  status: AttendanceStatusSchema.optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD')
    .optional(),
});

export type AttendanceQueryDtoType = z.infer<typeof AttendanceQueryDto>;

// ---------------------------
// Class Attendance Query DTO
// ---------------------------
export const ClassAttendanceQueryDto = z.object({
  classId: z.string().uuid('Invalid class ID'),
  attendanceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export type ClassAttendanceQueryDtoType = z.infer<
  typeof ClassAttendanceQueryDto
>;

// ---------------------------
// Attendance Response DTO
// ---------------------------
export const AttendanceResponseDto = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  attendanceDate: z.string(),
  status: AttendanceStatusSchema,
  remarks: z.string().nullable(),
  additionalMetadata: z.record(z.any()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  // Include related data
  student: z
    .object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      rollNumber: z.string(),
      user: z.object({
        fullName: z.string(),
        email: z.string(),
      }),
    })
    .optional(),
});

export type AttendanceResponseDtoType = z.infer<typeof AttendanceResponseDto>;

// ---------------------------
// Attendance Summary DTO
// ---------------------------
export const AttendanceSummaryDto = z.object({
  classId: z.string().uuid(),
  attendanceDate: z.string(),
  totalStudents: z.number(),
  presentCount: z.number(),
  absentCount: z.number(),
  lateCount: z.number(),
  excusedCount: z.number(),
  unknownCount: z.number(),
  attendancePercentage: z.number(),
});

export type AttendanceSummaryDtoType = z.infer<typeof AttendanceSummaryDto>;

// ---------------------------
// Student Attendance Report DTO
// ---------------------------
export const StudentAttendanceReportDto = z.object({
  studentId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  presentDays: z.number(),
  absentDays: z.number(),
  lateDays: z.number(),
  excusedDays: z.number(),
  attendancePercentage: z.number(),
  attendanceRecords: z.array(AttendanceResponseDto),
});

export type StudentAttendanceReportDtoType = z.infer<
  typeof StudentAttendanceReportDto
>;
