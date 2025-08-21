/**
 * =============================================================================
 * Exam Type Enum
 * =============================================================================
 * Defines the types of exams that can be added to the calendar.
 * =============================================================================
 */

export enum ExamType {
  FIRST_TERM = 'FIRST_TERM',
  SECOND_TERM = 'SECOND_TERM',
  THIRD_TERM = 'THIRD_TERM',
  FINAL = 'FINAL',
  UNIT_TEST = 'UNIT_TEST',
  OTHER = 'OTHER',
}

/**
 * Display labels for exam types
 */
export const ExamTypeLabels: Record<ExamType, string> = {
  [ExamType.FIRST_TERM]: 'First Term',
  [ExamType.SECOND_TERM]: 'Second Term',
  [ExamType.THIRD_TERM]: 'Third Term',
  [ExamType.FINAL]: 'Final',
  [ExamType.UNIT_TEST]: 'Unit Test',
  [ExamType.OTHER]: 'Other',
};

/**
 * Type guard to check if a value is a valid ExamType
 */
export function isExamType(value: any): value is ExamType {
  return Object.values(ExamType).includes(value);
}
