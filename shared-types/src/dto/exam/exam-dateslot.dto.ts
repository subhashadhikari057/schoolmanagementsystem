import { z } from 'zod';

// Enum for exam dateslot types
export enum ExamDateslotType {
  EXAM = 'EXAM',
  BREAK = 'BREAK',
  LUNCH = 'LUNCH',
  PREPARATION = 'PREPARATION',
}

// Base schema for exam dateslot validation
export const examDateslotBaseSchema = z.object({
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  examDate: z.string().or(z.date()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  label: z.string().optional(),
  type: z.nativeEnum(ExamDateslotType).default(ExamDateslotType.EXAM),
});

// Schema for creating a new exam dateslot
export const createExamDateslotSchema = examDateslotBaseSchema;

// Schema for updating an existing exam dateslot
export const updateExamDateslotSchema = z.object({
  id: z.string().uuid('Invalid dateslot ID'),
}).merge(examDateslotBaseSchema.partial());

// Schema for exam dateslot response
export const examDateslotResponseSchema = z.object({
  id: z.string().uuid(),
}).merge(examDateslotBaseSchema).merge(z.object({
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  calendarEntry: z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
    examType: z.string().nullable(),
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),
}));

// Schema for getting dateslots by calendar entry
export const getDateslotsByCalendarEntrySchema = z.object({
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
});

// Schema for bulk creating exam dateslots
export const bulkCreateExamDateslotsSchema = z.object({
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  dateslots: z.array(examDateslotBaseSchema.omit({ calendarEntryId: true })),
});

// Schema for generating dateslots from date range
export const generateDateslotsFromRangeSchema = z.object({
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  timeSlots: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    label: z.string().optional(),
  })).optional(),
});

// Types
export type ExamDateslotBase = z.infer<typeof examDateslotBaseSchema>;
export type CreateExamDateslotDto = z.infer<typeof createExamDateslotSchema>;
export type UpdateExamDateslotDto = z.infer<typeof updateExamDateslotSchema>;
export type ExamDateslotResponseDto = z.infer<typeof examDateslotResponseSchema>;
export type GetDateslotsByCalendarEntryDto = z.infer<typeof getDateslotsByCalendarEntrySchema>;
export type BulkCreateExamDateslotsDto = z.infer<typeof bulkCreateExamDateslotsSchema>;
export type GenerateDateslotsFromRangeDto = z.infer<typeof generateDateslotsFromRangeSchema>;


