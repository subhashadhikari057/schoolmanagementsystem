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
import { StaffService } from '../application/staff.service';
import {
  CreateStaffDto,
  CreateStaffDtoType,
  UpdateStaffByAdminDto,
  UpdateStaffByAdminDtoType,
  UpdateStaffSelfDto,
  UpdateStaffSelfDtoType,
  GetAllStaffDto,
  GetAllStaffDtoType,
} from '../dto/staff.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { EmailService } from '../../../shared/email/email.service';

@Controller('api/v1/staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('photo', createMulterConfig(UPLOAD_PATHS.STAFF_PROFILES)),
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
        if (typeof value === 'string') {
          // Handle the case where the string is literally "undefined"
          if (value === 'undefined' || value === 'null') return undefined;
          return JSON.parse(value); // Parse string
        }
        return value;
      };

      // Parse the nested JSON data from form-data or use directly if JSON
      const parsedData = {
        user: body.user ? safeJsonParse(body.user) : {},
        profile: body.profile ? safeJsonParse(body.profile) : {},
        salary: body.salary ? safeJsonParse(body.salary) : undefined,
        bankDetails: body.bankDetails
          ? safeJsonParse(body.bankDetails)
          : undefined,
        permissions: body.permissions
          ? safeJsonParse(body.permissions)
          : undefined,
      };

      // Validate using Zod
      const validatedData = CreateStaffDto.parse(parsedData);
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await this.staffService.create(
        validatedData,
        user.id,
        profilePicture,
        ip,
        userAgent,
      );

      const welcomePassword =
        validatedData.user?.password ?? (result.data as any)?.temporaryPassword;
      if (result.data?.staff?.hasLoginAccount && welcomePassword) {
        try {
          await this.emailService.sendWelcomeUserEmail({
            to: validatedData.user.email,
            name: result.data.staff.fullName,
            role: 'Staff',
            email: validatedData.user.email,
            password: welcomePassword,
          });
        } catch {
          // Ignore email failures to avoid blocking staff creation.
        }
      }

      return result;
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
    @Query(new ZodValidationPipe(GetAllStaffDto)) query: GetAllStaffDtoType,
  ) {
    return this.staffService.findAll(query);
  }

  /**
   * Get total count of staff members
   * (placed above the dynamic ':id' route so it is matched first)
   */
  @Get('count')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getStaffCount() {
    const count = await this.staffService.getStaffCount();
    return {
      message: 'Staff count retrieved successfully',
      data: { count },
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF)
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateByAdmin(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStaffByAdminDto))
    body: UpdateStaffByAdminDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.staffService.updateByAdmin(id, body, user.id, ip, userAgent);
  }

  @Patch(':id/self')
  @Roles(UserRole.STAFF)
  async updateSelf(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStaffSelfDto))
    body: UpdateStaffSelfDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.staffService.updateSelf(id, body, user.id, ip, userAgent);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.staffService.remove(id, user.id, ip, userAgent);
  }

  // Additional endpoints specific to staff management

  @Get('department/:department')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async findByDepartment(
    @Param('department') department: string,
    @Query(new ZodValidationPipe(GetAllStaffDto)) query: GetAllStaffDtoType,
  ) {
    const queryWithDepartment = { ...query, department: department as any };
    return this.staffService.findAll(queryWithDepartment);
  }

  @Get('stats/dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getDashboardStats() {
    // This could be implemented to return staff statistics
    // For now, return basic stats
    return {
      message: 'Staff dashboard stats endpoint - to be implemented',
      data: {
        totalStaff: 0,
        activeStaff: 0,
        departmentBreakdown: {},
      },
    };
  }

  /**
   * Get next auto-generated employee ID
   */
  @Get('next-employee-id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getNextEmployeeId() {
    try {
      const currentYear = new Date().getFullYear();
      const staffCount = await this.staffService.getStaffCount();
      const nextEmployeeId = `S-${currentYear}-${(staffCount + 1).toString().padStart(4, '0')}`;

      return {
        employeeId: nextEmployeeId,
        sequence: staffCount + 1,
        year: currentYear,
      };
    } catch (_) {
      // If there's an error, return a default employee ID
      const currentYear = new Date().getFullYear();
      return {
        employeeId: `S-${currentYear}-0001`,
        sequence: 1,
        year: currentYear,
      };
    }
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

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateEmploymentStatus(
    @Param('id') id: string,
    @Body() body: { employmentStatus: string },
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.staffService.updateByAdmin(
      id,
      { profile: { employmentStatus: body.employmentStatus as any } },
      user.id,
      ip,
      userAgent,
    );
  }
}
