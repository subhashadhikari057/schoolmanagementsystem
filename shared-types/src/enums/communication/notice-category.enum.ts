/**
 * =============================================================================
 * Notice Category Enum
 * =============================================================================
 * Defines the categories for notices.
 * =============================================================================
 */

export enum NoticeCategory {
  GENERAL = "general",
  ACADEMIC = "academic",
  EXAMINATION = "examination",
  FEE = "fee",
  EVENT = "event",
  HOLIDAY = "holiday",
  MEETING = "meeting",
  ANNOUNCEMENT = "announcement",
  URGENT = "urgent",
  OTHER = "other",
}

/**
 * Display labels for notice categories
 */
export const NoticeCategoryLabels: Record<NoticeCategory, string> = {
  [NoticeCategory.GENERAL]: "General",
  [NoticeCategory.ACADEMIC]: "Academic",
  [NoticeCategory.EXAMINATION]: "Examination",
  [NoticeCategory.FEE]: "Fee",
  [NoticeCategory.EVENT]: "Event",
  [NoticeCategory.HOLIDAY]: "Holiday",
  [NoticeCategory.MEETING]: "Meeting",
  [NoticeCategory.ANNOUNCEMENT]: "Announcement",
  [NoticeCategory.URGENT]: "Urgent",
  [NoticeCategory.OTHER]: "Other",
};
