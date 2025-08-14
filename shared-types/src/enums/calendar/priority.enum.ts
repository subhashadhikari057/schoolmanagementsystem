/**
 * =============================================================================
 * Priority Enum
 * =============================================================================
 * Defines priority levels for calendar entries, especially reminders.
 * =============================================================================
 */

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Display labels for priority levels
 */
export const PriorityLabels: Record<Priority, string> = {
  [Priority.LOW]: 'Low',
  [Priority.MEDIUM]: 'Medium',
  [Priority.HIGH]: 'High',
  [Priority.URGENT]: 'Urgent',
};

/**
 * Color codes for priority levels (useful for UI)
 */
export const PriorityColors: Record<Priority, string> = {
  [Priority.LOW]: '#10B981', // Green
  [Priority.MEDIUM]: '#F59E0B', // Yellow
  [Priority.HIGH]: '#F97316', // Orange
  [Priority.URGENT]: '#EF4444', // Red
};

/**
 * Numeric values for priority comparison
 */
export const PriorityLevels: Record<Priority, number> = {
  [Priority.LOW]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.HIGH]: 3,
  [Priority.URGENT]: 4,
};

/**
 * Type guard to check if a value is a valid Priority
 */
export function isPriority(value: any): value is Priority {
  return Object.values(Priority).includes(value);
}
