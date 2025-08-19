/**
 * Attendance status enum 
 * MUST match the Prisma enum AttendanceStatus exactly
 */
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
  UNKNOWN = 'unknown',
}