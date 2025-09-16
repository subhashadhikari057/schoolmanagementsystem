/**
 * =============================================================================
 * Backup Schedule Controller
 * =============================================================================
 * REST API endpoints for managing backup schedules and automation
 * =============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/decorators/roles.decorator';
import { User } from '../../../shared/decorators/user.decorator';
import { UserRole } from '@sms/shared-types';
import {
  BackupSchedulerService,
  CreateScheduleOptions,
} from '../services/backup-scheduler.service';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { BackupType, ScheduleFrequency } from '@prisma/client';

// DTOs
const CreateScheduleDtoSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(BackupType),
  frequency: z.nativeEnum(ScheduleFrequency),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  clientId: z.string().optional(),
  encrypt: z.boolean().optional(),
  clientKey: z.string().optional(),
  retentionDays: z.number().min(1).max(365).optional(),
  maxBackups: z.number().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
});

const UpdateScheduleDtoSchema = CreateScheduleDtoSchema.partial();

class CreateScheduleDto extends createZodDto(CreateScheduleDtoSchema) {}
class UpdateScheduleDto extends createZodDto(UpdateScheduleDtoSchema) {}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@ApiTags('Backup Schedule')
@Controller('api/v1/backup/schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupScheduleController {
  constructor(private readonly schedulerService: BackupSchedulerService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new backup schedule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Schedule created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid schedule configuration',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async createSchedule(
    @Body() createScheduleDto: CreateScheduleDto,
    @User() user: any,
  ): Promise<ApiResponse> {
    try {
      const schedule = await this.schedulerService.createSchedule(
        createScheduleDto as CreateScheduleOptions,
        user.id,
      );

      return {
        success: true,
        data: schedule,
        message: 'Backup schedule created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all backup schedules' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedules retrieved successfully',
  })
  async getSchedules(): Promise<ApiResponse> {
    try {
      const schedules = await this.schedulerService.getSchedules();

      return {
        success: true,
        data: schedules,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a specific backup schedule' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async getSchedule(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse> {
    try {
      const schedule = await this.schedulerService.getSchedule(id);

      if (!schedule) {
        return {
          success: false,
          error: 'Backup schedule not found',
        };
      }

      return {
        success: true,
        data: schedule,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a backup schedule' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async updateSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<ApiResponse> {
    try {
      const schedule = await this.schedulerService.updateSchedule(
        id,
        updateScheduleDto as Partial<CreateScheduleOptions>,
      );

      return {
        success: true,
        data: schedule,
        message: 'Backup schedule updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a backup schedule' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async deleteSchedule(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse> {
    try {
      await this.schedulerService.deleteSchedule(id);

      return {
        success: true,
        message: 'Backup schedule deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post(':id/toggle')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enable or disable a backup schedule' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule toggled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async toggleSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('enabled') enabled: boolean,
  ): Promise<ApiResponse> {
    try {
      const schedule = await this.schedulerService.toggleSchedule(id, enabled);

      return {
        success: true,
        data: schedule,
        message: `Backup schedule ${enabled ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post(':id/run-now')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Run a backup schedule immediately' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule executed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async runScheduleNow(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse> {
    try {
      await this.schedulerService.runScheduleNow(id);

      return {
        success: true,
        message: 'Backup schedule executed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('cleanup')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Run backup cleanup based on retention policies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cleanup completed successfully',
  })
  async cleanupBackups(): Promise<ApiResponse> {
    try {
      await this.schedulerService.cleanupOldBackups();

      return {
        success: true,
        message: 'Backup cleanup completed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('health')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get backup scheduler health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status retrieved successfully',
  })
  async getSchedulerHealth(): Promise<ApiResponse> {
    try {
      const health = await this.schedulerService.getSchedulerHealth();
      return {
        success: true,
        data: health,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('maintenance')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Perform scheduler maintenance tasks' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Maintenance completed successfully',
  })
  async performMaintenance(): Promise<ApiResponse> {
    try {
      const result = await this.schedulerService.performMaintenance();
      return {
        success: true,
        message: 'Maintenance completed successfully',
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
