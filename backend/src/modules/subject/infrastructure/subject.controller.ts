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
import { SubjectService } from '../application/subject.service';
import {
  CreateSubjectDto,
  CreateSubjectDtoType,
  UpdateSubjectDto,
  UpdateSubjectDtoType,
} from '../dto/subject.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';

@Controller('api/v1/subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateSubjectDto)) body: CreateSubjectDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.subjectService.create(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findAll() {
    return this.subjectService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findById(@Param('id') id: string) {
    return this.subjectService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSubjectDto)) body: UpdateSubjectDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.subjectService.update(
      id,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.subjectService.softDelete(
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
