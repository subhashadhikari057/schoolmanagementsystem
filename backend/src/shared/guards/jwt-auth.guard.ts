/**
 * =============================================================================
 * JWT Authentication Guard
 * =============================================================================
 * Protects routes by validating JWT access tokens and attaching user data
 * to the request object for downstream use.
 * =============================================================================
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core/services';
import { Request } from 'express';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { verifyToken } from '../auth/jwt.util';
import { UserRole } from '@sms/shared-types';

/**
 * JWT payload structure expected from tokens
 */
export interface JwtPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

/**
 * User data attached to request after successful authentication
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
  isActive: boolean;
}

/**
 * Extend Express Request to include authenticated user
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

/**
 * Metadata key for marking routes as public (no authentication required)
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public (bypasses JWT authentication)
 */
export const Public =
  () =>
  (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor && key) {
      Reflector.createDecorator<boolean>({ key: IS_PUBLIC_KEY })(true)(
        target,
        key,
        descriptor,
      );
    }
  };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      // Verify JWT token
      const payload = verifyToken(token) as JwtPayload;
      if (!payload || !payload.userId || !payload.sessionId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Validate session and get user data
      const user = await this.validateSession(
        payload.userId,
        payload.sessionId,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid session or user not found');
      }

      // Attach user to request for downstream use
      request.user = user;

      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`, {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        endpoint: request.url,
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract JWT token from Authorization header or cookies
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    // First try Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ') ?? [];
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    // Fallback to cookies (for compatibility with cookie-based auth)
    const accessToken = request.cookies?.accessToken;
    return accessToken || undefined;
  }

  /**
   * Validate session and retrieve user data
   */
  private async validateSession(
    userId: string,
    sessionId: string,
  ): Promise<AuthenticatedUser | null> {
    try {
      // Check session validity
      const session = await this.prisma.userSession.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            include: {
              roles: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!session || session.revokedAt || session.userId !== userId) {
        return null;
      }

      const user = session.user;
      if (!user || !user.isActive) {
        return null;
      }

      // Get primary role (assuming single role per user for now)
      const primaryRole = user.roles[0]?.role?.name as UserRole;
      if (!primaryRole) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: primaryRole,
        sessionId: session.id,
        isActive: user.isActive,
      };
    } catch (error) {
      this.logger.error('Session validation failed', error);
      return null;
    }
  }
}
