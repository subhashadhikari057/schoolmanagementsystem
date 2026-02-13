import { z } from 'zod';
import { LeaveTypeGenderRule, LeaveTypeLimitPeriod } from '../enums';

export const UpdateLeaveTypeDto = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  maxDays: z
    .number()
    .int()
    .min(1, 'Maximum days must be at least 1')
    .max(365, 'Maximum days cannot exceed 365')
    .optional(),
  isPaid: z.boolean().optional(),
  paidDays: z
    .number()
    .int()
    .min(0, 'Paid days cannot be negative')
    .max(365, 'Paid days cannot exceed 365')
    .optional(),
  limitPeriod: z.nativeEnum(LeaveTypeLimitPeriod).optional(),
  eligibilityGender: z.nativeEnum(LeaveTypeGenderRule).optional(),
  prorateOnTenure: z.boolean().optional(),
  proratePeriodMonths: z
    .number()
    .int()
    .min(1, 'Proration period must be at least 1 month')
    .max(120, 'Proration period cannot exceed 120 months')
    .optional(),
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
  requiresSubstituteCredit: z.boolean().optional(),
});

export type UpdateLeaveTypeDtoType = z.infer<typeof UpdateLeaveTypeDto>;
