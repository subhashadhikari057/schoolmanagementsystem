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
    // The CSRF middleware automatically adds the csrfToken function to the request
    const csrfToken = (req as any).csrfToken?.();

    if (!csrfToken) {
      return res.status(500).json({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to generate CSRF token',
      });
    }

    // Return the token to the client
    return res.status(200).json({
      token: csrfToken,
    });
  }
}
