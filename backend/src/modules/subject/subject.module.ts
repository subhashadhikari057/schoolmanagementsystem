import { Module } from '@nestjs/common';
import { SubjectController } from './infrastructure/subject.controller';
import { SubjectService } from './application/subject.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [SubjectController],
  providers: [SubjectService, PrismaService],
})
export class SubjectModule {}
