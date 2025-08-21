import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { StaffSalaryService } from '../application/staff-salary.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import {
  UpdateStaffSalaryDto,
  UpdateStaffSalaryDtoType,
} from '../dto/staff-salary.dto';

@Controller('api/v1/staff')
export class StaffSalaryController {
  constructor(private readonly staffSalaryService: StaffSalaryService) {}

  @Get(':id/salary-history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  async getSalaryHistory(@Param('id') staffId: string) {
    const salaryHistory =
      await this.staffSalaryService.getStaffSalaryHistory(staffId);

    return {
      message: 'Staff salary history retrieved successfully',
      data: salaryHistory,
    };
  }

  @Post(':id/salary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  async updateSalary(
    @Param('id') staffId: string,
    @Body(new ZodValidationPipe(UpdateStaffSalaryDto))
    dto: UpdateStaffSalaryDtoType,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const result = await this.staffSalaryService.updateStaffSalary({
        staffId,
        basicSalary: Number(dto.basicSalary),
        allowances: Number(dto.allowances),
        changeType: dto.changeType,
        changeReason:
          dto.changeReason && typeof dto.changeReason === 'string'
            ? dto.changeReason
            : undefined,
        effectiveMonth:
          dto.effectiveMonth && typeof dto.effectiveMonth === 'string'
            ? new Date(dto.effectiveMonth)
            : undefined,
        approvedById: user.id,
      });

      return {
        message: 'Staff salary updated successfully',
        data: {
          staff: {
            id: result.staff.id,
            basicSalary: result.staff.basicSalary,
            allowances: result.staff.allowances,
            totalSalary: result.staff.totalSalary,
          },
          salaryHistory: result.salaryHistory,
        },
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      throw error;
    }
  }

  @Get(':id/salary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.STAFF,
  )
  @HttpCode(HttpStatus.OK)
  async getCurrentSalary(@Param('id') staffId: string) {
    // Get the latest salary record
    const salaryHistory =
      await this.staffSalaryService.getStaffSalaryHistory(staffId);

    if ((salaryHistory as any[]).length === 0) {
      throw new BadRequestException(
        'No salary records found for this staff member',
      );
    }

    // The first record is the most recent one due to ordering in the service
    const currentSalary = (salaryHistory as any[])[0];

    return {
      message: 'Staff current salary retrieved successfully',
      data: currentSalary,
    };
  }

  @Get(':id/salary-for-month')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  async getSalaryForMonth(
    @Param('id') staffId: string,
    @Query('month') monthStr: string,
  ) {
    if (!monthStr || !/^\d{4}-\d{2}-\d{2}$/.test(monthStr)) {
      throw new BadRequestException(
        'Invalid month format. Please use YYYY-MM-DD format.',
      );
    }

    const month = new Date(monthStr);
    const salaryRecord = await this.staffSalaryService.getSalaryForMonth(
      staffId,
      month,
    );

    return {
      message: 'Staff salary for the specified month retrieved successfully',
      data: salaryRecord,
    };
  }
}
