import { z } from 'zod';

// Base schema for exam schedule validation
export const examScheduleBaseSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  name: z.string().min(1, 'Schedule name is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  status: z.string().default('draft'),
});

// Schema for creating a new exam schedule
export const createExamScheduleSchema = examScheduleBaseSchema;

// Schema for updating an existing exam schedule
export const updateExamScheduleSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
}).merge(examScheduleBaseSchema.partial());

// Schema for exam slot
export const examSlotBaseSchema = z.object({
  dateslotId: z.string().uuid('Invalid dateslot ID'),
  subjectId: z.string().uuid('Invalid subject ID').optional(),
  roomId: z.string().uuid('Invalid room ID').optional(),
  duration: z.number().int().positive().optional(),
  instructions: z.string().optional(),
});

// Schema for creating exam slots
export const createExamSlotSchema = z.object({
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
}).merge(examSlotBaseSchema);

// Schema for updating exam slots
export const updateExamSlotSchema = z.object({
  id: z.string().uuid('Invalid slot ID'),
}).merge(examSlotBaseSchema.partial());

// Schema for exam schedule response
export const examScheduleResponseSchema = z.object({
  id: z.string().uuid(),
}).merge(examScheduleBaseSchema).merge(z.object({
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  class: z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    grade: z.number(),
    section: z.string(),
  }).optional(),
  calendarEntry: z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
    examType: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),
}));

// Schema for exam slot response
export const examSlotResponseSchema = z.object({
  id: z.string().uuid(),
  examScheduleId: z.string().uuid(),
}).merge(examSlotBaseSchema).merge(z.object({
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  dateslot: z.object({
    id: z.string().uuid(),
    examDate: z.date(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    label: z.string().optional(),
  }).optional(),
  subject: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    description: z.string().optional(),
  }).optional(),
  room: z.object({
    id: z.string().uuid(),
    roomNo: z.string(),
    name: z.string().optional(),
    capacity: z.number(),
  }).optional(),
}));

// Schema for getting exam schedules by class
export const getExamSchedulesByClassSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
});

// Schema for getting exam schedules by calendar entry
export const getExamSchedulesByCalendarEntrySchema = z.object({
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
});

// Schema for getting exam slots by schedule
export const getExamSlotsByScheduleSchema = z.object({
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
});

// Schema for bulk creating exam schedules for multiple classes
export const bulkCreateExamSchedulesSchema = z.object({
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  classIds: z.array(z.string().uuid('Invalid class ID')).min(1, 'At least one class is required'),
  name: z.string().min(1, 'Schedule name is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
});

// Schema for bulk assigning subjects to exam slots
export const bulkAssignSubjectsSchema = z.object({
  examScheduleIds: z.array(z.string().uuid('Invalid exam schedule ID')).min(1, 'At least one schedule is required'),
  assignments: z.array(z.object({
    dateslotId: z.string().uuid('Invalid dateslot ID'),
    subjectId: z.string().uuid('Invalid subject ID'),
    roomId: z.string().uuid('Invalid room ID').optional(),
    duration: z.number().int().positive().optional(),
    instructions: z.string().optional(),
  })),
});

// Schema for activating an exam schedule
export const activateExamScheduleSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
});

// Schema for subject assignment to dateslot
export const assignSubjectToDateslotSchema = z.object({
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
  dateslotId: z.string().uuid('Invalid dateslot ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  roomId: z.string().uuid('Invalid room ID').optional(),
  duration: z.number().int().positive().optional(),
  instructions: z.string().optional(),
});

// Types
export type ExamScheduleBase = z.infer<typeof examScheduleBaseSchema>;
export type CreateExamScheduleDto = z.infer<typeof createExamScheduleSchema>;
export type UpdateExamScheduleDto = z.infer<typeof updateExamScheduleSchema>;
export type ExamScheduleResponseDto = z.infer<typeof examScheduleResponseSchema>;
export type GetExamSchedulesByClassDto = z.infer<typeof getExamSchedulesByClassSchema>;
export type GetExamSchedulesByCalendarEntryDto = z.infer<typeof getExamSchedulesByCalendarEntrySchema>;

export type ExamSlotBase = z.infer<typeof examSlotBaseSchema>;
export type CreateExamSlotDto = z.infer<typeof createExamSlotSchema>;
export type UpdateExamSlotDto = z.infer<typeof updateExamSlotSchema>;
export type ExamSlotResponseDto = z.infer<typeof examSlotResponseSchema>;
export type GetExamSlotsByScheduleDto = z.infer<typeof getExamSlotsByScheduleSchema>;

export type BulkCreateExamSchedulesDto = z.infer<typeof bulkCreateExamSchedulesSchema>;
export type BulkAssignSubjectsDto = z.infer<typeof bulkAssignSubjectsSchema>;
export type ActivateExamScheduleDto = z.infer<typeof activateExamScheduleSchema>;
export type AssignSubjectToDateslotDto = z.infer<typeof assignSubjectToDateslotSchema>;
