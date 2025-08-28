/**
 * =============================================================================
 * Staff Attendance Controller
 * =============================================================================
 * REST API endpoints for staff attendance management
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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { StaffAttendanceService } from '../application/staff-attendance.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import {
  MarkStaffAttendanceDto,
  GetStaffAttendanceQueryDto,
} from '../dto/staff-attendance.dto';

@Controller('api/v1/staff-attendance')
@UseGuards(JwtAuthGuard)
export class StaffAttendanceController {
  constructor(
    private readonly staffAttendanceService: StaffAttendanceService,
  ) {}

  /**
   * Mark staff attendance
   */
  @Post('mark')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async markAttendance(
    @Body() dto: MarkStaffAttendanceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.staffAttendanceService.markAttendance(dto, user.id);
  }

  /**
   * Get all staff for attendance marking
   */
  @Get('staff')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getStaffForAttendance(@Query('date') date?: string) {
    const staff = await this.staffAttendanceService.getStaffForAttendance(date);
    return {
      success: true,
      message: 'Staff retrieved successfully',
      data: staff,
    };
  }

  /**
   * Get staff attendance session for a specific date
   */
  @Get('session/:date')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getStaffAttendanceSession(
    @Param('date') date: string,
    @Query('sessionType') sessionType?: string,
  ) {
    const session = await this.staffAttendanceService.getStaffAttendanceForDate(
      date,
      sessionType,
    );
    return {
      success: true,
      message: session
        ? 'Staff attendance session found'
        : 'No attendance session found for this date',
      data: session,
    };
  }

  /**
   * Get individual staff attendance
   */
  @Get('staff/:staffId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF)
  async getStaffAttendance(
    @Param('staffId') staffId: string,
    @Query() query: GetStaffAttendanceQueryDto,
  ) {
    const attendance = await this.staffAttendanceService.getStaffAttendance({
      ...query,
      staffId,
    });
    return {
      success: true,
      message: 'Staff attendance retrieved successfully',
      data: attendance,
    };
  }

  /**
   * Get staff attendance statistics
   */
  @Get('stats/:staffId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF)
  async getStaffAttendanceStats(
    @Param('staffId') staffId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const stats = await this.staffAttendanceService.getStaffAttendanceStats(
      staffId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
    return {
      success: true,
      message: 'Staff attendance statistics retrieved successfully',
      data: stats,
    };
  }
}
