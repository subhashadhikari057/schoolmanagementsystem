/**
 * =============================================================================
 * User Decorator
 * =============================================================================
 * Provides decorators to extract authenticated user data from requests.
 * Works with JWT authentication to provide type-safe user access.
 * =============================================================================
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../guards/jwt-auth.guard';

/**
 * Extract the authenticated user from the request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@User() user: AuthenticatedUser) {
 *   return { id: user.id, email: user.email, role: user.role };
 * }
 * ```
 */
export const User = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);

/**
 * Extract only the user ID from the request
 *
 * @example
 * ```typescript
 * @Get('my-data')
 * getMyData(@UserId() userId: string) {
 *   return this.service.getUserData(userId);
 * }
 * ```
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    return user?.id || null;
  },
);

/**
 * Extract only the user role from the request
 *
 * @example
 * ```typescript
 * @Get('role-specific-data')
 * getRoleData(@UserRole() role: UserRole) {
 *   return this.service.getDataForRole(role);
 * }
 * ```
 */
export const UserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    return user?.role || null;
  },
);

/**
 * Extract the session ID from the request
 *
 * @example
 * ```typescript
 * @Post('logout')
 * logout(@SessionId() sessionId: string) {
 *   return this.authService.logout(sessionId);
 * }
 * ```
 */
export const SessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    return user?.sessionId || null;
  },
);

/**
 * Check if the current user has a specific role
 *
 * @example
 * ```typescript
 * @Get('admin-check')
 * checkAdmin(@HasRole(UserRole.ADMIN) isAdmin: boolean) {
 *   return { isAdmin };
 * }
 * ```
 */
export const HasRole = (targetRole: import('shared-types').UserRole) =>
  createParamDecorator((data: unknown, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    return user?.role === targetRole || false;
  });

/**
 * Get user email
 *
 * @example
 * ```typescript
 * @Get('email')
 * getEmail(@UserEmail() email: string) {
 *   return { email };
 * }
 * ```
 */
export const UserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    return user?.email || null;
  },
);
