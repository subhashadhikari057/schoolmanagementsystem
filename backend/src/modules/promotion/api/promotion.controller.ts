/**
 * =============================================================================
 * Promotion Controller
 * =============================================================================
 * REST API endpoints for student promotion management.
 * Handles promotion preview, execution, and academic year management.
 * =============================================================================
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { PromotionService } from '../application/promotion.service';
import {
  PreviewPromotionDto,
  PreviewPromotionSchema,
  ExecutePromotionDto,
  ExecutePromotionSchema,
  IndividualPromotionDto,
  IndividualPromotionSchema,
  CreateAcademicYearDto,
  CreateAcademicYearSchema,
  UpdateAcademicYearDto,
  UpdateAcademicYearSchema,
  PromotionPreviewResponseDto,
  PromotionExecutionResult,
  IndividualPromotionResult,
  PromotionBatchResponseDto,
  AcademicYearResponseDto,
} from '../dto/promotion.dto';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@Controller('api/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  /**
   * Debug endpoint to check classes in database
   */
  @Get('debug/classes')
  @Roles(UserRole.SUPER_ADMIN)
  async debugClasses() {
    return this.promotionService.debugClasses();
  }

  /**
   * Debug endpoint to check promotion batches
   */
  @Get('debug/batches')
  @Roles(UserRole.SUPER_ADMIN)
  async debugBatches() {
    return this.promotionService.debugBatches();
  }

  /**
   * Debug endpoint to clean up stuck promotion batches
   */
  @Post('debug/cleanup-stuck-batches')
  @Roles(UserRole.SUPER_ADMIN)
  async cleanupStuckBatches() {
    return this.promotionService.cleanupStuckBatches();
  }

  /**
   * Preview student promotions for an academic year
   */
  @Post('preview')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async previewPromotions(
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<PromotionPreviewResponseDto> {
    try {
      // Validate the request body manually
      const dto = PreviewPromotionSchema.parse(body);

      return this.promotionService.previewPromotions(dto, user.id);
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new BadRequestException(
          `Validation failed: ${error.issues.map(i => i.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  /**
   * Execute student promotions
   */
  @Post('execute')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async executePromotions(
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<PromotionExecutionResult> {
    try {
      // Validate the request body manually
      const dto = ExecutePromotionSchema.parse(body);

      return this.promotionService.executePromotions(dto, user.id);
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new BadRequestException(
          `Validation failed: ${error.issues.map(i => i.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  /**
   * Promote individual student
   */
  @Post('individual')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async promoteIndividualStudent(
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<IndividualPromotionResult> {
    try {
      // Validate the request body manually
      const dto = IndividualPromotionSchema.parse(body);

      return this.promotionService.promoteIndividualStudent(dto, user.id);
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new BadRequestException(
          `Validation failed: ${error.issues.map(i => i.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get promotion progress
   */
  @Get('progress/:batchId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPromotionProgress(@Param('batchId') batchId: string) {
    return this.promotionService.getPromotionProgress(batchId);
  }

  /**
   * Revert promotion batch
   */
  @Post('revert/:batchId')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async revertPromotionBatch(
    @Param('batchId') batchId: string,
    @CurrentUser() user: any,
  ) {
    return this.promotionService.revertPromotionBatch(batchId, user.id);
  }

  /**
   * Get promotion batch details
   */
  @Get('batch/:batchId')
  @Roles(UserRole.SUPER_ADMIN)
  async getPromotionBatch(
    @Param('batchId') batchId: string,
  ): Promise<PromotionBatchResponseDto> {
    return this.promotionService.getPromotionBatch(batchId);
  }

  /**
   * Get all promotion batches
   */
  @Get('batches')
  @Roles(UserRole.SUPER_ADMIN)
  async getPromotionBatches(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<PromotionBatchResponseDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.promotionService.getPromotionBatches(limitNum, offsetNum);
  }

  /**
   * Academic Year Management Endpoints
   */

  /**
   * Create a new academic year
   */
  @Post('academic-years')
  @Roles(UserRole.SUPER_ADMIN)
  async createAcademicYear(
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<AcademicYearResponseDto> {
    try {
      const dto = CreateAcademicYearSchema.parse(body);
      return this.promotionService.createAcademicYear(dto, user.id);
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new BadRequestException(
          `Validation failed: ${error.issues.map(i => i.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get current academic year
   */
  @Get('academic-years/current')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  async getCurrentAcademicYear(): Promise<AcademicYearResponseDto> {
    return this.promotionService.getCurrentAcademicYear();
  }

  /**
   * Get all academic years
   */
  @Get('academic-years')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllAcademicYears(): Promise<AcademicYearResponseDto[]> {
    return this.promotionService.getAllAcademicYears();
  }

  /**
   * Update academic year
   */
  @Post('academic-years/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async updateAcademicYear(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<AcademicYearResponseDto> {
    try {
      const dto = UpdateAcademicYearSchema.parse(body);
      return this.promotionService.updateAcademicYear(id, dto, user.id);
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new BadRequestException(
          `Validation failed: ${error.issues.map(i => i.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  /**
   * Set current academic year
   */
  @Post('academic-years/:id/set-current')
  @Roles(UserRole.SUPER_ADMIN)
  async setCurrentAcademicYear(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<AcademicYearResponseDto> {
    return this.promotionService.setCurrentAcademicYear(id, user.id);
  }
}
