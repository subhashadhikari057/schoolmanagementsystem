import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthController } from './infrastructure/auth.controller';
import { AuthService } from './application/auth.service';
import { PasswordResetService } from './application/password-reset.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';
import { CacheModule } from '../../shared/cache/cache.module';
import { AuthRateLimiter } from '../../shared/middlewares/rate-limit.middleware';

@Module({
  imports: [LoggerModule, CacheModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService, PrismaService],
})
export class AuthModule implements NestModule {
  constructor() {
    console.log('✅ AuthModule loaded'); // 👈 Debug statement
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthRateLimiter).forRoutes('auth'); // ✅ applies to all /auth/* routes
  }
}
