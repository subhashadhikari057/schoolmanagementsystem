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
import { ComplaintService } from '../application/complaint.service';
import { ComplaintAttachmentService } from '../application/complaint-attachment.service';
import { CreateComplaintDto, UpdateComplaintDto } from '@sms/shared-types';
import { UserRole } from '@sms/shared-types';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';

@Controller('api/v1/complaints')
export class ComplaintController {
  constructor(
    private readonly complaintService: ComplaintService,
    private readonly attachmentService: ComplaintAttachmentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateComplaintDto, @Req() req: any) {
    // Assume req.user is populated by auth middleware
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const complaint = await this.complaintService.create(
      body,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Complaint created', complaint };
  }

  @Get()
  async findAll(@Query() query: any, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const complaints = await this.complaintService.findAll(
      user.id,
      userRole,
      query,
    );
    return { message: 'Complaints retrieved', complaints };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    console.log('ComplaintController.findOne called with ID:', id);
    console.log('Request user:', req.user);

    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    console.log('User ID:', user.id);
    console.log('User Role:', userRole);

    const complaint = await this.complaintService.findOne(
      id,
      user.id,
      userRole,
    );
    return { message: 'Complaint retrieved', complaint };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateComplaintDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const complaint = await this.complaintService.update(
      id,
      body,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Complaint updated', complaint };
  }

  @Post(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body() body: { assignedToId: string },
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const complaint = await this.complaintService.assign(
      id,
      body.assignedToId,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Complaint assigned', complaint };
  }

  @Post(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() body: { resolution: string },
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const complaint = await this.complaintService.resolve(
      id,
      body.resolution,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Complaint resolved', complaint };
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      5, // Maximum 5 files
      createMulterConfig(UPLOAD_PATHS.COMPLAINT_ATTACHMENTS, 'document'),
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

  @Get(':id/attachments')
  async getAttachments(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const attachments = await this.attachmentService.getAttachments(
      id,
      user.id,
      userRole,
    );
    return { message: 'Attachments retrieved', attachments };
  }

  @Delete(':id/attachments/:attachmentId')
  async deleteAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const result = await this.attachmentService.deleteAttachment(
      attachmentId,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return result;
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const result = await this.complaintService.delete(
      id,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Complaint deleted successfully', result };
  }
}
