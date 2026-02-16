import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CreateLeaveTypeDtoType } from '../dto/create-leave-type.dto';
import { UpdateLeaveTypeDtoType } from '../dto/update-leave-type.dto';
import { QueryLeaveTypeDtoType } from '../dto/query-leave-type.dto';
import { LeaveTypeGenderRule, LeaveTypeStatus } from '../enums';

@Injectable()
export class LeaveTypeService {
  constructor(private readonly prisma: PrismaService) {}
  private static readonly SYSTEM_SUBSTITUTE_LEAVE_NAME = 'Substitute Leave';

  private normalizeCreateInput(input: CreateLeaveTypeDtoType) {
    const maxDays = input.maxDays;
    const paidDays =
      input.paidDays !== undefined
        ? input.paidDays
        : input.isPaid
          ? maxDays
          : 0;

    if (paidDays > maxDays) {
      throw new BadRequestException(
        'Paid days cannot exceed the maximum allowed days',
      );
    }

    return {
      ...input,
      paidDays,
      isPaid: input.isPaid || paidDays > 0,
    };
  }

  private normalizeUpdateInput(
    input: UpdateLeaveTypeDtoType,
    existing: { maxDays: number; paidDays: number; isPaid: boolean },
  ) {
    const updateData: UpdateLeaveTypeDtoType = { ...input };
    const effectiveMaxDays = input.maxDays ?? existing.maxDays;

    let effectivePaidDays = existing.paidDays ?? 0;
    let effectiveIsPaid = existing.isPaid ?? effectivePaidDays > 0;

    if (input.paidDays !== undefined) {
      effectivePaidDays = input.paidDays;
    } else if (input.isPaid !== undefined) {
      if (!input.isPaid) {
        effectivePaidDays = 0;
      } else if (effectivePaidDays === 0) {
        effectivePaidDays = effectiveMaxDays;
      }
    }

    if (effectivePaidDays > effectiveMaxDays) {
      throw new BadRequestException(
        'Paid days cannot exceed the maximum allowed days',
      );
    }

    if (input.isPaid !== undefined || input.paidDays !== undefined) {
      effectiveIsPaid = input.isPaid ?? effectivePaidDays > 0;
      updateData.isPaid = effectiveIsPaid;
      updateData.paidDays = effectivePaidDays;
    }

    return updateData;
  }

  async create(createLeaveTypeDto: CreateLeaveTypeDtoType, userId: string) {
    // Check if leave type with same name already exists
    const existingLeaveType = await this.prisma.leaveType.findFirst({
      where: {
        name: createLeaveTypeDto.name,
        deletedAt: null,
      },
    });

    if (existingLeaveType) {
      throw new ConflictException('Leave type with this name already exists');
    }

    const normalizedInput = this.normalizeCreateInput(createLeaveTypeDto);

    return this.prisma.leaveType.create({
      data: {
        ...normalizedInput,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryLeaveTypeDtoType) {
    const where: any = {
      deletedAt: null,
    };

    if (query.name) {
      where.name = {
        contains: query.name,
        mode: 'insensitive',
      };
    }

    if (query.isPaid !== undefined) {
      where.isPaid = query.isPaid;
    }

    if (query.status) {
      where.status = query.status as LeaveTypeStatus;
    }

    if (query.eligibilityGender) {
      where.OR = [
        { eligibilityGender: LeaveTypeGenderRule.ANY },
        { eligibilityGender: query.eligibilityGender },
      ];
    }

    return this.prisma.leaveType.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const leaveType = await this.prisma.leaveType.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    return leaveType;
  }

  async update(
    id: string,
    updateLeaveTypeDto: UpdateLeaveTypeDtoType,
    userId: string,
  ) {
    // Check if leave type exists
    const existingLeaveType = await this.findOne(id);

    // If name is being updated, check for conflicts
    if (
      updateLeaveTypeDto.name &&
      updateLeaveTypeDto.name !== existingLeaveType.name
    ) {
      const nameConflict = await this.prisma.leaveType.findFirst({
        where: {
          name: updateLeaveTypeDto.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (nameConflict) {
        throw new ConflictException('Leave type with this name already exists');
      }
    }

    const normalizedInput = this.normalizeUpdateInput(updateLeaveTypeDto, {
      maxDays: existingLeaveType.maxDays,
      paidDays: existingLeaveType.paidDays ?? 0,
      isPaid: existingLeaveType.isPaid,
    });

    return this.prisma.leaveType.update({
      where: { id },
      data: {
        ...normalizedInput,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Check if leave type exists
    const leaveType = await this.findOne(id);

    if (
      leaveType.name === LeaveTypeService.SYSTEM_SUBSTITUTE_LEAVE_NAME ||
      leaveType.requiresSubstituteCredit
    ) {
      throw new BadRequestException(
        'System substitute leave cannot be deleted',
      );
    }

    return this.prisma.leaveType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });
  }

  async toggleStatus(id: string, userId: string) {
    const leaveType = await this.findOne(id);

    const newStatus =
      leaveType.status === LeaveTypeStatus.ACTIVE
        ? LeaveTypeStatus.INACTIVE
        : LeaveTypeStatus.ACTIVE;

    return this.prisma.leaveType.update({
      where: { id },
      data: {
        status: newStatus,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getStats() {
    const [totalTypes, paidTypes, activeTypes, inactiveTypes] =
      await Promise.all([
        this.prisma.leaveType.count({
          where: { deletedAt: null },
        }),
        this.prisma.leaveType.count({
          where: {
            isPaid: true,
            deletedAt: null,
          },
        }),
        this.prisma.leaveType.count({
          where: {
            status: LeaveTypeStatus.ACTIVE,
            deletedAt: null,
          },
        }),
        this.prisma.leaveType.count({
          where: {
            status: LeaveTypeStatus.INACTIVE,
            deletedAt: null,
          },
        }),
      ]);

    return {
      totalTypes,
      paidTypes,
      activeTypes,
      inactiveTypes,
    };
  }
}
