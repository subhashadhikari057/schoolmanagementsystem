import { Module } from '@nestjs/common';
import { RoomController } from './infrastructure/room.controller';
import { RoomService } from './application/room.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../shared/logger/audit.service';

@Module({
  controllers: [RoomController],
  providers: [RoomService, PrismaService, AuditService],
  exports: [RoomService], // Export service for use in other modules
})
export class RoomModule {}
