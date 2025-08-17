/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthError } from '../../../shared/error-handling/auth-error.util';
import { AuthService } from '../application/auth.service';
import {
  LoginDto,
  ForceChangePasswordDto,
  ChangePasswordDto,
} from '../dto/auth.dto';
import { setAuthCookies, COOKIE_OPTIONS } from '../../../shared/auth/cookie';
import { verifyToken } from '../../../shared/auth/jwt.util';
import { Public } from '../../../shared/guards/jwt-auth.guard';

@Controller('api/v1/auth') // ✅ Route prefix with global prefix api/v1
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 🔐 Login endpoint
   * Issues access & refresh tokens as HTTP-only cookies
   * Logs user login via audit logger inside AuthService
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const ip: string = req.ip || 'unknown';
    const userAgent: string = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.login(body, ip, userAgent);

    // ✅ Check if password change is required
    if ('requirePasswordChange' in result && result.requirePasswordChange) {
      return res.status(200).json({
        message: result.message,
        requirePasswordChange: true,
        tempToken: result.tempToken,
        userInfo: result.userInfo,
      });
    }

    // ✅ Normal login - set cookies in browser
    // TypeScript now knows result has accessToken and refreshToken
    const { accessToken, refreshToken } = result as {
      accessToken: string;
      refreshToken: string;
    };
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({ message: 'Login successful' });
  }

  /**
   * 🔁 Refresh token endpoint
   * Rotates token pair and reissues new cookies
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const refreshToken: string | undefined = req.cookies?.refreshToken;
    const ip: string = req.ip || 'unknown';
    const userAgent: string = req.headers['user-agent'] || 'unknown';

    if (!refreshToken) {
      return res
        .status(401)
        .json(AuthError.unauthorized('Missing refresh token'));
    }

    try {
      const tokens = await this.authService.refresh(
        refreshToken,
        ip,
        userAgent,
      );
      const { accessToken, refreshToken: newRefreshToken } = tokens;

      // ✅ Set new cookies
      setAuthCookies(res, accessToken, newRefreshToken);

      return res.status(200).json({
        message: 'Token refreshed successfully',
        success: true,
      });
    } catch (error) {
      // Handle specific error types
      if (error instanceof UnauthorizedException) {
        return res.status(401).json(
          AuthError.tokenExpired({
            message: 'Your session has expired. Please log in again.',
          }),
        );
      } else if (error instanceof ForbiddenException) {
        return res.status(403).json(AuthError.tokenReuseDetected());
      }

      // Generic error fallback
      return res.status(401).json(
        AuthError.refreshFailed({
          message: 'Failed to refresh your session. Please log in again.',
        }),
      );
    }
  }

  /**
   * 🚪 Logout endpoint
   * Revokes session, clears cookies, logs out user
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const refreshToken: string | undefined = req.cookies?.refreshToken;
    const ip: string = req.ip || 'unknown';
    const userAgent: string = req.headers['user-agent'] || 'unknown';

    // If no refresh token, just clear cookies and return success
    // This allows logout to work even if the token is expired
    if (!refreshToken) {
      // ❌ Clear cookies
      res.clearCookie('accessToken', COOKIE_OPTIONS.accessToken);
      res.clearCookie('refreshToken', COOKIE_OPTIONS.refreshToken);

      return res.status(200).json({
        message: 'Logged out successfully',
        success: true,
      });
    }

    try {
      const decoded = verifyToken(refreshToken) as any;
      if (decoded?.sessionId) {
        // ✅ Revoke session
        await this.authService.logout(
          decoded.sessionId as string,
          ip,
          userAgent,
        );
      }
    } catch (error) {
      // Even if session revocation fails, we still want to clear cookies
      // Just log the error but don't fail the logout
      console.error('Error revoking session during logout:', error);
    } finally {
      // ❌ Always clear cookies, even if session revocation fails
      res.clearCookie('accessToken', COOKIE_OPTIONS.accessToken);
      res.clearCookie('refreshToken', COOKIE_OPTIONS.refreshToken);
    }

    return res.status(200).json({
      message: 'Logged out successfully',
      success: true,
    });
  }

  /**
   * 👤 Get current user information
   * Protected endpoint that returns current user data
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Req() req: Request): Promise<any> {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.authService.getCurrentUser(userId as string);
    return user;
  }

  /**
   * 🔄 Force password change endpoint
   * Allows users to change password when required after login with temp token
   */
  @Public()
  @Post('change-password-forced')
  @HttpCode(HttpStatus.OK)
  async forceChangePassword(
    @Body() body: ForceChangePasswordDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.forceChangePassword(
      body,
      ip,
      userAgent,
    );

    return {
      message: result.message,
      success: result.success,
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: Request,
    @Body() body: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    await this.authService.changePassword({ ...body, userId });
    return { message: 'Password changed successfully' };
  }
}
