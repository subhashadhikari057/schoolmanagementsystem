/**
 * =============================================================================
 * Calendar API Client (Legacy)
 * =============================================================================
 * Legacy API client functions for calendar management
 * Use calendarService from services/calendar.service.ts instead
 * =============================================================================
 */

import { calendarService, CalendarEvent } from './services/calendar.service';
import {
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntryResponseDto,
  CalendarEntriesQueryDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
  CalendarEntryType,
} from '@sms/shared-types';

/**
 * Calendar API endpoints (Legacy - use calendarService instead)
 * @deprecated Use calendarService from services/calendar.service.ts
 */
export const calendarApi = {
  /**
   * Create a new calendar entry
   * @deprecated Use calendarService.createCalendarEntry()
   */
  async create(dto: CreateCalendarEntryDto): Promise<CalendarEntryResponseDto> {
    return calendarService.createCalendarEntry(dto);
  },

  /**
   * Get calendar entries with filtering and pagination
   * @deprecated Use calendarService.getCalendarEntries()
   */
  async getAll(
    query?: CalendarEntriesQueryDto,
  ): Promise<CalendarEntriesResponseDto> {
    return calendarService.getCalendarEntries(query);
  },

  /**
   * Get upcoming calendar entries
   * @deprecated Use calendarService.getUpcomingEntries()
   */
  async getUpcoming(limit?: number): Promise<CalendarEntryResponseDto[]> {
    return calendarService.getUpcomingEntries(limit);
  },

  /**
   * Get calendar statistics
   * @deprecated Use calendarService.getCalendarStatistics()
   */
  async getStatistics(): Promise<{
    total: number;
    holidays: number;
    events: number;
    exams: number;
    thisMonth: number;
  }> {
    return calendarService.getCalendarStatistics();
  },

  /**
   * Get a single calendar entry by ID
   * @deprecated Use calendarService.getCalendarEntryById()
   */
  async getById(id: string): Promise<CalendarEntryResponseDto> {
    return calendarService.getCalendarEntryById(id);
  },

  /**
   * Update a calendar entry
   * @deprecated Use calendarService.updateCalendarEntry()
   */
  async update(
    id: string,
    dto: UpdateCalendarEntryDto,
  ): Promise<CalendarEntryResponseDto> {
    return calendarService.updateCalendarEntry(id, dto);
  },

  /**
   * Delete a calendar entry
   * @deprecated Use calendarService.deleteCalendarEntry()
   */
  async delete(id: string): Promise<{ message: string }> {
    return calendarService.deleteCalendarEntry(id);
  },

  /**
   * Bulk operations on calendar entries
   * @deprecated Use calendarService.bulkCalendarOperation()
   */
  async bulkOperation(
    dto: BulkCalendarOperationDto,
  ): Promise<{ success: number; failed: number }> {
    return calendarService.bulkCalendarOperation(dto);
  },
};

/**
 * Helper functions for calendar data transformation (Legacy)
 * @deprecated Use calendarService methods instead
 */
export const calendarHelpers = {
  /**
   * Convert API calendar entry to frontend CalendarEvent type
   * @deprecated Use calendarService.toCalendarEvent()
   */
  toCalendarEvent(entry: CalendarEntryResponseDto): CalendarEvent {
    return calendarService.toCalendarEvent(entry);
  },

  /**
   * Convert frontend CalendarEvent type to API create DTO
   * @deprecated Use calendarService.fromCalendarEvent()
   */
  fromCalendarEvent(
    event: Partial<CalendarEvent>,
    type: CalendarEntryType,
  ): CreateCalendarEntryDto {
    return calendarService.fromCalendarEvent(event, type);
  },

  /**
   * Get color for calendar entry type
   * @deprecated Use calendarService.getTypeColor()
   */
  getTypeColor(type: CalendarEntryType): string {
    return calendarService.getTypeColor(type);
  },

  /**
   * Get display label for calendar entry type
   * @deprecated Use calendarService.getTypeLabel()
   */
  getTypeLabel(type: CalendarEntryType): string {
    return calendarService.getTypeLabel(type);
  },
};

// Re-export types from calendar service for backward compatibility
export type { CalendarEvent, Event } from './services/calendar.service';
