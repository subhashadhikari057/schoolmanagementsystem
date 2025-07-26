import { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

// 👇 Type-safe "sameSite" value
const sameSite = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';

export const COOKIE_OPTIONS = {
  accessToken: {
    httpOnly: true,
    secure: isProd,
    sameSite,
    maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) || 15 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
  refreshToken: {
    httpOnly: true,
    secure: isProd,
    sameSite,
    maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) || 7 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
};

/**
 * ✅ Helper to apply cookies in controller
 */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('accessToken', accessToken, COOKIE_OPTIONS.accessToken);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS.refreshToken);
}
