/**
 * =============================================================================
 * Type Guards
 * =============================================================================
 * Utility functions for runtime type checking.
 * =============================================================================
 */

import { UserRole } from '../enums/core/user-roles.enum';
import { UserStatus } from '../enums/core/user-status.enum';

/**
 * Check if a value is a valid user role
 */
export function isUserRole(value: any): value is UserRole {
  return Object.values(UserRole).includes(value);
}

/**
 * Check if a value is a valid user status
 */
export function isUserStatus(value: any): value is UserStatus {
  return Object.values(UserStatus).includes(value);
}

/**
 * Check if a value is a valid UUID
 */
export function isUuid(value: any): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if a value is a valid email
 */
export function isEmail(value: any): value is string {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if a value is a valid phone number
 */
export function isPhoneNumber(value: any): value is string {
  if (typeof value !== 'string') return false;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(value);
}