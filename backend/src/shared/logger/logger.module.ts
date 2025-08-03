import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { AuditService } from './audit.service';
import { EnhancedAuditService } from './enhanced-audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggerService,
    AuditService,
    EnhancedAuditService,
    PrismaService,
    {
      provide: 'LOGGER_CONFIG',
      useFactory: () => ({
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        enableConsole: process.env.NODE_ENV !== 'production',
        enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
        enableDatabase: process.env.ENABLE_DB_LOGGING !== 'false',
        maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10mb',
        maxFiles: process.env.LOG_MAX_FILES || '5',
        logDirectory: process.env.LOG_DIRECTORY || './logs',
      }),
    },
  ],
  exports: [LoggerService, AuditService, EnhancedAuditService],
})
export class LoggerModule {}
