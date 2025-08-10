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
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@Controller('api/v1/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateStaffDto)) body: CreateStaffDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.staffService.create(body, user.id, ip, userAgent);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findAll(
    @Query(new ZodValidationPipe(GetAllStaffDto)) query: GetAllStaffDtoType,
  ) {
    return this.staffService.findAll(query);
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
