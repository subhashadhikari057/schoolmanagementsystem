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
  import { IsAuthenticated } from '../../../shared/guards/is-authenticated.guard';
  import { hasRole } from '../../../shared/guards/role.guard';
  import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
  
  @Controller('api/v1/subjects')
  @UseGuards(IsAuthenticated, hasRole('SUPERADMIN', 'ADMIN'))
  export class SubjectController {
    constructor(private readonly subjectService: SubjectService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
      @Body(new ZodValidationPipe(CreateSubjectDto)) body: CreateSubjectDtoType,
      @CurrentUser() user: any,
      @Req() req: Request,
    ) {
      return this.subjectService.create(body, user.id, req.ip, req.headers['user-agent']);
    }
  
    @Get()
    async findAll() {
      return this.subjectService.findAll();
    }
  
    @Get(':id')
    async findById(@Param('id') id: string) {
      return this.subjectService.findById(id);
    }
  
    @Patch(':id')
    async update(
      @Param('id') id: string,
      @Body(new ZodValidationPipe(UpdateSubjectDto)) body: UpdateSubjectDtoType,
      @CurrentUser() user: any,
      @Req() req: Request,
    ) {
      return this.subjectService.update(id, body, user.id, req.ip, req.headers['user-agent']);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async softDelete(
      @Param('id') id: string,
      @CurrentUser() user: any,
      @Req() req: Request,
    ) {
      return this.subjectService.softDelete(id, user.id, req.ip, req.headers['user-agent']);
    }
  }
  