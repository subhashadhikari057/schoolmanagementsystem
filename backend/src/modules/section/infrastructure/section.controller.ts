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
  import { IsAuthenticated } from '../../../shared/guards/is-authenticated.guard';
  import { hasRole } from '../../../shared/guards/role.guard';
  import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
  
  @Controller('api/v1/sections')
  @UseGuards(IsAuthenticated)
  export class SectionController {
    constructor(private readonly sectionService: SectionService) {}
  
    @Post()
    @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
    @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER'))
    async findAll() {
      return this.sectionService.findAll();
    }
  
    @Get(':id')
    @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER'))
    async findById(@Param('id') id: string) {
      return this.sectionService.findById(id);
    }
  
    @Patch(':id')
    @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
    @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  