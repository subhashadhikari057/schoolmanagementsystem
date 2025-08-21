/**
 * =============================================================================
 * Shared Enums - School Management System
 * =============================================================================
 * This file exports all enums used across the application.
 * These enums correspond to PostgreSQL ENUM types and ensure type safety.
 * =============================================================================
 */

// Core System Enums
export * from "./core/user-status.enum";
export * from "./core/user-roles.enum";
export * from "./core/system-status.enum";

// Auth Module Enums
export * from "./auth/session-status.enum";

// Audit Module Enums
export * from "./audit/audit-action.enum";
export * from "./audit/audit-module.enum";
export * from "./audit/audit-status.enum";

// Academic Module Enums
export * from "./academic/assignment-status.enum";
export * from "./academic/submission-status.enum";

// Attendance Module Enums
export * from "./attendance/attendance-status.enum";
export * from "./attendance/leave-status.enum";
export * from "./attendance/leave-type.enum";

// Finance Module Enums
export * from "./finance/payment-status.enum";
export * from "./finance/payment-method.enum";

// Communication Module Enums
export * from "./communication/notice-status.enum";
export * from "./communication/message-status.enum";
export * from "./communication/complaint-status.enum";

// Exam Module Enums
export * from "./exam/exam-status.enum";
export * from "./exam/result-status.enum";

// Files Module Enums
export * from "./files/file-status.enum";
export * from "./files/file-type.enum";

// Forum Module Enums
export * from "./forum/moderation-status.enum";
export * from "./forum/post-status.enum";

// Platform Module Enums
export * from "./platform/feature-flag-status.enum";

// Achievements Module Enums
export * from "./achievements/achievement-type.enum";
export * from "./achievements/certificate-status.enum";

// Calendar Module Enums
export * from './calendar/calendar-entry-type.enum';
export * from './calendar/holiday-type.enum';
export * from './calendar/exam-type.enum';
export * from './calendar/reminder-type.enum';
export * from './calendar/priority.enum';

// Utility Types and Helpers
export * from "./utils/status-helpers";
export * from "./utils/validation-helpers";
