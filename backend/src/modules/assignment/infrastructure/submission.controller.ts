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
} from '@nestjs/common';
import { SubmissionService } from '../application/submission.service';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
} from '../dto/submission.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RoleAccess, Roles } from '../../../shared/decorators/roles.decorator';
import { UserId } from '../../../shared/decorators/user.decorator';
import { UserRole } from '@sms/shared-types';

@Controller('api/v1/submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

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
}
