import { Module } from '@nestjs/common';
import { IDCardTemplateController } from './id-card-template.controller';
import { IDCardTemplateService } from './id-card-template.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  controllers: [IDCardTemplateController],
  providers: [IDCardTemplateService, PrismaService],
  exports: [IDCardTemplateService],
})
export class IDCardTemplateModule {}
