import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthController } from './infrastructure/auth.controller';
import { AuthService } from './application/auth.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';
import { AuthRateLimiter } from '../../shared/middlewares/rate-limit.middleware';

@Module({
  imports: [LoggerModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule implements NestModule {
  constructor() {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthRateLimiter).forRoutes('auth'); // ✅ applies to all /auth/* routes
  }
}
