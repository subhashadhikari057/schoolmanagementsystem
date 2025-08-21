/**
 * Audit Status Enum
 * Defines the status/outcome of audited actions
 */
export enum AuditStatus {
  // Successful operations
  SUCCESS = "SUCCESS",
  COMPLETED = "COMPLETED",

  // Failed operations
  FAILURE = "FAILURE",
  ERROR = "ERROR",

  // Security-related statuses
  BLOCKED = "BLOCKED",
  DENIED = "DENIED",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Process statuses
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  CANCELLED = "CANCELLED",

  // Alert statuses
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
  SUSPICIOUS = "SUSPICIOUS",

  // System statuses
  TIMEOUT = "TIMEOUT",
  RETRY = "RETRY",
  SKIPPED = "SKIPPED",
}
