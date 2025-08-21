import { z } from 'zod';
import { SalaryChangeType } from '@prisma/client';

// ---------------------------
// Update Teacher Salary DTO
// ---------------------------
export const UpdateTeacherSalaryDto = z.object({
  basicSalary: z.number().min(0, 'Basic salary must be a positive number'),
  allowances: z.number().min(0, 'Allowances must be a positive number'),
  changeType: z
    .enum([
      SalaryChangeType.INITIAL,
      SalaryChangeType.PROMOTION,
      SalaryChangeType.DEMOTION,
      SalaryChangeType.ADJUSTMENT,
    ])
    .default(SalaryChangeType.ADJUSTMENT),
  changeReason: z.string().optional(),
  effectiveMonth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
});

export type UpdateTeacherSalaryDtoType = z.infer<typeof UpdateTeacherSalaryDto>;

// ---------------------------
// Get Salary History Response DTO
// ---------------------------
export const TeacherSalaryHistoryResponseDto = z.object({
  id: z.string(),
  teacherId: z.string(),
  effectiveMonth: z.date(),
  basicSalary: z.number(),
  allowances: z.number(),
  totalSalary: z.number(),
  changeType: z.enum([
    SalaryChangeType.INITIAL,
    SalaryChangeType.PROMOTION,
    SalaryChangeType.DEMOTION,
    SalaryChangeType.ADJUSTMENT,
  ]),
  changeReason: z.string().nullable(),
  approvedBy: z
    .object({
      id: z.string(),
      fullName: z.string(),
      email: z.string(),
    })
    .nullable(),
  createdAt: z.date(),
});

export type TeacherSalaryHistoryResponseDtoType = z.infer<
  typeof TeacherSalaryHistoryResponseDto
>;
