import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { FeeStructureForSingleClassResponse } from 'shared-types';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async findAllClasses() {
    const classes = await this.prisma.class.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        grade: true,
        section: true,
        shift: true,
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });

    // Map to the desired response format with grade, section, shift, and total (monthly)
    return classes.map(cls => ({
      id: cls.id,
      grade: cls.grade,
      section: cls.section,
      shift: cls.shift,
    }));
  }

  async feeStructureForClass(
    forDate: Date,
    classId: string,
  ): Promise<FeeStructureForSingleClassResponse> {
    const classRecord = await this.prisma.class.findUnique({
      where: {
        id: classId,
        deletedAt: null,
      },
      select: {
        id: true,
        grade: true,
        section: true,
        shift: true,
        feeStructures: {
          where: {
            effectiveFrom: { lte: forDate },
            deletedAt: null,
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1, // Get the most recent fee structure effective on or before forDate
          select: {
            id: true,
            name: true,
            academicYear: true,
            effectiveFrom: true,
            status: true,
            histories: {
              where: {
                effectiveFrom: { lte: forDate },
              },
              orderBy: [{ effectiveFrom: 'desc' }, { version: 'desc' }],
              take: 1, // Get the latest history version that was effective at forDate
              select: {
                totalAnnual: true,
                version: true,
                effectiveFrom: true,
                snapshot: true, // Contains the actual items as they were at that time
              },
            },
          },
        },
      },
    });

    if (!classRecord) {
      throw new NotFoundException('Class not found');
    }

    if (!classRecord.feeStructures || classRecord.feeStructures.length === 0) {
      throw new NotFoundException(
        `No fee structure found for class (Grade ${classRecord.grade} Section ${classRecord.section}) effective on or before the specified date`,
      );
    }

    const feeStructure = classRecord.feeStructures[0];
    const history = feeStructure.histories[0];

    if (!history) {
      throw new NotFoundException(
        `No fee structure history found for the specified date`,
      );
    }

    // Calculate monthly total from annual
    const monthlyTotal = history.totalAnnual
      ? Math.floor(Number(history.totalAnnual) / 12)
      : 0;

    // Extract items from the historical snapshot
    type SnapshotItem = {
      id: string;
      label: string;
      amount: number;
      category: string;
      frequency: 'MONTHLY' | 'ANNUAL' | 'TERM' | 'ONE_TIME';
      isOptional: boolean;
    };
    const snapshotData = history.snapshot as { items: SnapshotItem[] };
    const historicalItems = snapshotData?.items || [];

    return {
      classId: classRecord.id,
      grade: classRecord.grade,
      section: classRecord.section,
      shift: classRecord.shift,
      feeStructure: {
        id: feeStructure.id,
        name: feeStructure.name,
        academicYear: feeStructure.academicYear,
        effectiveFrom: feeStructure.effectiveFrom,
        status: feeStructure.status,
        version: history.version,
        historyEffectiveFrom: history.effectiveFrom,
        totalAnnual: Number(history.totalAnnual),
        totalMonthly: monthlyTotal,
      },
      items: historicalItems.map((item: SnapshotItem) => ({
        id: item.id,
        label: item.label,
        amount: Number(item.amount),
        category: item.category,
        frequency: item.frequency,
        isOptional: item.isOptional,
        // Calculate monthly amount based on frequency
        monthlyAmount:
          item.frequency === 'MONTHLY'
            ? Number(item.amount)
            : item.frequency === 'ANNUAL'
              ? Math.floor(Number(item.amount) / 12)
              : item.frequency === 'TERM'
                ? Math.floor(Number(item.amount) / 3) // Assuming 3 terms per year
                : Number(item.amount), // ONE_TIME
      })),
    };
  }

  async getScholarshipsForStudent(
    studentId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const studentExists = await this.prisma.student.findUnique({
      where: {
        id: studentId,
        deletedAt: null,
      },
    });
    if (!studentExists) throw new NotFoundException('Student not found');

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    const scholarshipsRaw = await this.prisma.scholarshipAssignment.findMany({
      where: {
        studentId,
        deletedAt: null,
        effectiveFrom: { lte: startDate },
        OR: [{ expiresAt: null }, { expiresAt: { gte: adjustedEndDate } }],
      },
      include: {
        scholarship: true,
      },
      orderBy: {
        effectiveFrom: 'desc',
        // priority: 'desc',
      },
    });

    const scholarshipsData = scholarshipsRaw.map(item => {
      return {
        name: item.scholarship.name,
        type: item.scholarship.type,
        valueType: item.scholarship.valueType,
        value: item.scholarship.value,
        description: item.scholarship.description,
        isActive: item.scholarship.isActive,
        effectiveFrom: item.effectiveFrom,
        expiresAt: item.expiresAt,
      };
    });

    return scholarshipsData;
  }

  async getChargesAndFinesForStudent(
    studentId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const studentExists = await this.prisma.student.findUnique({
      where: {
        id: studentId,
        deletedAt: null,
      },
    });
    if (!studentExists) throw new NotFoundException('Student not found');

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    const chargesAndFinesRaw = await this.prisma.chargeAssignment.findMany({
      where: {
        studentId: studentId,
        appliedMonth: {
          gte: startDate,
          lte: adjustedEndDate,
        },
      },
      include: {
        charge: true,
      },
      // where: {
      // 	studentId,
      // 	},
      // deletedAt: null,
      // effectiveFrom: { lte: startDate },
      // expiresAt: { gte: adjustedEndDate },
    });
    return chargesAndFinesRaw;
  }
}
