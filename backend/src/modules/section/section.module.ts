import { Module } from '@nestjs/common';
import { SectionController } from './infrastructure/section.controller';
import { SectionService } from './application/section.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [SectionController],
  providers: [SectionService, PrismaService],
})
export class SectionModule {}
