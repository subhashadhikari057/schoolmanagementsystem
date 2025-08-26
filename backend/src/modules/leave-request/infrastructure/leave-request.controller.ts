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
  BadRequestException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LeaveRequestService } from '../application/leave-request.service';
import { LeaveRequestAttachmentService } from '../application/leave-request-attachment.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from '../dto';
import { UserRole } from '@sms/shared-types';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';
import {
  CreateTeacherLeaveRequestDto,
  AdminLeaveRequestActionDto,
} from '../dto';

@Controller('api/v1/leave-requests')
export class LeaveRequestController {
  constructor(
    private readonly leaveRequestService: LeaveRequestService,
    private readonly attachmentService: LeaveRequestAttachmentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      10,
      createMulterConfig(UPLOAD_PATHS.LEAVE_REQUEST_ATTACHMENTS, 'document'),
    ),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    // Parse the body data and add files
    const createData: CreateLeaveRequestDto = {
      title: body.title,
      description: body.description,
      type: body.type,
      start_date: body.start_date,
      end_date: body.end_date,
      attachments: files || [],
    };

    // Validate required fields
    if (
      !createData.title ||
      !createData.type ||
      !createData.start_date ||
      !createData.end_date
    ) {
      throw new BadRequestException(
        'Missing required fields: title, type, start_date, end_date',
      );
    }

    const leaveRequest = await this.leaveRequestService.create(
      createData,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Leave request created', leaveRequest };
  }

  @Post(':id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      10,
      createMulterConfig(UPLOAD_PATHS.LEAVE_REQUEST_ATTACHMENTS, 'document'),
    ),
  )
  async uploadAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const result = await this.attachmentService.uploadAttachments(
      id,
      files,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );

    return result;
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

  // =====================
  // Teacher Leave Request Endpoints (MUST come before :id routes)
  // =====================

  @Post('teacher')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      10,
      createMulterConfig(
        UPLOAD_PATHS.TEACHER_LEAVE_REQUEST_ATTACHMENTS,
        'document',
      ),
    ),
  )
  async createTeacherLeaveRequest(
    @Body() createTeacherLeaveRequestDto: CreateTeacherLeaveRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    // Add uploaded files to the DTO
    if (files && files.length > 0) {
      createTeacherLeaveRequestDto.attachments = files;
    }

    const teacherLeaveRequest =
      await this.leaveRequestService.createTeacherLeaveRequest(
        createTeacherLeaveRequestDto,
        user.id,
        userRole,
        req.ip,
        req.headers['user-agent'],
      );
    return {
      message: 'Teacher leave request created successfully',
      teacherLeaveRequest,
    };
  }

  @Get('teacher')
  @HttpCode(HttpStatus.OK)
  async getTeacherLeaveRequests(
    @Req() req: any,
    @Query('teacherId') teacherId?: string,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const teacherLeaveRequests =
      await this.leaveRequestService.getTeacherLeaveRequests(
        user.id,
        userRole,
        teacherId,
      );
    return { teacherLeaveRequests };
  }

  @Get('teacher/:id')
  @HttpCode(HttpStatus.OK)
  async getTeacherLeaveRequestById(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const teacherLeaveRequest =
      await this.leaveRequestService.getTeacherLeaveRequestById(
        id,
        user.id,
        userRole,
      );
    return { teacherLeaveRequest };
  }

  @Post('teacher/:id/admin-action')
  @HttpCode(HttpStatus.OK)
  async adminActionOnTeacherLeaveRequest(
    @Param('id') id: string,
    @Body() actionDto: AdminLeaveRequestActionDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const teacherLeaveRequest =
      await this.leaveRequestService.adminActionOnTeacherLeaveRequest(
        id,
        user.id,
        userRole,
        actionDto,
        req.ip,
        req.headers['user-agent'],
      );

    const actionMessage =
      actionDto.status === 'APPROVED'
        ? 'Teacher leave request approved successfully'
        : 'Teacher leave request rejected successfully';

    return { message: actionMessage, teacherLeaveRequest };
  }

  @Post('teacher/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTeacherLeaveRequest(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const teacherLeaveRequest =
      await this.leaveRequestService.cancelTeacherLeaveRequest(
        id,
        user.id,
        userRole,
        req.ip,
        req.headers['user-agent'],
      );
    return { message: 'Teacher leave request cancelled', teacherLeaveRequest };
  }

  // =====================
  // Teacher Leave Request Attachment Endpoints
  // =====================

  @Post('teacher/:id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      10,
      createMulterConfig(
        UPLOAD_PATHS.TEACHER_LEAVE_REQUEST_ATTACHMENTS,
        'document',
      ),
    ),
  )
  async uploadTeacherLeaveRequestAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const result =
      await this.attachmentService.uploadTeacherLeaveRequestAttachments(
        id,
        files,
        user.id,
        userRole,
        req.ip,
        req.headers['user-agent'],
      );

    return result;
  }

  @Get('teacher/:id/attachments')
  @HttpCode(HttpStatus.OK)
  async getTeacherLeaveRequestAttachments(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const attachments =
      await this.attachmentService.getTeacherLeaveRequestAttachments(
        id,
        user.id,
        userRole,
      );

    return { attachments };
  }

  @Delete('teacher/attachments/:attachmentId')
  @HttpCode(HttpStatus.OK)
  async deleteTeacherLeaveRequestAttachment(
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const result =
      await this.attachmentService.deleteTeacherLeaveRequestAttachment(
        attachmentId,
        user.id,
        userRole,
        req.ip,
        req.headers['user-agent'],
      );

    return result;
  }

  // =====================
  // Generic Leave Request Endpoints (MUST come after specific routes)
  // =====================

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
