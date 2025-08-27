import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  CreateScholarshipDefinitionDto,
  AssignScholarshipDto,
} from '@sms/shared-types';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateScholarshipDto {
  name: string;
  type: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER';
  description?: string;
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
}

interface AssignScholarshipSimpleDto {
  scholarshipId: string;
  studentId: string;
  effectiveFrom: string; // YYYY-MM-DD
  expiresAt?: string; // YYYY-MM-DD
}

@Injectable()
export class ScholarshipManagementService {
  constructor(private prisma: PrismaService) {}

  // Legacy method for compatibility
  async createDefinition(dto: CreateScholarshipDefinitionDto) {
    return this.prisma.scholarshipDefinition.create({ data: dto });
  }

  // Legacy method for compatibility
  async assign(dto: AssignScholarshipDto) {
    const { scholarshipId, studentIds, effectiveFrom, expiresAt } = dto;
    const eff = new Date(effectiveFrom);
    const exp = expiresAt ? new Date(expiresAt) : undefined;
    const assignments = await this.prisma.$transaction(
      studentIds.map(studentId =>
        this.prisma.scholarshipAssignment.create({
          data: {
            scholarshipId,
            studentId,
            effectiveFrom: eff,
            expiresAt: exp,
          },
        }),
      ),
    );
    return { assignments };
  }

  /**
   * Create a new scholarship definition
   */
  async createScholarship(dto: CreateScholarshipDto) {
    return this.prisma.scholarshipDefinition.create({
      data: {
        name: dto.name,
        type: dto.type as any,
        description: dto.description,
        valueType: dto.valueType as any,
        value: new Decimal(dto.value),
        isActive: true,
      },
    });
  }

  /**
   * Get all scholarship definitions
   */
  async getAllScholarships(includeInactive = false) {
    return this.prisma.scholarshipDefinition.findMany({
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
   * Get scholarship by ID
   */
  async getScholarshipById(id: string) {
    const scholarship = await this.prisma.scholarshipDefinition.findUnique({
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

    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return scholarship;
  }

  /**
   * Update scholarship definition
   */
  async updateScholarship(id: string, dto: Partial<CreateScholarshipDto>) {
    const existing = await this.prisma.scholarshipDefinition.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    const updateData: Record<string, any> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type) updateData.type = dto.type;
    if (dto.valueType) updateData.valueType = dto.valueType;
    if (dto.value !== undefined) updateData.value = new Decimal(dto.value);

    return this.prisma.scholarshipDefinition.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Deactivate scholarship definition
   */
  async deactivateScholarship(id: string) {
    const existing = await this.prisma.scholarshipDefinition.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return this.prisma.scholarshipDefinition.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Reactivate scholarship definition
   */
  async reactivateScholarship(id: string) {
    const existing = await this.prisma.scholarshipDefinition.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return this.prisma.scholarshipDefinition.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Assign scholarship to student
   */
  async assignToStudent(dto: AssignScholarshipSimpleDto) {
    // Verify scholarship exists and is active
    const scholarship = await this.prisma.scholarshipDefinition.findUnique({
      where: { id: dto.scholarshipId, isActive: true, deletedAt: null },
    });

    if (!scholarship) {
      throw new NotFoundException('Scholarship not found or inactive');
    }

    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check for existing active assignment
    const existingAssignment =
      await this.prisma.scholarshipAssignment.findFirst({
        where: {
          scholarshipId: dto.scholarshipId,
          studentId: dto.studentId,
          deletedAt: null,
          OR: [
            { expiresAt: null }, // Never expires
            { expiresAt: { gte: new Date() } }, // Not yet expired
          ],
        },
      });

    if (existingAssignment) {
      throw new BadRequestException(
        'Student already has this scholarship assigned',
      );
    }

    const effectiveFrom = new Date(dto.effectiveFrom);
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    if (expiresAt && expiresAt <= effectiveFrom) {
      throw new BadRequestException('Expiry date must be after effective date');
    }

    return this.prisma.scholarshipAssignment.create({
      data: {
        scholarshipId: dto.scholarshipId,
        studentId: dto.studentId,
        effectiveFrom,
        expiresAt,
      },
      include: {
        scholarship: true,
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
   * Get scholarships for a specific student
   */
  async getStudentScholarships(studentId: string, activeOnly = true) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const whereClause: any = {
      studentId,
      deletedAt: null,
    };

    if (activeOnly) {
      const currentDate = new Date();
      whereClause.effectiveFrom = { lte: currentDate };
      whereClause.OR = [
        { expiresAt: null },
        { expiresAt: { gte: currentDate } },
      ];
    }

    return this.prisma.scholarshipAssignment.findMany({
      where: whereClause,
      include: {
        scholarship: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  /**
   * Remove scholarship assignment from student
   */
  async removeFromStudent(assignmentId: string) {
    const assignment = await this.prisma.scholarshipAssignment.findUnique({
      where: { id: assignmentId, deletedAt: null },
    });

    if (!assignment) {
      throw new NotFoundException('Scholarship assignment not found');
    }

    return this.prisma.scholarshipAssignment.update({
      where: { id: assignmentId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get active scholarships for a student for a specific month
   */
  async getActiveScholarshipsForMonth(studentId: string, month: Date) {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return this.prisma.scholarshipAssignment.findMany({
      where: {
        studentId,
        deletedAt: null,
        effectiveFrom: { lte: monthEnd },
        OR: [{ expiresAt: null }, { expiresAt: { gte: monthStart } }],
      },
      include: {
        scholarship: true,
      },
    });
  }

  /**
   * Calculate scholarship deduction for a student
   */
  async calculateScholarshipDeduction(
    studentId: string,
    month: Date,
    baseFeeAmount: number,
    _feeCategory?: string,
  ) {
    const scholarships = await this.getActiveScholarshipsForMonth(
      studentId,
      month,
    );

    let totalDeduction = 0;
    const appliedScholarships: Array<{
      id: string;
      name: string;
      type: any;
      valueType: any;
      value: number;
      deduction: number;
    }> = [];

    for (const assignment of scholarships) {
      const scholarship = assignment.scholarship;

      // Scholarship now applies to full base amount without category restrictions

      let deduction = 0;
      if (scholarship.valueType === 'PERCENTAGE') {
        deduction = (baseFeeAmount * Number(scholarship.value)) / 100;
      } else {
        deduction = Number(scholarship.value);
      }

      totalDeduction += deduction;
      appliedScholarships.push({
        id: scholarship.id,
        name: scholarship.name,
        type: scholarship.type,
        valueType: scholarship.valueType,
        value: Number(scholarship.value),
        deduction,
      });
    }

    return {
      totalDeduction,
      appliedScholarships,
    };
  }

  /**
   * Bulk assign scholarship to multiple students
   */
  async bulkAssign(
    scholarshipId: string,
    studentIds: string[],
    effectiveFrom: string,
    expiresAt?: string,
  ) {
    const scholarship = await this.prisma.scholarshipDefinition.findUnique({
      where: { id: scholarshipId, isActive: true, deletedAt: null },
    });

    if (!scholarship) {
      throw new NotFoundException('Scholarship not found or inactive');
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const studentId of studentIds) {
      try {
        const assignment = await this.assignToStudent({
          scholarshipId,
          studentId,
          effectiveFrom,
          expiresAt,
        });
        results.push(assignment);
      } catch (error) {
        errors.push({
          studentId,
          error: error.message,
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
}
