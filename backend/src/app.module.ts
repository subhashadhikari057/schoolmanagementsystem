import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { SubjectModule } from './modules/subject/subject.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ClassModule } from './modules/class/class.module';
import { SectionModule } from './modules/section/section.module';
import { StudentModule } from './modules/student/student.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,  // ✅ Directly imported
    AdminModule, // ✅ Directly imported
    SubjectModule,
    TeacherModule,
    ClassModule,
    SectionModule,
    StudentModule,
  ],
})
export class AppModule {}
