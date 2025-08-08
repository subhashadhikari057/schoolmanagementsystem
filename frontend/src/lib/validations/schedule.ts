import { z } from 'zod';

export const basicInfoSchema = z.object({
  scheduleName: z.string().min(1, 'Schedule name is required'),
  grade: z.string().min(1, 'Grade is required'),
  section: z.string().min(1, 'Section is required'),
  academicYear: z.string().default('2024-25'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  status: z.string().default('draft'),
});

export const timeSlotSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.string().default('regular'),
});

export const timeSlotsSchema = z.object({
  timeSlots: z
    .array(timeSlotSchema)
    .min(1, 'At least one time slot is required'),
});

export const scheduleSchema = z.object({
  basicInfo: basicInfoSchema,
  timeSlots: z.array(timeSlotSchema),
});

export type BasicInfo = z.infer<typeof basicInfoSchema>;
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
