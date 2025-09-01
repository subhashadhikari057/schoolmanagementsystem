import { z } from 'zod';
import { ExamDateslotType } from './exam-dateslot.dto';

// Enhanced exam slot for exam timetable builder
export const examTimetableSlotSchema = z.object({
  id: z.string().uuid(),
  examScheduleId: z.string().uuid(),
  dateslotId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  duration: z.number().int().positive().optional(),
  instructions: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  // Enhanced with relation data
  dateslot: z.object({
    id: z.string().uuid(),
    examDate: z.date(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    label: z.string().optional(),
    type: z.nativeEnum(ExamDateslotType),
  }).optional(),
  subject: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    description: z.string().optional(),
    maxMarks: z.number(),
    passMarks: z.number(),
  }).optional(),
  room: z.object({
    id: z.string().uuid(),
    roomNo: z.string(),
    name: z.string().optional(),
    capacity: z.number(),
    floor: z.number(),
    building: z.string().optional(),
  }).optional(),
});

// Schema for bulk exam timetable operations
export const bulkExamTimetableOperationSchema = z.object({
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
  operations: z.array(z.object({
    action: z.enum(['create', 'update', 'delete']),
    slotData: z.object({
      id: z.string().uuid().optional(), // Required for update/delete
      dateslotId: z.string().uuid(),
      subjectId: z.string().uuid().optional(),
      roomId: z.string().uuid().optional(),
      duration: z.number().int().positive().optional(),
      instructions: z.string().optional(),
    }),
  })),
});

// Schema for getting complete exam timetable
export const getExamTimetableSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  examScheduleId: z.string().uuid('Invalid exam schedule ID').optional(),
});

// Schema for exam timetable validation
export const validateExamTimetableSchema = z.object({
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
  checkCompleteness: z.boolean().default(true),
});

// Schema for subject assignment to dateslot
export const assignSubjectToExamDateslotSchema = z.object({
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
  dateslotId: z.string().uuid('Invalid dateslot ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  roomId: z.string().uuid('Invalid room ID').optional(),
  duration: z.number().int().positive().optional(),
  instructions: z.string().optional(),
});

// Schema for removing subject from dateslot
export const removeSubjectFromDateslotSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID'),
});

// Schema for copying exam timetable to other classes
export const copyExamTimetableSchema = z.object({
  sourceExamScheduleId: z.string().uuid('Invalid source exam schedule ID'),
  targetClassIds: z.array(z.string().uuid('Invalid class ID')).min(1, 'At least one target class is required'),
  copySubjects: z.boolean().default(true),
  copyRooms: z.boolean().default(false),
  copyInstructions: z.boolean().default(true),
});

// Schema for exam timetable summary
export const examTimetableSummarySchema = z.object({
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
  totalSlots: z.number(),
  assignedSlots: z.number(),
  unassignedSlots: z.number(),
  subjects: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    assignedSlots: z.number(),
  })),
      dateslots: z.array(z.object({
      id: z.string().uuid(),
      examDate: z.date(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      label: z.string().optional(),
      type: z.nativeEnum(ExamDateslotType),
      assignedSubjects: z.number(),
    })),
});

// Types
export type ExamTimetableSlotDto = z.infer<typeof examTimetableSlotSchema>;
export type BulkExamTimetableOperationDto = z.infer<typeof bulkExamTimetableOperationSchema>;
export type GetExamTimetableDto = z.infer<typeof getExamTimetableSchema>;
export type ValidateExamTimetableDto = z.infer<typeof validateExamTimetableSchema>;
export type AssignSubjectToExamDateslotDto = z.infer<typeof assignSubjectToExamDateslotSchema>;
export type RemoveSubjectFromDateslotDto = z.infer<typeof removeSubjectFromDateslotSchema>;
export type CopyExamTimetableDto = z.infer<typeof copyExamTimetableSchema>;
export type ExamTimetableSummaryDto = z.infer<typeof examTimetableSummarySchema>;
