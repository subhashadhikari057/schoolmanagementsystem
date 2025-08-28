/**
 * =============================================================================
 * Teacher Attendance Module DTOs
 * =============================================================================
 * Data Transfer Objects for teacher attendance management operations
 * =============================================================================
 */

import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

/**
 * Mark Teacher Attendance DTO
 */
export const MarkTeacherAttendanceSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  sessionType: z.string().default('daily'),
  teachers: z
    .array(
      z.object({
        teacherId: z.string().uuid('Invalid teacher ID'),
        status: z.nativeEnum(AttendanceStatus),
        remarks: z.string().optional(),
      }),
    )
    .min(1, 'At least one teacher must be marked'),
  notes: z.string().optional(),
});

export type MarkTeacherAttendanceDto = z.infer<
  typeof MarkTeacherAttendanceSchema
>;

/**
 * Get Teacher Attendance Query DTO
 */
export const GetTeacherAttendanceQuerySchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID').optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2030).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetTeacherAttendanceQueryDto = z.infer<
  typeof GetTeacherAttendanceQuerySchema
>;

/**
 * Teacher Attendance Statistics Response DTO
 */
export const TeacherAttendanceStatsSchema = z.object({
  totalWorkingDays: z.number(),
  presentDays: z.number(),
  absentDays: z.number(),
  lateDays: z.number(),
  excusedDays: z.number(),
  attendancePercentage: z.number(),
});

export type TeacherAttendanceStatsDto = z.infer<
  typeof TeacherAttendanceStatsSchema
>;

/**
 * Teacher Attendance Response DTO
 */
export const TeacherAttendanceResponseSchema = z.object({
  teacherId: z.string(),
  teacherName: z.string(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  designation: z.string(),
  stats: TeacherAttendanceStatsSchema,
  records: z.array(
    z.object({
      date: z.string(),
      status: z.nativeEnum(AttendanceStatus),
      remarks: z.string().optional(),
      sessionType: z.string(),
    }),
  ),
});

export type TeacherAttendanceResponseDto = z.infer<
  typeof TeacherAttendanceResponseSchema
>;

/**
 * Teacher List for Attendance DTO
 */
export const TeacherForAttendanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  designation: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  lastAttendance: z.string().optional(),
});

export type TeacherForAttendanceDto = z.infer<
  typeof TeacherForAttendanceSchema
>;

/**
 * Teacher Attendance Session Response DTO
 */
export const TeacherAttendanceSessionResponseSchema = z.object({
  sessionId: z.string(),
  date: z.string(),
  sessionType: z.string(),
  isCompleted: z.boolean(),
  markedAt: z.string(),
  markedBy: z.string(),
  totalTeachers: z.number(),
  presentCount: z.number(),
  absentCount: z.number(),
  lateCount: z.number(),
  excusedCount: z.number(),
  teachers: z.array(TeacherForAttendanceSchema),
});

export type TeacherAttendanceSessionResponseDto = z.infer<
  typeof TeacherAttendanceSessionResponseSchema
>;
