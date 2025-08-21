/**
 * =============================================================================
 * Notice Recipient Type Enum
 * =============================================================================
 * Defines the types of recipients for notices.
 * =============================================================================
 */

export enum NoticeRecipientType {
  ALL = "all",
  STUDENT = "student",
  PARENT = "parent",
  TEACHER = "teacher",
  STAFF = "staff",
  CLASS = "class",
}

/**
 * Display labels for notice recipient types
 */
export const NoticeRecipientTypeLabels: Record<NoticeRecipientType, string> = {
  [NoticeRecipientType.ALL]: "All",
  [NoticeRecipientType.STUDENT]: "Student",
  [NoticeRecipientType.PARENT]: "Parent",
  [NoticeRecipientType.TEACHER]: "Teacher",
  [NoticeRecipientType.STAFF]: "Staff",
  [NoticeRecipientType.CLASS]: "Class",
};
