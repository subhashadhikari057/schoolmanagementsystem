import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { ClassService } from '../application/class.service';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateClassDto,
  CreateClassDtoType,
  UpdateClassDto,
  UpdateClassDtoType,
} from '../dto/class.dto';

import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';

@Controller('api/v1/classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateClassDto))
    body: CreateClassDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.classService.create(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findAll() {
    return this.classService.findAll(); // returns class + sections[]
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findById(@Param('id') id: string) {
    return this.classService.findById(id); // returns class + sections[]
  }

  @Get(':id/students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getClassWithStudents(@Param('id') id: string) {
    return this.classService.getClassDetailsWithStudents(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateClassDto))
    body: UpdateClassDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.classService.update(
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
    return this.classService.softDelete(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('rooms/available')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAvailableRooms(@Query('shift') shift: 'MORNING' | 'DAY') {
    if (!shift || !['MORNING', 'DAY'].includes(shift)) {
      shift = 'MORNING'; // Default to MORNING if not specified or invalid
    }
    return this.classService.getAvailableRoomsForShift(shift);
  }

  @Get('teachers/available')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAvailableTeachers() {
    return this.classService.getAvailableTeachers();
  }

  @Post(':id/sync-enrollment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async syncEnrollmentCount(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const count = await this.classService.syncEnrollmentCount(id);
    return { message: 'Enrollment count synced successfully', count };
  }
}
