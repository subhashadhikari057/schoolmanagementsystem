import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateChargeDto {
  name: string;
  type: 'FINE' | 'EQUIPMENT' | 'TRANSPORT' | 'OTHER';
  category?: string;
  description?: string;
  valueType: 'FIXED' | 'PERCENTAGE';
  value: number;
  isRecurring?: boolean;
}

interface ApplyChargeDto {
  chargeId: string;
  studentId: string;
  appliedMonth: string; // YYYY-MM-DD
  amount?: number; // Override calculated amount
  reason?: string;
}

@Injectable()
export class ChargeManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new charge definition
   */
  async createCharge(dto: CreateChargeDto) {
    return this.prisma.chargeDefinition.create({
      data: {
        name: dto.name,
        type: dto.type,
        category: dto.category,
        description: dto.description,
        valueType: dto.valueType,
        value: new Decimal(dto.value),
        isRecurring: dto.isRecurring ?? false,
        isActive: true,
      },
    });
  }

  /**
   * Get all charge definitions
   */
  async getAllCharges(includeInactive = false) {
    return this.prisma.chargeDefinition.findMany({
      where: includeInactive ? {} : { isActive: true, deletedAt: null },
      include: {
        assignments: {
          where: { deletedAt: null },
          include: {
            student: {
              include: {
                user: { select: { fullName: true } },
                class: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get charge by ID
   */
  async getChargeById(id: string) {
    const charge = await this.prisma.chargeDefinition.findUnique({
      where: { id, deletedAt: null },
      include: {
        assignments: {
          where: { deletedAt: null },
          include: {
            student: {
              include: {
                user: { select: { fullName: true } },
                class: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!charge) {
      throw new NotFoundException(`Charge with ID ${id} not found`);
    }

    return charge;
  }

  /**
   * Update charge definition
   */
  async updateCharge(id: string, dto: Partial<CreateChargeDto>) {
    const existing = await this.prisma.chargeDefinition.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Charge with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type) updateData.type = dto.type;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.valueType) updateData.valueType = dto.valueType;
    if (dto.value !== undefined) updateData.value = new Decimal(dto.value);
    if (dto.isRecurring !== undefined) updateData.isRecurring = dto.isRecurring;

    return this.prisma.chargeDefinition.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Deactivate charge definition
   */
  async deactivateCharge(id: string) {
    const existing = await this.prisma.chargeDefinition.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Charge with ID ${id} not found`);
    }

    return this.prisma.chargeDefinition.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Reactivate charge definition
   */
  async reactivateCharge(id: string) {
    const existing = await this.prisma.chargeDefinition.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Charge with ID ${id} not found`);
    }

    return this.prisma.chargeDefinition.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Apply charge to student
   */
  async applyToStudent(dto: ApplyChargeDto) {
    // Verify charge exists and is active
    const charge = await this.prisma.chargeDefinition.findUnique({
      where: { id: dto.chargeId, isActive: true, deletedAt: null },
    });

    if (!charge) {
      throw new NotFoundException('Charge not found or inactive');
    }

    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const appliedMonth = new Date(dto.appliedMonth);

    // Check for existing assignment for this month
    const existingAssignment = await this.prisma.chargeAssignment.findFirst({
      where: {
        chargeId: dto.chargeId,
        studentId: dto.studentId,
        appliedMonth,
        deletedAt: null,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'Charge already applied to student for this month',
      );
    }

    // Calculate amount if not provided
    let finalAmount = dto.amount;
    if (!finalAmount) {
      if (charge.valueType === 'FIXED') {
        finalAmount = Number(charge.value);
      } else {
        // For percentage charges, we need base fee amount - simplified to fixed for now
        finalAmount = Number(charge.value);
      }
    }

    return this.prisma.chargeAssignment.create({
      data: {
        chargeId: dto.chargeId,
        studentId: dto.studentId,
        appliedMonth,
        amount: new Decimal(finalAmount),
        reason: dto.reason,
      },
      include: {
        charge: true,
        student: {
          include: {
            user: { select: { fullName: true } },
            class: { select: { name: true } },
          },
        },
      },
    });
  }

  /**
   * Get charges for a specific student
   */
  async getStudentCharges(
    studentId: string,
    fromMonth?: string,
    toMonth?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const whereClause: Record<string, unknown> = {
      studentId,
      deletedAt: null,
    };

    if (fromMonth || toMonth) {
      const dateFilter: Record<string, Date> = {};
      if (fromMonth) {
        dateFilter.gte = new Date(fromMonth);
      }
      if (toMonth) {
        const toDate = new Date(toMonth);
        toDate.setMonth(toDate.getMonth() + 1);
        toDate.setDate(0);
        dateFilter.lte = toDate;
      }
      whereClause.appliedMonth = dateFilter;
    }

    return this.prisma.chargeAssignment.findMany({
      where: whereClause,
      include: {
        charge: true,
      },
      orderBy: { appliedMonth: 'desc' },
    });
  }

  /**
   * Remove charge assignment from student
   */
  async removeFromStudent(assignmentId: string) {
    const assignment = await this.prisma.chargeAssignment.findUnique({
      where: { id: assignmentId, deletedAt: null },
    });

    if (!assignment) {
      throw new NotFoundException('Charge assignment not found');
    }

    return this.prisma.chargeAssignment.update({
      where: { id: assignmentId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get applied charges for a student for a specific month
   */
  async getAppliedChargesForMonth(studentId: string, month: Date) {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return this.prisma.chargeAssignment.findMany({
      where: {
        studentId,
        deletedAt: null,
        appliedMonth: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        charge: true,
      },
    });
  }

  /**
   * Calculate total charges for a student for a specific month
   */
  async calculateChargesTotal(studentId: string, month: Date) {
    const charges = await this.getAppliedChargesForMonth(studentId, month);

    let totalCharges = 0;
    const appliedCharges: Array<{
      id: string;
      name: string;
      type: any;
      amount: number;
      reason: string | null;
      appliedMonth: Date;
    }> = [];

    for (const assignment of charges) {
      const chargeAmount = Number(assignment.amount);
      totalCharges += chargeAmount;

      appliedCharges.push({
        id: assignment.charge.id,
        name: assignment.charge.name,
        type: assignment.charge.type,
        amount: chargeAmount,
        reason: assignment.reason,
        appliedMonth: assignment.appliedMonth,
      });
    }

    return {
      totalCharges,
      appliedCharges,
    };
  }

  /**
   * Bulk apply charge to multiple students
   */
  async bulkApply(
    chargeId: string,
    studentIds: string[],
    appliedMonth: string,
    reason?: string,
  ) {
    const charge = await this.prisma.chargeDefinition.findUnique({
      where: { id: chargeId, isActive: true, deletedAt: null },
    });

    if (!charge) {
      throw new NotFoundException('Charge not found or inactive');
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const studentId of studentIds) {
      try {
        const assignment = await this.applyToStudent({
          chargeId,
          studentId,
          appliedMonth,
          reason,
        });
        results.push(assignment);
      } catch (error) {
        errors.push({
          studentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful: results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
    };
  }

  /**
   * Get charges summary for a class for a specific month
   */
  async getClassChargesSummary(classId: string, month: string) {
    const monthDate = new Date(month + '-01');
    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1,
    );
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
    );

    const charges = await this.prisma.chargeAssignment.findMany({
      where: {
        deletedAt: null,
        appliedMonth: {
          gte: monthStart,
          lte: monthEnd,
        },
        student: {
          classId,
          deletedAt: null,
        },
      },
      include: {
        charge: true,
        student: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    const totalAmount = charges.reduce(
      (sum, charge) => sum + Number(charge.amount),
      0,
    );
    const chargesByType = charges.reduce(
      (acc, charge) => {
        const type = charge.charge.type;
        if (!acc[type]) {
          acc[type] = { count: 0, amount: 0 };
        }
        acc[type].count++;
        acc[type].amount += Number(charge.amount);
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    return {
      month,
      classId,
      totalCharges: charges.length,
      totalAmount,
      chargesByType,
      charges: charges.map(charge => ({
        id: charge.id,
        studentName: charge.student.user.fullName,
        chargeName: charge.charge.name,
        chargeType: charge.charge.type,
        amount: Number(charge.amount),
        reason: charge.reason,
        appliedMonth: charge.appliedMonth,
      })),
    };
  }
}
