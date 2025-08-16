import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { StudentService } from '../application/student.service';
import {
  CreateStudentDto,
  CreateStudentDtoType,
  UpdateStudentByAdminDto,
  UpdateStudentByAdminDtoType,
  UpdateStudentSelfDto,
  UpdateStudentSelfDtoType,
  GetAllStudentsDto,
  GetAllStudentsDtoType,
} from '../dto/student.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@Controller('api/v1/students')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('photo', createMulterConfig(UPLOAD_PATHS.STUDENT_PROFILES)),
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
        academic: body.academic ? safeJsonParse(body.academic) : {},
        parentInfo: body.parentInfo ? safeJsonParse(body.parentInfo) : {},
        parents: body.parents ? safeJsonParse(body.parents) : undefined,
        guardians: body.guardians ? safeJsonParse(body.guardians) : undefined,
        additional: body.additional
          ? safeJsonParse(body.additional)
          : undefined,
        profile: body.profile ? safeJsonParse(body.profile) : undefined,
      };

      // Validate using Zod
      const validatedData = CreateStudentDto.parse(parsedData);

      const result = await this.studentService.create(
        validatedData,
        user.id,
        profilePicture,
        req.ip,
        req.headers['user-agent'],
      );

      return {
        message: 'Student created successfully',
        student: result.student,
        ...(result.temporaryPassword && {
          temporaryPassword: result.temporaryPassword,
        }),
        ...(result.parentCredentials &&
          result.parentCredentials.length > 0 && {
            parentCredentials: result.parentCredentials,
          }),
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      throw error;
    }
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findAll(
    @Query(new ZodValidationPipe(GetAllStudentsDto))
    query: GetAllStudentsDtoType,
  ) {
    return this.studentService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findOne(@Param('id') id: string) {
    return this.studentService.findById(id);
  }

  @Get('user/:userId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  async findByUserId(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    // Students can only access their own profile
    if (user.role === 'STUDENT' && user.id !== userId) {
      throw new BadRequestException('Access denied');
    }
    return this.studentService.findByUserId(userId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateByAdmin(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStudentByAdminDto))
    updateData: UpdateStudentByAdminDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.studentService.updateByAdmin(
      id,
      updateData,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch('profile/self')
  @Roles(UserRole.STUDENT)
  async updateSelf(
    @Body(new ZodValidationPipe(UpdateStudentSelfDto))
    updateData: UpdateStudentSelfDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.studentService.updateSelf(
      user.id,
      updateData,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.studentService.softDelete(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id/parents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getParents(@Param('id') id: string) {
    return this.studentService.getParents(id);
  }

  @Get(':id/guardians')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getGuardians(@Param('id') id: string) {
    return this.studentService.getGuardians(id);
  }

  @Get('stats/count')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getStudentCount() {
    const count = await this.studentService.getStudentCount();
    return { count };
  }

  @Get('available-classes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getAvailableClasses() {
    const classes = await this.studentService.getAvailableClasses();
    return { classes };
  }
}
