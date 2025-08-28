/**
 * =============================================================================
 * Teacher Attendance Controller
 * =============================================================================
 * REST API endpoints for teacher attendance management
 * =============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { TeacherAttendanceService } from '../application/teacher-attendance.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  MarkTeacherAttendanceDto,
  MarkTeacherAttendanceSchema,
  GetTeacherAttendanceQueryDto,
  GetTeacherAttendanceQuerySchema,
} from '../dto/teacher-attendance.dto';

@ApiTags('Teacher Attendance')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/teacher-attendance')
@UseGuards(JwtAuthGuard)
export class TeacherAttendanceController {
  constructor(
    private readonly teacherAttendanceService: TeacherAttendanceService,
  ) {}

  @Post('mark')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark attendance for teachers',
    description:
      'Mark attendance for all teachers for a specific date and session',
  })
  @ApiBody({
    description: 'Teacher attendance marking data',
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date', example: '2025-01-28' },
        sessionType: { type: 'string', default: 'daily' },
        notes: { type: 'string' },
        teachers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              teacherId: { type: 'string', format: 'uuid' },
              status: {
                type: 'string',
                enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
              },
              remarks: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher attendance marked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found',
  })
  async markAttendance(
    @Body(new ZodValidationPipe(MarkTeacherAttendanceSchema))
    dto: MarkTeacherAttendanceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.teacherAttendanceService.markAttendance(dto, user.id);
  }

  @Get('teachers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get all teachers for attendance marking',
    description:
      'Retrieve all active teachers with their current attendance status',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: 'string',
    format: 'date',
    description: 'Date to check attendance status for (defaults to today)',
  })
  @ApiResponse({
    status: 200,
    description: 'Teachers retrieved successfully',
  })
  async getTeachersForAttendance(@Query('date') date?: string) {
    return {
      success: true,
      data: await this.teacherAttendanceService.getTeachersForAttendance(date),
    };
  }

  @Get('session/:date')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get teacher attendance for a specific date',
    description:
      'Retrieve attendance session details for teachers on a specific date',
  })
  @ApiQuery({
    name: 'sessionType',
    required: false,
    type: 'string',
    description: 'Session type (defaults to daily)',
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher attendance session retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attendance session not found',
  })
  async getTeacherAttendanceForDate(
    @Param('date') date: string,
    @Query('sessionType') sessionType: string = 'daily',
  ) {
    const data =
      await this.teacherAttendanceService.getTeacherAttendanceForDate(
        date,
        sessionType,
      );

    if (!data) {
      return {
        success: false,
        message: 'No attendance session found for this date',
        data: null,
      };
    }

    return {
      success: true,
      data,
    };
  }

  @Get('teacher/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get detailed teacher attendance',
    description: 'Retrieve detailed attendance records for a specific teacher',
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher attendance retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found',
  })
  async getTeacherAttendance(
    @Param('teacherId') teacherId: string,
    @Query(new ZodValidationPipe(GetTeacherAttendanceQuerySchema))
    query: GetTeacherAttendanceQueryDto,
  ) {
    const data = await this.teacherAttendanceService.getTeacherAttendance({
      ...query,
      teacherId,
    });

    return {
      success: true,
      data,
    };
  }

  @Get('stats/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get teacher attendance statistics',
    description: 'Retrieve attendance statistics for a specific teacher',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: 'number',
    description: 'Month (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: 'number',
    description: 'Year',
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher attendance statistics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found',
  })
  async getTeacherAttendanceStats(
    @Param('teacherId') teacherId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const data = await this.teacherAttendanceService.getTeacherAttendanceStats(
      teacherId,
      month,
      year,
    );

    return {
      success: true,
      data,
    };
  }
}
