import { Module } from '@nestjs/common';
import { StudentController } from './infrastructure/student.controller';
import { StudentService } from './application/student.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [StudentController],
  providers: [StudentService, PrismaService],
})
export class StudentModule {}
