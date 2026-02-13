import { z } from 'zod';
import { LeaveTypeGenderRule } from '../enums';

export const QueryLeaveTypeDto = z.object({
  name: z.string().optional(),
  isPaid: z.preprocess(val => {
    if (typeof val === 'string') {
      return val === 'true';
    }
    return val;
  }, z.boolean().optional()),
  status: z.string().optional(),
  eligibilityGender: z.nativeEnum(LeaveTypeGenderRule).optional(),
});

export type QueryLeaveTypeDtoType = z.infer<typeof QueryLeaveTypeDto>;
