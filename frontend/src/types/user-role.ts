/**
 * =============================================================================
 * Simple User Role Definitions
 * =============================================================================
 * Basic user role definitions for the school management system
 * =============================================================================
 */

export enum UserRole {
  SUPER_ADMIN = 'Superadmin',
  ADMIN = 'Admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  ACCOUNTANT = 'Accountant',
}

export type { UserRole as UserRoleType };
