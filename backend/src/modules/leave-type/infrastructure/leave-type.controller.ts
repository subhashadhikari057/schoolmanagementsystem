import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { LeaveTypeService } from '../application/leave-type.service';
import { CreateLeaveTypeDto } from '../dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../dto/update-leave-type.dto';
import { QueryLeaveTypeDtoType } from '../dto/query-leave-type.dto';
import { UserRole } from '@sms/shared-types';

@Controller('api/v1/leave-types')
export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) {}

  @Post()
  async create(@Body() body: unknown, @Req() req: any) {
    // Check if user has admin or super admin role
    const userRole = Array.isArray(req.user.roles)
      ? req.user.roles[0]
      : req.user.role || req.user.roles;

    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      throw new Error('Unauthorized: Only admins can create leave types');
    }

    const parsed = CreateLeaveTypeDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsed.error.issues,
      });
    }

    return this.leaveTypeService.create(parsed.data, req.user.id);
  }

  @Get()
  async findAll(@Query() query: any, @Req() req: any) {
    // Allow teachers, admins, and super admins to view leave types
    const userRole = Array.isArray(req.user.roles)
      ? req.user.roles[0]
      : req.user.role || req.user.roles;

    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER].includes(
        userRole,
      )
    ) {
      throw new Error(
        'Unauthorized: Only teachers, admins, and super admins can view leave types',
      );
    }

    // Transform query parameters manually
    const transformedQuery: QueryLeaveTypeDtoType = {
      name: query.name,
      isPaid:
        query.isPaid === 'true'
          ? true
          : query.isPaid === 'false'
            ? false
            : undefined,
      status: query.status,
      eligibilityGender: query.eligibilityGender,
    };

    return this.leaveTypeService.findAll(transformedQuery);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    // Allow teachers, admins, and super admins to view leave type stats
    const userRole = Array.isArray(req.user.roles)
      ? req.user.roles[0]
      : req.user.role || req.user.roles;

    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER].includes(
        userRole,
      )
    ) {
      throw new Error(
        'Unauthorized: Only teachers, admins, and super admins can view leave type stats',
      );
    }

    return this.leaveTypeService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    // Allow teachers, admins, and super admins to view leave types
    const userRole = Array.isArray(req.user.roles)
      ? req.user.roles[0]
      : req.user.role || req.user.roles;

    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER].includes(
        userRole,
      )
    ) {
      throw new Error(
        'Unauthorized: Only teachers, admins, and super admins can view leave types',
      );
    }

    return this.leaveTypeService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    // Check if user has admin or super admin role
    const userRole = Array.isArray(req.user.roles)
      ? req.user.roles[0]
      : req.user.role || req.user.roles;

    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      throw new Error('Unauthorized: Only admins can update leave types');
    }

    const parsed = UpdateLeaveTypeDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsed.error.issues,
      });
    }

    return this.leaveTypeService.update(id, parsed.data, req.user.id);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string, @Req() req: any) {
    // Check if user has admin or super admin role
    const userRole = Array.isArray(req.user.roles)
      ? req.user.roles[0]
      : req.user.role || req.user.roles;

    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      throw new Error('Unauthorized: Only admins can toggle leave type status');
    }

    return this.leaveTypeService.toggleStatus(id, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    // Check if user has admin or super admin role
    const userRole = Array.isArray(req.user.roles)
      ? req.user.roles[0]
      : req.user.role || req.user.roles;

    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      throw new Error('Unauthorized: Only admins can delete leave types');
    }

    return this.leaveTypeService.remove(id, req.user.id);
  }
}
