import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  CreateFeeStructureDto,
  ReviseFeeStructureDto,
} from '@sms/shared-types';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FeeStructureService {
  constructor(private prisma: PrismaService) {}

  async createStructure(dto: CreateFeeStructureDto): Promise<unknown> {
    return await this.prisma.$transaction(async tx => {
      const multi = dto as CreateFeeStructureDto & { classIds?: string[] };
      const targetClassIdsRaw =
        multi.classIds && multi.classIds.length > 0
          ? multi.classIds
          : dto.classId
            ? [dto.classId]
            : [];
      const targetClassIds = Array.from(new Set(targetClassIdsRaw));
      if (targetClassIds.length === 0)
        throw new BadRequestException('At least one classId required');

      // Simple conflict detection per class (ignore assignment table now; each structure is independent)
      const existing = await tx.feeStructure.findMany({
        where: {
          academicYear: dto.academicYear,
          deletedAt: null,
          classId: { in: targetClassIds },
        },
        select: { classId: true },
      });
      if (existing.length) {
        const conflictIds = existing.map(e => e.classId);
        throw new ConflictException({
          message:
            'Fee structure already exists for one or more selected classes for this academic year',
          conflictingClassIds: conflictIds,
        });
      }

      // If only one class -> preserve original single-create return shape
      if (targetClassIds.length === 1) {
        const classId = targetClassIds[0];
        const structure = await tx.feeStructure.create({
          data: {
            classId,
            academicYear: dto.academicYear,
            name: dto.name,
            effectiveFrom: new Date(dto.effectiveFrom),
            status: 'ACTIVE',
            items: {
              create: dto.items.map(i => ({
                category: i.category,
                label: i.label,
                amount: new Decimal(i.amount),
                frequency: i.frequency,
                isOptional: i.isOptional ?? false,
              })),
            },
          },
          include: { items: true },
        });
        const totalAnnual = this.computeAnnual(
          structure.items.map(i => ({
            amount: i.amount,
            frequency: i.frequency,
          })),
        );
        await tx.feeStructureHistory.create({
          data: {
            feeStructureId: structure.id,
            version: 1,
            effectiveFrom: new Date(dto.effectiveFrom),
            totalAnnual,
            snapshot: { items: structure.items },
          },
        });
        // Seed students of this class
        const students = await tx.student.findMany({
          where: { classId, deletedAt: null },
        });
        const baseMonth = new Date(dto.effectiveFrom);
        const monthKey = new Date(
          baseMonth.getFullYear(),
          baseMonth.getMonth(),
          1,
        );
        for (const s of students) {
          const exists = await tx.studentFeeHistory.findFirst({
            where: { studentId: s.id, periodMonth: monthKey, version: 1 },
          });
          if (!exists) {
            await tx.studentFeeHistory.create({
              data: {
                studentId: s.id,
                feeStructureId: structure.id,
                periodMonth: monthKey,
                version: 1,
                baseAmount: totalAnnual,
                scholarshipAmount: new Decimal(0),
                extraChargesAmount: new Decimal(0),
                finalPayable: totalAnnual,
                breakdown: { items: structure.items },
              },
            });
          }
        }
        return structure;
      }

      // Multi-class: create independent structures (duplicate items) per class
      interface CreatedStructure {
        id: string;
        classId: string;
        academicYear: string;
        name: string;
        effectiveFrom: Date;
        status: string;
        items: { id: string; label: string; amount: Decimal }[];
      }
      const created: CreatedStructure[] = [];
      for (const classId of targetClassIds) {
        const structure = await tx.feeStructure.create({
          data: {
            classId,
            academicYear: dto.academicYear,
            name: dto.name,
            effectiveFrom: new Date(dto.effectiveFrom),
            status: 'ACTIVE',
            items: {
              create: dto.items.map(i => ({
                category: i.category,
                label: i.label,
                amount: new Decimal(i.amount),
                frequency: i.frequency,
                isOptional: i.isOptional ?? false,
              })),
            },
          },
          include: { items: true },
        });
        const totalAnnual = this.computeAnnual(
          structure.items.map(i => ({
            amount: i.amount,
            frequency: i.frequency,
          })),
        );
        await tx.feeStructureHistory.create({
          data: {
            feeStructureId: structure.id,
            version: 1,
            effectiveFrom: new Date(dto.effectiveFrom),
            totalAnnual,
            snapshot: { items: structure.items },
          },
        });
        // Seed students for this specific class
        const students = await tx.student.findMany({
          where: { classId, deletedAt: null },
        });
        const baseMonth = new Date(dto.effectiveFrom);
        const monthKey = new Date(
          baseMonth.getFullYear(),
          baseMonth.getMonth(),
          1,
        );
        for (const s of students) {
          const exists = await tx.studentFeeHistory.findFirst({
            where: { studentId: s.id, periodMonth: monthKey, version: 1 },
          });
          if (!exists) {
            await tx.studentFeeHistory.create({
              data: {
                studentId: s.id,
                feeStructureId: structure.id,
                periodMonth: monthKey,
                version: 1,
                baseAmount: totalAnnual,
                scholarshipAmount: new Decimal(0),
                extraChargesAmount: new Decimal(0),
                finalPayable: totalAnnual,
                breakdown: { items: structure.items },
              },
            });
          }
        }
        created.push(structure);
      }
      return created; // array of structures
    });
  }

  async reviseStructure(dto: ReviseFeeStructureDto) {
    return await this.prisma.$transaction(async tx => {
      const structure = await tx.feeStructure.findUnique({
        where: { id: dto.feeStructureId },
        include: { items: true, histories: true },
      });
      if (!structure) throw new NotFoundException('Fee structure not found');
      const nextVersion =
        (structure.histories.length
          ? Math.max(...structure.histories.map(h => h.version))
          : 0) + 1;
      // replace items (soft delete old by setting deletedAt?) for simplicity create new items & mark old deletedAt
      await tx.feeStructureItem.updateMany({
        where: { feeStructureId: structure.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      const newItems = await Promise.all(
        dto.items.map(i =>
          tx.feeStructureItem.create({
            data: {
              feeStructureId: structure.id,
              category: i.category || 'General',
              label: i.label,
              amount: new Decimal(i.amount),
              frequency: i.frequency || 'MONTHLY',
              isOptional: i.isOptional ?? false,
            },
          }),
        ),
      );
      const totalAnnual = this.computeAnnual(
        newItems.map(i => ({ amount: i.amount, frequency: i.frequency })),
      );
      await tx.feeStructureHistory.create({
        data: {
          feeStructureId: structure.id,
          version: nextVersion,
          effectiveFrom: new Date(dto.effectiveFrom),
          totalAnnual,
          snapshot: { items: newItems },
          changeReason: dto.changeReason,
        },
      });
      return { version: nextVersion, totalAnnual };
    });
  }

  async getStructureHistory(id: string) {
    return await this.prisma.feeStructureHistory.findMany({
      where: { feeStructureId: id },
      orderBy: { version: 'asc' },
    });
  }

  async listStructures(params: {
    classId?: string;
    academicYear?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { classId, academicYear } = params;
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 20;
    const where: { deletedAt: null; classId?: string; academicYear?: string } =
      { deletedAt: null };
    if (classId) where.classId = classId;
    if (academicYear) where.academicYear = academicYear;
    const [total, structuresResult] = await this.prisma.$transaction([
      this.prisma.feeStructure.count({ where }),
      this.prisma.feeStructure.findMany({
        where,
        orderBy: { effectiveFrom: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            where: { deletedAt: null },
            select: { id: true, label: true, amount: true },
          },
          histories: {
            orderBy: { version: 'desc' },
            take: 1,
            select: { version: true, totalAnnual: true },
          },
          class: { select: { grade: true, section: true, id: true } },
        },
      }),
    ]);
    type StructureWithRels = {
      id: string;
      classId: string;
      academicYear: string;
      name: string;
      status: string;
      effectiveFrom: Date;
      items: { id: string; label: string; amount: Decimal | number }[];
      histories: { version: number; totalAnnual: Decimal | number }[];
      class?: { id: string; grade: number | null; section: string | null };
    };
    const structures = structuresResult as StructureWithRels[];
    const classIds = Array.from(new Set(structures.map(s => s.classId)));
    const counts = await this.prisma.student.groupBy({
      where: { classId: { in: classIds }, deletedAt: null },
      by: ['classId'],
      _count: { classId: true },
    });
    const countMap = new Map(counts.map(c => [c.classId, c._count.classId]));
    const data = structures.map(s => ({
      id: s.id,
      name: s.name,
      academicYear: s.academicYear,
      status: s.status,
      effectiveFrom: s.effectiveFrom,
      classId: s.classId,
      grade: s.class?.grade,
      section: s.class?.section,
      assignedClasses: [
        {
          id: s.classId,
          grade: s.class?.grade ?? null,
          section: s.class?.section ?? null,
        },
      ],
      studentCount: countMap.get(s.classId) || 0,
      items: s.items.map(i => ({ id: i.id, label: i.label, amount: i.amount })),
      totalAnnual: s.histories[0]?.totalAnnual,
      latestVersion: s.histories[0]?.version || 1,
    }));
    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT') {
    const structure = await this.prisma.feeStructure.update({
      where: { id },
      data: { status },
    });
    return { id: structure.id, status: structure.status };
  }

  private computeAnnual(items: { amount: Decimal; frequency: string }[]) {
    let total = new Decimal(0);
    for (const i of items) {
      const amt =
        i.amount instanceof Decimal ? i.amount : new Decimal(i.amount);
      switch (i.frequency) {
        case 'MONTHLY':
          total = total.plus(amt.mul(12));
          break;
        case 'TERM':
          total = total.plus(amt.mul(3));
          break; // assume 3 terms
        case 'ANNUAL':
          total = total.plus(amt);
          break;
        case 'ONE_TIME':
          total = total.plus(amt);
          break;
        default:
          total = total.plus(amt);
          break;
      }
    }
    return total;
  }
}
