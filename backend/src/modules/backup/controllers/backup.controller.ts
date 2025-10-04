import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  HttpException,
  Res,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/decorators/roles.decorator';
import { BackupService, CreateBackupOptions } from '../services/backup.service';
import { RestoreService } from '../services/restore.service';
import { User } from '../../../shared/decorators/user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// DTOs
const CreateBackupDtoSchema = z.object({
  type: z.enum(['DATABASE', 'FILES', 'FULL_SYSTEM']),
  clientId: z.string().optional(),
  encrypt: z.boolean().optional(),
  clientKey: z.string().optional(),
  outputDir: z.string().optional(),
  backupName: z.string().optional(),
  includePaths: z.array(z.string()).optional(),
  excludePaths: z.array(z.string()).optional(),
});

const RestoreBackupDtoSchema = z.object({
  backupId: z.string().optional(),
  clientKey: z.string().optional(),
  targetDir: z.string().optional(),
  overwrite: z.boolean().optional().default(false),
  restoreDatabase: z.boolean().optional().default(true),
  restoreFiles: z.boolean().optional().default(true),
  restoreConfig: z.boolean().optional().default(true),
  dropExisting: z.boolean().optional().default(false),
});

const ListBackupsDtoSchema = z.object({
  clientId: z.string().optional(),
  type: z.enum(['DATABASE', 'FILES', 'FULL_SYSTEM']).optional(),
  status: z
    .enum(['IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'])
    .optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

const CleanupBackupsDtoSchema = z.object({
  clientId: z.string().optional(),
  retentionDays: z.number().min(1).optional().default(30),
  maxBackups: z.number().min(1).optional().default(10),
  type: z.enum(['DATABASE', 'FILES', 'FULL_SYSTEM']).optional(),
});

class CreateBackupDto extends createZodDto(CreateBackupDtoSchema) {}
class RestoreBackupDto extends createZodDto(RestoreBackupDtoSchema) {}
class ListBackupsDto extends createZodDto(ListBackupsDtoSchema) {}
class CleanupBackupsDto extends createZodDto(CleanupBackupsDtoSchema) {}

@ApiTags('Backup & Restore')
@Controller('api/v1/backup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly restoreService: RestoreService,
  ) {}

  @Post('create')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new backup' })
  @ApiResponse({ status: 201, description: 'Backup created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid backup configuration' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createBackup(
    @Body() createBackupDto: CreateBackupDto,
    @User() user: any,
  ) {
    try {
      const options: CreateBackupOptions = {
        type: createBackupDto.type,
        clientId: createBackupDto.clientId,
        encrypt: createBackupDto.encrypt,
        clientKey: createBackupDto.clientKey,
        outputDir: createBackupDto.outputDir,
        backupName: createBackupDto.backupName,
        includePaths: createBackupDto.includePaths,
        excludePaths: createBackupDto.excludePaths,
      };

      const backup = await this.backupService.createBackup(options, user.id);

      return {
        success: true,
        message: 'Backup created successfully',
        data: {
          backupId: backup.backupId,
          operationId: backup.metadata?.operationId, // Include operationId for SSE tracking
          type: backup.type,
          size: backup.size.toString(), // Convert BigInt to string for JSON
          location: backup.location,
          encrypted: backup.encrypted,
          status: backup.status,
          startedAt: backup.startedAt,
          completedAt: backup.completedAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create backup',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('restore')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore from backup' })
  @ApiResponse({ status: 200, description: 'Restore completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid restore configuration' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async restoreFromBackup(
    @Body() restoreDto: RestoreBackupDto,
    @User() user: any,
  ) {
    try {
      if (restoreDto.backupId) {
        // Generate operationId for progress tracking
        const operationId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Start restore in background (non-blocking)
        this.backupService
          .restoreFromBackup(
            restoreDto.backupId,
            {
              clientKey: restoreDto.clientKey,
              targetDir: restoreDto.targetDir,
              overwrite: restoreDto.overwrite,
              restoreDatabase: restoreDto.restoreDatabase,
              restoreFiles: restoreDto.restoreFiles,
              restoreConfig: restoreDto.restoreConfig,
              dropExisting: restoreDto.dropExisting,
              enablePreRestoreSnapshot: true, // Always enable pre-restore snapshots for safety
              userId: user.id,
            },
            operationId, // Pass operationId for SSE progress tracking
          )
          .catch(error => {
            // Log error but don't block response
            this.logger.error('Restore failed:', error);
          });

        return {
          success: true,
          message: 'Restore initiated successfully',
          data: {
            operationId, // Return operationId for progress tracking
          },
        };
      } else {
        throw new Error('Either backupId or backup file must be provided');
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to restore backup',
        error: error.message,
      };
    }
  }

  @Post('restore/upload')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('backupFile', {
      dest: './uploads/restore', // Temporary directory for uploaded files
      limits: {
        fileSize: 10 * 1024 * 1024 * 1024, // 10GB limit
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Restore from uploaded backup file' })
  @ApiResponse({ status: 200, description: 'Restore completed successfully' })
  async restoreFromUploadedFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() restoreDto: any, // Use any to avoid validation issues with multipart data
  ) {
    let tempFilePath: string | undefined;

    try {
      if (!file) {
        throw new Error('No backup file uploaded');
      }

      // Use file path or buffer
      tempFilePath = file.path || file.filename;
      if (!tempFilePath && file.buffer) {
        // If no path, write buffer to temporary file
        const tempDir = './uploads/restore';

        // Ensure temp directory exists
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        tempFilePath = path.join(
          tempDir,
          `temp_${Date.now()}_${file.originalname}`,
        );
        fs.writeFileSync(tempFilePath, file.buffer);
      }

      if (!tempFilePath) {
        throw new Error('Unable to process uploaded file');
      }

      // Convert string values to proper types (multipart form data sends everything as strings)
      const options = {
        clientKey: restoreDto.clientKey || undefined,
        targetDir: restoreDto.targetDir || undefined,
        overwrite:
          restoreDto.overwrite === 'true' || restoreDto.overwrite === true,
        restoreDatabase:
          restoreDto.restoreDatabase === 'true' ||
          restoreDto.restoreDatabase === true ||
          restoreDto.restoreDatabase === undefined,
        restoreFiles:
          restoreDto.restoreFiles === 'true' ||
          restoreDto.restoreFiles === true ||
          restoreDto.restoreFiles === undefined,
        restoreConfig:
          restoreDto.restoreConfig === 'true' ||
          restoreDto.restoreConfig === true ||
          restoreDto.restoreConfig === undefined,
        dropExisting:
          restoreDto.dropExisting === 'true' ||
          restoreDto.dropExisting === true,
      };

      // Generate operationId for progress tracking
      const operationId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use the uploaded file path for restore
      const result = await this.restoreService.restoreFromBackup(
        tempFilePath,
        options,
        operationId,
      );

      return {
        success: true,
        message: 'Restore initiated successfully',
        data: {
          operationId: result.operationId, // Return operationId for progress tracking
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to restore from uploaded file',
        error: error.message,
      };
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          // Log cleanup errors but don't throw
        }
      }
    }
  }

  @Get('list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all backups' })
  @ApiResponse({ status: 200, description: 'Backups retrieved successfully' })
  async listBackups(@Query() query: ListBackupsDto) {
    try {
      const backups = await this.backupService.listBackups({
        clientId: query.clientId,
        type: query.type as any,
        status: query.status as any,
        limit: query.limit,
        offset: query.offset,
      });

      return {
        success: true,
        data: backups.map(backup => ({
          ...backup,
          size: backup.size.toString(), // Convert BigInt to string
        })),
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: backups.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to list backups',
        error: error.message,
      };
    }
  }

  @Post('cleanup')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cleanup old backups' })
  @ApiResponse({ status: 200, description: 'Backup cleanup completed' })
  async cleanupBackups(@Body() cleanupDto: CleanupBackupsDto) {
    try {
      const result = await this.backupService.cleanupOldBackups({
        clientId: cleanupDto.clientId,
        retentionDays: cleanupDto.retentionDays,
        maxBackups: cleanupDto.maxBackups,
        type: cleanupDto.type as any,
      });

      return {
        success: true,
        message: 'Backup cleanup completed',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cleanup backups',
        error: error.message,
      };
    }
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get backup statistics' })
  @ApiResponse({
    status: 200,
    description: 'Backup statistics retrieved successfully',
  })
  async getBackupStats(@Query('clientId') clientId?: string) {
    try {
      const stats = await this.backupService.getBackupStats(clientId);

      return {
        success: true,
        data: {
          ...stats,
          totalSize: stats.totalSize.toString(), // Convert BigInt to string
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get backup statistics',
        error: error.message,
      };
    }
  }

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get backup dashboard overview' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getBackupDashboard(@Query('clientId') clientId?: string) {
    try {
      const [stats, serviceStatus, storageUsage, recentBackups, offsiteStatus] =
        await Promise.all([
          this.backupService.getBackupStats(clientId),
          this.backupService.getServiceStatus(),
          this.backupService.getStorageUsage(),
          this.backupService.getRecentBackups(10, clientId),
          this.backupService.getOffsiteStatus(),
        ]);

      return {
        success: true,
        data: {
          stats: {
            ...stats,
            totalSize: stats.totalSize.toString(), // Convert BigInt to string
          },
          serviceStatus,
          storageUsage,
          recentBackups: recentBackups.map(backup => ({
            ...backup,
            size: backup.size.toString(), // Convert BigInt to string
          })),
          offsiteStatus,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get dashboard data',
        error: error.message,
      };
    }
  }

  @Get('service/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get backup service status' })
  @ApiResponse({
    status: 200,
    description: 'Service status retrieved successfully',
  })
  async getServiceStatus() {
    try {
      const status = await this.backupService.getServiceStatus();

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get service status',
        error: error.message,
      };
    }
  }

  @Get('storage/usage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get storage usage breakdown' })
  @ApiResponse({
    status: 200,
    description: 'Storage usage retrieved successfully',
  })
  async getStorageUsage() {
    try {
      const usage = await this.backupService.getStorageUsage();

      return {
        success: true,
        data: usage,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get storage usage',
        error: error.message,
      };
    }
  }

  @Get('recent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get recent backups for dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Recent backups retrieved successfully',
  })
  async getRecentBackups(
    @Query('limit') limit?: number,
    @Query('clientId') clientId?: string,
  ) {
    try {
      const backups = await this.backupService.getRecentBackups(
        limit || 10,
        clientId,
      );

      return {
        success: true,
        data: backups.map(backup => ({
          ...backup,
          size: backup.size.toString(), // Convert BigInt to string
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get recent backups',
        error: error.message,
      };
    }
  }

  @Get('offsite/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get offsite backup status' })
  @ApiResponse({
    status: 200,
    description: 'Offsite status retrieved successfully',
  })
  async getOffsiteStatus() {
    try {
      const status = await this.backupService.getOffsiteStatus();

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get offsite status',
        error: error.message,
      };
    }
  }

  @Get(':backupId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get backup details' })
  @ApiResponse({
    status: 200,
    description: 'Backup details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  async getBackupDetails(@Param('backupId') backupId: string) {
    try {
      const backup = await this.backupService.getBackupMetadata(backupId);

      if (!backup) {
        return {
          success: false,
          message: 'Backup not found',
        };
      }

      return {
        success: true,
        data: {
          ...backup,
          size: backup.size.toString(), // Convert BigInt to string
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get backup details',
        error: error.message,
      };
    }
  }

  @Get(':backupId/validate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Validate backup integrity' })
  @ApiResponse({ status: 200, description: 'Backup validation completed' })
  async validateBackup(@Param('backupId') backupId: string) {
    try {
      const result = await this.backupService.validateBackup(backupId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to validate backup',
        error: error.message,
      };
    }
  }

  @Delete(':backupId')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete backup' })
  @ApiResponse({ status: 200, description: 'Backup deleted successfully' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  async deleteBackup(@Param('backupId') backupId: string) {
    try {
      await this.backupService.deleteBackup(backupId);

      return {
        success: true,
        message: 'Backup deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete backup',
        error: error.message,
      };
    }
  }

  @Post('settings/reset')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reset backup settings to defaults' })
  @ApiResponse({ status: 200, description: 'Settings reset successfully' })
  async resetToDefaults(@User() user: any) {
    try {
      await this.backupService.resetToDefaults(user.id);

      return {
        success: true,
        message: 'Backup settings reset to defaults successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reset settings',
        error: error.message,
      };
    }
  }

  @Post('test-connection')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Test offsite backup connection' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testOffsiteConnection() {
    try {
      const status = await this.backupService.testOffsiteConnection();

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to test offsite connection',
        error: error.message,
      };
    }
  }

  @Get(':backupId/preview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get restore preview' })
  @ApiResponse({
    status: 200,
    description: 'Restore preview generated successfully',
  })
  async getRestorePreview(
    @Param('backupId') backupId: string,
    @Query('clientKey') clientKey?: string,
  ) {
    try {
      const backup = await this.backupService.getBackupMetadata(backupId);

      if (!backup) {
        return {
          success: false,
          message: 'Backup not found',
        };
      }

      const preview = await this.restoreService.getRestorePreview(
        backup.location,
        clientKey || backup.encryptionKey || undefined,
      );

      return {
        success: true,
        data: preview,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate restore preview',
        error: error.message,
      };
    }
  }

  @Get(':backupId/download')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Download backup file' })
  @ApiResponse({ status: 200, description: 'Backup file download initiated' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  async downloadBackup(
    @Param('backupId') backupId: string,
    @Res() res: any,
    @Query('clientKey') clientKey?: string,
  ) {
    try {
      const result = await this.backupService.downloadBackup(
        backupId,
        clientKey,
      );

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message || 'Backup not found',
        });
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`,
      );
      res.setHeader('Content-Length', result.fileSize);

      // Stream the file
      return res.sendFile(result.filePath);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to download backup',
        error: error.message,
      });
    }
  }
}
