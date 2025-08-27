/**
 * =============================================================================
 * Calendar Management DTOs
 * =============================================================================
 * Data Transfer Objects for calendar management operations.
 * =============================================================================
 */

import { z } from 'zod';
import { CalendarEntryType } from '../../enums/calendar/calendar-entry-type.enum';
import { HolidayType } from '../../enums/calendar/holiday-type.enum';
import { ExamType } from '../../enums/calendar/exam-type.enum';
import { EmergencyClosureType } from '../../enums/calendar/emergency-closure-type.enum';
import { EventScope } from '../../enums/calendar/event-scope.enum';

/**
 * Base calendar entry schema with common fields
 */
export const BaseCalendarEntrySchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  type: z.nativeEnum(CalendarEntryType),
  eventScope: z.nativeEnum(EventScope).optional(), // Whether event is partial or school-wide
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
  venue: z.string().optional(),
  holidayType: z.nativeEnum(HolidayType).optional(),
  // Time fields for events and exams only
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  // Exam-specific fields
  examType: z.nativeEnum(ExamType).optional(),
  examDetails: z.string().optional(),
  // Emergency closure specific fields
  emergencyClosureType: z.nativeEnum(EmergencyClosureType).optional(),
  emergencyReason: z.string().optional(),
  affectedAreas: z.string().optional(), // JSON string for areas affected
});

/**
 * Create calendar entry DTO
 */
export const CreateCalendarEntrySchema = BaseCalendarEntrySchema
  .refine(
    (data) => {
      if (data.type === CalendarEntryType.HOLIDAY && !data.holidayType) {
        return false;
      }
      if (data.type === CalendarEntryType.EVENT && !data.venue) {
        return false;
      }
      if (data.type === CalendarEntryType.EVENT && !data.eventScope) {
        return false;
      }
      if (data.type === CalendarEntryType.EXAM && !data.examType) {
        return false;
      }
      if (data.type === CalendarEntryType.EMERGENCY_CLOSURE && !data.emergencyClosureType) {
        return false;
      }
      return true;
    },
    {
      message: 'Holiday type is required for holidays, venue and event scope are required for events, exam type is required for exams, emergency closure type is required for emergency closures',
    }
  )
  .refine(
    (data) => {
      // Time fields should only be present for events and exams
      if ((data.type === CalendarEntryType.HOLIDAY || data.type === CalendarEntryType.EMERGENCY_CLOSURE) && (data.startTime || data.endTime)) {
        return false;
      }
      return true;
    },
    {
      message: 'Time fields are not allowed for holidays and emergency closures',
      path: ['startTime', 'endTime'],
    }
  )
  .refine(
    (data) => {
      // If both times are provided, end time should be after start time
      if (data.startTime && data.endTime) {
        const startTime = new Date(`2000-01-01T${data.startTime}:00`);
        const endTime = new Date(`2000-01-01T${data.endTime}:00`);
        return endTime > startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type CreateCalendarEntryDto = z.infer<typeof CreateCalendarEntrySchema>;

/**
 * Update calendar entry DTO
 */
export const UpdateCalendarEntrySchema =
  BaseCalendarEntrySchema.partial().refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export type UpdateCalendarEntryDto = z.infer<typeof UpdateCalendarEntrySchema>;

/**
 * Calendar entry response DTO
 */
export const CalendarEntryResponseSchema = BaseCalendarEntrySchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().optional(),
  createdById: z.string().uuid().optional(),
  updatedById: z.string().uuid().optional(),
  deletedById: z.string().uuid().optional(),
});

export type CalendarEntryResponseDto = z.infer<
  typeof CalendarEntryResponseSchema
>;

/**
 * Calendar entries list query parameters
 */
export const CalendarEntriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(CalendarEntryType).optional(),
  examType: z.nativeEnum(ExamType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2200).optional(),
  search: z.string().optional(),
});

export type CalendarEntriesQueryDto = z.infer<
  typeof CalendarEntriesQuerySchema
>;

/**
 * Calendar entries response DTO
 */
export const CalendarEntriesResponseSchema = z.object({
  entries: z.array(CalendarEntryResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export type CalendarEntriesResponseDto = z.infer<
  typeof CalendarEntriesResponseSchema
>;

/**
 * Bulk operations DTO
 */
export const BulkCalendarOperationSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1, "At least one entry is required"),
  action: z.enum(["delete"]),
});

export type BulkCalendarOperationDto = z.infer<
  typeof BulkCalendarOperationSchema
>;

/**
 * Calendar import DTO (for importing events from external sources)
 */
export const CalendarImportSchema = z.object({
  source: z.enum(["ics", "csv", "json"]),
  data: z.string(),
  overwriteExisting: z.boolean().default(false),
});

export type CalendarImportDto = z.infer<typeof CalendarImportSchema>;
