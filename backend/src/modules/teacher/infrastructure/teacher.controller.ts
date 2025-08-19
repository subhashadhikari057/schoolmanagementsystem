import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { TeacherService } from '../application/teacher.service';
import {
  CreateTeacherDto,
  CreateTeacherDtoType,
  UpdateTeacherByAdminDto,
  UpdateTeacherByAdminDtoType,
  UpdateTeacherSelfDto,
  UpdateTeacherSelfDtoType,
} from '../dto/teacher.dto';
import {
  AssignTeacherClassesDto,
  AssignTeacherClassesDtoType,
  RemoveTeacherClassDto,
} from '../dto/teacher-classes.dto.ts';
import {
  AssignSubjectsDto,
  AssignSubjectsDtoType,
} from '../dto/assign-subjects.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';

import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@Controller('api/v1/teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('photo', createMulterConfig(UPLOAD_PATHS.TEACHER_PROFILES)),
  )
  async create(
    @Body() body: any, // We'll parse and validate this manually due to multipart form data
    @UploadedFile() profilePicture: Express.Multer.File,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    try {
      // Helper function to safely parse JSON or return object if already parsed
      const safeJsonParse = (value: any) => {
        if (!value) return undefined;
        if (typeof value === 'object') return value; // Already parsed
        if (typeof value === 'string') return JSON.parse(value); // Parse string
        return value;
      };

      // Parse the nested JSON data from form-data or use directly if JSON
      const parsedData = {
        user: body.user ? safeJsonParse(body.user) : {},
        personal: body.personal ? safeJsonParse(body.personal) : undefined,
        professional: body.professional ? safeJsonParse(body.professional) : {},
        subjects: body.subjects ? safeJsonParse(body.subjects) : undefined,
        salary: body.salary ? safeJsonParse(body.salary) : undefined,
        bankDetails: body.bankDetails
          ? safeJsonParse(body.bankDetails)
          : undefined,
        additional: body.additional
          ? safeJsonParse(body.additional)
          : undefined,
      };

      // Validate using Zod
      const validatedData = CreateTeacherDto.parse(parsedData);

      const result = await this.teacherService.create(
        validatedData,
        user.id,
        profilePicture,
        req.ip,
        req.headers['user-agent'],
      );

      return {
        message: 'Teacher created successfully',
        teacher: result.teacher,
        ...(result.temporaryPassword && {
          temporaryPassword: result.temporaryPassword,
        }),
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        console.error(
          'Zod Validation Error:',
          JSON.stringify(error.errors, null, 2),
        );
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors,
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received,
          })),
        });
      }
      console.error('Teacher Creation Error:', error);
      throw error;
    }
  }

  /**
   * Get next auto-generated employee ID
   */
  @Get('next-employee-id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getNextEmployeeId() {
    const currentYear = new Date().getFullYear();
    const teacherCount = await this.teacherService.getTeacherCount();
    const nextEmployeeId = `T-${currentYear}-${(teacherCount + 1).toString().padStart(4, '0')}`;

    return {
      employeeId: nextEmployeeId,
      sequence: teacherCount + 1,
      year: currentYear,
    };
  }

  /**
   * Calculate total salary from basic salary and allowances
   */
  @Post('calculate-salary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async calculateSalary(
    @Body() body: { basicSalary?: number; allowances?: number },
  ) {
    const basicSalary = body.basicSalary || 0;
    const allowances = body.allowances || 0;
    const totalSalary = basicSalary + allowances;

    return {
      basicSalary,
      allowances,
      totalSalary,
    };
  }

  /**
   * Create teacher without file upload (JSON only)
   */
  @Post('json')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createWithJson(
    @Body(new ZodValidationPipe(CreateTeacherDto)) body: CreateTeacherDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const result = await this.teacherService.create(
      body,
      user.id,
      undefined, // No file
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Teacher created successfully',
      teacher: result.teacher,
      ...(result.temporaryPassword && {
        temporaryPassword: result.temporaryPassword,
      }),
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findAll() {
    return this.teacherService.findAll();
  }

  @Get('me')
  @Roles(UserRole.TEACHER)
  async getSelf(@CurrentUser() user: any) {
    return this.teacherService.findByUserId(user.id);
  }

  @Get('me/subjects')
  @Roles(UserRole.TEACHER)
  async getMySubjects(@CurrentUser() user: any) {
    const teacher = await this.teacherService.findByUserId(user.id);
    return this.teacherService.getSubjects(teacher.id);
  }

  @Get('me/classes/:classId/subjects')
  @Roles(UserRole.TEACHER)
  async getMySubjectsForClass(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    const teacher = await this.teacherService.findByUserId(user.id);
    return this.teacherService.getSubjectsForClass(teacher.id, classId);
  }

  @Get('me/classes')
  @Roles(UserRole.TEACHER)
  async getMyClasses(@CurrentUser() user: any) {
    const teacher = await this.teacherService.findByUserId(user.id);
    return this.teacherService.getAssignedClasses(teacher.id);
  }

  @Get('me/class-teacher-class')
  @Roles(UserRole.TEACHER)
  async getMyClassTeacherClass(@CurrentUser() user: any) {
    const teacher = await this.teacherService.findByUserId(user.id);
    return this.teacherService.getClassTeacherClass(teacher.id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findById(@Param('id') id: string) {
    return this.teacherService.findById(id);
  }

  @Patch('me')
  @Roles(UserRole.TEACHER)
  async updateSelf(
    @Body(new ZodValidationPipe(UpdateTeacherSelfDto))
    body: UpdateTeacherSelfDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.updateSelf(
      user.id,
      body,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTeacherByAdminDto))
    body: UpdateTeacherByAdminDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.updateByAdmin(
      id,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.softDelete(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id/subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getSubjects(@Param('id') id: string) {
    return this.teacherService.getSubjects(id);
  }

  @Post(':id/subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async assignSubjects(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignSubjectsDto))
    body: AssignSubjectsDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.assignSubjects(
      id,
      body.subjectIds,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id/subjects/:subjectId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async unassignSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.removeSubject(
      id,
      subjectId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id/classes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getAssignedClasses(@Param('id') id: string) {
    return this.teacherService.getAssignedClasses(id);
  }

  @Post(':id/classes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async assignClasses(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignTeacherClassesDto))
    body: AssignTeacherClassesDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.assignClasses(
      id,
      body.assignments, // ✅ updated field from new DTO
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id/classes/:classId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async unassignClass(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.removeClass(
      id,
      classId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id/classes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async unassignAllClasses(
    @Param('id') id: string,
    @Query('classId') classId: string | undefined,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.removeAllClasses(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
      classId,
    );
  }

  @Get(':id/profile')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  async getProfile(@Param('id') id: string) {
    return this.teacherService.getProfileOnly(id);
  }
}
