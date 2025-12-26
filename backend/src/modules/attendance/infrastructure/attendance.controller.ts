/**
 * =============================================================================
 * Attendance Controller
 * =============================================================================
 * REST API controller for attendance management operations
 * =============================================================================
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from '../application/attendance.service';
import { WorkingDaysService } from '../application/working-days.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { UserRole } from '@sms/shared-types';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  MarkAttendanceDto,
  MarkAttendanceSchema,
  GetAttendanceQueryDto,
  WorkingDaysCalculationDto,
  WorkingDaysCalculationSchema,
} from '../dto/attendance.dto';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly workingDaysService: WorkingDaysService,
  ) {}

  @Post('mark')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark attendance for students in a class',
    description:
      'Mark attendance for all students in a class for a specific date and session',
  })
  @ApiBody({
    description: 'Attendance marking data',
    schema: {
      type: 'object',
      properties: {
        classId: { type: 'string', format: 'uuid' },
        date: { type: 'string', format: 'date', example: '2025-08-25' },
        sessionType: { type: 'string', default: 'daily' },
        notes: { type: 'string' },
        students: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'string', format: 'uuid' },
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
    description: 'Attendance marked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Class or student not found',
  })
  async markAttendance(
    @Body(new ZodValidationPipe(MarkAttendanceSchema)) dto: MarkAttendanceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.attendanceService.markAttendance(dto, user.id);
  }

  @Get('student/:studentId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'Get student attendance details',
    description:
      'Get detailed attendance records and statistics for a specific student',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    type: 'string',
  })
  @ApiQuery({ name: 'month', required: false, type: 'number' })
  @ApiQuery({ name: 'year', required: false, type: 'number' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Student attendance data retrieved successfully',
  })
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query()
    query: {
      classId?: string;
      studentId?: string;
      startDate?: string;
      endDate?: string;
      month?: string | number;
      year?: string | number;
      page?: string | number;
      limit?: string | number;
    },
  ) {
    const normalizedQuery: GetAttendanceQueryDto = {
      ...query,
      month:
        query.month !== undefined && query.month !== null
          ? Number(query.month)
          : undefined,
      year:
        query.year !== undefined && query.year !== null
          ? Number(query.year)
          : undefined,
      page:
        query.page !== undefined && query.page !== null
          ? Number(query.page)
          : 1,
      limit:
        query.limit !== undefined && query.limit !== null
          ? Number(query.limit)
          : 20,
    };

    return this.attendanceService.getStudentAttendance(
      studentId,
      normalizedQuery,
    );
  }

  @Get('student/:studentId/stats')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'Get student attendance statistics',
    description:
      'Get attendance statistics for a student for a specific month/year',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    type: 'string',
  })
  @ApiQuery({ name: 'month', required: false, type: 'number' })
  @ApiQuery({ name: 'year', required: false, type: 'number' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  async getStudentAttendanceStats(
    @Param('studentId') studentId: string,
    @Query()
    query: {
      month?: string;
      year?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const month = query.month ? parseInt(query.month, 10) : undefined;
    const year = query.year ? parseInt(query.year, 10) : undefined;

    return this.attendanceService.getStudentAttendanceStats(
      studentId,
      month,
      year,
      query.startDate,
      query.endDate,
    );
  }

  @Get('class/:classId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get class attendance for a specific date',
    description:
      'Get attendance records for all students in a class for a specific date',
  })
  @ApiParam({
    name: 'classId',
    description: 'Class ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: 'string',
    example: '2025-08-25',
  })
  @ApiQuery({
    name: 'sessionType',
    required: false,
    type: 'string',
    example: 'daily',
  })
  async getClassAttendance(
    @Param('classId') classId: string,
    @Query('date') date: string,
    @Query('sessionType') sessionType: string = 'daily',
  ) {
    return this.attendanceService.getClassAttendance(
      classId,
      date,
      sessionType,
    );
  }

  @Post('working-days/calculate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate working days for a month',
    description:
      'Calculate the total working days for a specific month and year, excluding Saturdays, holidays, and events',
  })
  @ApiBody({
    description: 'Month and year for calculation',
    schema: {
      type: 'object',
      properties: {
        month: { type: 'number', minimum: 1, maximum: 12 },
        year: { type: 'number', minimum: 2020, maximum: 2030 },
      },
    },
  })
  async calculateWorkingDays(
    @Body(new ZodValidationPipe(WorkingDaysCalculationSchema))
    dto: WorkingDaysCalculationDto,
  ) {
    const workingDays = await this.attendanceService.calculateWorkingDays(dto);
    return {
      month: dto.month,
      year: dto.year,
      workingDays,
    };
  }

  @Get('working-days/:month/:year')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get working days tracker for a month',
    description:
      'Get detailed working days breakdown for a specific month and year',
  })
  @ApiParam({ name: 'month', type: 'number' })
  @ApiParam({ name: 'year', type: 'number' })
  async getWorkingDaysTracker(
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    const tracker = await this.workingDaysService.getWorkingDaysTracker(
      monthNum,
      yearNum,
    );

    if (!tracker) {
      // Calculate and create if doesn't exist
      const workingDays = await this.workingDaysService.calculateWorkingDays(
        monthNum,
        yearNum,
      );
      return {
        month: monthNum,
        year: yearNum,
        workingDays,
        calculated: true,
      };
    }

    return tracker;
  }

  @Get('working-days/current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get current month working days',
    description:
      'Get working days breakdown for the current month with live count',
  })
  async getCurrentWorkingDays() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await this.workingDaysService.calculateWorkingDays(month, year);
    const tracker = await this.workingDaysService.getWorkingDaysTracker(
      month,
      year,
    );

    return {
      ...tracker,
      isCurrentMonth: true,
      lastCalculated: new Date().toISOString(),
    };
  }

  @Get('date-status/:date')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Check date status for attendance purposes',
    description:
      'Check if a date requires attendance, is a holiday, emergency closure, or event. Considers EventScope for proper attendance planning.',
  })
  @ApiParam({
    name: 'date',
    type: 'string',
    description: 'Date in YYYY-MM-DD format',
    example: '2025-08-25',
  })
  @ApiResponse({
    status: 200,
    description: 'Date status information with attendance requirements',
    schema: {
      type: 'object',
      properties: {
        isWorkingDay: {
          type: 'boolean',
          description: 'Whether attendance is required',
        },
        isHoliday: { type: 'boolean', description: 'Whether it is a holiday' },
        isEmergencyClosure: {
          type: 'boolean',
          description: 'Whether school is closed due to emergency',
        },
        message: {
          type: 'string',
          description: 'Human-readable status message',
        },
        eventDetails: {
          type: 'object',
          nullable: true,
          properties: {
            title: { type: 'string' },
            type: { type: 'string' },
            eventScope: {
              type: 'string',
              enum: ['PARTIAL', 'SCHOOL_WIDE'],
              nullable: true,
            },
            description: { type: 'string' },
          },
        },
      },
    },
  })
  async checkDateStatus(@Param('date') date: string) {
    return this.workingDaysService.checkDateStatus(date);
  }

  @Get('class-wise-stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get class-wise attendance statistics',
    description:
      'Get attendance statistics for all classes for today or a specific date',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: 'string',
    description: 'Date in YYYY-MM-DD format (defaults to today)',
    example: '2025-08-25',
  })
  @ApiResponse({
    status: 200,
    description: 'Class-wise attendance statistics',
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        classes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              grade: { type: 'string' },
              section: { type: 'string' },
              totalStudents: { type: 'number' },
              present: { type: 'number' },
              absent: { type: 'number' },
              late: { type: 'number' },
              excused: { type: 'number' },
              attendancePercentage: { type: 'number' },
              status: {
                type: 'string',
                enum: ['completed', 'partial', 'pending'],
              },
            },
          },
        },
        overall: {
          type: 'object',
          properties: {
            totalStudents: { type: 'number' },
            totalPresent: { type: 'number' },
            totalAbsent: { type: 'number' },
            overallAttendanceRate: { type: 'number' },
            completedClasses: { type: 'number' },
            pendingClasses: { type: 'number' },
          },
        },
      },
    },
  })
  async getClassWiseAttendanceStats(@Query('date') date?: string) {
    return this.attendanceService.getClassWiseAttendanceStats(date);
  }
}
