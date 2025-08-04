/**
 * =============================================================================
 * User Roles Enum
 * =============================================================================
 * Defines all user roles in the School Management System.
 * Corresponds to PostgreSQL ENUM: auth.user_role_enum
 * =============================================================================
 */

/**
 * User roles in the School Management System
 * @enum {string}
 */
export enum UserRole {
  /** System super administrator with full access */
  SUPER_ADMIN = 'SUPER_ADMIN',
  
  /** School administrator with management access */
  ADMIN = 'ADMIN',
  
  /** School accountant with financial access */
  ACCOUNTANT = 'ACCOUNTANT',
  
  /** Teacher with class and subject management access */
  TEACHER = 'TEACHER',
  
  /** Student with limited access to their own data */
  STUDENT = 'STUDENT',
  
  /** Parent with access to their children's data */
  PARENT = 'PARENT',
  
  /** Staff member with limited administrative access */
  STAFF = 'STAFF',
}

/**
 * Array of all user roles for validation and iteration
 */
export const USER_ROLES = Object.values(UserRole);

/**
 * Type representing any valid user role
 */
export type UserRoleType = `${UserRole}`;

/**
 * Role hierarchy levels (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.ACCOUNTANT]: 60,
  [UserRole.TEACHER]: 40,
  [UserRole.STAFF]: 30,
  [UserRole.PARENT]: 20,
  [UserRole.STUDENT]: 10,
};

/**
 * Check if a role has higher or equal permissions than another role
 * @param userRole - The user's role
 * @param requiredRole - The required role level
 * @returns True if user has sufficient permissions
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all roles that have lower permissions than the given role
 * @param role - The role to compare against
 * @returns Array of roles with lower permissions
 */
export function getLowerRoles(role: UserRole): UserRole[] {
  const roleLevel = ROLE_HIERARCHY[role];
  return USER_ROLES.filter(r => ROLE_HIERARCHY[r] < roleLevel);
}

/**
 * Get all roles that have higher permissions than the given role
 * @param role - The role to compare against
 * @returns Array of roles with higher permissions
 */
export function getHigherRoles(role: UserRole): UserRole[] {
  const roleLevel = ROLE_HIERARCHY[role];
  return USER_ROLES.filter(r => ROLE_HIERARCHY[r] > roleLevel);
}