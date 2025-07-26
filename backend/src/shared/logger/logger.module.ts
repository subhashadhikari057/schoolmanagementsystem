import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { DatabaseModule } from '../../infrastructure/database/database.module'; 

@Module({
  imports: [DatabaseModule], 
  providers: [AuditService],
  exports: [AuditService],
})
export class LoggerModule {}
