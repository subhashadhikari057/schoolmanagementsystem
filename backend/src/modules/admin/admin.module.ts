import { Module } from '@nestjs/common';
import { AdminController } from './infrastructure/admin.controller';
import { AdminService } from './application/admin.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
