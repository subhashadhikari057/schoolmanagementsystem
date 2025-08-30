import { Module } from '@nestjs/common';
import { IDCardService } from './id-card.service';
import { IDCardController } from './id-card.controller';
import { QRVerificationService } from './qr-verification.service';
import { PersonSearchService } from './person-search.service';
import { IDCardGenerationService } from './id-card-generation.service';
import { IDCardGenerationController } from './id-card-generation.controller';
import { PDFGenerationService } from './pdf-generation.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  controllers: [IDCardController, IDCardGenerationController],
  providers: [
    IDCardService,
    QRVerificationService,
    PersonSearchService,
    IDCardGenerationService,
    PDFGenerationService,
    PrismaService,
  ],
  exports: [
    IDCardService,
    QRVerificationService,
    PersonSearchService,
    IDCardGenerationService,
    PDFGenerationService,
  ],
})
export class IDCardModule {}
