import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { ChargeManagementService } from '../services/charge-management.service';

@Controller('api/v1/fees/charges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
export class ChargeManagementController {
  constructor(private readonly chargeService: ChargeManagementService) {}

  /**
   * Create a new charge definition
   */
  @Post()
  async createCharge(
    @Body()
    dto: {
      name: string;
      type: 'FINE' | 'EQUIPMENT' | 'TRANSPORT' | 'OTHER';
      category?: string;
      description?: string;
      valueType: 'FIXED' | 'PERCENTAGE';
      value: number;
      isRecurring?: boolean;
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

    return this.chargeService.createCharge(dto);
  }

  /**
   * Get all charge definitions
   */
  @Get()
  async getAllCharges(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveFlag = includeInactive === 'true';
    return this.chargeService.getAllCharges(includeInactiveFlag);
  }

  /**
   * List all charge definitions (alias for frontend compatibility)
   */
  @Get('list')
  async listCharges(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveFlag = includeInactive === 'true';
    return this.chargeService.getAllCharges(includeInactiveFlag);
  }

  /**
   * Get charge by ID
   */
  @Get(':id')
  async getChargeById(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Charge ID is required');
    }
    return this.chargeService.getChargeById(id);
  }

  /**
   * Update charge definition
   */
  @Put(':id')
  async updateCharge(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      type?: 'FINE' | 'EQUIPMENT' | 'TRANSPORT' | 'OTHER';
      category?: string;
      description?: string;
      valueType?: 'FIXED' | 'PERCENTAGE';
      value?: number;
      isRecurring?: boolean;
    },
  ) {
    if (!id) {
      throw new BadRequestException('Charge ID is required');
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

    return this.chargeService.updateCharge(id, dto);
  }

  /**
   * Deactivate charge definition
   */
  @Put(':id/deactivate')
  async deactivateCharge(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Charge ID is required');
    }
    return this.chargeService.deactivateCharge(id);
  }

  /**
   * Reactivate charge definition
   */
  @Put(':id/reactivate')
  async reactivateCharge(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Charge ID is required');
    }
    return this.chargeService.reactivateCharge(id);
  }

  /**
   * Apply charge to a student
   */
  @Post('apply')
  async applyToStudent(
    @Body()
    dto: {
      chargeId: string;
      studentId: string;
      appliedMonth: string;
      amount?: number;
      reason?: string;
    },
  ) {
    if (!dto.chargeId || !dto.studentId || !dto.appliedMonth) {
      throw new BadRequestException(
        'Missing required fields: chargeId, studentId, appliedMonth',
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.appliedMonth)) {
      throw new BadRequestException(
        'appliedMonth must be in YYYY-MM-DD format',
      );
    }

    if (dto.amount !== undefined && dto.amount < 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.chargeService.applyToStudent(dto);
  }

  /**
   * Get charges for a specific student
   */
  @Get('students/:studentId')
  async getStudentCharges(
    @Param('studentId') studentId: string,
    @Query('fromMonth') fromMonth?: string,
    @Query('toMonth') toMonth?: string,
  ) {
    if (!studentId) {
      throw new BadRequestException('Student ID is required');
    }

    if (fromMonth && !/^\d{4}-\d{2}$/.test(fromMonth)) {
      throw new BadRequestException('fromMonth must be in YYYY-MM format');
    }

    if (toMonth && !/^\d{4}-\d{2}$/.test(toMonth)) {
      throw new BadRequestException('toMonth must be in YYYY-MM format');
    }

    return this.chargeService.getStudentCharges(studentId, fromMonth, toMonth);
  }

  /**
   * Remove charge assignment from student
   */
  @Delete('assignments/:assignmentId')
  async removeFromStudent(@Param('assignmentId') assignmentId: string) {
    if (!assignmentId) {
      throw new BadRequestException('Assignment ID is required');
    }
    return this.chargeService.removeFromStudent(assignmentId);
  }

  /**
   * Bulk apply charge to multiple students
   */
  @Post('bulk-apply')
  async bulkApply(
    @Body()
    dto: {
      chargeId: string;
      studentIds: string[];
      appliedMonth: string;
      reason?: string;
    },
  ) {
    if (
      !dto.chargeId ||
      !dto.studentIds ||
      !Array.isArray(dto.studentIds) ||
      dto.studentIds.length === 0 ||
      !dto.appliedMonth
    ) {
      throw new BadRequestException(
        'Missing required fields: chargeId, studentIds (array), appliedMonth',
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.appliedMonth)) {
      throw new BadRequestException(
        'appliedMonth must be in YYYY-MM-DD format',
      );
    }

    return this.chargeService.bulkApply(
      dto.chargeId,
      dto.studentIds,
      dto.appliedMonth,
      dto.reason,
    );
  }

  /**
   * Calculate charges total for a student for a specific month
   */
  @Post('calculate')
  async calculateChargesTotal(
    @Body() dto: { studentId: string; month: string },
  ) {
    if (!dto.studentId || !dto.month) {
      throw new BadRequestException(
        'Missing required fields: studentId, month',
      );
    }

    if (!/^\d{4}-\d{2}$/.test(dto.month)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    const month = new Date(dto.month + '-01');
    return this.chargeService.calculateChargesTotal(dto.studentId, month);
  }

  /**
   * Get charges summary for a class for a specific month
   */
  @Get('class/:classId/month/:month')
  async getClassChargesSummary(
    @Param('classId') classId: string,
    @Param('month') month: string,
  ) {
    if (!classId) {
      throw new BadRequestException('Class ID is required');
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    return this.chargeService.getClassChargesSummary(classId, month);
  }
}
