import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ComputeMonthlyFeesDto } from '@sms/shared-types';
import { Decimal } from '@prisma/client/runtime/library';

interface SnapshotItem {
  id?: string;
  category: string;
  label: string;
  amount: Decimal | number;
  frequency: string; // MONTHLY | TERM | ANNUAL | ONE_TIME
  isOptional?: boolean;
}

function computeMonthlyPortion(items: SnapshotItem[], periodMonth: Date) {
  const monthIndex = periodMonth.getMonth();
  let base = new Decimal(0);
  const itemBreakdown = items.map(it => {
    const amt =
      it.amount instanceof Decimal ? it.amount : new Decimal(it.amount);
    let monthlyPortion = new Decimal(0);
    switch (it.frequency) {
      case 'MONTHLY':
        monthlyPortion = amt;
        break;
      case 'ANNUAL':
        monthlyPortion = amt.div(12);
        break;
      case 'TERM': {
        // Spread evenly across months in term (4 months each) => amount / TERMS_PER_YEAR / monthsPerTerm = amount / 12
        monthlyPortion = amt.div(12);
        break;
      }
      case 'ONE_TIME': {
        // charge only in first effective month; caller ensures items set with structure effectiveFrom
        monthlyPortion = new Decimal(0); // handled separately if needed
        break;
      }
      default:
        monthlyPortion = amt;
        break;
    }
    base = base.plus(monthlyPortion);
    return {
      category: it.category,
      label: it.label,
      frequency: it.frequency,
      amount: amt,
      monthlyPortion,
    };
  });
  return { base, itemBreakdown };
}

@Injectable()
export class FeeComputationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute monthly fee histories for a given month across students.
   * If an entry exists, create a new version incrementally.
   */
  async computeForMonth(dto: ComputeMonthlyFeesDto & { actorUserId?: string }) {
    const monthDate = new Date(dto.month + '-01');
    const periodMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1,
    );

    // gather students
    let students: { id: string; classId: string | null }[] = [];
    if (dto.classId) {
      students = await this.prisma.student.findMany({
        where: { classId: dto.classId },
        select: { id: true, classId: true },
      });
    } else {
      students = await this.prisma.student.findMany({
        select: { id: true, classId: true },
      });
    }

    // fetch applicable fee structures (latest active per class)
    // Obtain latest active fee structure history snapshot per class effective on or before month
    const histories = await this.prisma.feeStructureHistory.findMany({
      where: { effectiveFrom: { lte: periodMonth } },
      orderBy: { effectiveFrom: 'asc' },
      include: { feeStructure: true },
    });
    const structureHistoryByClass = new Map<
      string,
      (typeof histories)[number]
    >();
    for (const h of histories) {
      const cls = h.feeStructure.classId;
      const existing = structureHistoryByClass.get(cls);
      if (!existing || existing.effectiveFrom < h.effectiveFrom)
        structureHistoryByClass.set(cls, h);
    }

    // scholarships & charges
    const scholarshipAssignments =
      await this.prisma.scholarshipAssignment.findMany({
        where: {
          effectiveFrom: { lte: periodMonth },
          OR: [{ expiresAt: null }, { expiresAt: { gte: periodMonth } }],
        },
        include: { scholarship: true },
      });
    const scholarshipByStudent: Record<string, typeof scholarshipAssignments> =
      {} as any;
    for (const s of scholarshipAssignments) {
      (scholarshipByStudent[s.studentId] =
        scholarshipByStudent[s.studentId] || []).push(s);
    }
    const chargeAssignments = await this.prisma.chargeAssignment.findMany({
      where: { appliedMonth: periodMonth },
      include: { charge: true },
    });
    const chargesByStudent: Record<string, typeof chargeAssignments> =
      {} as any;
    for (const c of chargeAssignments) {
      (chargesByStudent[c.studentId] =
        chargesByStudent[c.studentId] || []).push(c);
    }

    let created = 0;
    for (const student of students) {
      const hist = student.classId
        ? structureHistoryByClass.get(student.classId)
        : undefined;
      if (!hist) continue;
      const snapshot = (hist.snapshot as any) || {};
      const items: SnapshotItem[] = snapshot.items || [];
      const { base, itemBreakdown } = computeMonthlyPortion(items, periodMonth);
      let scholarshipReduction = new Decimal(0);
      for (const assign of scholarshipByStudent[student.id] || []) {
        const def = assign.scholarship;
        if (!def || !def.isActive) continue;
        // Apply scholarship to entire base amount
        if (def.valueType === 'PERCENTAGE')
          scholarshipReduction = scholarshipReduction.plus(
            base.mul(def.value).div(100),
          );
        else scholarshipReduction = scholarshipReduction.plus(def.value);
      }
      let charges = new Decimal(0);
      for (const charge of chargesByStudent[student.id] || []) {
        if (!charge.charge || !charge.charge.isActive) continue;
        charges = charges.plus(charge.amount);
      }
      const payable = base.minus(scholarshipReduction).plus(charges);
      const last = await this.prisma.studentFeeHistory.findFirst({
        where: { studentId: student.id, periodMonth },
        orderBy: { version: 'desc' },
      });
      const hasChanged =
        !last ||
        !last.finalPayable.equals(payable) ||
        !last.baseAmount.equals(base) ||
        !last.scholarshipAmount.equals(scholarshipReduction) ||
        !last.extraChargesAmount.equals(charges);
      if (!hasChanged && !dto.includeExisting) continue; // skip if unchanged and not forced
      const version = (last?.version || 0) + 1;
      await this.prisma.studentFeeHistory.create({
        data: {
          studentId: student.id,
          periodMonth,
          version,
          feeStructureId: hist.feeStructureId,
          baseAmount: base,
          scholarshipAmount: scholarshipReduction,
          extraChargesAmount: charges,
          finalPayable: payable,
          createdById: dto.actorUserId,
          breakdown: {
            feeStructureId: hist.feeStructureId,
            feeStructureHistoryVersion: hist.version,
            items: itemBreakdown.map(b => ({
              category: b.category,
              label: b.label,
              frequency: b.frequency,
              base: b.amount.toString(),
              monthlyPortion: b.monthlyPortion.toString(),
            })),
            scholarships: (scholarshipByStudent[student.id] || []).map(s => ({
              scholarshipId: s.scholarshipId,
              name: s.scholarship?.name,
              valueType: s.scholarship?.valueType,
              value: s.scholarship?.value?.toString(),
            })),
            charges: (chargesByStudent[student.id] || []).map(c => ({
              chargeId: c.chargeId,
              name: c.charge?.name,
              amount: c.amount.toString(),
              reason: c.reason,
            })),
            totals: {
              base: base.toString(),
              scholarshipDeduction: scholarshipReduction.toString(),
              charges: charges.toString(),
              final: payable.toString(),
            },
          },
        },
      });
      created++;
    }
    return { count: created };
  }
}
