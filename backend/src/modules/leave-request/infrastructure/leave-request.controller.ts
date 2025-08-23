import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LeaveRequestService } from '../application/leave-request.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from '../dto';
import { UserRole } from '@sms/shared-types';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';

@Controller('api/v1/leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateLeaveRequestDto, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const leaveRequest = await this.leaveRequestService.create(
      body,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Leave request created', leaveRequest };
  }

  @Get()
  async findAll(@Query() query: any, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const result = await this.leaveRequestService.findAll(
      user.id,
      userRole,
      query,
    );
    return { message: 'Leave requests retrieved', ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const leaveRequest = await this.leaveRequestService.findOne(
      id,
      user.id,
      userRole,
    );
    return { message: 'Leave request retrieved', leaveRequest };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateLeaveRequestDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const leaveRequest = await this.leaveRequestService.update(
      id,
      body,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Leave request updated', leaveRequest };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const result = await this.leaveRequestService.delete(
      id,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return result;
  }

  @Post(':id/approve-parent')
  @HttpCode(HttpStatus.OK)
  async approveByParent(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const leaveRequest = await this.leaveRequestService.approveByParent(
      id,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Leave request approved by parent', leaveRequest };
  }

  @Post(':id/approve-teacher')
  @HttpCode(HttpStatus.OK)
  async approveByTeacher(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const leaveRequest = await this.leaveRequestService.approveByTeacher(
      id,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Leave request approved by teacher', leaveRequest };
  }

  @Post(':id/reject-parent')
  @HttpCode(HttpStatus.OK)
  async rejectByParent(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const leaveRequest = await this.leaveRequestService.rejectByParent(
      id,
      body.reason,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Leave request rejected by parent', leaveRequest };
  }

  @Post(':id/reject-teacher')
  @HttpCode(HttpStatus.OK)
  async rejectByTeacher(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const leaveRequest = await this.leaveRequestService.rejectByTeacher(
      id,
      body.reason,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Leave request rejected by teacher', leaveRequest };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const leaveRequest = await this.leaveRequestService.cancel(
      id,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Leave request cancelled', leaveRequest };
  }
}
