import { z } from 'zod';

// Define SalaryChangeType enum since it's not exported from Prisma client
// This matches the enum in the Prisma schema
export enum SalaryChangeType {
  INITIAL = 'INITIAL',
  PROMOTION = 'PROMOTION',
  DEMOTION = 'DEMOTION',
  ADJUSTMENT = 'ADJUSTMENT',
}

// ---------------------------
// Update Staff Salary DTO
// ---------------------------
export const UpdateStaffSalaryDto = z.object({
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

export type UpdateStaffSalaryDtoType = z.infer<typeof UpdateStaffSalaryDto>;

// ---------------------------
// Get Salary History Response DTO
// ---------------------------
export const StaffSalaryHistoryResponseDto = z.object({
  id: z.string(),
  staffId: z.string(),
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

export type StaffSalaryHistoryResponseDtoType = z.infer<
  typeof StaffSalaryHistoryResponseDto
>;
