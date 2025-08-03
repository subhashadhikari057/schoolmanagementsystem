import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { UserSession } from '@prisma/client';

export interface CachedSession {
  userId: string;
  sessionId: string;
  isActive: boolean;
  expiresAt: Date | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  lastActivityAt: Date | null;
}

@Injectable()
export class SessionCacheService {
  private readonly SESSION_PREFIX = 'session';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions';
  private readonly DEFAULT_TTL = 900; // 15 minutes

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Cache user session
   */
  async cacheSession(session: UserSession): Promise<void> {
    // Calculate if session is active based on expiration and revocation
    const isActive =
      !session.revokedAt &&
      (!session.expiresAt || session.expiresAt > new Date());

    const cachedSession: CachedSession = {
      userId: session.userId,
      sessionId: session.id,
      isActive,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastActivityAt: session.lastActivityAt,
    };

    // Cache individual session
    const sessionKey = this.getSessionKey(session.id);
    await this.cacheService.set(sessionKey, cachedSession, {
      ttl: this.DEFAULT_TTL,
    });

    // Cache user's active sessions list
    await this.cacheUserSessions(session.userId);
  }

  /**
   * Get cached session
   */
  async getSession(sessionId: string): Promise<CachedSession | null> {
    const sessionKey = this.getSessionKey(sessionId);
    return this.cacheService.get<CachedSession>(sessionKey);
  }

  /**
   * Invalidate session from cache
   */
  async invalidateSession(sessionId: string, userId?: string): Promise<void> {
    const sessionKey = this.getSessionKey(sessionId);
    await this.cacheService.del(sessionKey);

    // If userId provided, update user sessions cache
    if (userId) {
      await this.invalidateUserSessions(userId);
    }
  }

  /**
   * Cache user's active sessions
   */
  async cacheUserSessions(userId: string, sessions?: string[]): Promise<void> {
    const userSessionsKey = this.getUserSessionsKey(userId);

    if (sessions) {
      await this.cacheService.set(userSessionsKey, sessions, {
        ttl: this.DEFAULT_TTL,
      });
    } else {
      // If no sessions provided, just invalidate the cache
      // The next request will fetch fresh data from database
      await this.cacheService.del(userSessionsKey);
    }
  }

  /**
   * Get user's cached sessions
   */
  async getUserSessions(userId: string): Promise<string[] | null> {
    const userSessionsKey = this.getUserSessionsKey(userId);
    return this.cacheService.get<string[]>(userSessionsKey);
  }

  /**
   * Invalidate all user sessions from cache
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    const userSessionsKey = this.getUserSessionsKey(userId);
    await this.cacheService.del(userSessionsKey);
  }

  /**
   * Validate cached session
   */
  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    const now = new Date();
    return session.isActive && (!session.expiresAt || session.expiresAt > now);
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (session) {
      session.lastActivityAt = new Date();
      const sessionKey = this.getSessionKey(sessionId);
      await this.cacheService.set(sessionKey, session, {
        ttl: this.DEFAULT_TTL,
      });
    }
  }

  /**
   * Generate session cache key
   */
  private getSessionKey(sessionId: string): string {
    return this.cacheService.generateKey(this.SESSION_PREFIX, sessionId);
  }

  /**
   * Generate user sessions cache key
   */
  private getUserSessionsKey(userId: string): string {
    return this.cacheService.generateKey(this.USER_SESSIONS_PREFIX, userId);
  }

  /**
   * Cache authentication result temporarily
   */
  async cacheAuthResult(
    identifier: string,
    result: { success: boolean; userId?: string; attempts?: number },
    ttl: number = 300, // 5 minutes
  ): Promise<void> {
    const key = this.cacheService.generateKey('auth_result', identifier);
    await this.cacheService.set(key, result, { ttl });
  }

  /**
   * Get cached authentication result
   */
  async getAuthResult(
    identifier: string,
  ): Promise<{ success: boolean; userId?: string; attempts?: number } | null> {
    const key = this.cacheService.generateKey('auth_result', identifier);
    return this.cacheService.get(key);
  }

  /**
   * Cache password reset token
   */
  async cachePasswordResetToken(
    token: string,
    data: { userId: string; expiresAt: Date },
    ttl?: number,
  ): Promise<void> {
    const key = this.cacheService.generateKey('password_reset', token);
    const tokenTtl =
      ttl || Math.floor((data.expiresAt.getTime() - Date.now()) / 1000);
    await this.cacheService.set(key, data, { ttl: tokenTtl });
  }

  /**
   * Get cached password reset token
   */
  async getPasswordResetToken(
    token: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    const key = this.cacheService.generateKey('password_reset', token);
    return this.cacheService.get(key);
  }

  /**
   * Invalidate password reset token
   */
  async invalidatePasswordResetToken(token: string): Promise<void> {
    const key = this.cacheService.generateKey('password_reset', token);
    await this.cacheService.del(key);
  }
}
