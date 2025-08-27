/**
 * =============================================================================
 * Calendar Types
 * =============================================================================
 * Local type definitions for calendar components
 * =============================================================================
 */

import {
  CalendarEntryType,
  HolidayType,
  ExamType,
  EmergencyClosureType,
  EventScope,
  CalendarEntryResponseDto,
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntriesQueryDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
} from '@sms/shared-types';

// Re-export shared types for convenience
export type {
  CalendarEntryResponseDto,
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntriesQueryDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
};

export {
  CalendarEntryType,
  HolidayType,
  ExamType,
  EmergencyClosureType,
  EventScope,
};

// Local calendar event interface (compatible with existing Event type)
export interface CalendarEvent {
  id: string;
  name: string;
  title?: string; // For backward compatibility - should match name
  date: string;
  time: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Scheduled';
  type?: string;
  venue?: string;
  endDate?: string;
  holidayType?: string;
  startTime?: string;
  endTime?: string;
  examType?: string;
  examDetails?: string;
}

// Form data interface for event creation
export interface EventFormData {
  name: string;
  type: CalendarEntryType;
  eventScope?: EventScope;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  holidayType?: HolidayType;
  examType?: ExamType;
  examDetails?: string;
  emergencyClosureType?: EmergencyClosureType;
  emergencyReason?: string;
  affectedAreas?: string;
}

// Modal props interface
export interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  initialDate?: string;
}

// Calendar props interface
export interface AcademicCalendarProps {
  title?: string;
  subtitle?: string;
  showExportButton?: boolean;
  showActionButtons?: boolean;
  events?: CalendarEvent[];
  className?: string;
}

// Calendar management props
export interface CalendarManagementProps {
  className?: string;
}
