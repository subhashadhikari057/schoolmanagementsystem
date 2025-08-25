import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CreateLeaveTypeDtoType } from '../dto/create-leave-type.dto';
import { UpdateLeaveTypeDtoType } from '../dto/update-leave-type.dto';
import { QueryLeaveTypeDtoType } from '../dto/query-leave-type.dto';
import { LeaveTypeStatus } from '../enums/leave-type-status.enum';

@Injectable()
export class LeaveTypeService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.leaveType.create({
      data: {
        ...createLeaveTypeDto,
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

    return this.prisma.leaveType.update({
      where: { id },
      data: {
        ...updateLeaveTypeDto,
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
    await this.findOne(id);

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
