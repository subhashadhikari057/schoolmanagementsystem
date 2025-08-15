import { Response } from 'express';
import { env } from '../config/env.validation';

const isProd = env.NODE_ENV === 'production';

export const COOKIE_OPTIONS = {
  accessToken: {
    httpOnly: true,
    secure: isProd,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: env.ACCESS_TOKEN_EXPIRES_IN,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/api', // Restrict to API paths only
  },
  refreshToken: {
    httpOnly: true,
    secure: isProd,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/api/v1/auth', // Restrict to auth endpoints only for better security
  },
};

/**
 * ✅ Helper to apply cookies in controller
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie('accessToken', accessToken, COOKIE_OPTIONS.accessToken);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS.refreshToken);
}
