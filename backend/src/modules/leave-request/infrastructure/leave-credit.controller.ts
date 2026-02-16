import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { TeacherLeaveCreditService } from '../application/teacher-leave-credit.service';
import { CreateTeacherLeaveCreditDto } from '../dto/create-teacher-leave-credit.dto';
import { UserRole } from '@sms/shared-types';

@Controller('api/v1/leave-credits')
export class LeaveCreditController {
  constructor(private readonly leaveCreditService: TeacherLeaveCreditService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCredits(@Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const credits = await this.leaveCreditService.getAllCredits(userRole);

    return {
      message: 'All leave credits retrieved successfully',
      credits,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async grantCredit(
    @Body() body: CreateTeacherLeaveCreditDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const credit = await this.leaveCreditService.grantCredit(
      body,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Leave credit granted successfully',
      credit,
    };
  }

  @Patch(':creditId/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeCredit(
    @Param('creditId') creditId: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const credit = await this.leaveCreditService.revokeCredit(
      creditId,
      user.id,
      userRole,
      body?.reason,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Leave credit deallocated successfully',
      credit,
    };
  }

  @Get('teacher/:teacherId')
  @HttpCode(HttpStatus.OK)
  async getTeacherCredits(
    @Param('teacherId') teacherId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const credits = await this.leaveCreditService.getTeacherCredits(
      teacherId,
      user.id,
      userRole,
    );

    return {
      message: 'Leave credits retrieved successfully',
      credits,
    };
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  async getMyCredits(@Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    if (userRole !== UserRole.TEACHER) {
      throw new Error('Only teachers can access their leave credits');
    }

    const teacher = await this.leaveCreditService['prisma'].teacher.findFirst({
      where: { userId: user.id, deletedAt: null },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const credits = await this.leaveCreditService.getTeacherCredits(
      teacher.id,
      user.id,
      userRole,
    );

    return {
      message: 'Your leave credits retrieved successfully',
      credits,
    };
  }
}
