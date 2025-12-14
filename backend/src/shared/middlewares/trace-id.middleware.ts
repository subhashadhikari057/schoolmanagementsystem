// backend/src/shared/middlewares/trace-id.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware to add trace ID to requests for debugging and audit trails
 * Follows the standardized error handling requirements from Pre-Documents
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Generate a unique trace ID for this request
    const traceId = randomUUID();

    // Add trace ID to request object for use in controllers and services
    (req as any).traceId = traceId;

    // Add trace ID to response headers for client debugging
    res.setHeader('X-Trace-ID', traceId);

    // Continue to next middleware
    next();
  }
}

/**
 * Express request interface extension to include trace ID
 */
// declare module 'express-serve-static-core' {
//   interface Request {
//     traceId?: string;
//   }
// }
