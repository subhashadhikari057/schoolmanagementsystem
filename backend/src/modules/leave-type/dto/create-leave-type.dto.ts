import { z } from 'zod';

export const CreateLeaveTypeDto = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  maxDays: z
    .number()
    .int()
    .min(1, 'Maximum days must be at least 1')
    .max(365, 'Maximum days cannot exceed 365'),
  isPaid: z.boolean(),
});

export type CreateLeaveTypeDtoType = z.infer<typeof CreateLeaveTypeDto>;
