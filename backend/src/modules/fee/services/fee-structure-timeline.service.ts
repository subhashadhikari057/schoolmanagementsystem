import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

interface FeeItem {
  label: string;
  amount: number;
  frequency?: string;
  category?: string;
}

interface FeeSnapshot {
  items?: FeeItem[];
  totals?: Record<string, unknown>;
}

interface ItemComparison {
  label: string;
  fromAmount: number;
  toAmount: number;
  amountChange: number;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  fromFrequency: string;
  toFrequency: string;
}

interface ChangeFromPrevious {
  annualChange: number;
  monthlyChange: number;
  percentageChange: number;
  isIncrease: boolean;
}

interface TimelineVersion {
  version: number;
  effectiveFrom: Date;
  changeReason: string | null;
  createdBy: string;
  createdAt: Date;
  amounts: {
    annualTotal: number;
    monthlyTotal: number;
  };
  items: Array<{
    label: string;
    amount: number;
    frequency: string;
    category: string;
  }>;
  impact: {
    studentsAffected: number;
    changeFromPrevious: ChangeFromPrevious | null;
  };
}

@Injectable()
export class FeeStructureTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get complete timeline of fee structure versions and changes
   */
  async getFeeStructureTimeline(feeStructureId: string) {
    // Verify fee structure exists
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

    if (versions.length === 0) {
      return {
        feeStructureId,
        feeStructure: {
          name: feeStructure.name,
          class: feeStructure.class,
          academicYear: feeStructure.academicYear,
          status: feeStructure.status,
        },
        versions: [],
        totalVersions: 0,
        message: 'No version history found',
      };
    }

    // Get creator information for all versions
    const creatorIds = versions
      .map(v => v.createdById)
      .filter(Boolean) as string[];
    const creators = await this.prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, fullName: true },
    });
    const creatorMap = new Map(creators.map(c => [c.id, c.fullName]));

    // Calculate impact for each version
    const timelineVersions: TimelineVersion[] = [];
    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      const snapshot = version.snapshot as unknown as FeeSnapshot;
      const items = snapshot?.items || [];

      // Calculate totals from items
      const annualTotal = items.reduce((sum: number, item: FeeItem) => {
        const monthlyAmount = item.amount || 0;
        const frequency = item.frequency || 'MONTHLY';

        let annualAmount = 0;
        switch (frequency) {
          case 'ANNUAL':
            annualAmount = monthlyAmount;
            break;
          case 'TERM':
            annualAmount = monthlyAmount * 3; // 3 terms per year
            break;
          case 'MONTHLY':
          default:
            annualAmount = monthlyAmount * 12;
            break;
        }
        return sum + annualAmount;
      }, 0);

      const monthlyTotal = annualTotal / 12;

      // Get affected students count for this version
      const affectedStudentsCount = await this.prisma.studentFeeHistory.count({
        where: {
          feeStructureId,
          breakdown: {
            path: ['feeStructureHistoryVersion'],
            equals: version.version,
          },
        },
      });

      // Calculate change from previous version
      let changeFromPrevious: ChangeFromPrevious | null = null;
      if (i > 0) {
        const prevSnapshot = versions[i - 1].snapshot as unknown as FeeSnapshot;
        const prevItems = prevSnapshot?.items || [];
        const prevAnnualTotal = prevItems.reduce(
          (sum: number, item: FeeItem) => {
            const monthlyAmount = item.amount || 0;
            const frequency = item.frequency || 'MONTHLY';

            let annualAmount = 0;
            switch (frequency) {
              case 'ANNUAL':
                annualAmount = monthlyAmount;
                break;
              case 'TERM':
                annualAmount = monthlyAmount * 3;
                break;
              case 'MONTHLY':
              default:
                annualAmount = monthlyAmount * 12;
                break;
            }
            return sum + annualAmount;
          },
          0,
        );

        const annualChange = annualTotal - prevAnnualTotal;
        const percentageChange =
          prevAnnualTotal > 0 ? (annualChange / prevAnnualTotal) * 100 : 0;

        changeFromPrevious = {
          annualChange,
          monthlyChange: annualChange / 12,
          percentageChange: Math.round(percentageChange * 100) / 100,
          isIncrease: annualChange > 0,
        };
      }

      const creatorName = version.createdById
        ? creatorMap.get(version.createdById)
        : null;

      timelineVersions.push({
        version: version.version,
        effectiveFrom: version.effectiveFrom,
        changeReason: version.changeReason,
        createdBy: creatorName || 'System',
        createdAt: version.createdAt,
        amounts: {
          annualTotal,
          monthlyTotal: Math.round(monthlyTotal * 100) / 100,
        },
        items: items.map((item: FeeItem) => ({
          label: item.label,
          amount: item.amount,
          frequency: item.frequency || 'MONTHLY',
          category: item.category || 'General',
        })),
        impact: {
          studentsAffected: affectedStudentsCount,
          changeFromPrevious,
        },
      });
    }

    return {
      feeStructureId,
      feeStructure: {
        name: feeStructure.name,
        class: feeStructure.class,
        academicYear: feeStructure.academicYear,
        status: feeStructure.status,
        createdAt: feeStructure.createdAt,
        updatedAt: feeStructure.updatedAt,
      },
      totalVersions: versions.length,
      currentVersion: Math.max(...versions.map(v => v.version)),
      versions: timelineVersions,
    };
  }

  /**
   * Get list of students affected by fee structure changes
   */
  async getAffectedStudents(
    feeStructureId: string,
    version?: number,
    month?: string,
  ) {
    // Verify fee structure exists
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

    // Build where clause
    const whereClause: Record<string, unknown> = {
      feeStructureId,
    };

    if (version) {
      whereClause.breakdown = {
        path: ['feeStructureHistoryVersion'],
        equals: version,
      };
    }

    if (month) {
      const monthDate = new Date(month + '-01');
      if (isNaN(monthDate.getTime())) {
        throw new BadRequestException('Invalid month format. Use YYYY-MM');
      }
      whereClause.periodMonth = monthDate;
    }

    // Get affected students
    const studentFeeHistories = await this.prisma.studentFeeHistory.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ periodMonth: 'desc' }, { version: 'desc' }],
    });

    // Group by student (get latest record for each)
    const studentMap = new Map();
    for (const history of studentFeeHistories) {
      const studentKey = history.studentId;
      if (
        !studentMap.has(studentKey) ||
        studentMap.get(studentKey).periodMonth < history.periodMonth ||
        (studentMap.get(studentKey).periodMonth.getTime() ===
          history.periodMonth.getTime() &&
          studentMap.get(studentKey).version < history.version)
      ) {
        studentMap.set(studentKey, history);
      }
    }

    const affectedStudents = Array.from(studentMap.values()).map(history => ({
      studentId: history.studentId,
      rollNumber: history.student.rollNumber,
      fullName: history.student.user.fullName,
      email: history.student.email,
      class: history.student.class,
      feeDetails: {
        month: history.periodMonth.toISOString().slice(0, 7),
        version: history.version,
        amounts: {
          baseAmount: history.baseAmount.toNumber(),
          scholarshipDeduction: history.scholarshipAmount.toNumber(),
          extraCharges: history.extraChargesAmount.toNumber(),
          finalPayable: history.finalPayable.toNumber(),
        },
        breakdown: history.breakdown,
      },
      lastUpdated: history.updatedAt,
    }));

    return {
      feeStructureId,
      feeStructure: {
        name: feeStructure.name,
        class: feeStructure.class,
        academicYear: feeStructure.academicYear,
      },
      filters: {
        version,
        month,
      },
      summary: {
        totalStudentsAffected: affectedStudents.length,
        totalFeeAmount: affectedStudents.reduce(
          (sum, student) => sum + student.feeDetails.amounts.finalPayable,
          0,
        ),
        averageFeePerStudent:
          affectedStudents.length > 0
            ? affectedStudents.reduce(
                (sum, student) => sum + student.feeDetails.amounts.finalPayable,
                0,
              ) / affectedStudents.length
            : 0,
      },
      students: affectedStudents,
    };
  }

  /**
   * Get financial impact analysis of fee structure changes
   */
  async getImpactAnalysis(
    feeStructureId: string,
    fromVersion?: number,
    toVersion?: number,
  ) {
    // Verify fee structure exists
    const feeStructure = await this.prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      throw new NotFoundException(
        `Fee structure with ID ${feeStructureId} not found`,
      );
    }

    // Get all versions if not specified
    const versions = await this.prisma.feeStructureHistory.findMany({
      where: { feeStructureId },
      orderBy: { version: 'asc' },
    });

    if (versions.length === 0) {
      throw new NotFoundException(
        'No version history found for this fee structure',
      );
    }

    // Determine version range
    const startVersion = fromVersion || versions[0].version;
    const endVersion = toVersion || versions[versions.length - 1].version;

    const fromVersionData = versions.find(v => v.version === startVersion);
    const toVersionData = versions.find(v => v.version === endVersion);

    if (!fromVersionData || !toVersionData) {
      throw new BadRequestException('Invalid version numbers specified');
    }

    // Calculate financial impact
    const fromSnapshot = fromVersionData.snapshot as unknown as FeeSnapshot;
    const toSnapshot = toVersionData.snapshot as unknown as FeeSnapshot;

    const fromItems = fromSnapshot?.items || [];
    const toItems = toSnapshot?.items || [];

    // Calculate totals
    const calculateTotal = (items: FeeItem[]) => {
      return items.reduce((sum, item) => {
        const amount = item.amount || 0;
        const frequency = item.frequency || 'MONTHLY';

        switch (frequency) {
          case 'ANNUAL':
            return sum + amount;
          case 'TERM':
            return sum + amount * 3;
          case 'MONTHLY':
          default:
            return sum + amount * 12;
        }
      }, 0);
    };

    const fromTotal = calculateTotal(fromItems);
    const toTotal = calculateTotal(toItems);
    const totalChange = toTotal - fromTotal;
    const percentageChange =
      fromTotal > 0 ? (totalChange / fromTotal) * 100 : 0;

    // Get affected students for impact calculation
    const affectedStudents = await this.prisma.studentFeeHistory.count({
      where: {
        feeStructureId,
        breakdown: {
          path: ['feeStructureHistoryVersion'],
          equals: endVersion,
        },
      },
    });

    // Calculate revenue impact
    const annualRevenueImpact = totalChange * affectedStudents;
    const monthlyRevenueImpact = annualRevenueImpact / 12;

    // Item-level comparison
    const itemComparison: ItemComparison[] = [];
    const fromItemMap = new Map(
      fromItems.map((item: FeeItem) => [item.label, item]),
    );
    const toItemMap = new Map(
      toItems.map((item: FeeItem) => [item.label, item]),
    );

    // Check all items from both versions
    const allItemLabels = new Set([...fromItemMap.keys(), ...toItemMap.keys()]);

    for (const label of allItemLabels) {
      const fromItem = fromItemMap.get(label);
      const toItem = toItemMap.get(label);

      let changeType: 'added' | 'removed' | 'modified' | 'unchanged' =
        'unchanged';
      let amountChange = 0;

      if (!fromItem && toItem) {
        changeType = 'added';
        amountChange = toItem.amount;
      } else if (fromItem && !toItem) {
        changeType = 'removed';
        amountChange = -fromItem.amount;
      } else if (fromItem && toItem) {
        amountChange = toItem.amount - fromItem.amount;
        changeType = amountChange !== 0 ? 'modified' : 'unchanged';
      }

      itemComparison.push({
        label: label as string,
        fromAmount: fromItem?.amount || 0,
        toAmount: toItem?.amount || 0,
        amountChange,
        changeType,
        fromFrequency: fromItem?.frequency || 'MONTHLY',
        toFrequency: toItem?.frequency || 'MONTHLY',
      });
    }

    return {
      feeStructureId,
      feeStructure: {
        name: feeStructure.name,
        academicYear: feeStructure.academicYear,
      },
      comparison: {
        fromVersion: {
          version: startVersion,
          effectiveFrom: fromVersionData.effectiveFrom,
          annualTotal: fromTotal,
          monthlyTotal: fromTotal / 12,
        },
        toVersion: {
          version: endVersion,
          effectiveFrom: toVersionData.effectiveFrom,
          annualTotal: toTotal,
          monthlyTotal: toTotal / 12,
        },
      },
      impact: {
        amountChange: {
          annual: totalChange,
          monthly: totalChange / 12,
          percentage: Math.round(percentageChange * 100) / 100,
          isIncrease: totalChange > 0,
        },
        revenueImpact: {
          studentsAffected: affectedStudents,
          annualRevenue: annualRevenueImpact,
          monthlyRevenue: monthlyRevenueImpact,
        },
      },
      itemComparison: itemComparison.filter(
        item => item.changeType !== 'unchanged',
      ),
    };
  }

  /**
   * Get specific version details of fee structure
   */
  async getVersionDetails(feeStructureId: string, version: number) {
    // Verify fee structure exists
    const feeStructure = await this.prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      throw new NotFoundException(
        `Fee structure with ID ${feeStructureId} not found`,
      );
    }

    // Get specific version
    const versionData = await this.prisma.feeStructureHistory.findUnique({
      where: {
        feeStructureId_version: {
          feeStructureId,
          version,
        },
      },
    });

    if (!versionData) {
      throw new NotFoundException(
        `Version ${version} not found for fee structure ${feeStructureId}`,
      );
    }

    // Get creator info
    const creator = versionData.createdById
      ? await this.prisma.user.findUnique({
          where: { id: versionData.createdById },
          select: { fullName: true },
        })
      : null;

    const snapshot = versionData.snapshot as unknown as FeeSnapshot;
    const items = snapshot?.items || [];

    // Calculate totals
    const annualTotal = items.reduce((sum: number, item: FeeItem) => {
      const amount = item.amount || 0;
      const frequency = item.frequency || 'MONTHLY';

      switch (frequency) {
        case 'ANNUAL':
          return sum + amount;
        case 'TERM':
          return sum + amount * 3;
        case 'MONTHLY':
        default:
          return sum + amount * 12;
      }
    }, 0);

    // Get students affected by this version
    const affectedStudentsCount = await this.prisma.studentFeeHistory.count({
      where: {
        feeStructureId,
        breakdown: {
          path: ['feeStructureHistoryVersion'],
          equals: version,
        },
      },
    });

    return {
      feeStructureId,
      feeStructure: {
        name: feeStructure.name,
        academicYear: feeStructure.academicYear,
      },
      version: {
        number: version,
        effectiveFrom: versionData.effectiveFrom,
        changeReason: versionData.changeReason,
        createdBy: creator?.fullName || 'System',
        createdAt: versionData.createdAt,
      },
      amounts: {
        annualTotal,
        monthlyTotal: annualTotal / 12,
      },
      items: items.map((item: FeeItem) => ({
        label: item.label,
        amount: item.amount,
        frequency: item.frequency || 'MONTHLY',
        category: item.category || 'General',
        annualAmount: (() => {
          const frequency = item.frequency || 'MONTHLY';
          switch (frequency) {
            case 'ANNUAL':
              return item.amount;
            case 'TERM':
              return item.amount * 3;
            case 'MONTHLY':
            default:
              return item.amount * 12;
          }
        })(),
      })),
      impact: {
        studentsAffected: affectedStudentsCount,
        estimatedAnnualRevenue: annualTotal * affectedStudentsCount,
      },
    };
  }

  /**
   * Preview what would happen if rolling back to a specific version
   */
  async getRollbackPreview(feeStructureId: string, targetVersion: number) {
    // Get basic version comparison
    const impactAnalysis = await this.getImpactAnalysis(
      feeStructureId,
      targetVersion,
    );

    return {
      ...impactAnalysis,
      rollbackDetails: {
        targetVersion,
        warning:
          impactAnalysis.impact.amountChange.annual < 0
            ? 'Rolling back to this version will reduce fees. Existing payments may need adjustment.'
            : impactAnalysis.impact.amountChange.annual > 0
              ? 'Rolling back to this version will increase fees from current levels.'
              : 'Rolling back to this version will result in no fee changes.',
      },
    };
  }
}
