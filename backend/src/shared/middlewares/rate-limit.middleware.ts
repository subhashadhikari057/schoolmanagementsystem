// backend/src/shared/middleware/rate-limit.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * AuthRateLimiter applies rate limiting for any route it's attached to.
 * Currently configured to allow 10 requests per minute per IP.
 */
@Injectable()
export class AuthRateLimiter implements NestMiddleware {
  private limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests to auth endpoints. Please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  use(req: Request, res: Response, next: NextFunction): void {
    this.limiter(req, res, next);
  }
}
