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
import { LoginDto } from '../dto/auth.dto';
import { setAuthCookies, COOKIE_OPTIONS } from '../../../shared/auth/cookie';
import { verifyToken } from '../../../shared/auth/jwt.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 🔐 Login endpoint: issues tokens via cookies
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const ip: string = req.ip || 'unknown';
    const userAgent: string = req.headers['user-agent'] || 'unknown';

    const { accessToken, refreshToken } = await this.authService.login(
      body,
      ip,
      userAgent,
    );

    // ✅ Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({ message: 'Login successful' });
  }

  /**
   * 🔁 Refresh endpoint: rotates token pair via cookies
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const refreshToken: string | undefined = req.cookies?.refreshToken;
    const ip: string = req.ip || 'unknown';
    const userAgent: string = req.headers['user-agent'] || 'unknown';

    if (!refreshToken) {
      return res.status(401).json({ message: 'Missing refresh token' });
    }

    const tokens = await this.authService.refresh(refreshToken, ip, userAgent);
    const { accessToken, refreshToken: newRefreshToken } = tokens;

    // ✅ Set new cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    return res.status(200).json({ message: 'Token refreshed successfully' });
  }

  /**
   * 🚪 Logout endpoint: revokes session + clears cookies
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const refreshToken: string | undefined = req.cookies?.refreshToken;
    const ip: string = req.ip || 'unknown';
    const userAgent: string = req.headers['user-agent'] || 'unknown';

    if (!refreshToken) {
      return res.status(400).json({ message: 'Missing refresh token' });
    }

    const decoded = verifyToken(refreshToken) as any;
    if (!decoded?.sessionId) {
      return res.status(400).json({ message: 'Invalid refresh token' });
    }

    // ✅ Revoke session
    await this.authService.logout(decoded.sessionId as string, ip, userAgent);

    // ❌ Clear cookies
    res.clearCookie('accessToken', COOKIE_OPTIONS.accessToken);
    res.clearCookie('refreshToken', COOKIE_OPTIONS.refreshToken);

    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
