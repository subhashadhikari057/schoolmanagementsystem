import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { StudentFeeApiService } from '../services/student-fee-api.service';

@Controller('api/student-fees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
export class StudentFeeApiController {
  constructor(private readonly studentFeeApiService: StudentFeeApiService) {}

  /**
   * Get current month fees for a specific student
   * For external accounting software integration
   */
  @Get(':studentId/current')
  async getCurrentStudentFees(@Param('studentId') studentId: string) {
    if (!studentId) {
      throw new BadRequestException('Student ID is required');
    }

    return this.studentFeeApiService.getCurrentStudentFees(studentId);
  }

  /**
   * Get fee history for a specific student
   * Supports date range filtering and pagination
   */
  @Get(':studentId/history')
  async getStudentFeeHistory(
    @Param('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!studentId) {
      throw new BadRequestException('Student ID is required');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;

    if (pageNum < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (pageSizeNum < 1 || pageSizeNum > 100) {
      throw new BadRequestException('Page size must be between 1 and 100');
    }

    return this.studentFeeApiService.getStudentFeeHistory(
      studentId,
      from,
      to,
      pageNum,
      pageSizeNum,
    );
  }

  /**
   * Get fees for a specific student for a specific month
   */
  @Get(':studentId/month/:month')
  async getStudentFeesForMonth(
    @Param('studentId') studentId: string,
    @Param('month') month: string,
  ) {
    if (!studentId) {
      throw new BadRequestException('Student ID is required');
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    return this.studentFeeApiService.getStudentFeesForMonth(studentId, month);
  }

  /**
   * Get bulk student fees for a specific month
   * Optionally filter by class
   */
  @Get('bulk/:month')
  async getBulkStudentFees(
    @Param('month') month: string,
    @Query('classId') classId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 50;

    if (pageNum < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (pageSizeNum < 1 || pageSizeNum > 100) {
      throw new BadRequestException('Page size must be between 1 and 100');
    }

    return this.studentFeeApiService.getBulkStudentFees(
      month,
      classId,
      pageNum,
      pageSizeNum,
    );
  }

  /**
   * Get fee structure timeline
   */
  @Get('fee-structure/:feeStructureId/timeline')
  async getFeeStructureTimeline(
    @Param('feeStructureId') feeStructureId: string,
  ) {
    if (!feeStructureId) {
      throw new BadRequestException('Fee structure ID is required');
    }

    return this.studentFeeApiService.getFeeStructureTimeline(feeStructureId);
  }
}
