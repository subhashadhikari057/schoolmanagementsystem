// backend/src/shared/middlewares/audit.middleware.ts

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  EnhancedAuditService,
  AuditContext,
} from '../logger/enhanced-audit.service';
import {
  AuditAction,
  AuditModule,
  AuditStatus,
  UserRole,
} from '@sms/shared-types';

declare module 'express-serve-static-core' {
  interface Request {
    traceId?: string;
    startTime?: number;
    auditContext?: AuditContext;
  }
}

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditMiddleware.name);

  constructor(private readonly auditService: EnhancedAuditService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    req.startTime = startTime;

    // Build audit context from request
    const auditContext: AuditContext = {
      userId: req.user?.id,
      traceId: req.traceId,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('User-Agent'),
      endpoint: req.url,
      method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    };

    req.auditContext = auditContext;

    // Override res.end to capture response details
    const originalEnd = res.end;
    const auditService = this.auditService;
    const logger = this.logger;

    res.end = function (chunk?: any, encoding?: any, cb?: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update audit context with response details
      auditContext.statusCode = res.statusCode;
      auditContext.duration = duration;

      // Determine if this request should be audited
      if (shouldAuditRequest(req, res)) {
        setImmediate(() => {
          void auditRequest(req, res, auditContext, auditService, logger);
        });
      }

      // Call original end method
      return originalEnd.call(this, chunk, encoding, cb);
    };

    next();
  }

  private getClientIp(req: Request): string {
    const forwardedFor = req.headers?.['x-forwarded-for'] as string;
    const realIp = req.headers?.['x-real-ip'] as string;
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

/**
 * Determine if a request should be audited based on various criteria
 */
function shouldAuditRequest(req: Request, res: Response): boolean {
  const { method, url } = req;
  const { statusCode } = res;

  // Always audit authentication endpoints
  if (url.includes('/auth/')) {
    return true;
  }

  // Always audit administrative actions
  if (
    req.user?.role === UserRole.SUPER_ADMIN ||
    req.user?.role === UserRole.ADMIN
  ) {
    return true;
  }

  // Always audit write operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }

  // Always audit error responses
  if (statusCode >= 400) {
    return true;
  }

  // Audit sensitive read operations
  const sensitiveEndpoints = [
    '/users',
    '/students',
    '/teachers',
    '/grades',
    '/finance',
    '/payments',
    '/audit',
    '/config',
  ];

  if (sensitiveEndpoints.some(endpoint => url.includes(endpoint))) {
    return true;
  }

  // Skip health checks and static assets
  const skipPatterns = [
    '/health',
    '/metrics',
    '/favicon.ico',
    '/static/',
    '/assets/',
    '/_next/',
  ];

  if (skipPatterns.some(pattern => url.includes(pattern))) {
    return false;
  }

  // Default: don't audit regular read operations
  return false;
}

/**
 * Audit the request with appropriate action and module
 */
async function auditRequest(
  req: Request,
  res: Response,
  context: AuditContext,
  auditService: EnhancedAuditService,
  logger: Logger,
): Promise<void> {
  try {
    const { method, url } = req;
    const { statusCode } = res;

    // Determine audit action based on HTTP method and status
    let action: AuditAction;
    let status: AuditStatus;

    if (statusCode >= 500) {
      action = AuditAction.ERROR_OCCURRED;
      status = AuditStatus.ERROR;
    } else if (statusCode === 401) {
      action = AuditAction.UNAUTHORIZED_ACCESS;
      status = AuditStatus.FAILURE;
    } else if (statusCode === 403) {
      action = AuditAction.PERMISSION_DENIED;
      status = AuditStatus.BLOCKED;
    } else if (statusCode === 429) {
      action = AuditAction.RATE_LIMIT_EXCEEDED;
      status = AuditStatus.BLOCKED;
    } else if (statusCode >= 400) {
      action = getActionFromMethod(method);
      status = AuditStatus.FAILURE;
    } else {
      action = getActionFromMethod(method);
      status = AuditStatus.SUCCESS;
    }

    // Determine module based on URL path
    const module = getModuleFromUrl(url);

    // Extract details for audit log
    const details: Record<string, unknown> = {
      endpoint: url,
      method,
      statusCode,
      duration: context.duration,
      userAgent: context.userAgent,
    };

    // Add query parameters for GET requests
    if (method === 'GET' && req.query && Object.keys(req.query).length > 0) {
      details.queryParams = req.query;
    }

    // Add body size for write operations (but not the actual body for security)
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      details.bodySize = JSON.stringify(req.body).length;
    }

    // Record the audit log
    await auditService.record(action, module, status, context, details);
  } catch (error) {
    logger.error('Failed to audit request', error, {
      url: req.url,
      method: req.method,
      userId: req.user?.id,
      traceId: req.traceId,
    });
  }
}

/**
 * Map HTTP method to audit action
 */
function getActionFromMethod(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'GET':
      return AuditAction.READ;
    case 'POST':
      return AuditAction.CREATE;
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    default:
      return AuditAction.EXECUTE;
  }
}

/**
 * Map URL path to audit module
 */
function getModuleFromUrl(url: string): AuditModule {
  const path = url.toLowerCase();

  if (path.includes('/auth')) return AuditModule.AUTH;
  if (path.includes('/user')) return AuditModule.USER;
  if (path.includes('/student')) return AuditModule.STUDENT;
  if (path.includes('/teacher')) return AuditModule.TEACHER;
  if (path.includes('/academic') || path.includes('/assignment'))
    return AuditModule.ACADEMIC;
  if (path.includes('/exam') || path.includes('/result'))
    return AuditModule.EXAM;
  if (path.includes('/attendance')) return AuditModule.ATTENDANCE;
  if (
    path.includes('/finance') ||
    path.includes('/payment') ||
    path.includes('/fee')
  )
    return AuditModule.FINANCE;
  if (path.includes('/message') || path.includes('/communication'))
    return AuditModule.MESSAGE;
  if (path.includes('/notice')) return AuditModule.NOTICE;
  if (path.includes('/complaint')) return AuditModule.COMPLAINT;
  if (path.includes('/file') || path.includes('/upload'))
    return AuditModule.FILE;
  if (path.includes('/calendar') || path.includes('/schedule'))
    return AuditModule.CALENDAR;
  if (path.includes('/audit')) return AuditModule.AUDIT;
  if (path.includes('/config') || path.includes('/setting'))
    return AuditModule.CONFIG;
  if (path.includes('/role') || path.includes('/permission'))
    return AuditModule.ROLE;

  return AuditModule.SYSTEM;
}
