import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SubmissionService } from '../application/submission.service';
import { SubmissionAttachmentService } from '../application/submission-attachment.service';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
} from '../dto/submission.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RoleAccess, Roles } from '../../../shared/decorators/roles.decorator';
import { UserId } from '../../../shared/decorators/user.decorator';
import { UserRole } from '@sms/shared-types';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';

@Controller('api/v1/submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly attachmentService: SubmissionAttachmentService,
  ) {}

  /**
   * Create or update a submission
   * Available to students and teachers
   */
  @Post()
  async createOrUpdate(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    const submission = await this.submissionService.createOrUpdate(
      createSubmissionDto,
      userId,
      req.ip,
      req.get('User-Agent'),
    );

    return {
      success: true,
      message: 'Submission saved successfully',
      data: submission,
    };
  }

  /**
   * Get submission by ID
   * Available to all authenticated users
   */
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const submission = await this.submissionService.findById(id);

    return {
      success: true,
      data: submission,
    };
  }

  /**
   * Grade a submission
   * Available to teachers and admins
   */
  @Put(':id/grade')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async gradeSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    const submission = await this.submissionService.gradeSubmission(
      id,
      updateSubmissionDto,
      userId,
      req.ip,
      req.get('User-Agent'),
    );

    return {
      success: true,
      message: 'Submission graded successfully',
      data: submission,
    };
  }

  /**
   * Delete submission
   * Available to teachers and admins
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    const result = await this.submissionService.delete(
      id,
      userId,
      req.ip,
      req.get('User-Agent'),
    );

    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * Get all submissions for an assignment
   * Available to teachers and admins
   */
  @Get('assignment/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findByAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ) {
    const submissions =
      await this.submissionService.findByAssignment(assignmentId);

    return {
      success: true,
      data: submissions,
    };
  }

  /**
   * Get all submissions by a student
   * Available to all authenticated users
   */
  @Get('student/:studentId')
  async findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    const submissions = await this.submissionService.findByStudent(studentId);

    return {
      success: true,
      data: submissions,
    };
  }

  /**
   * Get submission history for a specific assignment and student
   * Available to all authenticated users
   */
  @Get('assignment/:assignmentId/student/:studentId')
  async findByAssignmentAndStudent(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    const submissions = await this.submissionService.findByAssignmentAndStudent(
      assignmentId,
      studentId,
    );

    return {
      success: true,
      data: submissions,
    };
  }

  /**
   * Upload attachments to submission
   * Available to students, teachers, and admins
   */
  @Post(':id/attachments')
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      5, // Maximum 5 files
      createMulterConfig(UPLOAD_PATHS.SUBMISSION_ATTACHMENTS, 'document'),
    ),
  )
  async uploadAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
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
      req.get('User-Agent'),
    );

    return {
      success: true,
      message: result.message,
      data: result.attachments,
    };
  }

  /**
   * Get attachments for submission
   * Available to all authenticated users
   */
  @Get(':id/attachments')
  async getAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;

    const attachments = await this.attachmentService.getAttachments(
      id,
      user.id,
      userRole,
    );

    return {
      success: true,
      data: attachments,
    };
  }

  /**
   * Delete attachment from submission
   * Available to students, teachers, and admins
   */
  @Delete(':id/attachments/:attachmentId')
  async deleteAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Request() req: any,
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
      req.get('User-Agent'),
    );

    return {
      success: true,
      message: result.message,
    };
  }
}
