/**
 * =============================================================================
 * School Information Module
 * =============================================================================
 * Module for managing school information settings.
 * =============================================================================
 */

import { Module } from '@nestjs/common';
import { SchoolInformationController } from './infrastructure/school-information.controller';
import { SchoolInformationService } from './application/school-information.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [SchoolInformationController],
  providers: [SchoolInformationService, PrismaService],
  exports: [SchoolInformationService],
})
export class SchoolInformationModule {}
