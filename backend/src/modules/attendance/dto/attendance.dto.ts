/**
 * =============================================================================
 * Attendance Module DTOs
 * =============================================================================
 * Data Transfer Objects for attendance management operations
 * =============================================================================
 */

import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

/**
 * Mark Attendance DTO
 */
export const MarkAttendanceSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  sessionType: z.string().default('daily'),
  students: z
    .array(
      z.object({
        studentId: z.string().uuid('Invalid student ID'),
        status: z.nativeEnum(AttendanceStatus),
        remarks: z.string().optional(),
      }),
    )
    .min(1, 'At least one student must be marked'),
  notes: z.string().optional(),
});

export type MarkAttendanceDto = z.infer<typeof MarkAttendanceSchema>;

/**
 * Get Attendance Query DTO
 */
export const GetAttendanceQuerySchema = z.object({
  classId: z.string().uuid('Invalid class ID').optional(),
  studentId: z.string().uuid('Invalid student ID').optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  month: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(12))
    .optional(),
  year: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(2020).max(2030))
    .optional(),
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .default(1),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .default(20),
});

export type GetAttendanceQueryDto = z.infer<typeof GetAttendanceQuerySchema>;

/**
 * Working Days Calculation DTO
 */
export const WorkingDaysCalculationSchema = z.object({
  month: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(12)),
  year: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(2020).max(2030)),
});

export type WorkingDaysCalculationDto = z.infer<
  typeof WorkingDaysCalculationSchema
>;

/**
 * Attendance Statistics Response DTO
 */
export const AttendanceStatsSchema = z.object({
  totalWorkingDays: z.number(),
  presentDays: z.number(),
  absentDays: z.number(),
  lateDays: z.number(),
  excusedDays: z.number(),
  attendancePercentage: z.number(),
});

export type AttendanceStatsDto = z.infer<typeof AttendanceStatsSchema>;

/**
 * Student Attendance Response DTO
 */
export const StudentAttendanceResponseSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  rollNumber: z.string(),
  className: z.string(),
  stats: AttendanceStatsSchema,
  statistics: AttendanceStatsSchema.optional(), // alias for compatibility
  records: z.array(
    z.object({
      date: z.string(),
      status: z.nativeEnum(AttendanceStatus),
      remarks: z.string().optional(),
      sessionType: z.string(),
    }),
  ),
});

export type StudentAttendanceResponseDto = z.infer<
  typeof StudentAttendanceResponseSchema
>;
