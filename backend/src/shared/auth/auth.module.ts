/**
 * =============================================================================
 * Authentication Module
 * =============================================================================
 * Centralized module for authentication guards, decorators, and middleware.
 * Provides all authentication-related services and utilities.
 * =============================================================================
 */

import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../decorators/roles.decorator';
import { SessionValidationMiddleware } from '../middlewares/session-validation.middleware';
import { CsrfMiddleware } from '../middlewares/csrf.middleware';
import { CsrfController } from './csrf.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../logger/audit.module';

@Global()
@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CsrfController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    SessionValidationMiddleware,
    CsrfMiddleware,
    // Apply JWT guard globally to all routes
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply roles guard globally after JWT guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    SessionValidationMiddleware,
    CsrfMiddleware,
  ],
})
export class AuthGuardModule {}
