/**
 * =============================================================================
 * Calendar DTOs  
 * =============================================================================
 * Data Transfer Objects for calendar and event management.
 * =============================================================================
 */

import { z } from 'zod';
import { BaseEntity, UuidSchema } from '../common/base.dto';

/**
 * Event type enum
 */
export enum EventType {
  HOLIDAY = 'holiday',
  EXAM = 'exam', 
  MEETING = 'meeting',
  CLASS = 'class',
  ACTIVITY = 'activity',
  OTHER = 'other',
}

/**
 * Event status enum
 */
export enum EventStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Calendar event DTO
 */
export interface CalendarEventDto extends BaseEntity {
  /** Event title */
  title: string;
  /** Event description */
  description?: string;
  /** Event type */
  type: EventType;
  /** Event status */
  status: EventStatus;
  /** Start date and time */
  start_date: Date;
  /** End date and time */
  end_date: Date;
  /** Is all day event */
  all_day: boolean;
  /** Location */
  location?: string;
  /** Organizer user ID */
  organizer_id: string;
  /** Attendee user IDs */
  attendee_ids?: string[];
}

/**
 * Create calendar event DTO
 */
export interface CreateCalendarEventDto {
  /** Event title */
  title: string;
  /** Event description */
  description?: string;
  /** Event type */
  type: EventType;
  /** Start date and time */
  start_date: Date;
  /** End date and time */
  end_date: Date;
  /** Is all day event */
  all_day?: boolean;
  /** Location */
  location?: string;
  /** Attendee user IDs */
  attendee_ids?: string[];
}

/**
 * Update calendar event DTO
 */
export interface UpdateCalendarEventDto {
  /** Event title */
  title?: string;
  /** Event description */
  description?: string;
  /** Event type */
  type?: EventType;
  /** Event status */
  status?: EventStatus;
  /** Start date and time */
  start_date?: Date;
  /** End date and time */
  end_date?: Date;
  /** Is all day event */
  all_day?: boolean;
  /** Location */
  location?: string;
  /** Attendee user IDs */
  attendee_ids?: string[];
}

/**
 * Zod schemas
 */
export const EventTypeSchema = z.nativeEnum(EventType);
export const EventStatusSchema = z.nativeEnum(EventStatus);

export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: EventTypeSchema,
  start_date: z.date(),
  end_date: z.date(),
  all_day: z.boolean().default(false),
  location: z.string().optional(),
  attendee_ids: z.array(UuidSchema).optional(),
});

export const UpdateCalendarEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: EventTypeSchema.optional(),
  status: EventStatusSchema.optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  all_day: z.boolean().optional(),
  location: z.string().optional(),
  attendee_ids: z.array(UuidSchema).optional(),
});

/**
 * Type inference
 */
export type CreateCalendarEventType = z.infer<typeof CreateCalendarEventSchema>;
export type UpdateCalendarEventType = z.infer<typeof UpdateCalendarEventSchema>;