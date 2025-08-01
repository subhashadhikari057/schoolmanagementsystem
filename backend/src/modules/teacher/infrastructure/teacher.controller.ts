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
} from '@nestjs/common';
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
import { IsAuthenticated } from '../../../shared/guards/is-authenticated.guard';
import { hasRole } from '../../../shared/guards/role.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@Controller('api/v1/teachers')
@UseGuards(IsAuthenticated)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateTeacherDto)) body: CreateTeacherDtoType,
    @CurrentUser() user: { id: string }, // FIXME: implement proper type definition for user
    @Req() req: Request,
  ) {
    const result = await this.teacherService.create(
      body,
      user.id,
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  async findAll() {
    return this.teacherService.findAll();
  }

  @Get('me')
  @UseGuards(hasRole('TEACHER'))
  async getSelf(@CurrentUser() user: any) {
    return this.teacherService.findByUserId(user.id);
  }

  @Get(':id')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER'))
  async findById(@Param('id') id: string) {
    return this.teacherService.findById(id);
  }

  @Patch('me')
  @UseGuards(hasRole('TEACHER'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER'))
  async getSubjects(@Param('id') id: string) {
    return this.teacherService.getSubjects(id);
  }

  @Post(':id/subjects')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER'))
  async getAssignedClasses(@Param('id') id: string) {
    return this.teacherService.getAssignedClasses(id);
  }

  @Post(':id/classes')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  async unassignClass(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @Query('sectionId') sectionId: string | undefined,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.removeClass(
      id,
      classId,
      user.id,
      req.ip,
      req.headers['user-agent'],
      sectionId,
    );
  }

  @Delete(':id/classes')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  async unassignAllClasses(
    @Param('id') id: string,
    @Query('classId') classId: string | undefined,
    @Query('sectionId') sectionId: string | undefined,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.teacherService.removeAllClasses(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
      classId,
      sectionId,
    );
  }

  @Get(':id/profile')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER', 'STUDENT'))
  async getProfile(@Param('id') id: string) {
    return this.teacherService.getProfileOnly(id);
  }
}
