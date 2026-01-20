import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class StudentFeeApiService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current month fees for a student - SIMPLIFIED VERSION
   */
  async getCurrentStudentFees(studentId: string) {
    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true } },
        class: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Get current month
    const currentDate = new Date();
    const currentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    // Get latest fee history for current month
    const feeHistory = await this.prisma.studentFeeHistory.findFirst({
      where: {
        studentId,
        periodMonth: currentMonth,
      },
      orderBy: { version: 'desc' },
    });

    if (!feeHistory) {
      return {
        studentId,
        student: {
          fullName: student.user.fullName,
          rollNumber: student.rollNumber,
          class: student.class,
        },
        currentMonth: currentMonth.toISOString().slice(0, 7),
        message: 'No fee structure applied for current month',
      };
    }

    return {
      studentId,
      student: {
        fullName: student.user.fullName,
        rollNumber: student.rollNumber,
        class: student.class,
      },
      currentMonth: currentMonth.toISOString().slice(0, 7),
      computedFee: {
        version: feeHistory.version,
        baseAmount: feeHistory.baseAmount.toNumber(),
        scholarshipDeduction: feeHistory.scholarshipAmount.toNumber(),
        extraCharges: feeHistory.extraChargesAmount.toNumber(),
        finalPayable: feeHistory.finalPayable.toNumber(),
        breakdown: feeHistory.breakdown,
      },
      createdAt: feeHistory.createdAt,
    };
  }

  /**
   * Parent-safe wrapper: verify parent-child link before returning current month fees
   */
  async getCurrentStudentFeesForParent(
    parentUserId: string,
    studentId: string,
  ) {
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId: parentUserId,
        deletedAt: null,
        children: {
          some: { studentId, deletedAt: null },
        },
      },
      select: { id: true },
    });

    if (!parent) {
      throw new ForbiddenException('Access denied: child not linked to parent');
    }

    return this.getCurrentStudentFees(studentId);
  }

  /**
   * Get student fee history with pagination
   */
  async getStudentFeeHistory(
    studentId: string,
    from?: string,
    to?: string,
    page = 1,
    pageSize = 20,
  ) {
    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true } },
        class: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Build date filter
    const whereClause: Record<string, unknown> = { studentId };

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from + '-01');
        if (isNaN(fromDate.getTime())) {
          throw new BadRequestException(
            'Invalid from date format. Use YYYY-MM-DD',
          );
        }
        dateFilter.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to + '-01');
        if (isNaN(toDate.getTime())) {
          throw new BadRequestException(
            'Invalid to date format. Use YYYY-MM-DD',
          );
        }
        toDate.setMonth(toDate.getMonth() + 1);
        toDate.setDate(0);
        dateFilter.lte = toDate;
      }
      whereClause.periodMonth = dateFilter;
    }

    // Get total count
    const totalCount = await this.prisma.studentFeeHistory.count({
      where: whereClause,
    });

    // Get paginated records
    const records = await this.prisma.studentFeeHistory.findMany({
      where: whereClause,
      orderBy: [{ periodMonth: 'desc' }, { version: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      studentId,
      student: {
        fullName: student.user.fullName,
        rollNumber: student.rollNumber,
        class: student.class,
      },
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      history: records.map(record => ({
        id: record.id,
        month: record.periodMonth.toISOString().slice(0, 7),
        version: record.version,
        amounts: {
          baseAmount: record.baseAmount.toNumber(),
          scholarshipDeduction: record.scholarshipAmount.toNumber(),
          extraCharges: record.extraChargesAmount.toNumber(),
          finalPayable: record.finalPayable.toNumber(),
        },
        breakdown: record.breakdown,
        createdAt: record.createdAt,
      })),
    };
  }

  /**
   * Get specific month fees for a student
   */
  async getStudentFeesForMonth(studentId: string, month: string) {
    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true } },
        class: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const monthDate = new Date(month + '-01');
    if (isNaN(monthDate.getTime())) {
      throw new BadRequestException('Invalid month format. Use YYYY-MM');
    }

    // Get all versions for this month
    const feeHistories = await this.prisma.studentFeeHistory.findMany({
      where: {
        studentId,
        periodMonth: monthDate,
      },
      orderBy: { version: 'desc' },
    });

    if (feeHistories.length === 0) {
      return {
        studentId,
        student: {
          fullName: student.user.fullName,
          rollNumber: student.rollNumber,
          class: student.class,
        },
        month,
        message: `No fee data found for ${month}`,
      };
    }

    const latestHistory = feeHistories[0];

    return {
      studentId,
      student: {
        fullName: student.user.fullName,
        rollNumber: student.rollNumber,
        class: student.class,
      },
      month,
      feeHistory: {
        current: {
          version: latestHistory.version,
          amounts: {
            baseAmount: latestHistory.baseAmount.toNumber(),
            scholarshipDeduction: latestHistory.scholarshipAmount.toNumber(),
            extraCharges: latestHistory.extraChargesAmount.toNumber(),
            finalPayable: latestHistory.finalPayable.toNumber(),
          },
          breakdown: latestHistory.breakdown,
          createdAt: latestHistory.createdAt,
        },
        allVersions: feeHistories.map(history => ({
          version: history.version,
          amounts: {
            baseAmount: history.baseAmount.toNumber(),
            scholarshipDeduction: history.scholarshipAmount.toNumber(),
            extraCharges: history.extraChargesAmount.toNumber(),
            finalPayable: history.finalPayable.toNumber(),
          },
          createdAt: history.createdAt,
        })),
      },
    };
  }

  /**
   * Get bulk student fees for a month
   */
  async getBulkStudentFees(
    month: string,
    classId?: string,
    page = 1,
    pageSize = 50,
  ) {
    const monthDate = new Date(month + '-01');
    if (isNaN(monthDate.getTime())) {
      throw new BadRequestException('Invalid month format. Use YYYY-MM');
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      periodMonth: monthDate,
    };

    if (classId) {
      whereClause.student = {
        classId,
      };
    }

    // Get total count
    const totalCount = await this.prisma.studentFeeHistory.count({
      where: whereClause,
    });

    // Get paginated records (latest version for each student)
    const records = await this.prisma.studentFeeHistory.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ studentId: 'asc' }, { version: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Filter to get only latest version for each student
    const studentMap = new Map();
    for (const record of records) {
      const studentKey = record.studentId;
      if (
        !studentMap.has(studentKey) ||
        studentMap.get(studentKey).version < record.version
      ) {
        studentMap.set(studentKey, record);
      }
    }

    const uniqueRecords = Array.from(studentMap.values());

    const totalPages = Math.ceil(totalCount / pageSize);

    // Calculate summary
    const totalBaseAmount = uniqueRecords.reduce(
      (sum, record) => sum + Number(record.baseAmount),
      0,
    );
    const totalScholarships = uniqueRecords.reduce(
      (sum, record) => sum + Number(record.scholarshipAmount),
      0,
    );
    const totalCharges = uniqueRecords.reduce(
      (sum, record) => sum + Number(record.extraChargesAmount),
      0,
    );
    const totalCollection = uniqueRecords.reduce(
      (sum, record) => sum + Number(record.finalPayable),
      0,
    );

    return {
      month,
      classId,
      pagination: {
        page,
        pageSize,
        totalCount: uniqueRecords.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        totalStudents: uniqueRecords.length,
        totalBaseAmount,
        totalScholarships,
        totalCharges,
        totalCollection,
        averageFeePerStudent:
          uniqueRecords.length > 0 ? totalCollection / uniqueRecords.length : 0,
      },
      students: uniqueRecords.map(record => ({
        studentId: record.studentId,
        rollNumber: record.student.rollNumber,
        fullName: record.student.user.fullName,
        email: record.student.email,
        class: record.student.class,
        amounts: {
          baseAmount: Number(record.baseAmount),
          scholarshipDeduction: Number(record.scholarshipAmount),
          extraCharges: Number(record.extraChargesAmount),
          finalPayable: Number(record.finalPayable),
        },
        version: record.version,
        breakdown: record.breakdown,
        createdAt: record.createdAt,
      })),
    };
  }

  /**
   * Get fee structure timeline (simplified)
   */
  async getFeeStructureTimeline(feeStructureId: string) {
    // Get fee structure
    const feeStructure = await this.prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    if (!feeStructure) {
      throw new NotFoundException(
        `Fee structure with ID ${feeStructureId} not found`,
      );
    }

    // Get all versions
    const versions = await this.prisma.feeStructureHistory.findMany({
      where: { feeStructureId },
      orderBy: { effectiveFrom: 'asc' },
    });

    return {
      feeStructureId,
      feeStructure: {
        name: feeStructure.name,
        class: feeStructure.class,
        academicYear: feeStructure.academicYear,
        status: feeStructure.status,
      },
      totalVersions: versions.length,
      currentVersion:
        versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0,
      versions: versions.map(version => ({
        version: version.version,
        effectiveFrom: version.effectiveFrom,
        changeReason: version.changeReason,
        totalAnnual: version.totalAnnual.toNumber(),
        snapshot: version.snapshot,
        createdAt: version.createdAt,
      })),
    };
  }
}
