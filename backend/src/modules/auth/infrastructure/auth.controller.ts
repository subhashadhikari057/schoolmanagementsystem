/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { UserFriendlyValidationPipe } from '../../../shared/pipes/user-friendly-validation.pipe';
import { AuthService } from '../application/auth.service';
import { PasswordResetService } from '../application/password-reset.service';
import {
  ForceChangePasswordDto,
  LoginDtoType,
  FlexibleRefreshTokenDto,
} from '../dto/auth.dto';
import { LoginRequestSchema } from '@sms/shared-types';
import { z } from 'zod';

// Password Reset DTOs with Zod validation
const RequestPasswordResetDto = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
});

const ResetPasswordDto = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type RequestPasswordResetDtoType = z.infer<typeof RequestPasswordResetDto>;
type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;
import { setAuthCookies, COOKIE_OPTIONS } from '../../../shared/auth/cookie';
import { verifyToken } from '../../../shared/auth/jwt.util';
import { Public } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../shared/utils/response.util';
import { AuditService } from '../../../shared/logger/audit.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 🔐 Login endpoint
   * Industry-grade centralized authentication with comprehensive validation
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new UserFriendlyValidationPipe(LoginRequestSchema))
    credentials: LoginDtoType,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const traceId = req.headers['x-trace-id'] as string;

    try {
      // Audit login attempt
      await this.auditService.record({
        action: 'LOGIN_ATTEMPT',
        status: 'PENDING',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
        details: { identifier: credentials.identifier },
      });

      const result = await this.authService.login(credentials, ip, userAgent);

      // Handle forced password change scenario
      if ('requirePasswordChange' in result && result.requirePasswordChange) {
        await this.auditService.record({
          action: 'PASSWORD_CHANGE_REQUIRED',
          status: 'SUCCESS',
          module: 'AUTH',
          ipAddress: ip,
          userAgent,
          traceId,
          userId: result.userInfo?.id,
        });

        return res.status(HttpStatus.OK).json(
          createSuccessResponse(
            {
              message: result.message,
              requirePasswordChange: true,
              tempToken: result.tempToken,
              userInfo: result.userInfo,
            },
            'Password change required',
          ),
        );
      }

      // Normal login success
      const { accessToken, refreshToken, user } = result as {
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          fullName: string;
          email: string;
          roles: string[];
          isActive: boolean;
        };
      };

      // Set HTTP-only cookies for backward compatibility
      setAuthCookies(res, accessToken, refreshToken);

      // Audit successful login
      await this.auditService.record({
        action: 'LOGIN_SUCCESS',
        status: 'SUCCESS',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
        userId: user.id,
      });

      // Return standardized response with tokens in body
      return res.status(HttpStatus.OK).json(
        createSuccessResponse(
          {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 900, // 15 minutes
            token_type: 'Bearer',
            user: {
              id: user.id,
              full_name: user.fullName,
              email: user.email,
              role: (user.roles[0] as any)?.role?.name || 'STUDENT',
              status: user.isActive ? 'ACTIVE' : 'INACTIVE',
            },
          },
          'Login successful',
        ),
      );
    } catch (error) {
      // Check if it's a validation error (should not happen here since ZodValidationPipe handles it)
      // or an authentication error
      const errorMessage = (error as Error).message || '';
      const isAuthError =
        errorMessage.includes('Invalid credentials') ||
        errorMessage.includes('User not found') ||
        errorMessage.includes('Incorrect password') ||
        errorMessage.includes('Account disabled') ||
        errorMessage.includes('Account locked');

      // Audit failed login
      await this.auditService.record({
        action: 'LOGIN_FAILED',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
        details: {
          identifier: credentials.identifier,
          error: errorMessage,
        },
      });

      // Return appropriate error based on error type
      if (isAuthError) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json(
            createErrorResponse(
              'AUTHENTICATION_FAILED',
              errorMessage || 'Invalid credentials or account disabled',
              HttpStatus.UNAUTHORIZED,
              traceId,
            ),
          );
      } else {
        // For other errors (like validation), return the original error
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              'VALIDATION_ERROR',
              errorMessage || 'Request validation failed',
              HttpStatus.BAD_REQUEST,
              traceId,
            ),
          );
      }
    }
  }

  /**
   * 🔄 Token refresh endpoint
   * Industry-grade token rotation with comprehensive security
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(FlexibleRefreshTokenDto))
    tokenData: { refresh_token?: string },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    // Support both body and cookie refresh tokens for backward compatibility
    const refreshToken = tokenData.refresh_token || req.cookies?.refreshToken;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const traceId = req.headers['x-trace-id'] as string;

    if (!refreshToken) {
      await this.auditService.record({
        action: 'TOKEN_REFRESH_FAILED',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
        details: { reason: 'Missing refresh token' },
      });

      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(
          createErrorResponse(
            'MISSING_REFRESH_TOKEN',
            'Refresh token is required',
            HttpStatus.UNAUTHORIZED,
            traceId,
          ),
        );
    }

    try {
      const tokens = await this.authService.refresh(
        refreshToken,
        ip,
        userAgent,
      );
      const { accessToken, refreshToken: newRefreshToken } = tokens;

      // Set HTTP-only cookies for backward compatibility
      setAuthCookies(res, accessToken, newRefreshToken);

      // Audit successful token refresh
      await this.auditService.record({
        action: 'TOKEN_REFRESH_SUCCESS',
        status: 'SUCCESS',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
      });

      return res.status(HttpStatus.OK).json(
        createSuccessResponse(
          {
            access_token: accessToken,
            refresh_token: newRefreshToken,
            expires_in: 900, // 15 minutes
            token_type: 'Bearer',
          },
          'Token refreshed successfully',
        ),
      );
    } catch (error) {
      await this.auditService.record({
        action: 'TOKEN_REFRESH_FAILED',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
        details: { error: error.message },
      });

      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(
          createErrorResponse(
            'TOKEN_REFRESH_FAILED',
            'Failed to refresh token',
            HttpStatus.UNAUTHORIZED,
            traceId,
          ),
        );
    }
  }

  /**
   * 🚪 Secure logout endpoint
   * Comprehensive session invalidation with audit logging
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const refreshToken = req.cookies?.refreshToken;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const traceId = req.headers['x-trace-id'] as string;

    if (!refreshToken) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            'MISSING_REFRESH_TOKEN',
            'Missing refresh token',
            HttpStatus.BAD_REQUEST,
            traceId,
          ),
        );
    }

    try {
      const decoded = verifyToken(refreshToken) as any;
      if (!decoded?.sessionId) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              'INVALID_REFRESH_TOKEN',
              'Invalid refresh token',
              HttpStatus.BAD_REQUEST,
              traceId,
            ),
          );
      }

      // Revoke session
      await this.authService.logout(decoded.sessionId as string, ip, userAgent);

      // Clear HTTP-only cookies
      res.clearCookie('accessToken', COOKIE_OPTIONS.accessToken);
      res.clearCookie('refreshToken', COOKIE_OPTIONS.refreshToken);

      // Audit successful logout
      await this.auditService.record({
        action: 'LOGOUT_SUCCESS',
        status: 'SUCCESS',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
        userId: decoded.userId,
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createSuccessResponse(
            { logged_out_sessions: 1 },
            'Logged out successfully',
          ),
        );
    } catch (error) {
      await this.auditService.record({
        action: 'LOGOUT_FAILED',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
        details: { error: error.message },
      });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            'LOGOUT_FAILED',
            'Failed to logout',
            HttpStatus.INTERNAL_SERVER_ERROR,
            traceId,
          ),
        );
    }
  }

  /**
   * 👤 Get current user profile
   * Returns authenticated user information and permissions
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: any, @Req() req: Request) {
    const traceId = req.headers['x-trace-id'] as string;

    try {
      return createSuccessResponse(
        {
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          phone: user.phone || null,
          role: user.roles[0]?.role?.name || 'STUDENT',
          status: user.isActive ? 'ACTIVE' : 'INACTIVE',
          permissions: user.permissions || [],
          last_login: user.lastLoginAt,
          profile_complete: !!(user.fullName && user.email),
        },
        'Profile retrieved successfully',
      );
    } catch {
      return createErrorResponse(
        'PROFILE_FETCH_FAILED',
        'Failed to retrieve user profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
        traceId,
      );
    }
  }

  /**
   * 🔄 Force password change endpoint
   * Secure password change for users with temporary tokens
   */
  @Public()
  @Post('change-password-forced')
  @HttpCode(HttpStatus.OK)
  async forceChangePassword(
    @Body(new ZodValidationPipe(ForceChangePasswordDto)) passwordData: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const traceId = req.headers['x-trace-id'] as string;

    try {
      const result = await this.authService.forceChangePassword(
        passwordData,
        ip,
        userAgent,
      );

      await this.auditService.record({
        action: 'FORCED_PASSWORD_CHANGE',
        status: 'SUCCESS',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
      });

      return createSuccessResponse({ success: result.success }, result.message);
    } catch (error) {
      await this.auditService.record({
        action: 'FORCED_PASSWORD_CHANGE_FAILED',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        traceId,
        details: { error: error.message },
      });

      return createErrorResponse(
        'PASSWORD_CHANGE_FAILED',
        'Failed to change password',
        HttpStatus.BAD_REQUEST,
        traceId,
      );
    }
  }

  /**
   * 🔄 Request password reset endpoint
   * Role-based password reset: Admins/Teachers get OTP, Students/Parents contact admin
   */
  @Public()
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body(new ZodValidationPipe(RequestPasswordResetDto))
    body: RequestPasswordResetDtoType,
    @Req() req: Request,
  ) {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.passwordResetService.requestPasswordReset(
      body,
      ip,
      userAgent,
    );

    if (result.requiresAdminContact) {
      return createErrorResponse(
        result.message,
        'CONTACT_ADMIN_REQUIRED',
        HttpStatus.FORBIDDEN,
      );
    }

    return createSuccessResponse(
      { message: result.message },
      'Password reset request processed',
    );
  }

  /**
   * 🔑 Reset password endpoint
   * Complete password reset using token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordDto)) body: ResetPasswordDtoType,
    @Req() req: Request,
  ) {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.passwordResetService.resetPassword(
      body,
      ip,
      userAgent,
    );

    return createSuccessResponse(
      { message: result.message },
      'Password reset completed',
    );
  }
}
