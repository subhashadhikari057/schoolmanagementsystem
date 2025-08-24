import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ErrorHandlingModule } from './shared/error-handling/error-handling.module';
import { AuditModule as SharedAuditModule } from './shared/logger/audit.module';
import { AuthGuardModule } from './shared/auth/auth.module';
import { TraceIdMiddleware } from './shared/middlewares/trace-id.middleware';
import { AuditMiddleware } from './shared/middlewares/audit.middleware';
import { SessionValidationMiddleware } from './shared/middlewares/session-validation.middleware';
import { CsrfMiddleware } from './shared/middlewares/csrf.middleware';
import { AdminModule } from './modules/admin/admin.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { SubjectModule } from './modules/subject/subject.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ClassModule } from './modules/class/class.module';

import { StudentModule } from './modules/student/student.module';
import { StaffModule } from './modules/staff/staff.module';
import { FileModule } from './modules/files/file.module';
import { RoomModule } from './modules/room/room.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { ParentModule } from './modules/parent/parent.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { FeeModule } from './modules/fee/fee.module';
import { NoticeModule } from './modules/notice/notice.module';
import { AttendanceModule } from './modules/attendance/attendance.module';

@Module({
  imports: [
    DatabaseModule,
    SharedAuditModule,
    ErrorHandlingModule,
    AuthModule,
    AuthGuardModule, // Add authentication guards
    AdminModule,
    SubjectModule,
    RoomModule, // Add rooms before classes since classes depend on rooms
    TeacherModule,
    ClassModule,
    StudentModule,
    ParentModule,
    StaffModule,
    FileModule,
    CalendarModule,
    AssignmentModule,
    ScheduleModule,
    FeeModule,
    NoticeModule,
    AttendanceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply trace ID middleware first to all routes
    consumer.apply(TraceIdMiddleware).forRoutes('*');

    // Apply session validation middleware after authentication
    consumer.apply(SessionValidationMiddleware).forRoutes('api/*');

    // Apply CSRF protection to all mutation endpoints and the CSRF token endpoint
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        { path: 'api/v1/auth/logout', method: RequestMethod.POST },
      )
      .forRoutes(
        { path: 'api/v1/csrf/token', method: RequestMethod.GET }, // CSRF token endpoint
        { path: 'api/*', method: RequestMethod.POST },
        { path: 'api/*', method: RequestMethod.PUT },
        { path: 'api/*', method: RequestMethod.DELETE },
        { path: 'api/*', method: RequestMethod.PATCH },
      );

    // Apply audit middleware to all API routes
    consumer.apply(AuditMiddleware).forRoutes('api/*');
  }
}
