import * as jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from 'dotenv';

config();

let privateKey: string;
let publicKey: string;

function loadKeysFromEnv() {
  if (!privateKey || !publicKey) {
    const privBase64 = process.env.JWT_PRIVATE_KEY_BASE64 || '';
    const pubBase64 = process.env.JWT_PUBLIC_KEY_BASE64 || '';

    if (!privBase64 || !pubBase64) {
      throw new Error('🔐 JWT keys missing in environment variables');
    }

    privateKey = Buffer.from(privBase64, 'base64').toString('utf-8');
    publicKey = Buffer.from(pubBase64, 'base64').toString('utf-8');
  }
}

export function signAccessToken(payload: object, options: SignOptions = {}): string {
  loadKeysFromEnv();
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    ...options,
  });
}

export function signRefreshToken(payload: object, options: SignOptions = {}): string {
  loadKeysFromEnv();
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ...options,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    loadKeysFromEnv();
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
  } catch {
    return null;
  }
}
