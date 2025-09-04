import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/logger/audit.module';
import { GradingController } from './controllers/grading.controller';
import { GradingService } from './services/grading.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GradingController],
  providers: [GradingService],
  exports: [GradingService],
})
export class GradingModule {}
