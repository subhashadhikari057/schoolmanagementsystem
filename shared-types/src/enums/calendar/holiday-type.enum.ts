/**
 * =============================================================================
 * Holiday Type Enum
 * =============================================================================
 * Defines the types of holidays that can be added to the calendar.
 * =============================================================================
 */

export enum HolidayType {
  NATIONAL = 'NATIONAL',
  SCHOOL = 'SCHOOL',
}

/**
 * Display labels for holiday types
 */
export const HolidayTypeLabels: Record<HolidayType, string> = {
  [HolidayType.NATIONAL]: 'National Holiday',
  [HolidayType.SCHOOL]: 'School Holiday',
};

/**
 * Type guard to check if a value is a valid HolidayType
 */
export function isHolidayType(value: any): value is HolidayType {
  return Object.values(HolidayType).includes(value);
}
