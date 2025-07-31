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
import { IsAuthenticated } from '../../../shared/guards/is-authenticated.guard';
import { hasRole } from '../../../shared/guards/role.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { StudentService } from '../application/student.service';
import { z } from 'zod';


// DTOs
import {
  CreateStudentDto,
  CreateStudentDtoType,
  UpdateStudentDto,
  UpdateStudentDtoType,
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
@UseGuards(IsAuthenticated)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // 🔹 Create student (with parents)
  @Post()
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
      ...(result.temporaryPassword && {
        temporaryPassword: result.temporaryPassword,
      }),
      ...(result.parentAccount && {
        parentAccount: result.parentAccount,
      }),
    };
  }

  // 🔹 Get all students (paginated)
  @Get()
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  async findAll(
    @Query(new ZodValidationPipe(GetAllStudentsQuerySchema))
    query: GetAllStudentsQueryDtoType,
  ) {
    return this.studentService.findAll(query);
  }

  // 🔹 Get all parents (paginated) - MOVED UP before parameterized routes
  @Get('parents')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  async getAllParents(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.studentService.getAllParents(Number(page), Number(limit), search);
  }

  // 🔹 Get children (for parent user) - MOVED UP before parameterized routes
  @Get('me/children')
  @UseGuards(hasRole('PARENT'))
  async getChildren(@CurrentUser() user: any) {
    return this.studentService.findChildrenOfParent(user.id);
  }

  // 🔹 Student self-update (basic info) - MOVED UP before parameterized routes
  @Patch('me')
  @UseGuards(hasRole('STUDENT'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT'))
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentService.findById(id, {
      id: user.id,
      roleNames: user.roles.map((r) => r.role.name),
    });
  }

  // 🔹 Get profile (alias of findById)
  @Get(':id/profile')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT'))
  async getProfile(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentService.findById(id, {
      id: user.id,
      roleNames: user.roles.map((r) => r.role.name),
    });
  }


  // 🔹 Admin update student
  @Patch(':id')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  async getParents(@Param('id') studentId: string) {
    return this.studentService.getStudentParents(studentId);
  }

  // 🔹 Link new parent
  @Post(':id/parents')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  @HttpCode(HttpStatus.CREATED)
  async linkParent(
    @Param('id') studentId: string,
    @Body(new ZodValidationPipe(CreateParentLinkDto)) body: CreateParentLinkDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.studentService.addParentToStudent(
      studentId,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // 🔹 Unlink parent
  @Delete(':id/parents/:parentId')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  async unlinkParent(
    @Param('id') studentId: string,
    @Param('parentId') parentId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.studentService.unlinkParent(
      studentId,
      parentId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // 🔹 Make parent primary
  @Patch(':id/parents/:parentId/primary')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
  async makePrimary(
    @Param('id') studentId: string,
    @Param('parentId') parentId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.studentService.makeParentPrimary(
      studentId,
      parentId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }


  
}
