import { z } from 'zod';
import { TimeslotType } from './timeslot.dto';

// Base schema for schedule validation
export const scheduleBaseSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  name: z.string().min(1, 'Schedule name is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  effectiveFrom: z.string().or(z.date()),
  status: z.string().default('draft'),
});

// Schema for creating a new schedule
export const createScheduleSchema = scheduleBaseSchema;

// Schema for updating an existing schedule
export const updateScheduleSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
}).merge(scheduleBaseSchema.partial());

// Schema for schedule slot
export const scheduleSlotBaseSchema = z.object({
  timeslotId: z.string().uuid('Invalid timeslot ID'),
  day: z.string().min(1, 'Day is required'),
  subjectId: z.string().uuid('Invalid subject ID').optional(),
  teacherId: z.string().uuid('Invalid teacher ID').optional(),
  roomId: z.string().uuid('Invalid room ID').optional(),
  type: z.nativeEnum(TimeslotType).default(TimeslotType.REGULAR),
  hasConflict: z.boolean().default(false),
});

// Schema for creating schedule slots
export const createScheduleSlotSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
}).merge(scheduleSlotBaseSchema);

// Schema for updating schedule slots
export const updateScheduleSlotSchema = z.object({
  id: z.string().uuid('Invalid slot ID'),
}).merge(scheduleSlotBaseSchema.partial());

// Schema for schedule response
export const scheduleResponseSchema = z.object({
  id: z.string().uuid(),
}).merge(scheduleBaseSchema).merge(z.object({
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
}));

// Schema for schedule slot response
export const scheduleSlotResponseSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
}).merge(scheduleSlotBaseSchema).merge(z.object({
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
}));

// Schema for getting schedules by class
export const getSchedulesByClassSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
});

// Schema for getting schedule slots by schedule
export const getScheduleSlotsByScheduleSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
});

// Schema for checking teacher conflicts
export const checkTeacherConflictSchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
  day: z.string().min(1, 'Day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  excludeSlotId: z.string().uuid('Invalid slot ID').optional(),
});

// Schema for activating a schedule
export const activateScheduleSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
});

// Types
export type ScheduleBase = z.infer<typeof scheduleBaseSchema>;
export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleDto = z.infer<typeof updateScheduleSchema>;
export type ScheduleResponseDto = z.infer<typeof scheduleResponseSchema>;
export type GetSchedulesByClassDto = z.infer<typeof getSchedulesByClassSchema>;

export type ScheduleSlotBase = z.infer<typeof scheduleSlotBaseSchema>;
export type CreateScheduleSlotDto = z.infer<typeof createScheduleSlotSchema>;
export type UpdateScheduleSlotDto = z.infer<typeof updateScheduleSlotSchema>;
export type ScheduleSlotResponseDto = z.infer<typeof scheduleSlotResponseSchema>;
export type GetScheduleSlotsByScheduleDto = z.infer<typeof getScheduleSlotsByScheduleSchema>;
export type CheckTeacherConflictDto = z.infer<typeof checkTeacherConflictSchema>;
export type ActivateScheduleDto = z.infer<typeof activateScheduleSchema>;
