/**
 * =============================================================================
 * School Information Controller
 * =============================================================================
 * REST API endpoints for managing school information settings.
 * Only SUPER_ADMIN can create/update school information.
 * All users can read school information.
 * =============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from 'nestjs-zod';
import { SchoolInformationService } from '../application/school-information.service';
import {
  CreateSchoolInformationDto,
  UpdateSchoolInformationDto,
  CreateSchoolInformationDtoType,
  UpdateSchoolInformationDtoType,
} from '../dto/school-information.dto';

@Controller('api/v1/school-information')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolInformationController {
  constructor(
    private readonly schoolInformationService: SchoolInformationService,
  ) {}

  /**
   * Create school information (SUPER_ADMIN only)
   */
  @Post()
  @RoleAccess.SuperAdminOnly()
  async create(
    @Body(new ZodValidationPipe(CreateSchoolInformationDto))
    body: CreateSchoolInformationDtoType,
    @CurrentUser() user: { id: string; role: string },
    @Req() req: Request,
  ) {
    const result = await this.schoolInformationService.create(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: result.message,
      data: result.schoolInformation,
    };
  }

  /**
   * Get school information (accessible to all authenticated users)
   */
  @Get()
  @RoleAccess.Authenticated()
  async findOne() {
    const schoolInformation = await this.schoolInformationService.findOne();

    return {
      statusCode: HttpStatus.OK,
      message: schoolInformation
        ? 'School information retrieved successfully'
        : 'School information not found',
      data: schoolInformation,
    };
  }

  /**
   * Update school information (SUPER_ADMIN only)
   */
  @Put()
  @RoleAccess.SuperAdminOnly()
  async update(
    @Body(new ZodValidationPipe(UpdateSchoolInformationDto))
    body: UpdateSchoolInformationDtoType,
    @CurrentUser() user: { id: string; role: string },
    @Req() req: Request,
  ) {
    const result = await this.schoolInformationService.update(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result.schoolInformation,
    };
  }

  /**
   * Create or update school information (upsert) (SUPER_ADMIN only)
   */
  @Post('upsert')
  @RoleAccess.SuperAdminOnly()
  async createOrUpdate(
    @Body(new ZodValidationPipe(CreateSchoolInformationDto))
    body: CreateSchoolInformationDtoType,
    @CurrentUser() user: { id: string; role: string },
    @Req() req: Request,
  ) {
    const result = await this.schoolInformationService.createOrUpdate(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result.schoolInformation,
    };
  }

  /**
   * Check if school information exists
   */
  @Get('exists')
  @RoleAccess.Authenticated()
  async exists() {
    const exists = await this.schoolInformationService.exists();

    return {
      statusCode: HttpStatus.OK,
      message: 'School information existence check completed',
      data: { exists },
    };
  }
}
