import * as jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.validation';

let privateKey: string;
let publicKey: string;

function loadKeysFromEnv() {
  if (!privateKey || !publicKey) {
    const privBase64 = env.JWT_PRIVATE_KEY_BASE64;
    const pubBase64 = env.JWT_PUBLIC_KEY_BASE64;

    privateKey = Buffer.from(privBase64, 'base64').toString('utf-8');
    publicKey = Buffer.from(pubBase64, 'base64').toString('utf-8');
  }
}

export function signAccessToken(
  payload: object,
  options: SignOptions = {},
): string {
  loadKeysFromEnv();
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    ...options,
  });
}

export function signRefreshToken(
  payload: object,
  options: SignOptions = {},
): string {
  loadKeysFromEnv();
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    ...options,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    loadKeysFromEnv();
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as JwtPayload;
  } catch {
    return null;
  }
}

// ✅ Temp token functions for force password change
export function signTempToken(payload: { userId: string; purpose: string }, options: SignOptions = {}): string {
  loadKeysFromEnv();
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '30m', // Short-lived for security
    issuer: 'school-management',
    audience: 'temp-action',
    ...options,
  });
}

export function verifyTempToken(token: string): { userId: string; purpose: string } | null {
  try {
    loadKeysFromEnv();
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'school-management',
      audience: 'temp-action',
    }) as JwtPayload;
    
    if (decoded.userId && decoded.purpose) {
      return {
        userId: decoded.userId as string,
        purpose: decoded.purpose as string,
      };
    }
    return null;
  } catch {
    return null;
  }
}
