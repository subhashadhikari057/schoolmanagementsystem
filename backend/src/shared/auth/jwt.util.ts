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
