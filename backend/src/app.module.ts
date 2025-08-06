import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ErrorHandlingModule } from './shared/error-handling/error-handling.module';
import { AuditModule as SharedAuditModule } from './shared/logger/audit.module';
import { AuthGuardModule } from './shared/auth/auth.module';
import { TraceIdMiddleware } from './shared/middlewares/trace-id.middleware';
import { AuditMiddleware } from './shared/middlewares/audit.middleware';
import { SessionValidationMiddleware } from './shared/middlewares/session-validation.middleware';
import { AdminModule } from './modules/admin/admin.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { SubjectModule } from './modules/subject/subject.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ClassModule } from './modules/class/class.module';
import { SectionModule } from './modules/section/section.module';
import { StudentModule } from './modules/student/student.module';
import { StaffModule } from './modules/staff/staff.module';
import { FileModule } from './modules/files/file.module';

@Module({
  imports: [
    DatabaseModule,
    SharedAuditModule,
    ErrorHandlingModule,
    AuthModule,
    AuthGuardModule, // Add authentication guards
    AdminModule,
    SubjectModule,
    TeacherModule,
    ClassModule,
    SectionModule,
    StudentModule,
    StaffModule,
    FileModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply trace ID middleware first to all routes
    consumer.apply(TraceIdMiddleware).forRoutes('*');

    // Apply session validation middleware after authentication
    consumer.apply(SessionValidationMiddleware).forRoutes('api/*');

    // Apply audit middleware to all API routes
    consumer.apply(AuditMiddleware).forRoutes('api/*');
  }
}
