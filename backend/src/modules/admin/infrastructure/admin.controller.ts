// src/modules/admin/infrastructure/admin.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from '../application/admin.service';
import {
  CreateAdminSchema,
  CreateAdminDtoType,
  UpdateAdminSchema,
  UpdateAdminDtoType,
} from '../dto/admin.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';

@Controller('api/admin')
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateAdminSchema)) body: CreateAdminDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const result = await this.adminService.create(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Admin created successfully',
      admin: result.admin,
      ...(result.temporaryPassword && {
        temporaryPassword: result.temporaryPassword,
      }),
    };
  }

  @Get()
  async findAll() {
    return this.adminService.findAll();
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAdminSchema)) body: UpdateAdminDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.adminService.update(
      id,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.adminService.softDelete(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
