import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Role-based access guard that supports multiple roles.
 * Usage: @UseGuards(IsAuthenticated, hasRole('ADMIN', 'SUPERADMIN'))
 */
export function hasRole(...requiredRoles: string[]): any {
  return class RoleGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest();
      const userRoles = req.user?.roles || [];

      // Check if any user role matches one of the allowed roles
      const isAuthorized = userRoles.some((r) =>
        requiredRoles.includes(r.role?.name),
      );

      if (!isAuthorized) {
        throw new ForbiddenException('You do not have permission');
      }

      return true;
    }
  };
}
