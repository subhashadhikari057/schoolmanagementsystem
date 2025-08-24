import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ScholarshipManagementService } from '../services/scholarship-management.service';
import {
  assignScholarshipSchema,
  createScholarshipDefinitionSchema,
} from '@sms/shared-types';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  Permissions,
  RolesGuard,
  Roles,
} from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/fees/scholarships')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
export class ScholarshipManagementController {
  constructor(private readonly service: ScholarshipManagementService) {}

  // Legacy endpoint for compatibility
  @Post('legacy')
  @Permissions('FINANCE_MANAGE_SCHOLARSHIPS')
  async create(@Body() body: unknown) {
    const dto = createScholarshipDefinitionSchema.parse(body);
    return await this.service.createDefinition(dto);
  }

  // Legacy endpoint for compatibility
  @Post('legacy/assign')
  @Permissions('FINANCE_MANAGE_SCHOLARSHIPS')
  async assign(@Body() body: unknown) {
    const dto = assignScholarshipSchema.parse(body);
    return await this.service.assign(dto);
  }

  /**
   * Create a new scholarship definition
   */
  @Post()
  async createScholarship(
    @Body()
    dto: {
      name: string;
      type: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER';
      description?: string;
      valueType: 'PERCENTAGE' | 'FIXED';
      value: number;
    },
  ) {
    if (!dto.name || !dto.type || !dto.valueType || dto.value === undefined) {
      throw new BadRequestException(
        'Missing required fields: name, type, valueType, value',
      );
    }

    if (dto.value < 0) {
      throw new BadRequestException('Value must be positive');
    }

    if (dto.valueType === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException('Percentage value cannot exceed 100');
    }

    return this.service.createScholarship(dto);
  }

  /**
   * Get all scholarship definitions
   */
  @Get()
  async getAllScholarships(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveFlag = includeInactive === 'true';
    return this.service.getAllScholarships(includeInactiveFlag);
  }

  /**
   * List all scholarship definitions (alias for frontend compatibility)
   */
  @Get('list')
  async listScholarships(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveFlag = includeInactive === 'true';
    return this.service.getAllScholarships(includeInactiveFlag);
  }

  /**
   * Get scholarship by ID
   */
  @Get(':id')
  async getScholarshipById(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Scholarship ID is required');
    }
    return this.service.getScholarshipById(id);
  }

  /**
   * Update scholarship definition
   */
  @Put(':id')
  async updateScholarship(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      type?: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER';
      description?: string;
      valueType?: 'PERCENTAGE' | 'FIXED';
      value?: number;
    },
  ) {
    if (!id) {
      throw new BadRequestException('Scholarship ID is required');
    }

    if (dto.value !== undefined && dto.value < 0) {
      throw new BadRequestException('Value must be positive');
    }

    if (
      dto.valueType === 'PERCENTAGE' &&
      dto.value !== undefined &&
      dto.value > 100
    ) {
      throw new BadRequestException('Percentage value cannot exceed 100');
    }

    return this.service.updateScholarship(id, dto);
  }

  /**
   * Deactivate scholarship definition
   */
  @Put(':id/deactivate')
  async deactivateScholarship(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Scholarship ID is required');
    }
    return this.service.deactivateScholarship(id);
  }

  /**
   * Reactivate scholarship definition
   */
  @Put(':id/reactivate')
  async reactivateScholarship(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Scholarship ID is required');
    }
    return this.service.reactivateScholarship(id);
  }

  /**
   * Delete scholarship definition (legacy)
   */
  @Delete(':id')
  async deleteScholarship(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Scholarship ID is required');
    }
    return this.service.deactivateScholarship(id);
  }

  /**
   * Assign scholarship to a student or multiple students
   */
  @Post('assign')
  async assignToStudent(
    @Body()
    dto: {
      scholarshipId: string;
      studentId?: string;
      studentIds?: string[];
      effectiveFrom: string;
      expiresAt?: string;
    },
  ) {
    // Support both single student and multiple students
    const studentIds = dto.studentIds || (dto.studentId ? [dto.studentId] : []);

    if (!dto.scholarshipId || !studentIds.length || !dto.effectiveFrom) {
      throw new BadRequestException(
        'Missing required fields: scholarshipId, studentId/studentIds, effectiveFrom',
      );
    }

    // Validate date format
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dto.effectiveFrom) &&
      !/^\d{4}-\d{2}-\d{2}$/.test(dto.effectiveFrom)
    ) {
      throw new BadRequestException(
        'effectiveFrom must be in YYYY-MM-DD or ISO date format',
      );
    }

    if (
      dto.expiresAt &&
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dto.expiresAt) &&
      !/^\d{4}-\d{2}-\d{2}$/.test(dto.expiresAt)
    ) {
      throw new BadRequestException(
        'expiresAt must be in YYYY-MM-DD or ISO date format',
      );
    }

    // If multiple students, use bulk assign
    if (studentIds.length > 1) {
      return this.service.bulkAssign(
        dto.scholarshipId,
        studentIds,
        dto.effectiveFrom,
        dto.expiresAt,
      );
    } else {
      // Single student assignment
      return this.service.assignToStudent({
        scholarshipId: dto.scholarshipId,
        studentId: studentIds[0],
        effectiveFrom: dto.effectiveFrom,
        expiresAt: dto.expiresAt,
      });
    }
  }

  /**
   * Get scholarships for a specific student
   */
  @Get('students/:studentId')
  async getStudentScholarships(
    @Param('studentId') studentId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    if (!studentId) {
      throw new BadRequestException('Student ID is required');
    }

    const activeOnlyFlag = activeOnly !== 'false';
    return this.service.getStudentScholarships(studentId, activeOnlyFlag);
  }

  /**
   * Remove scholarship assignment from student
   */
  @Delete('assignments/:assignmentId')
  async removeFromStudent(@Param('assignmentId') assignmentId: string) {
    if (!assignmentId) {
      throw new BadRequestException('Assignment ID is required');
    }
    return this.service.removeFromStudent(assignmentId);
  }

  /**
   * Bulk assign scholarship to multiple students
   */
  @Post('bulk-assign')
  async bulkAssign(
    @Body()
    dto: {
      scholarshipId: string;
      studentIds: string[];
      effectiveFrom: string;
      expiresAt?: string;
    },
  ) {
    if (
      !dto.scholarshipId ||
      !dto.studentIds ||
      !Array.isArray(dto.studentIds) ||
      dto.studentIds.length === 0 ||
      !dto.effectiveFrom
    ) {
      throw new BadRequestException(
        'Missing required fields: scholarshipId, studentIds (array), effectiveFrom',
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.effectiveFrom)) {
      throw new BadRequestException(
        'effectiveFrom must be in YYYY-MM-DD format',
      );
    }

    if (dto.expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(dto.expiresAt)) {
      throw new BadRequestException('expiresAt must be in YYYY-MM-DD format');
    }

    return this.service.bulkAssign(
      dto.scholarshipId,
      dto.studentIds,
      dto.effectiveFrom,
      dto.expiresAt,
    );
  }

  /**
   * Calculate scholarship deduction for a student
   */
  @Post('calculate')
  async calculateScholarshipDeduction(
    @Body()
    dto: {
      studentId: string;
      month: string;
      baseFeeAmount: number;
      feeCategory?: string;
    },
  ) {
    if (!dto.studentId || !dto.month || dto.baseFeeAmount === undefined) {
      throw new BadRequestException(
        'Missing required fields: studentId, month, baseFeeAmount',
      );
    }

    if (!/^\d{4}-\d{2}$/.test(dto.month)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    if (dto.baseFeeAmount < 0) {
      throw new BadRequestException('Base fee amount must be positive');
    }

    const month = new Date(dto.month + '-01');
    return this.service.calculateScholarshipDeduction(
      dto.studentId,
      month,
      dto.baseFeeAmount,
      dto.feeCategory,
    );
  }
}
