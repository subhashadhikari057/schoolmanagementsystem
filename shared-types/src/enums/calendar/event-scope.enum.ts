/**
 * =============================================================================
 * Event Scope Enum
 * =============================================================================
 * Defines whether an event affects the entire school or is partial.
 * =============================================================================
 */

export enum EventScope {
  PARTIAL = 'PARTIAL',      // Partial event - school remains open, normal attendance
  SCHOOL_WIDE = 'SCHOOL_WIDE',  // School-wide event - affects all classes, counts as holiday for attendance
}

/**
 * Display labels for event scope types
 */
export const EventScopeLabels: Record<EventScope, string> = {
  [EventScope.PARTIAL]: 'Partial Event',
  [EventScope.SCHOOL_WIDE]: 'School-wide Event',
};

/**
 * Descriptions for event scope types
 */
export const EventScopeDescriptions: Record<EventScope, string> = {
  [EventScope.PARTIAL]: 'Event affects only some classes/students. School remains open and attendance is taken normally.',
  [EventScope.SCHOOL_WIDE]: 'Event affects the entire school. School is closed and this day is excluded from attendance calculations.',
};

/**
 * Type guard to check if a value is a valid EventScope
 */
export function isEventScope(value: any): value is EventScope {
  return Object.values(EventScope).includes(value);
}
