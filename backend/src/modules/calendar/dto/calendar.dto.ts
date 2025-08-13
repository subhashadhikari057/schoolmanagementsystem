/**
 * =============================================================================
 * Calendar Module DTOs
 * =============================================================================
 * Local DTOs for the calendar module that extend shared types
 * =============================================================================
 */

// Re-export shared types for convenience
export {
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntryResponseDto,
  CalendarEntriesQueryDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
  CalendarImportDto,
  CreateCalendarEntrySchema,
  UpdateCalendarEntrySchema,
  CalendarEntryResponseSchema,
  CalendarEntriesQuerySchema,
  CalendarEntriesResponseSchema,
  BulkCalendarOperationSchema,
  CalendarImportSchema,
} from '@sms/shared-types';

export { CalendarEntryType, HolidayType } from '@sms/shared-types';
