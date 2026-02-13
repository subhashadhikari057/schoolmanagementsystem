import { z } from 'zod';
import { LeaveTypeGenderRule, LeaveTypeLimitPeriod } from '../enums';

export const CreateLeaveTypeDto = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  maxDays: z
    .number()
    .int()
    .min(1, 'Maximum days must be at least 1')
    .max(365, 'Maximum days cannot exceed 365'),
  isPaid: z.boolean(),
  paidDays: z
    .number()
    .int()
    .min(0, 'Paid days cannot be negative')
    .max(365, 'Paid days cannot exceed 365')
    .default(0),
  limitPeriod: z
    .nativeEnum(LeaveTypeLimitPeriod)
    .default(LeaveTypeLimitPeriod.YEAR),
  eligibilityGender: z
    .nativeEnum(LeaveTypeGenderRule)
    .default(LeaveTypeGenderRule.ANY),
  prorateOnTenure: z.boolean().default(false),
  proratePeriodMonths: z
    .number()
    .int()
    .min(1, 'Proration period must be at least 1 month')
    .max(120, 'Proration period cannot exceed 120 months')
    .default(12),
  carryForwardLimit: z
    .number()
    .int()
    .min(0, 'Carry forward limit cannot be negative')
    .max(365, 'Carry forward limit cannot exceed 365')
    .nullable()
    .optional(),
  encashAfterLimit: z
    .number()
    .int()
    .min(0, 'Encashment limit cannot be negative')
    .max(365, 'Encashment limit cannot exceed 365')
    .nullable()
    .optional(),
  requiresSubstituteCredit: z.boolean().default(false),
});

export type CreateLeaveTypeDtoType = z.infer<typeof CreateLeaveTypeDto>;
