import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AssignmentService } from '../application/assignment.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentFiltersDto,
} from '../dto/assignment.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RoleAccess } from '../../../shared/decorators/roles.decorator';
import { UserId } from '../../../shared/decorators/user.decorator';

@Controller('api/v1/assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  /**
   * Create a new assignment
   * Available to teachers and super admins
   */
  @Post()
  @RoleAccess.Academic() // This allows SUPER_ADMIN, ADMIN, and TEACHER
  async create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    const assignment = await this.assignmentService.create(
      createAssignmentDto,
      userId,
      req.ip,
      req.get('User-Agent'),
    );

    return {
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    };
  }

  /**
   * Get all assignments with optional filtering
   * Available to all authenticated users
   */
  @Get()
  async findAll(@Query() filters: AssignmentFiltersDto) {
    const assignments = await this.assignmentService.findAll(filters);

    return {
      success: true,
      data: assignments,
    };
  }

  /**
   * Get assignment by ID
   * Available to all authenticated users
   */
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const assignment = await this.assignmentService.findById(id);

    return {
      success: true,
      data: assignment,
    };
  }

  /**
   * Update assignment
   * Available to teachers and super admins
   */
  @Put(':id')
  @RoleAccess.Academic()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    const assignment = await this.assignmentService.update(
      id,
      updateAssignmentDto,
      userId,
      req.ip,
      req.get('User-Agent'),
    );

    return {
      success: true,
      message: 'Assignment updated successfully',
      data: assignment,
    };
  }

  /**
   * Delete assignment
   * Available to teachers and super admins
   */
  @Delete(':id')
  @RoleAccess.Academic()
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    const result = await this.assignmentService.delete(
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
   * Get assignments by teacher
   * Available to all authenticated users
   */
  @Get('teacher/:teacherId')
  async findByTeacher(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    const assignments = await this.assignmentService.findByTeacher(teacherId);

    return {
      success: true,
      data: assignments,
    };
  }

  /**
   * Get assignments by class
   * Available to all authenticated users
   */
  @Get('class/:classId')
  async findByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    const assignments = await this.assignmentService.findByClass(classId);

    return {
      success: true,
      data: assignments,
    };
  }

  /**
   * Get assignments by subject
   * Available to all authenticated users
   */
  @Get('subject/:subjectId')
  async findBySubject(@Param('subjectId', ParseUUIDPipe) subjectId: string) {
    const assignments = await this.assignmentService.findBySubject(subjectId);

    return {
      success: true,
      data: assignments,
    };
  }
}
