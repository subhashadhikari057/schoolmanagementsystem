import { Module } from '@nestjs/common';
import { StudentController } from './infrastructure/student.controller';
import { StudentImportController } from './infrastructure/student-import.controller';
import { StudentService } from './application/student.service';
import { StudentImportService } from './application/student-import.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [StudentController, StudentImportController],
  providers: [StudentService, StudentImportService, PrismaService],
})
export class StudentModule {}
