/**
 * =============================================================================
 * User Status Enum
 * =============================================================================
 * Defines user account status in the School Management System.
 * Corresponds to PostgreSQL ENUM: auth.user_status_enum
 * =============================================================================
 */

/**
 * User account status
 * @enum {string}
 */
export enum UserStatus {
  /** User account is active and can access the system */
  ACTIVE = "active",

  /** User account is inactive (temporarily disabled) */
  INACTIVE = "inactive",

  /** User account is suspended (disciplinary action) */
  SUSPENDED = "suspended",

  /** User account is pending email/phone verification */
  PENDING_VERIFICATION = "pending_verification",
}

/**
 * Array of all user statuses for validation and iteration
 */
export const USER_STATUSES = Object.values(UserStatus);

/**
 * Type representing any valid user status
 */
export type UserStatusType = `${UserStatus}`;

/**
 * Status transitions - defines which status changes are allowed
 */
export const USER_STATUS_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  [UserStatus.PENDING_VERIFICATION]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
  [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
  [UserStatus.INACTIVE]: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
  [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
};

/**
 * Check if a status transition is valid
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns True if transition is allowed
 */
export function isValidStatusTransition(
  fromStatus: UserStatus,
  toStatus: UserStatus,
): boolean {
  return USER_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

/**
 * Get all valid next statuses for a given current status
 * @param currentStatus - The current user status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: UserStatus): UserStatus[] {
  return USER_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Check if user can access the system with given status
 * @param status - User status to check
 * @returns True if user can access the system
 */
export function canUserAccess(status: UserStatus): boolean {
  return status === UserStatus.ACTIVE;
}
