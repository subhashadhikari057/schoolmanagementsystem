/**
 * =============================================================================
 * Session Validation Middleware
 * =============================================================================
 * Middleware to validate user sessions and handle session-related security.
 * Provides additional security layer beyond JWT validation.
 * =============================================================================
 */

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../logger/audit.service';
import type { AuthenticatedUser } from '../guards/jwt-auth.guard';

// Extend Express Request to include user
declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

/**
 * Session validation configuration
 */
export interface SessionValidationConfig {
  /** Maximum session idle time in minutes */
  maxIdleTime: number;
  /** Whether to update last activity on each request */
  updateLastActivity: boolean;
  /** Whether to validate IP address consistency */
  validateIpAddress: boolean;
  /** Whether to validate user agent consistency */
  validateUserAgent: boolean;
}

/**
 * Default session validation configuration
 */
const DEFAULT_CONFIG: SessionValidationConfig = {
  maxIdleTime: 30, // 30 minutes
  updateLastActivity: true,
  validateIpAddress: false, // Disabled by default due to proxy/NAT issues
  validateUserAgent: true,
};

@Injectable()
export class SessionValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SessionValidationMiddleware.name);
  private readonly config: SessionValidationConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.config = { ...DEFAULT_CONFIG };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Skip validation for public routes or if no user is attached
    if (!req.user) {
      return next();
    }

    try {
      await this.validateSession(req);
      next();
    } catch (error) {
      this.logger.warn(`Session validation failed: ${error.message}`, {
        userId: req.user.id,
        sessionId: req.user.sessionId,
        ip: this.getClientIp(req),
        userAgent: req.get('User-Agent'),
        endpoint: req.url,
      });

      // Record security event
      await this.recordSecurityEvent(req, error.message);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Session validation failed');
    }
  }

  /**
   * Validate the current session
   */
  private async validateSession(req: Request): Promise<void> {
    const user = req.user!;
    const currentIp = this.getClientIp(req);
    const currentUserAgent = req.get('User-Agent') || '';

    // Get session from database
    const session = await this.prisma.userSession.findUnique({
      where: { id: user.sessionId },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    // Check session idle timeout
    if (this.isSessionExpired(session.lastActivityAt)) {
      await this.revokeSession(session.id, 'Session expired due to inactivity');
      throw new UnauthorizedException('Session expired due to inactivity');
    }

    // Validate IP address if enabled
    if (this.config.validateIpAddress && session.ipAddress !== currentIp) {
      await this.revokeSession(session.id, 'IP address mismatch detected');
      throw new UnauthorizedException(
        'Session security violation: IP address mismatch',
      );
    }

    // Validate user agent if enabled
    if (
      this.config.validateUserAgent &&
      session.userAgent !== currentUserAgent
    ) {
      // Log suspicious activity but don't block (user agent can change legitimately)
      this.logger.warn('User agent mismatch detected', {
        userId: user.id,
        sessionId: session.id,
        originalUserAgent: session.userAgent,
        currentUserAgent,
      });
    }

    // Update last activity if enabled
    if (this.config.updateLastActivity) {
      await this.updateSessionActivity(session.id, currentIp);
    }
  }

  /**
   * Check if session has expired due to inactivity
   */
  private isSessionExpired(lastActivityAt: Date | null): boolean {
    if (!lastActivityAt) {
      return false; // No last activity recorded, consider valid
    }

    const maxIdleMs = this.config.maxIdleTime * 60 * 1000;
    const timeSinceLastActivity = Date.now() - lastActivityAt.getTime();

    return timeSinceLastActivity > maxIdleMs;
  }

  /**
   * Update session last activity timestamp
   */
  private async updateSessionActivity(
    sessionId: string,
    ipAddress: string,
  ): Promise<void> {
    try {
      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: {
          lastActivityAt: new Date(),
          ipAddress, // Update IP in case user moved networks
        },
      });
    } catch (error) {
      this.logger.error('Failed to update session activity', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Revoke a session
   */
  private async revokeSession(
    sessionId: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
          // revokeReason: reason, // Field doesn't exist in schema
        },
      });
    } catch (error) {
      this.logger.error('Failed to revoke session', error);
    }
  }

  /**
   * Record security event for audit trail
   */
  private async recordSecurityEvent(
    req: Request,
    reason: string,
  ): Promise<void> {
    try {
      await this.auditService.record({
        action: 'SESSION_SECURITY_VIOLATION',
        status: 'FAIL',
        module: 'AUTH',
        userId: req.user?.id,
        ipAddress: this.getClientIp(req),
        userAgent: req.get('User-Agent'),
        details: {
          reason,
          endpoint: req.url,
          method: req.method,
          sessionId: req.user?.sessionId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to record security event', error);
    }
  }

  /**
   * Extract client IP address
   */
  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    const remoteAddress =
      req.connection?.remoteAddress || req.socket?.remoteAddress;

    return (
      (forwardedFor && forwardedFor.split(',')[0]) ||
      realIp ||
      remoteAddress ||
      'unknown'
    );
  }
}

// Factory function removed to avoid TypeScript export issues
// Use SessionValidationMiddleware directly with constructor config parameter
