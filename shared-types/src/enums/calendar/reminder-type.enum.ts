/**
 * =============================================================================
 * Reminder Type Enum
 * =============================================================================
 * Defines the types of reminders that can be added to the calendar.
 * =============================================================================
 */

export enum ReminderType {
  EXAM = 'EXAM',
  FEE_DEADLINE = 'FEE_DEADLINE',
  ASSIGNMENT = 'ASSIGNMENT',
  MEETING = 'MEETING',
  ADMISSION = 'ADMISSION',
  OTHER = 'OTHER',
}

/**
 * Display labels for reminder types
 */
export const ReminderTypeLabels: Record<ReminderType, string> = {
  [ReminderType.EXAM]: 'Exam',
  [ReminderType.FEE_DEADLINE]: 'Fee Deadline',
  [ReminderType.ASSIGNMENT]: 'Assignment Due',
  [ReminderType.MEETING]: 'Meeting',
  [ReminderType.ADMISSION]: 'Admission',
  [ReminderType.OTHER]: 'Other',
};

/**
 * Type guard to check if a value is a valid ReminderType
 */
export function isReminderType(value: any): value is ReminderType {
  return Object.values(ReminderType).includes(value);
}
