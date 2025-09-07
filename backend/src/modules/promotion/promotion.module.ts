/**
 * =============================================================================
 * Promotion Module
 * =============================================================================
 * Module for student promotion management.
 * Provides services for promotion preview, execution, and academic year management.
 * =============================================================================
 */

import { Module } from '@nestjs/common';
import { PromotionController } from './api/promotion.controller';
import { PromotionService } from './application/promotion.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [PromotionController],
  providers: [PromotionService, PrismaService, AuditService],
  exports: [PromotionService],
})
export class PromotionModule {}
