import { Module } from '@nestjs/common';
import { IDCardService } from './id-card.service';
import { IDCardController } from './id-card.controller';
import { QRVerificationService } from './qr-verification.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  controllers: [IDCardController],
  providers: [IDCardService, QRVerificationService, PrismaService],
  exports: [IDCardService, QRVerificationService],
})
export class IDCardModule {}
