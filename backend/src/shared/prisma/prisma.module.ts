// src/shared/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
