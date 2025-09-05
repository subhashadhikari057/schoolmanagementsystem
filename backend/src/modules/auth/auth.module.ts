import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthController } from './infrastructure/auth.controller';
import { ProfileController } from './controllers/profile.controller';
import { AuthService } from './application/auth.service';
import { ProfileService } from './application/profile.service';
import { OtpService } from './application/otp.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';
import { AuthRateLimiter } from '../../shared/middlewares/rate-limit.middleware';

@Module({
  imports: [LoggerModule],
  controllers: [AuthController, ProfileController],
  providers: [AuthService, ProfileService, OtpService, PrismaService],
})
export class AuthModule implements NestModule {
  constructor() {
    console.log('✅ AuthModule loaded'); // 👈 Debug statement
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthRateLimiter).forRoutes('auth'); // ✅ applies to all /auth/* routes
  }
}
