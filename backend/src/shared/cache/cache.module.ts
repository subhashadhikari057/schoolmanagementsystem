import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { SessionCacheService } from './session-cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Use memory store for now, can be switched to Redis later
        return {
          ttl: configService.get('CACHE_TTL', 300) * 1000, // Convert to milliseconds
          max: configService.get('CACHE_MAX_ITEMS', 1000),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService, SessionCacheService],
  exports: [CacheService, SessionCacheService, NestCacheModule],
})
export class CacheModule {}
