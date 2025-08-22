import { z } from 'zod';
import { TimeslotType } from '../schedule/timeslot.dto';

// Enhanced schedule slot for timetable builder
export const timetableSlotSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  timeslotId: z.string().uuid(),
  day: z.string(),
  subjectId: z.string().uuid().nullable(),
  teacherId: z.string().uuid().nullable(),
  roomId: z.string().uuid().nullable(),
  type: z.nativeEnum(TimeslotType),
  hasConflict: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  // Enhanced with relation data
  timeslot: z.object({
    id: z.string().uuid(),
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    type: z.nativeEnum(TimeslotType),
    label: z.string().nullable(),
  }).optional(),
  subject: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    description: z.string().nullable(),
  }).nullable().optional(),
  teacher: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    employeeId: z.string().nullable(),
    designation: z.string(),
    user: z.object({
      id: z.string().uuid(),
      fullName: z.string(),
      email: z.string(),
    }),
  }).nullable().optional(),
  room: z.object({
    id: z.string().uuid(),
    roomNo: z.string(),
    name: z.string().nullable(),
    capacity: z.number(),
    floor: z.number(),
    building: z.string().nullable(),
  }).nullable().optional(),
});

// Schema for bulk timetable operations
export const bulkTimetableOperationSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
  operations: z.array(z.object({
    action: z.enum(['create', 'update', 'delete']),
    slotData: z.object({
      id: z.string().uuid().optional(), // Required for update/delete
      timeslotId: z.string().uuid(),
      day: z.string(),
      subjectId: z.string().uuid().nullable(),
      teacherId: z.string().uuid().nullable(),
      roomId: z.string().uuid().nullable(),
      type: z.nativeEnum(TimeslotType).default(TimeslotType.REGULAR),
    }),
  })),
});

// Schema for getting complete timetable
export const getTimetableSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  scheduleId: z.string().uuid('Invalid schedule ID').optional(),
  includeConflicts: z.boolean().default(true),
});

// Schema for timetable validation
export const validateTimetableSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
  checkConflicts: z.boolean().default(true),
  checkCompleteness: z.boolean().default(true),
});

// Schema for subject assignment to timeslot
export const assignSubjectToTimeslotSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
  timeslotId: z.string().uuid('Invalid timeslot ID'),
  day: z.string().min(1, 'Day is required'),
  subjectId: z.string().uuid('Invalid subject ID'),
});

// Schema for teacher assignment to slot
export const assignTeacherToSlotSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID'),
  teacherId: z.string().uuid('Invalid teacher ID'),
});

// Types
export type TimetableSlotDto = z.infer<typeof timetableSlotSchema>;
export type BulkTimetableOperationDto = z.infer<typeof bulkTimetableOperationSchema>;
export type GetTimetableDto = z.infer<typeof getTimetableSchema>;
export type ValidateTimetableDto = z.infer<typeof validateTimetableSchema>;
export type AssignSubjectToTimeslotDto = z.infer<typeof assignSubjectToTimeslotSchema>;
export type AssignTeacherToSlotDto = z.infer<typeof assignTeacherToSlotSchema>;
