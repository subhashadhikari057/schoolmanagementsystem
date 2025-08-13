/**
 * =============================================================================
 * Calendar Management Interfaces
 * =============================================================================
 * TypeScript interfaces for calendar entities and related types.
 * =============================================================================
 */

import {
  CalendarEntryType,
  HolidayType,
  ReminderType,
  Priority,
} from '../../enums';
import { AuditInfo } from '../common/audit.interface';

/**
 * Base calendar entry interface
 */
export interface CalendarEntry extends AuditInfo {
  id: string;
  title: string;
  description?: string;
  type: CalendarEntryType;
  
  // Date and time information
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  
  // Event-specific fields
  venue?: string;
  timing?: string;
  
  // Holiday-specific fields
  holidayType?: HolidayType;
  
  // Reminder-specific fields
  reminderType?: ReminderType;
  priority: Priority;
  
  // Visibility and status
  isPublished: boolean;
  status: string;
  
  // Bikram Sambat date support
  bsYear?: number;
  bsMonth?: number;
  bsDay?: number;
  
  // Recurrence support
  isRecurring: boolean;
  recurrencePattern?: Record<string, any>;
  
  // Additional metadata
  metadata?: Record<string, any>;
  color?: string;
}

/**
 * Calendar entry with creator information
 */
export interface CalendarEntryWithCreator extends CalendarEntry {
  creator?: {
    id: string;
    fullName: string;
    email: string;
  };
}

/**
 * Calendar event statistics
 */
export interface CalendarStatistics {
  totalEntries: number;
  holidays: number;
  events: number;
  reminders: number;
  published: number;
  unpublished: number;
  thisMonth: number;
  nextMonth: number;
  upcoming: number;
}

/**
 * Calendar view configuration
 */
export interface CalendarViewConfig {
  defaultView: 'month' | 'week' | 'day' | 'agenda';
  calendarSystem: 'AD' | 'BS';
  showWeekends: boolean;
  startWeek: 'sunday' | 'monday';
  timeFormat: '12h' | '24h';
  showHolidays: boolean;
  showEvents: boolean;
  showReminders: boolean;
}

/**
 * Calendar filter options
 */
export interface CalendarFilter {
  types?: CalendarEntryType[];
  published?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  priority?: Priority[];
  holidayTypes?: HolidayType[];
  reminderTypes?: ReminderType[];
}

/**
 * Recurrence pattern interface
 */
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  daysOfWeek?: number[]; // For weekly recurrence (0=Sunday, 6=Saturday)
  dayOfMonth?: number; // For monthly recurrence
  endDate?: Date;
  occurrences?: number; // Number of occurrences
}

/**
 * Calendar entry summary for dashboard/widgets
 */
export interface CalendarEntrySummary {
  id: string;
  title: string;
  type: CalendarEntryType;
  startDate: Date;
  isAllDay: boolean;
  priority?: Priority;
  color?: string;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    entryId: string;
    error: string;
  }>;
}

/**
 * Calendar import result
 */
export interface CalendarImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: Array<{
    line?: number;
    entry?: string;
    error?: string;
    status: 'imported' | 'skipped' | 'error';
  }>;
}
