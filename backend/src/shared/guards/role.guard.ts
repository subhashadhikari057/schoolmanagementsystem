// shared/auth/guards/role.guard.ts
import {
    CanActivate, ExecutionContext, ForbiddenException, Injectable,
  } from '@nestjs/common';
  
  export function hasRole(requiredRole: string): any {
    return class RoleGuard implements CanActivate {
      async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const roles = req.user?.roles || [];
  
        const hasRequired = roles.some((r) => r.role?.name === requiredRole);
        if (!hasRequired) {
          throw new ForbiddenException('You do not have permission');
        }
        return true;
      }
    };
  }
  