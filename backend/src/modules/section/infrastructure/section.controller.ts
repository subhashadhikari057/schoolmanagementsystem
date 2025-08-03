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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { SectionService } from '../application/section.service';
import {
  CreateSectionSchema,
  CreateSectionDtoType,
  UpdateSectionSchema,
  UpdateSectionDtoType,
} from '../dto/section.dto';
import { ZodValidationPipe } from 'nestjs-zod';

import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';

@Controller('api/v1/sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateSectionSchema))
    body: CreateSectionDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.sectionService.create(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findAll() {
    return this.sectionService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findById(@Param('id') id: string) {
    return this.sectionService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSectionSchema))
    body: UpdateSectionDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.sectionService.update(
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
    return this.sectionService.softDelete(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
