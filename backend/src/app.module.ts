// backend/src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ErrorHandlingModule } from './shared/error-handling/error-handling.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { TraceIdMiddleware } from './shared/middlewares/trace-id.middleware';

@Module({
  imports: [DatabaseModule, ErrorHandlingModule, AuthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply trace ID middleware to all routes
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
