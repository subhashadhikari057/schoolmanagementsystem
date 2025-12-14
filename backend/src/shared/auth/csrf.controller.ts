/**
 * =============================================================================
 * CSRF Controller
 * =============================================================================
 * Controller for CSRF token generation and validation
 * =============================================================================
 */

import {
  Controller,
  Get,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { Public } from '../guards/jwt-auth.guard';

@Controller('api/v1/csrf')
export class CsrfController {
  /**
   * Generate a new CSRF token and send it to the client
   * This endpoint is public to allow token generation before authentication
   */
  @Public()
  @Get('token')
  @HttpCode(HttpStatus.OK)
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    try {
      // Generate CSRF token using csurf middleware function
      // The middleware attaches csrfToken() function to the request
      const token =
        typeof (req as any).csrfToken === 'function'
          ? (req as any).csrfToken()
          : randomBytes(32).toString('hex');

      // Return the token to the client
      return res.status(200).json({
        token: token,
      });
    } catch (error) {
      // Log the error for debugging
      // eslint-disable-next-line no-console
      console.error('CSRF Token generation failed:', error);

      return res.status(500).json({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to generate CSRF token',
      });
    }
  }
}
