import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { SalaryChangeType } from '@prisma/client';

export interface TeacherSalaryUpdateDto {
  teacherId: string;
  basicSalary: number;
  allowances: number;
  changeType?: SalaryChangeType;
  changeReason?: string;
  effectiveMonth?: Date;
  approvedById?: string;
}

@Injectable()
export class TeacherSalaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Creates an initial salary history record for a teacher
   * This is called when a new teacher is created
   */
  async createInitialSalaryRecord(
    teacherId: string,
    basicSalary: number,
    allowances: number,
    createdById?: string,
  ) {
    // Calculate total salary
    const totalSalary = basicSalary + allowances;

    // Get teacher to verify it exists and get joining date
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { joiningDate: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Use the joining date to set the effective month (first day of the joining month)
    const joiningDate = new Date(teacher.joiningDate);
    const effectiveMonth = new Date(
      joiningDate.getFullYear(),
      joiningDate.getMonth(),
      1,
    );

    // Create the salary history record
    const salaryRecord = await this.prisma.teacherSalaryHistory.create({
      data: {
        teacherId,
        effectiveMonth,
        basicSalary,
        allowances,
        totalSalary,
        changeType: SalaryChangeType.INITIAL,
        createdById,
      },
    });

    return salaryRecord;
  }

  /**
   * Updates a teacher's salary and creates a new history record
   * This will be used by the Salaries page
   */
  async updateTeacherSalary(dto: TeacherSalaryUpdateDto) {
    const {
      teacherId,
      basicSalary,
      allowances,
      changeType = SalaryChangeType.ADJUSTMENT,
      changeReason,
      approvedById,
    } = dto;

    // Calculate total salary
    const totalSalary = basicSalary + allowances;

    // Verify teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Determine effective month (first day of next month)
    const now = new Date();
    const effectiveMonth =
      (dto.effectiveMonth && typeof dto.effectiveMonth === 'string'
        ? new Date(dto.effectiveMonth)
        : undefined) ||
      new Date(
        now.getFullYear(),
        now.getMonth() + 1, // Next month
        1, // First day of the month
      );

    // Use a transaction to update both the teacher record and create a salary history entry
    const result = await this.prisma.$transaction(async tx => {
      // 1. Update the teacher record with the new salary information
      const updatedTeacher = await tx.teacher.update({
        where: { id: teacherId },
        data: {
          basicSalary,
          allowances,
          totalSalary,
          updatedAt: new Date(),
          updatedById: approvedById,
        },
      });

      // 2. Create a new salary history record
      const salaryRecord = await tx.teacherSalaryHistory.create({
        data: {
          teacherId,
          effectiveMonth,
          basicSalary,
          allowances,
          totalSalary,
          changeType,
          changeReason,
          approvedById,
          createdById: approvedById,
        },
      });

      return { teacher: updatedTeacher, salaryHistory: salaryRecord };
    });

    // Audit the salary change
    await this.audit.log({
      action: 'TEACHER_SALARY_UPDATED',
      module: 'TEACHER',
      userId: approvedById,
      details: {
        teacherId,
        previousSalary: {
          basicSalary: teacher.basicSalary,
          allowances: teacher.allowances,
          totalSalary: teacher.totalSalary,
        },
        newSalary: {
          basicSalary,
          allowances,
          totalSalary,
        },
        changeType,
        changeReason,
        effectiveMonth,
      },
    });

    return result;
  }

  /**
   * Gets the salary history for a teacher
   */
  async getTeacherSalaryHistory(teacherId: string) {
    // Verify teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Get all salary history records for this teacher
    const salaryHistory = await this.prisma.teacherSalaryHistory.findMany({
      where: {
        teacherId,
        deletedAt: null,
      },
      orderBy: {
        effectiveMonth: 'desc',
      },
      include: {
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return salaryHistory;
  }

  /**
   * Gets the applicable salary for a specific month
   * This is useful for payroll generation
   */
  async getSalaryForMonth(teacherId: string, month: Date) {
    // Normalize the date to the first day of the month
    const targetMonth = new Date(month.getFullYear(), month.getMonth(), 1);

    // Find the most recent salary record that is effective on or before the target month
    const salaryRecord = await this.prisma.teacherSalaryHistory.findFirst({
      where: {
        teacherId,
        effectiveMonth: {
          lte: targetMonth, // Less than or equal to the target month
        },
        deletedAt: null,
      },
      orderBy: {
        effectiveMonth: 'desc', // Get the most recent applicable record
      },
    });

    if (!salaryRecord) {
      throw new NotFoundException(
        `No salary record found for teacher ${teacherId} for the month ${targetMonth.toISOString()}`,
      );
    }

    return salaryRecord;
  }
}
