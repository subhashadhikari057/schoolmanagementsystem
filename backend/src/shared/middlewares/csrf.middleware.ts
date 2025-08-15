/**
 * =============================================================================
 * CSRF Protection Middleware
 * =============================================================================
 * Middleware to protect against Cross-Site Request Forgery attacks
 * =============================================================================
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';
import { env } from '../config/env.validation';

/**
 * CSRF Protection Middleware
 *
 * Provides protection against Cross-Site Request Forgery attacks
 * by requiring a token for all mutation requests (POST, PUT, DELETE, PATCH)
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  private readonly csrfProtection: any;

  constructor() {
    // Configure CSRF protection
    this.csrfProtection = csurf({
      cookie: {
        key: '_csrf', // Name of the cookie
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.COOKIE_SAME_SITE,
        path: '/',
        maxAge: 86400, // 24 hours
      },
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Only apply to mutation methods
      value: (req: Request) => this.extractCsrfToken(req), // Custom function to extract token
    });
  }

  /**
   * Apply CSRF protection middleware
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Skip CSRF for authentication endpoints
    if (
      req.path.startsWith('/api/v1/auth/login') ||
      req.path.startsWith('/api/v1/auth/refresh') ||
      req.path.startsWith('/api/v1/auth/logout')
    ) {
      return next();
    }

    // Special handling for CSRF token endpoint
    if (req.path === '/api/v1/csrf/token' && req.method === 'GET') {
      // For the token endpoint, we need to apply the middleware to generate the token
      // but we don't want to validate an existing token (which would create a chicken-and-egg problem)
      this.csrfProtection(req, res, next);
      return;
    }

    // Apply CSRF protection
    this.csrfProtection(req, res, (err: any) => {
      if (err) {
        this.logger.warn(`CSRF validation failed: ${err.message}`, {
          ip: req.ip,
          method: req.method,
          path: req.path,
        });

        // Return 403 Forbidden with clear error message
        return res.status(403).json({
          statusCode: 403,
          error: 'Forbidden',
          message: 'CSRF token validation failed',
          code: 'CSRF_VALIDATION_FAILED',
        });
      }

      next();
    });
  }

  /**
   * Extract CSRF token from various locations
   * Checks headers, body, and query parameters
   */
  private extractCsrfToken(req: Request): string {
    // Check for token in headers (preferred method)
    const headerToken =
      req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

    if (headerToken) {
      return Array.isArray(headerToken) ? headerToken[0] : headerToken;
    }

    // Check for token in request body
    if (req.body && req.body._csrf) {
      return req.body._csrf;
    }

    // Check for token in query parameters
    if (req.query && req.query._csrf) {
      return req.query._csrf as string;
    }

    // Return empty string instead of null to satisfy type constraint
    return '';
  }
}
