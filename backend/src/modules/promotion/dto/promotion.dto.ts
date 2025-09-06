/**
 * =============================================================================
 * Promotion DTOs
 * =============================================================================
 * Data Transfer Objects for student promotion operations.
 * Includes validation schemas and type definitions.
 * =============================================================================
 */

import { z } from 'zod';

/**
 * =============================================================================
 * VALIDATION SCHEMAS
 * =============================================================================
 */

export const PreviewPromotionSchema = z.object({
  academicYear: z.string().min(1, 'Academic year is required'),
  excludedStudentIds: z.array(z.string()).optional().default([]),
});

export const ExecutePromotionSchema = z.object({
  academicYear: z.string().min(1, 'Academic year is required'),
  toAcademicYear: z.string().min(1, 'Target academic year is required'),
  excludedStudentIds: z.array(z.string()).optional().default([]),
  reason: z.string().optional(),
});

export const CreateAcademicYearSchema = z.object({
  year: z.string().regex(/^\d{4}-\d{4}$/, 'Year must be in format YYYY-YYYY'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().optional().default(false),
});

export const UpdateAcademicYearSchema = CreateAcademicYearSchema.partial();

export const PromotionStudentResponseSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  rollNumber: z.string(),
  studentId: z.string().nullable(),
  className: z.string(),
  currentGrade: z.number(),
  section: z.string(),
  academicStatus: z.string(),
  isEligible: z.boolean(),
  ineligibilityReasons: z.array(z.string()),
  feeStatus: z.string().nullable(),
  attendancePercentage: z.number().nullable(),
  gpa: z.number().nullable(),
  promotionType: z.enum(['PROMOTED', 'RETAINED', 'GRADUATED']),
  targetGrade: z.number().nullable(),
  targetSection: z.string().nullable(),
});

export const PromotionSummarySchema = z.object({
  fromGrade: z.number(),
  toGrade: z.union([z.number(), z.literal('Graduate')]),
  totalStudents: z.number(),
  eligibleStudents: z.number(),
  ineligibleStudents: z.number(),
  promotingStudents: z.number(),
  stayingStudents: z.number(),
  graduatingStudents: z.number(),
});

export const PromotionPreviewResponseSchema = z.object({
  fromAcademicYear: z.string(),
  toAcademicYear: z.string(),
  summaryByGrade: z.array(PromotionSummarySchema),
  promotionStudents: z.array(PromotionStudentResponseSchema),
  totalStats: z.object({
    totalStudents: z.number(),
    totalPromoting: z.number(),
    totalStaying: z.number(),
    totalGraduating: z.number(),
    totalIneligible: z.number(),
  }),
  metadata: z
    .object({
      hasClasses: z.boolean(),
      hasStudents: z.boolean(),
      message: z.string().optional(),
    })
    .optional(),
});

export const PromotionBatchResponseSchema = z.object({
  id: z.string(),
  fromAcademicYear: z.string(),
  toAcademicYear: z.string(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  totalStudents: z.number(),
  promotedStudents: z.number(),
  retainedStudents: z.number(),
  graduatedStudents: z.number(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  executedBy: z
    .object({
      id: z.string(),
      fullName: z.string(),
      email: z.string(),
    })
    .nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const AcademicYearResponseSchema = z.object({
  id: z.string(),
  year: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  isCurrent: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

/**
 * =============================================================================
 * DTO TYPES
 * =============================================================================
 */

export type PreviewPromotionDto = z.infer<typeof PreviewPromotionSchema>;
export type ExecutePromotionDto = z.infer<typeof ExecutePromotionSchema>;
export type CreateAcademicYearDto = z.infer<typeof CreateAcademicYearSchema>;
export type UpdateAcademicYearDto = z.infer<typeof UpdateAcademicYearSchema>;

export type PromotionStudentResponseDto = z.infer<
  typeof PromotionStudentResponseSchema
>;
export type PromotionSummaryDto = z.infer<typeof PromotionSummarySchema>;
export type PromotionPreviewResponseDto = z.infer<
  typeof PromotionPreviewResponseSchema
>;
export type PromotionBatchResponseDto = z.infer<
  typeof PromotionBatchResponseSchema
>;
export type AcademicYearResponseDto = z.infer<
  typeof AcademicYearResponseSchema
>;

/**
 * =============================================================================
 * REQUEST/RESPONSE INTERFACES
 * =============================================================================
 */

export interface PromotionExecutionResult {
  success: boolean;
  batchId: string;
  message: string;
  totalProcessed: number;
  promoted: number;
  retained: number;
  graduated: number;
  failed: number;
  errors?: string[];
}

export interface PromotionProgressUpdate {
  batchId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  message?: string;
  totalProcessed?: number;
  promoted?: number;
  retained?: number;
  graduated?: number;
  failed?: number;
}
