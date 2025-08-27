import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { TeacherLeaveUsageService } from '../application/teacher-leave-usage.service';
import { UserRole } from '@sms/shared-types';

@Controller('api/v1/leave-usage')
export class LeaveUsageController {
  constructor(private readonly leaveUsageService: TeacherLeaveUsageService) {}

  /**
   * Get teacher's leave usage summary
   * Teachers can view their own usage, admins can view any teacher's usage
   */
  @Get('teacher/:teacherId')
  @HttpCode(HttpStatus.OK)
  async getTeacherLeaveUsage(
    @Param('teacherId') teacherId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const usage = await this.leaveUsageService.getTeacherLeaveUsage(
      teacherId,
      user.id,
      userRole,
    );

    return {
      message: 'Teacher leave usage retrieved successfully',
      usage,
    };
  }

  /**
   * Get current user's leave usage (for teachers)
   */
  @Get('my-usage')
  @HttpCode(HttpStatus.OK)
  async getMyLeaveUsage(@Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    if (userRole !== UserRole.TEACHER) {
      throw new Error('Only teachers can access their own leave usage');
    }

    // Find the teacher record for the current user
    const teacher = await this.leaveUsageService['prisma'].teacher.findFirst({
      where: { userId: user.id, deletedAt: null },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const usage = await this.leaveUsageService.getTeacherLeaveUsage(
      teacher.id,
      user.id,
      userRole,
    );

    return {
      message: 'Your leave usage retrieved successfully',
      usage,
    };
  }

  /**
   * Get all teachers' leave usage (admin only)
   */
  @Get('all-teachers')
  @HttpCode(HttpStatus.OK)
  async getAllTeachersLeaveUsage(@Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const usage = await this.leaveUsageService.getAllTeachersLeaveUsage(
      user.id,
      userRole,
    );

    return {
      message: 'All teachers leave usage retrieved successfully',
      usage,
    };
  }

  /**
   * Reset teacher's leave usage (admin only)
   */
  @Post('teacher/:teacherId/reset')
  @HttpCode(HttpStatus.OK)
  async resetTeacherLeaveUsage(
    @Param('teacherId') teacherId: string,
    @Body()
    body: { leaveTypeId: string; resetType: 'YEARLY' | 'MONTHLY' | 'ALL' },
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const result = await this.leaveUsageService.resetTeacherLeaveUsage(
      teacherId,
      body.leaveTypeId,
      body.resetType,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: `Teacher leave usage reset successfully (${body.resetType})`,
      result,
    };
  }

  /**
   * Get leave usage statistics (admin only)
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getLeaveUsageStatistics(@Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const statistics = await this.leaveUsageService.getLeaveUsageStatistics(
      user.id,
      userRole,
    );

    return {
      message: 'Leave usage statistics retrieved successfully',
      statistics,
    };
  }

  /**
   * Get current usage for a specific teacher and leave type
   */
  @Get('teacher/:teacherId/leave-type/:leaveTypeId')
  @HttpCode(HttpStatus.OK)
  async getCurrentUsage(
    @Param('teacherId') teacherId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    // Check permissions
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.leaveUsageService['prisma'].teacher.findFirst({
        where: { userId: user.id, deletedAt: null },
      });
      if (!teacher || teacher.id !== teacherId) {
        throw new Error('You can only view your own leave usage');
      }
    } else if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN
    ) {
      throw new Error('Insufficient permissions');
    }

    const usage = await this.leaveUsageService.getCurrentUsage(
      teacherId,
      leaveTypeId,
    );

    return {
      message: 'Current usage retrieved successfully',
      usage,
    };
  }
}
