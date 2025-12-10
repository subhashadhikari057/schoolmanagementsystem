/**
 * =============================================================================
 * Backup Progress Controller
 * =============================================================================
 * Provides Server-Sent Events (SSE) endpoints for real-time progress tracking
 * =============================================================================
 */

import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseDoc,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import {
  ProgressTrackingService,
  ProgressUpdate,
} from '../services/progress-tracking.service';

@ApiTags('Backup Progress')
@Controller('api/v1/backup/progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupProgressController {
  constructor(private readonly progressService: ProgressTrackingService) {}

  @Get('stream/:operationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Stream progress updates for an operation (SSE)' })
  @ApiParam({ name: 'operationId', description: 'The operation ID to track' })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Server-Sent Events stream',
  })
  async streamProgress(
    @Param('operationId') operationId: string,
    @Res() res: Response,
  ): Promise<void> {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Get the progress observable
    const observable = this.progressService.getProgressObservable(operationId);

    if (!observable) {
      // Send initial history if available
      const history = this.progressService.getProgressHistory(operationId);
      if (history.length > 0) {
        history.forEach(update => {
          res.write(`data: ${JSON.stringify(update)}\n\n`);
        });
      } else {
        res.write(
          `data: ${JSON.stringify({ error: 'Operation not found or already completed' })}\n\n`,
        );
      }
      res.end();
      return;
    }

    // Send historical updates first
    const history = this.progressService.getProgressHistory(operationId);
    history.forEach(update => {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    });

    // Subscribe to new updates
    const subscription = observable.subscribe({
      next: (update: ProgressUpdate) => {
        res.write(`data: ${JSON.stringify(update)}\n\n`);
      },
      complete: () => {
        res.write(`data: ${JSON.stringify({ status: 'completed' })}\n\n`);
        res.end();
      },
      error: error => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      },
    });

    // Handle client disconnect
    res.on('close', () => {
      subscription.unsubscribe();
    });
  }

  @Get('current/:operationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current progress for an operation' })
  @ApiParam({ name: 'operationId', description: 'The operation ID to check' })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Current progress state',
  })
  async getCurrentProgress(@Param('operationId') operationId: string) {
    const progress = this.progressService.getCurrentProgress(operationId);
    return {
      success: true,
      data: progress,
    };
  }

  @Get('history/:operationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get progress history for an operation' })
  @ApiParam({ name: 'operationId', description: 'The operation ID to check' })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Progress history',
  })
  async getProgressHistory(@Param('operationId') operationId: string) {
    const history = this.progressService.getProgressHistory(operationId);
    return {
      success: true,
      data: history,
    };
  }

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all active operations' })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'List of active operation IDs',
  })
  async getActiveOperations() {
    const operations = this.progressService.getActiveOperations();
    return {
      success: true,
      data: operations,
    };
  }
}
