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

/**
 * Base calendar entry schema with common fields
 */
export const BaseCalendarEntrySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  type: z.nativeEnum(CalendarEntryType),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  venue: z.string().optional(),
  holidayType: z.nativeEnum(HolidayType).optional(),
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
      return true;
    },
    {
      message: 'Holiday type is required for holidays, venue is required for events',
    }
  )
  .refine(
    (data) => {
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type CreateCalendarEntryDto = z.infer<typeof CreateCalendarEntrySchema>;

/**
 * Update calendar entry DTO
 */
export const UpdateCalendarEntrySchema = BaseCalendarEntrySchema
  .partial()
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type UpdateCalendarEntryDto = z.infer<typeof UpdateCalendarEntrySchema>;

/**
 * Calendar entry response DTO
 */
export const CalendarEntryResponseSchema = BaseCalendarEntrySchema
  .extend({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
    deletedAt: z.string().datetime().optional(),
    createdById: z.string().uuid().optional(),
    updatedById: z.string().uuid().optional(),
    deletedById: z.string().uuid().optional(),
  });

export type CalendarEntryResponseDto = z.infer<typeof CalendarEntryResponseSchema>;

/**
 * Calendar entries list query parameters
 */
export const CalendarEntriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(CalendarEntryType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2200).optional(),
  search: z.string().optional(),
});

export type CalendarEntriesQueryDto = z.infer<typeof CalendarEntriesQuerySchema>;

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

export type CalendarEntriesResponseDto = z.infer<typeof CalendarEntriesResponseSchema>;

/**
 * Bulk operations DTO
 */
export const BulkCalendarOperationSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1, 'At least one entry is required'),
  action: z.enum(['delete']),
});

export type BulkCalendarOperationDto = z.infer<typeof BulkCalendarOperationSchema>;

/**
 * Calendar import DTO (for importing events from external sources)
 */
export const CalendarImportSchema = z.object({
  source: z.enum(['ics', 'csv', 'json']),
  data: z.string(),
  overwriteExisting: z.boolean().default(false),
});

export type CalendarImportDto = z.infer<typeof CalendarImportSchema>;