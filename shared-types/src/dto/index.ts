/**
 * =============================================================================
 * Shared DTOs - School Management System
 * =============================================================================
 * This file exports all Data Transfer Objects (DTOs) used across the application.
 * DTOs define the structure of data exchanged between frontend and backend.
 * =============================================================================
 */

// Common/Base DTOs
export * from "./common/base.dto";
export * from "./common/pagination.dto";
export * from "./common/response.dto";

// Auth Module DTOs
export * from "./auth/login.dto";
export * from "./auth/register.dto";
export * from "./auth/password-reset.dto";
export * from "./auth/session.dto";

// User Module DTOs
export * from "./user/user.dto";
export * from "./user/profile.dto";

// Calendar DTOs
export * from "./calendar/calendar.dto";

// Student Module DTOs
export * from "./student/student.dto";

// Teacher Module DTOs
export * from "./teacher/teacher.dto";
export * from "./staff/staff.dto";

// Parent Module DTOs
export * from "./parent/parent.dto";

// Academic Module DTOs
export * from "./academic/assignment.dto";
export * from "./academic/submission.dto";
export * from "./academic/class-subject.dto";

// Schedule Module DTOs
export * from "./schedule/timeslot.dto";
export * from "./schedule/schedule.dto";
export * from "./schedule/timetable.dto";

// Attendance Module DTOs
export * from "./attendance/attendance.dto";
export * from "./attendance/leave-request.dto";

// Finance Module DTOs
export * from "./finance/payment.dto";
export * from "./finance/invoice.dto";
export * from "./finance/fee.dto";

// Communication Module DTOs
export * from "./communication/notice.dto";
export * from "./communication/message.dto";
export * from "./communication/complaint.dto";

// Exam Module DTOs
export * from "./exam/exam.dto";
export * from "./exam/result.dto";

// Files Module DTOs
export * from "./files/file-upload.dto";

// Platform Module DTOs
export * from "./platform/feature-flag.dto";

// Configuration Module DTOs
export * from "./configuration/configuration.dto";

// Forum Module DTOs
export * from "./forum/forum.dto";

// Achievements Module DTOs
export * from "./achievements/achievement.dto";
export * from "./achievements/certificate.dto";
