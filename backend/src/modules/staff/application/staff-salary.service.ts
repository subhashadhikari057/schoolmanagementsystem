import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { SalaryChangeType } from '../dto/staff-salary.dto';

export interface StaffSalaryUpdateDto {
  staffId: string;
  basicSalary: number;
  allowances: number;
  changeType?: SalaryChangeType;
  changeReason?: string;
  effectiveMonth?: Date;
  approvedById?: string;
}

@Injectable()
export class StaffSalaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Creates an initial salary history record for a staff member
   * This is called when a new staff is created
   */
  async createInitialSalaryRecord(
    staffId: string,
    basicSalary: number,
    allowances: number,
    createdById?: string,
  ) {
    // Calculate total salary
    const totalSalary = basicSalary + allowances;

    // Get staff to verify it exists and get joining date
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      select: { employmentDate: true },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    // Use the employment date to set the effective month (first day of the employment month)
    const effectiveDate = staff.employmentDate || new Date();
    const effectiveMonth = new Date(
      effectiveDate.getFullYear(),
      effectiveDate.getMonth(),
      1,
    );

    // Create the salary history record using Prisma create instead of raw SQL
    const salaryRecord = await this.prisma.staffSalaryHistory.create({
      data: {
        staffId,
        effectiveMonth,
        basicSalary,
        allowances,
        totalSalary,
        changeType: 'INITIAL',
        createdById: createdById || null,
      },
    });

    return salaryRecord;
  }

  /**
   * Updates a staff member's salary and creates a new history record
   * This will be used by the Salaries page
   */
  async updateStaffSalary(dto: StaffSalaryUpdateDto) {
    const {
      staffId,
      basicSalary,
      allowances,
      changeType = SalaryChangeType.ADJUSTMENT,
      changeReason,
      approvedById,
    } = dto;

    // Calculate total salary
    const totalSalary = basicSalary + allowances;

    // Verify staff exists
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
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

    // Use a transaction to update both the staff record and create a salary history entry
    const result = await this.prisma.$transaction(async tx => {
      // 1. Update the staff record with the new salary information
      const updatedStaff = await tx.staff.update({
        where: { id: staffId },
        data: {
          basicSalary,
          allowances,
          totalSalary,
          updatedAt: new Date(),
          updatedById: approvedById,
        },
      });

      // 2. Create a new salary history record using Prisma create
      const salaryRecord = await tx.staffSalaryHistory.create({
        data: {
          staffId,
          effectiveMonth,
          basicSalary,
          allowances,
          totalSalary,
          changeType,
          changeReason: changeReason || null,
          approvedById: approvedById || null,
          createdById: approvedById || null,
        },
      });

      return { staff: updatedStaff, salaryHistory: salaryRecord };
    });

    // Audit the salary change
    await this.audit.record({
      userId: approvedById,
      action: 'STAFF_SALARY_UPDATED',
      module: 'STAFF',
      status: 'SUCCESS',
      details: {
        staffId,
        previousSalary: {
          basicSalary: staff.basicSalary,
          allowances: staff.allowances,
          totalSalary: staff.totalSalary,
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
   * Gets the salary history for a staff member
   */
  async getStaffSalaryHistory(staffId: string) {
    // Verify staff exists
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    // Get all salary history records for this staff
    // Use raw SQL to get salary history
    const salaryHistory = await this.prisma.$queryRaw`
      SELECT 
        ssh.*, 
        u.id as "approvedById",
        u."fullName" as "approvedByName",
        u.email as "approvedByEmail"
      FROM "StaffSalaryHistory" ssh
      LEFT JOIN "User" u ON ssh."approvedById" = u.id
      WHERE ssh."staffId" = ${staffId}
      AND ssh."deletedAt" IS NULL
      ORDER BY ssh."effectiveMonth" DESC
    `;

    return salaryHistory;
  }

  /**
   * Gets the applicable salary for a specific month
   * This is useful for payroll generation
   */
  async getSalaryForMonth(staffId: string, month: Date) {
    // Normalize the date to the first day of the month
    const targetMonth = new Date(month.getFullYear(), month.getMonth(), 1);

    // Find the most recent salary record that is effective on or before the target month
    // Use raw SQL to get the salary record for a specific month
    const salaryRecords: any[] = await this.prisma.$queryRaw`
      SELECT *
      FROM "StaffSalaryHistory"
      WHERE "staffId" = ${staffId}
      AND "effectiveMonth" <= ${targetMonth}
      AND "deletedAt" IS NULL
      ORDER BY "effectiveMonth" DESC
      LIMIT 1
    `;
    const salaryRecord = salaryRecords.length > 0 ? salaryRecords[0] : null;

    if (!salaryRecord) {
      throw new NotFoundException(
        `No salary record found for staff ${staffId} for the month ${targetMonth.toISOString()}`,
      );
    }

    return salaryRecord;
  }
}
