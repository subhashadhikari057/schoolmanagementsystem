/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../application/auth.service';
import { LoginDto, ForceChangePasswordDto } from '../dto/auth.dto';
import { setAuthCookies, COOKIE_OPTIONS } from '../../../shared/auth/cookie';
import { verifyToken } from '../../../shared/auth/jwt.util';

@Controller('api/auth') // ✅ Traditional route prefix (no RouterModule)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 🔐 Login endpoint
   * Issues access & refresh tokens as HTTP-only cookies
   * Logs user login via audit logger inside AuthService
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.login(
      body,
      ip,
      userAgent,
    );

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
    const { accessToken, refreshToken } = result as { accessToken: string; refreshToken: string };
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({ message: 'Login successful' });
  }

  /**
   * 🔁 Refresh token endpoint
   * Rotates token pair and reissues new cookies
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!refreshToken) {
      return res.status(401).json({ message: 'Missing refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken, ip, userAgent);

    // ✅ Set new cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    return res.status(200).json({ message: 'Token refreshed successfully' });
  }

  /**
   * 🚪 Logout endpoint
   * Revokes session, clears cookies, logs out user
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!refreshToken) {
      return res.status(400).json({ message: 'Missing refresh token' });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded?.sessionId) {
      return res.status(400).json({ message: 'Invalid refresh token' });
    }

    // ✅ Revoke session and log it
    await this.authService.logout(decoded.sessionId, ip, userAgent);

    // ❌ Clear cookies
    res.clearCookie('accessToken', COOKIE_OPTIONS.accessToken);
    res.clearCookie('refreshToken', COOKIE_OPTIONS.refreshToken);

    return res.status(200).json({ message: 'Logged out successfully' });
  }

  /**
   * 🔄 Force password change endpoint
   * Allows users to change password when required after login with temp token
   */
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
}
