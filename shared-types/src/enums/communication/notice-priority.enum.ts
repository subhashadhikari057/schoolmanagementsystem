/**
 * =============================================================================
 * Notice Priority Enum
 * =============================================================================
 * Defines the priority levels for notices.
 * =============================================================================
 */

export enum NoticePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * Display labels for notice priorities
 */
export const NoticePriorityLabels: Record<NoticePriority, string> = {
  [NoticePriority.LOW]: "Low",
  [NoticePriority.MEDIUM]: "Medium",
  [NoticePriority.HIGH]: "High",
  [NoticePriority.URGENT]: "Urgent",
};

/**
 * Priority colors for UI
 */
export const NoticePriorityColors: Record<NoticePriority, string> = {
  [NoticePriority.LOW]: "#10B981", // green
  [NoticePriority.MEDIUM]: "#F59E0B", // yellow
  [NoticePriority.HIGH]: "#EF4444", // red
  [NoticePriority.URGENT]: "#DC2626", // dark red
};
