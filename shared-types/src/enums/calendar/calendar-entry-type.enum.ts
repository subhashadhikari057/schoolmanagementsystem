/**
 * =============================================================================
 * Calendar Entry Type Enum
 * =============================================================================
 * Defines the types of calendar entries available in the system.
 * =============================================================================
 */

export enum CalendarEntryType {
  HOLIDAY = "HOLIDAY",
  EVENT = "EVENT",
}

/**
 * Display labels for calendar entry types
 */
export const CalendarEntryTypeLabels: Record<CalendarEntryType, string> = {
  [CalendarEntryType.HOLIDAY]: "Holiday",
  [CalendarEntryType.EVENT]: "Event",
};

/**
 * Type guard to check if a value is a valid CalendarEntryType
 */
export function isCalendarEntryType(value: any): value is CalendarEntryType {
  return Object.values(CalendarEntryType).includes(value);
}
