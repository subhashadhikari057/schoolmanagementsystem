/**
 * =============================================================================
 * Calendar Service
 * =============================================================================
 * Service layer for calendar operations with proper error handling and data transformation
 * =============================================================================
 */

import { httpClient } from '../client';
import {
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntryResponseDto,
  CalendarEntriesQueryDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
  CalendarEntryType,
} from '@sms/shared-types';
import { CalendarEvent } from '../../components/organisms/calendar/types/calendar.types';

// Re-export for convenience
export type { CalendarEvent };

/**
 * Calendar Service Class
 * Handles all calendar-related API operations
 */
export class CalendarService {
  private readonly baseUrl = '/api/calendar';

  /**
   * Create a new calendar entry
   */
  async createCalendarEntry(
    dto: CreateCalendarEntryDto,
  ): Promise<CalendarEntryResponseDto> {
    try {
      const response = await httpClient.post<CalendarEntryResponseDto>(
        this.baseUrl,
        dto,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create calendar entry:', error);
      throw this.handleError(error, 'Failed to create calendar entry');
    }
  }

  /**
   * Get calendar entries with filtering and pagination
   */
  async getCalendarEntries(
    query?: CalendarEntriesQueryDto,
  ): Promise<CalendarEntriesResponseDto> {
    try {
      const response = await httpClient.get<CalendarEntriesResponseDto>(
        this.baseUrl,
        query,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch calendar entries:', error);
      throw this.handleError(error, 'Failed to fetch calendar entries');
    }
  }

  /**
   * Get upcoming calendar entries
   */
  async getUpcomingEntries(limit = 10): Promise<CalendarEntryResponseDto[]> {
    try {
      const response = await httpClient.get<CalendarEntryResponseDto[]>(
        `${this.baseUrl}/upcoming`,
        { limit },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch upcoming entries:', error);
      throw this.handleError(error, 'Failed to fetch upcoming entries');
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStatistics(): Promise<{
    total: number;
    holidays: number;
    events: number;
    exams: number;
    thisMonth: number;
  }> {
    try {
      const response = await httpClient.get<{
        total: number;
        holidays: number;
        events: number;
        exams: number;
        thisMonth: number;
      }>(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch calendar statistics:', error);
      throw this.handleError(error, 'Failed to fetch calendar statistics');
    }
  }

  /**
   * Get a single calendar entry by ID
   */
  async getCalendarEntryById(id: string): Promise<CalendarEntryResponseDto> {
    try {
      const response = await httpClient.get<CalendarEntryResponseDto>(
        `${this.baseUrl}/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch calendar entry:', error);
      throw this.handleError(error, 'Failed to fetch calendar entry');
    }
  }

  /**
   * Update a calendar entry
   */
  async updateCalendarEntry(
    id: string,
    dto: UpdateCalendarEntryDto,
  ): Promise<CalendarEntryResponseDto> {
    try {
      const response = await httpClient.patch<CalendarEntryResponseDto>(
        `${this.baseUrl}/${id}`,
        dto,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update calendar entry:', error);
      throw this.handleError(error, 'Failed to update calendar entry');
    }
  }

  /**
   * Delete a calendar entry
   */
  async deleteCalendarEntry(id: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.delete<{ message: string }>(
        `${this.baseUrl}/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to delete calendar entry:', error);
      throw this.handleError(error, 'Failed to delete calendar entry');
    }
  }

  /**
   * Perform bulk operations on calendar entries
   */
  async bulkCalendarOperation(
    dto: BulkCalendarOperationDto,
  ): Promise<{ success: number; failed: number }> {
    try {
      const response = await httpClient.post<{
        success: number;
        failed: number;
      }>(`${this.baseUrl}/bulk`, dto);
      return response.data;
    } catch (error) {
      console.error('Failed to perform bulk operation:', error);
      throw this.handleError(error, 'Failed to perform bulk operation');
    }
  }

  /**
   * Convert API calendar entry to frontend CalendarEvent type
   */
  toCalendarEvent(entry: CalendarEntryResponseDto): CalendarEvent {
    // For holidays, don't show time; for events and exams, show proper time
    const isHoliday = entry.type.toUpperCase() === 'HOLIDAY';
    const eventTime = isHoliday
      ? '' // No time for holidays
      : new Date(entry.startDate).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

    return {
      id: entry.id,
      name: entry.name,
      title: entry.name, // Ensure title field is populated for legacy compatibility
      date: entry.startDate.split('T')[0], // Extract date part
      time: eventTime,
      type: entry.type.toLowerCase(),
      venue: entry.venue || '',
      endDate: entry.endDate ? entry.endDate.split('T')[0] : undefined,
      holidayType: entry.holidayType || undefined,
      location: entry.venue || '', // For compatibility with Event interface
      status: 'Active', // Default to active for simplified schema
      // New fields for enhanced calendar functionality
      startTime: entry.startTime || undefined,
      endTime: entry.endTime || undefined,
      examType: entry.examType || undefined,
      examDetails: entry.examDetails || undefined,
    };
  }

  /**
   * Convert frontend CalendarEvent type to API create DTO
   */
  fromCalendarEvent(
    event: Partial<CalendarEvent>,
    type: CalendarEntryType,
  ): CreateCalendarEntryDto {
    const startDate = event.date
      ? new Date(event.date + 'T' + (event.time || '00:00')).toISOString()
      : new Date().toISOString();

    const endDate = event.endDate
      ? new Date(event.endDate + 'T' + (event.time || '23:59')).toISOString()
      : startDate; // Default to same day if no end date

    return {
      name: event.name || event.title || '',
      type,
      startDate,
      endDate,
      venue: event.venue || event.location,
      // Add type-specific fields
      ...(type === CalendarEntryType.HOLIDAY && {
        holidayType: event.holidayType || 'SCHOOL',
      }),
    } as CreateCalendarEntryDto;
  }

  /**
   * Get color for calendar entry type
   */
  getTypeColor(type: CalendarEntryType): string {
    const colors = {
      [CalendarEntryType.HOLIDAY]: '#EF4444', // Red
      [CalendarEntryType.EVENT]: '#3B82F6', // Blue
      [CalendarEntryType.EXAM]: '#8B5CF6', // Purple
      [CalendarEntryType.EMERGENCY_CLOSURE]: '#DC2626', // Dark Red
    };
    return colors[type] || '#6B7280'; // Gray fallback
  }

  /**
   * Get display label for calendar entry type
   */
  getTypeLabel(type: CalendarEntryType): string {
    const labels = {
      [CalendarEntryType.HOLIDAY]: 'Holiday',
      [CalendarEntryType.EVENT]: 'Event',
      [CalendarEntryType.EXAM]: 'Exam',
      [CalendarEntryType.EMERGENCY_CLOSURE]: 'Emergency Closure',
    };
    return labels[type] || 'Unknown';
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error?.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error?.message) {
      return new Error(error.message);
    }
    return new Error(defaultMessage);
  }
}

// Create singleton instance
export const calendarService = new CalendarService();

// Re-export the original Event type for compatibility
export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Scheduled';
}
