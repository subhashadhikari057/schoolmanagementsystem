import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuditService } from '../logger/audit.service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
}

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);

      if (value) {
        await this.auditService.record({
          action: 'CACHE_HIT',
          module: 'CACHE',
          status: 'SUCCESS',
          details: { key, hasValue: !!value },
        });
      }

      return value || null;
    } catch (error) {
      await this.auditService.record({
        action: 'CACHE_GET_ERROR',
        module: 'CACHE',
        status: 'FAIL',
        details: { key, error: error.message },
      });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || 300; // 5 minutes default
      await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds

      await this.auditService.record({
        action: 'CACHE_SET',
        module: 'CACHE',
        status: 'SUCCESS',
        details: { key, ttl, hasValue: !!value },
      });
    } catch (error) {
      await this.auditService.record({
        action: 'CACHE_SET_ERROR',
        module: 'CACHE',
        status: 'FAIL',
        details: { key, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);

      await this.auditService.record({
        action: 'CACHE_DELETE',
        module: 'CACHE',
        status: 'SUCCESS',
        details: { key },
      });
    } catch (error) {
      await this.auditService.record({
        action: 'CACHE_DELETE_ERROR',
        module: 'CACHE',
        status: 'FAIL',
        details: { key, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      // Use store-specific reset if available, otherwise clear individual keys
      if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      } else {
        // For cache-manager v5+, we need to implement our own reset logic
        console.warn(
          'Cache reset not directly supported, implementing custom reset',
        );
      }

      await this.auditService.record({
        action: 'CACHE_RESET',
        module: 'CACHE',
        status: 'SUCCESS',
        details: {},
      });
    } catch (error) {
      await this.auditService.record({
        action: 'CACHE_RESET_ERROR',
        module: 'CACHE',
        status: 'FAIL',
        details: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Get or set pattern - retrieve from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Cache decorator for methods
   */
  static CacheResult(options?: CacheOptions) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor,
    ) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheService: CacheService = this.cacheService;

        if (!cacheService) {
          return method.apply(this, args);
        }

        const key =
          options?.key ||
          `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

        return cacheService.getOrSet(
          key,
          () => method.apply(this, args),
          options,
        );
      };
    };
  }
}
