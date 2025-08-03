import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
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
import { IsAuthenticated } from '../../../shared/guards/is-authenticated.guard';
import { hasRole } from '../../../shared/guards/role.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@Controller('api/v1/classes')
@UseGuards(IsAuthenticated)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER'))
  async findAll() {
    return this.classService.findAll(); // returns class + sections[]
  }

  @Get(':id')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN', 'TEACHER'))
  async findById(@Param('id') id: string) {
    return this.classService.findById(id); // returns class + sections[]
  }

  @Patch(':id')
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
  @UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
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
}
