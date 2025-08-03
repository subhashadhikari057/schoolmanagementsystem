/**
 * =============================================================================
 * Roles Decorator & Guard
 * =============================================================================
 * Provides role-based access control through decorators and guards.
 * Works in conjunction with JWT authentication to enforce permissions.
 * =============================================================================
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole, hasRolePermission } from '@sms/shared-types';
import { AuthenticatedUser } from '../guards/jwt-auth.guard';

/**
 * Metadata key for storing required roles
 */
export const ROLES_KEY = 'roles';

/**
 * Metadata key for storing minimum role requirement
 */
export const MIN_ROLE_KEY = 'minRole';

/**
 * Decorator to specify required roles for a route
 * @param roles - Array of roles that can access the route
 *
 * @example
 * ```typescript
 * @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 * @Get('sensitive-data')
 * getSensitiveData() {
 *   return this.service.getSensitiveData();
 * }
 * ```
 */
export const Roles = (...roles: UserRole[]) => {
  return (
    target: any,
    key?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor && key) {
      Reflector.createDecorator<UserRole[]>({ key: ROLES_KEY })(roles)(
        target,
        key,
        descriptor,
      );
    }
  };
};

/**
 * Decorator to specify minimum role level required for a route
 * Uses role hierarchy to allow higher-level roles automatic access
 *
 * @param minRole - Minimum role level required
 *
 * @example
 * ```typescript
 * @MinRole(UserRole.TEACHER)
 * @Get('academic-data')
 * getAcademicData() {
 *   // Accessible by TEACHER, ADMIN, SUPER_ADMIN
 *   return this.service.getAcademicData();
 * }
 * ```
 */
export const MinRole = (minRole: UserRole) => {
  return (
    target: any,
    key?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor && key) {
      Reflector.createDecorator<UserRole>({ key: MIN_ROLE_KEY })(minRole)(
        target,
        key,
        descriptor,
      );
    }
  };
};

/**
 * Role-based authorization guard
 * Must be used after JwtAuthGuard to ensure user is authenticated
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;

    // User must be authenticated first
    if (!user) {
      throw new UnauthorizedException(
        'User must be authenticated to check roles',
      );
    }

    // Get role requirements from decorators
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const minRole = this.reflector.getAllAndOverride<UserRole>(MIN_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no role requirements, allow access
    if (!requiredRoles && !minRole) {
      return true;
    }

    const userRole = user.role;

    // Check specific roles requirement
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(userRole);
      if (!hasRequiredRole) {
        this.logger.warn(
          `Access denied: User ${user.id} with role ${userRole} attempted to access route requiring roles: ${requiredRoles.join(', ')}`,
          {
            userId: user.id,
            userRole,
            requiredRoles,
            endpoint: request.url,
            method: request.method,
          },
        );

        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Check minimum role requirement
    if (minRole) {
      const hasMinimumRole = hasRolePermission(userRole, minRole);
      if (!hasMinimumRole) {
        this.logger.warn(
          `Access denied: User ${user.id} with role ${userRole} attempted to access route requiring minimum role: ${minRole}`,
          {
            userId: user.id,
            userRole,
            minRole,
            endpoint: request.url,
            method: request.method,
          },
        );

        throw new ForbiddenException(
          `Access denied. Minimum role required: ${minRole}`,
        );
      }
    }

    return true;
  }
}

/**
 * Combined decorator for common role-based access patterns
 */
export class RoleAccess {
  /**
   * Super Admin only access
   */
  static SuperAdminOnly() {
    return Roles(UserRole.SUPER_ADMIN);
  }

  /**
   * Admin level access (Admin and Super Admin)
   */
  static AdminLevel() {
    return MinRole(UserRole.ADMIN);
  }

  /**
   * Accountant level access (Accountant, Admin, Super Admin)
   */
  static AccountantLevel() {
    return MinRole(UserRole.ACCOUNTANT);
  }

  /**
   * Teacher level access (Teacher and above)
   */
  static TeacherLevel() {
    return MinRole(UserRole.TEACHER);
  }

  /**
   * Parent level access (Parent and above, excluding Student)
   */
  static ParentLevel() {
    return MinRole(UserRole.PARENT);
  }

  /**
   * Any authenticated user
   */
  static Authenticated() {
    // No role decorator needed, just requires JWT authentication
    return (target: any, key?: string, descriptor?: PropertyDescriptor) => {};
  }

  /**
   * Financial operations (Admin, Super Admin, Accountant)
   */
  static Financial() {
    return Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT);
  }

  /**
   * Academic operations (Admin, Super Admin, Teacher)
   */
  static Academic() {
    return Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER);
  }

  /**
   * Student data access (Student can only access their own data)
   */
  static StudentSelfOnly() {
    return Roles(UserRole.STUDENT);
  }

  /**
   * Parent data access (Parent can only access their children's data)
   */
  static ParentChildrenOnly() {
    return Roles(UserRole.PARENT);
  }
}
