/**
 * =============================================================================
 * User Roles Enum Tests
 * =============================================================================
 * Comprehensive test suite for UserRole enum and related utilities.
 * =============================================================================
 */

import {
  UserRole,
  USER_ROLES,
  ROLE_HIERARCHY,
  hasRolePermission,
  getLowerRoles,
  getHigherRoles,
} from "../../enums/core/user-roles.enum";

describe("UserRole Enum", () => {
  describe("Enum Values", () => {
    test("should have all expected role values", () => {
      expect(UserRole.SUPER_ADMIN).toBe("SUPER_ADMIN");
      expect(UserRole.ADMIN).toBe("ADMIN");
      expect(UserRole.ACCOUNTANT).toBe("ACCOUNTANT");
      expect(UserRole.TEACHER).toBe("TEACHER");
      expect(UserRole.STUDENT).toBe("STUDENT");
      expect(UserRole.PARENT).toBe("PARENT");
    });

    test("should export USER_ROLES array with all values", () => {
      expect(USER_ROLES).toEqual([
        "SUPER_ADMIN",
        "ADMIN",
        "ACCOUNTANT",
        "TEACHER",
        "STUDENT",
        "PARENT",
        "STAFF",
      ]);
      expect(USER_ROLES).toHaveLength(7);
    });
  });

  describe("Role Hierarchy", () => {
    test("should have correct hierarchy levels", () => {
      expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toBe(100);
      expect(ROLE_HIERARCHY[UserRole.ADMIN]).toBe(80);
      expect(ROLE_HIERARCHY[UserRole.ACCOUNTANT]).toBe(60);
      expect(ROLE_HIERARCHY[UserRole.TEACHER]).toBe(40);
      expect(ROLE_HIERARCHY[UserRole.PARENT]).toBe(20);
      expect(ROLE_HIERARCHY[UserRole.STUDENT]).toBe(10);
    });

    test("should have super admin as highest level", () => {
      const superAdminLevel = ROLE_HIERARCHY[UserRole.SUPER_ADMIN];
      const otherLevels = Object.values(ROLE_HIERARCHY).filter(
        (level) => level !== superAdminLevel,
      );

      expect(otherLevels.every((level) => level < superAdminLevel)).toBe(true);
    });

    test("should have student as lowest level", () => {
      const studentLevel = ROLE_HIERARCHY[UserRole.STUDENT];
      const otherLevels = Object.values(ROLE_HIERARCHY).filter(
        (level) => level !== studentLevel,
      );

      expect(otherLevels.every((level) => level > studentLevel)).toBe(true);
    });
  });

  describe("hasRolePermission", () => {
    test("should return true when user role has higher or equal permissions", () => {
      expect(hasRolePermission(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(
        true,
      );
      expect(hasRolePermission(UserRole.ADMIN, UserRole.TEACHER)).toBe(true);
      expect(hasRolePermission(UserRole.TEACHER, UserRole.TEACHER)).toBe(true);
    });

    test("should return false when user role has lower permissions", () => {
      expect(hasRolePermission(UserRole.STUDENT, UserRole.TEACHER)).toBe(false);
      expect(hasRolePermission(UserRole.PARENT, UserRole.ADMIN)).toBe(false);
      expect(hasRolePermission(UserRole.TEACHER, UserRole.SUPER_ADMIN)).toBe(
        false,
      );
    });
  });

  describe("getLowerRoles", () => {
    test("should return all roles with lower permissions", () => {
      const lowerThanAdmin = getLowerRoles(UserRole.ADMIN);
      expect(lowerThanAdmin).toContain(UserRole.ACCOUNTANT);
      expect(lowerThanAdmin).toContain(UserRole.TEACHER);
      expect(lowerThanAdmin).toContain(UserRole.PARENT);
      expect(lowerThanAdmin).toContain(UserRole.STUDENT);
      expect(lowerThanAdmin).toHaveLength(4);
    });

    test("should return empty array for lowest role", () => {
      const lowerThanStudent = getLowerRoles(UserRole.STUDENT);
      expect(lowerThanStudent).toEqual([]);
    });

    test("should return all roles except super admin for admin", () => {
      const lowerThanSuperAdmin = getLowerRoles(UserRole.SUPER_ADMIN);
      expect(lowerThanSuperAdmin).toHaveLength(5);
      expect(lowerThanSuperAdmin).not.toContain(UserRole.SUPER_ADMIN);
    });
  });

  describe("getHigherRoles", () => {
    test("should return all roles with higher permissions", () => {
      const higherThanTeacher = getHigherRoles(UserRole.TEACHER);
      expect(higherThanTeacher).toContain(UserRole.SUPER_ADMIN);
      expect(higherThanTeacher).toContain(UserRole.ADMIN);
      expect(higherThanTeacher).toContain(UserRole.ACCOUNTANT);
      expect(higherThanTeacher).toHaveLength(3);
    });

    test("should return empty array for highest role", () => {
      const higherThanSuperAdmin = getHigherRoles(UserRole.SUPER_ADMIN);
      expect(higherThanSuperAdmin).toEqual([]);
    });

    test("should return all roles except student for student", () => {
      const higherThanStudent = getHigherRoles(UserRole.STUDENT);
      expect(higherThanStudent).toHaveLength(5);
      expect(higherThanStudent).not.toContain(UserRole.STUDENT);
    });
  });
});
