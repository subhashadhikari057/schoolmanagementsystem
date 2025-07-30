// backend/src/shared/error-handling/error-handling.module.ts

import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';
import { LoggerModule } from '../logger/logger.module';
import { ErrorHandlingService } from './error-handling.service';

/**
 * Global error handling module that provides standardized error handling
 * across the entire application
 */
@Global()
@Module({
  imports: [LoggerModule],
  providers: [
    ErrorHandlingService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [ErrorHandlingService],
})
export class ErrorHandlingModule {}
