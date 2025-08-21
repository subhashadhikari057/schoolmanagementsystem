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

import { TeacherSalaryService } from '../application/teacher-salary.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import {
  UpdateTeacherSalaryDto,
  UpdateTeacherSalaryDtoType,
} from '../dto/teacher-salary.dto';

@Controller('api/v1/teachers')
export class TeacherSalaryController {
  constructor(private readonly teacherSalaryService: TeacherSalaryService) {}

  @Get(':id/salary-history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  async getSalaryHistory(@Param('id') teacherId: string) {
    const salaryHistory =
      await this.teacherSalaryService.getTeacherSalaryHistory(teacherId);

    return {
      message: 'Teacher salary history retrieved successfully',
      data: salaryHistory,
    };
  }

  @Post(':id/salary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  async updateSalary(
    @Param('id') teacherId: string,
    @Body(new ZodValidationPipe(UpdateTeacherSalaryDto))
    dto: UpdateTeacherSalaryDtoType,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const result = await this.teacherSalaryService.updateTeacherSalary({
        teacherId,
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
        message: 'Teacher salary updated successfully',
        data: {
          teacher: {
            id: result.teacher.id,
            basicSalary: result.teacher.basicSalary,
            allowances: result.teacher.allowances,
            totalSalary: result.teacher.totalSalary,
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
    UserRole.TEACHER,
  )
  @HttpCode(HttpStatus.OK)
  async getCurrentSalary(@Param('id') teacherId: string) {
    // Get the latest salary record
    const salaryHistory =
      await this.teacherSalaryService.getTeacherSalaryHistory(teacherId);

    if (salaryHistory.length === 0) {
      throw new BadRequestException('No salary records found for this teacher');
    }

    // The first record is the most recent one due to ordering in the service
    const currentSalary = salaryHistory[0];

    return {
      message: 'Teacher current salary retrieved successfully',
      data: currentSalary,
    };
  }

  @Get(':id/salary-for-month')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  async getSalaryForMonth(
    @Param('id') teacherId: string,
    @Query('month') monthStr: string,
  ) {
    if (!monthStr || !/^\d{4}-\d{2}-\d{2}$/.test(monthStr)) {
      throw new BadRequestException(
        'Invalid month format. Please use YYYY-MM-DD format.',
      );
    }

    const month = new Date(monthStr);
    const salaryRecord = await this.teacherSalaryService.getSalaryForMonth(
      teacherId,
      month,
    );

    return {
      message: 'Teacher salary for the specified month retrieved successfully',
      data: salaryRecord,
    };
  }
}
