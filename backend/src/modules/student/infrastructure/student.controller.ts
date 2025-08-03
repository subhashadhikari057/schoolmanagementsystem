import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { StudentService } from '../application/student.service';
import { z } from 'zod';

// DTOs
import {
  CreateStudentDto,
  CreateStudentDtoType,
  CreateStudentWithNewParentsDto,
  CreateStudentWithNewParentsDtoType,
  CreateStudentWithExistingParentsDto,
  CreateStudentWithExistingParentsDtoType,
  UpdateStudentDto,
  UpdateStudentDtoType,
  SetPrimaryParentDto,
  SetPrimaryParentDtoType,
} from '../dto/student.dto';
import {
  CreateParentLinkDto,
  CreateParentLinkDtoType,
} from '../dto/parent-link.dto';
import {
  CreateStudentProfileDto,
  CreateStudentProfileDtoType,
  UpdateStudentProfileDto,
} from '../dto/student-profile.dto';
import {
  GetAllStudentsQuerySchema,
  GetAllStudentsQueryDtoType,
} from '../dto/get-all.dto';

// ✅ Combine both for self-update validation
const CombinedSelfUpdateDto = UpdateStudentDto.merge(UpdateStudentProfileDto);
type CombinedSelfUpdateDtoType = z.infer<typeof CombinedSelfUpdateDto>;

@Controller('api/v1/students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // 🔹 Create student with new parents
  @Post('create-with-new-parents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createStudentWithNewParents(
    @Body(new ZodValidationPipe(CreateStudentWithNewParentsDto))
    body: CreateStudentWithNewParentsDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const result = await this.studentService.createStudentWithNewParents(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Student and parents created successfully',
      student: result.student,
      ...(result.studentTemporaryPassword && {
        studentTemporaryPassword: result.studentTemporaryPassword,
      }),
      parents: result.parents,
    };
  }

  // 🔹 Create student with existing parents
  @Post('create-with-existing-parents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createStudentWithExistingParents(
    @Body(new ZodValidationPipe(CreateStudentWithExistingParentsDto))
    body: CreateStudentWithExistingParentsDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const result = await this.studentService.createStudentWithExistingParents(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Student created and linked to existing parents successfully',
      student: result.student,
      ...(result.studentTemporaryPassword && {
        studentTemporaryPassword: result.studentTemporaryPassword,
      }),
      ...(result.primaryParent && {
        primaryParent: result.primaryParent,
      }),
    };
  }

  // 🔹 Create student (legacy endpoint - backward compatibility)
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateStudentDto)) body: CreateStudentDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const result = await this.studentService.create(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Student created successfully',
      student: result.student,
      ...(result.studentTemporaryPassword && {
        studentTemporaryPassword: result.studentTemporaryPassword,
      }),
      parents: result.parents,
    };
  }

  // 🔹 Get all students (paginated)
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async findAll(
    @Query(new ZodValidationPipe(GetAllStudentsQuerySchema))
    query: GetAllStudentsQueryDtoType,
  ) {
    return this.studentService.findAll(query);
  }

  // 🔹 Get all parents (paginated) - MOVED UP before parameterized routes
  @Get('parents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllParents(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.studentService.getAllParents(
      Number(page),
      Number(limit),
      search,
    );
  }

  // 🔹 Get children (for parent user) - MOVED UP before parameterized routes
  @Get('me/children')
  @Roles(UserRole.PARENT)
  async getChildren(@CurrentUser() user: any) {
    return this.studentService.findChildrenOfParent(user.id);
  }

  // 🔹 Student self-update (basic info) - MOVED UP before parameterized routes
  @Patch('me')
  @Roles(UserRole.STUDENT)
  async updateSelf(
    @Body(new ZodValidationPipe(CombinedSelfUpdateDto))
    body: CombinedSelfUpdateDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.studentService.updateSelf(
      user.id,
      body,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // 🔹 Get single student by ID
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentService.findById(id, {
      id: user.id,
      roleNames: user.roles.map(r => r.role.name),
    });
  }

  // 🔹 Get profile (alias of findById)
  @Get(':id/profile')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  async getProfile(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentService.findById(id, {
      id: user.id,
      roleNames: user.roles.map(r => r.role.name),
    });
  }

  // 🔹 Admin update student
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStudentDto))
    body: UpdateStudentDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.studentService.updateByAdmin(
      id,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // 🔹 Admin adds/updates student profile
  @Patch(':id/profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async upsertProfile(
    @Param('id') studentId: string,
    @Body(new ZodValidationPipe(CreateStudentProfileDto))
    body: CreateStudentProfileDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.studentService.upsertProfile(
      studentId,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // 🔹 Soft-delete student
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.studentService.softDelete(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // 🔹 Get linked parents
  @Get(':id/parents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getParents(@Param('id') studentId: string) {
    return this.studentService.getStudentParents(studentId);
  }

  // 🔹 Set primary parent (handles all scenarios: contact→primary, user→primary, switching)
  @Patch(':id/parents/:linkId/set-primary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async setPrimaryParent(
    @Param('id') studentId: string,
    @Param('linkId') parentLinkId: string,
    @Body(new ZodValidationPipe(SetPrimaryParentDto))
    body: SetPrimaryParentDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.studentService.setPrimaryParent(
      studentId,
      parentLinkId,
      body.password,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
