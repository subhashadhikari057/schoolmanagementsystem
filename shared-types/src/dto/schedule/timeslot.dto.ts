import { z } from 'zod';

// Enum for timeslot types
export enum TimeslotType {
  REGULAR = 'REGULAR',
  BREAK = 'BREAK',
  LUNCH = 'LUNCH',
  ACTIVITY = 'ACTIVITY',
  STUDY_HALL = 'STUDY_HALL',
  FREE_PERIOD = 'FREE_PERIOD',
}

// Base schema for timeslot validation
export const timeslotBaseSchema = z.object({
  day: z.string().min(1, 'Day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.nativeEnum(TimeslotType).default(TimeslotType.REGULAR),
  label: z.string().optional(),
});

// Schema for creating a new timeslot
export const createTimeslotSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
}).merge(timeslotBaseSchema);

// Schema for updating an existing timeslot
export const updateTimeslotSchema = z.object({
  id: z.string().uuid('Invalid timeslot ID'),
}).merge(timeslotBaseSchema.partial());

// Schema for timeslot response
export const timeslotResponseSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
}).merge(timeslotBaseSchema).merge(z.object({
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
}));

// Schema for getting timeslots by class
export const getTimeslotsByClassSchema = z.object({
  // Accept any non-empty string so that frontend can pass slug IDs like "class-3".
  // Backend still guarantees referential integrity at service level.
  classId: z.string().min(1, 'Class ID is required'),
});

// Schema for bulk creating timeslots
export const bulkCreateTimeslotsSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  timeslots: z.array(timeslotBaseSchema),
});

// Types
export type TimeslotBase = z.infer<typeof timeslotBaseSchema>;
export type CreateTimeslotDto = z.infer<typeof createTimeslotSchema>;
export type UpdateTimeslotDto = z.infer<typeof updateTimeslotSchema>;
export type TimeslotResponseDto = z.infer<typeof timeslotResponseSchema>;
export type GetTimeslotsByClassDto = z.infer<typeof getTimeslotsByClassSchema>;
export type BulkCreateTimeslotsDto = z.infer<typeof bulkCreateTimeslotsSchema>;
