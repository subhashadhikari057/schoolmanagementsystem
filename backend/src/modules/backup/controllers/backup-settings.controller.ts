/**
 * =============================================================================
 * Backup Settings Controller
 * =============================================================================
 * REST API endpoints for managing backup system settings
 * =============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/decorators/roles.decorator';
import { User } from '../../../shared/decorators/user.decorator';
import { UserRole } from '@sms/shared-types';
import { BackupSettingsService } from '../services/backup-settings.service';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// DTOs
const EncryptionSettingsDtoSchema = z.object({
  enableEncryption: z.boolean(),
  clientEncryptionKey: z.string().optional(),
  keyRotationEnabled: z.boolean().default(false),
  keyRotationDays: z.number().min(1).max(365).default(90),
  keyCreatedAt: z.union([z.string(), z.date()]).optional(),
  keyUpdatedAt: z.union([z.string(), z.date()]).optional(),
});

const SSHConfigDtoSchema = z.object({
  keyType: z.enum(['password', 'privateKey']),
  privateKey: z.string().optional(),
  passphrase: z.string().optional(),
  password: z.string().optional(),
  keyName: z.string().optional(),
  keyFingerprint: z.string().optional(),
  createdAt: z.string().optional(),
});

const OffsiteSettingsDtoSchema = z.object({
  enableOffsiteBackup: z.boolean(),
  provider: z.enum(['ssh', 's3', 'azure', 'gcp']).default('ssh'),
  remoteHost: z.string().optional(),
  username: z.string().optional(),
  remotePath: z.string().optional(),
  sshKeyPath: z.string().optional(),
  sshConfig: SSHConfigDtoSchema.optional(),
  encryptInTransit: z.boolean().default(true),
  syncFrequency: z.enum(['immediate', 'hourly', 'daily']).default('daily'),
  lastSync: z.union([z.string(), z.date()]).optional(),
  connectionStatus: z
    .enum(['connected', 'disconnected', 'error'])
    .default('disconnected'),
});

const AdvancedSettingsDtoSchema = z.object({
  compressionLevel: z.enum(['none', 'low', 'medium', 'high']).default('medium'),
  parallelOperations: z.number().min(1).max(16).default(2),
  backupNotifications: z.array(z.string().email()).default([]),
  enableProgressTracking: z.boolean().default(true),
  enablePreRestoreSnapshot: z.boolean().default(true),
  maxRetryAttempts: z.number().min(0).max(10).default(3),
  backupTimeout: z.number().min(60).max(86400).default(3600), // 1 minute to 24 hours
});

const MetadataDtoSchema = z.object({
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  updatedBy: z.string().optional(),
  version: z.string(),
});

const BackupSettingsDtoSchema = z.object({
  encryption: EncryptionSettingsDtoSchema.optional(),
  offsite: OffsiteSettingsDtoSchema.optional(),
  advanced: AdvancedSettingsDtoSchema.optional(),
  metadata: MetadataDtoSchema.optional(),
});

class BackupSettingsDto extends createZodDto(BackupSettingsDtoSchema) {}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@ApiTags('Backup Settings')
@Controller('api/v1/backup/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupSettingsController {
  constructor(private readonly settingsService: BackupSettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get backup settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
  })
  async getSettings(): Promise<ApiResponse> {
    try {
      const settings = await this.settingsService.getSettings();
      console.log('🔍 CONTROLLER RESPONSE:', {
        success: true,
        enableEncryption: settings.encryption.enableEncryption,
        keyExists: !!settings.encryption.clientEncryptionKey,
        offsiteEnabled: settings.offsite.enableOffsiteBackup,
      });
      return {
        success: true,
        data: settings,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update backup settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
  })
  async updateSettings(
    @Body() settingsDto: BackupSettingsDto,
    @User() user: any,
  ): Promise<ApiResponse> {
    try {
      // Transform the DTO to match the service interface
      const transformedSettings = this.transformDtoToSettings(settingsDto);

      const updatedSettings = await this.settingsService.updateSettings(
        transformedSettings,
        user.id,
      );
      return {
        success: true,
        data: updatedSettings,
        message: 'Backup settings updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private transformDtoToSettings(dto: BackupSettingsDto): Partial<any> {
    const result: any = {};

    if (dto.encryption) {
      result.encryption = {
        ...dto.encryption,
        keyCreatedAt: dto.encryption.keyCreatedAt
          ? typeof dto.encryption.keyCreatedAt === 'string'
            ? new Date(dto.encryption.keyCreatedAt)
            : dto.encryption.keyCreatedAt
          : undefined,
        keyUpdatedAt: dto.encryption.keyUpdatedAt
          ? typeof dto.encryption.keyUpdatedAt === 'string'
            ? new Date(dto.encryption.keyUpdatedAt)
            : dto.encryption.keyUpdatedAt
          : undefined,
      };
    }

    if (dto.offsite) {
      result.offsite = {
        ...dto.offsite,
        lastSync: dto.offsite.lastSync
          ? typeof dto.offsite.lastSync === 'string'
            ? new Date(dto.offsite.lastSync)
            : dto.offsite.lastSync
          : undefined,
      };
    }

    if (dto.advanced) {
      result.advanced = dto.advanced;
    }

    if (dto.metadata) {
      result.metadata = {
        ...dto.metadata,
        createdAt:
          typeof dto.metadata.createdAt === 'string'
            ? new Date(dto.metadata.createdAt)
            : dto.metadata.createdAt,
        updatedAt:
          typeof dto.metadata.updatedAt === 'string'
            ? new Date(dto.metadata.updatedAt)
            : dto.metadata.updatedAt,
      };
    }

    return result;
  }

  @Post('encryption/generate-key')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate new encryption key' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Encryption key generated successfully',
  })
  async generateEncryptionKey(@User() user: any): Promise<ApiResponse> {
    try {
      const keyData = await this.settingsService.generateEncryptionKey(user.id);
      return {
        success: true,
        data: keyData,
        message: 'New encryption key generated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('offsite/test-connection')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Test offsite backup connection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection test completed',
  })
  async testOffsiteConnection(
    @Body() offsiteSettings?: any,
  ): Promise<ApiResponse> {
    try {
      const testResult =
        await this.settingsService.testOffsiteConnection(offsiteSettings);
      return {
        success: true,
        data: testResult,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('offsite/create-folder')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create backup folder on remote server' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remote folder created successfully',
  })
  async createRemoteFolder(
    @Body()
    config: {
      remoteHost: string;
      username: string;
      password: string;
      remotePath: string;
    },
  ): Promise<ApiResponse> {
    try {
      const result = await this.settingsService.createRemoteFolder(
        config.remoteHost,
        config.username,
        config.password,
        config.remotePath,
      );
      return {
        success: result.success,
        data: result,
        message: result.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('offsite/configure-ssh')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Configure SSH key for offsite backup' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSH key configured successfully',
  })
  async configureSSHKey(
    @Body() sshConfig: { publicKey: string; privateKeyPath?: string },
    @User() user: any,
  ): Promise<ApiResponse> {
    try {
      const result = await this.settingsService.configureSSHKey(
        sshConfig,
        user.id,
      );
      return {
        success: true,
        data: result,
        message: 'SSH key configured successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('reset-defaults')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reset settings to defaults' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings reset successfully',
  })
  async resetToDefaults(@User() user: any): Promise<ApiResponse> {
    try {
      const defaultSettings = await this.settingsService.resetToDefaults(
        user.id,
      );
      return {
        success: true,
        data: defaultSettings,
        message: 'Settings reset to defaults successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('validation')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Validate current settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings validation completed',
  })
  async validateSettings(): Promise<ApiResponse> {
    try {
      const validation = await this.settingsService.validateSettings();
      return {
        success: true,
        data: validation,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
