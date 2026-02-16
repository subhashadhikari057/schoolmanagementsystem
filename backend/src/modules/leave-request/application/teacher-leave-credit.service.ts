import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { UserRole } from '@sms/shared-types';
import { CreateTeacherLeaveCreditDto } from '../dto/create-teacher-leave-credit.dto';

@Injectable()
export class TeacherLeaveCreditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async grantCredit(
    dto: CreateTeacherLeaveCreditDto,
    adminId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can grant leave credits');
    }

    const [teacher, leaveType] = await Promise.all([
      this.prisma.teacher.findFirst({
        where: { id: dto.teacherId, deletedAt: null },
      }),
      this.prisma.leaveType.findFirst({
        where: { id: dto.leaveTypeId, deletedAt: null },
      }),
    ]);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    const credit = await this.prisma.teacherLeaveCredit.create({
      data: {
        teacherId: dto.teacherId,
        leaveTypeId: dto.leaveTypeId,
        days: dto.days,
        source: dto.source || undefined,
        description: dto.description,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        createdById: adminId,
        updatedById: adminId,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'TEACHER_LEAVE_CREDIT_GRANTED',
      module: 'TEACHER_LEAVE_CREDIT',
      details: {
        creditId: credit.id,
        teacherId: dto.teacherId,
        leaveTypeId: dto.leaveTypeId,
        days: dto.days,
      },
      ipAddress,
      userAgent,
    });

    return credit;
  }

  async getTeacherCredits(
    teacherId: string,
    userId: string,
    userRole: UserRole,
  ) {
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
      });
      if (!teacher || teacher.id !== teacherId) {
        throw new ForbiddenException(
          'You can only view your own leave credits',
        );
      }
    } else if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.teacherLeaveCredit.findMany({
      where: { teacherId, deletedAt: null },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            requiresSubstituteCredit: true,
          },
        },
      },
      orderBy: { creditedAt: 'desc' },
    });
  }

  async getAllCredits(userRole: UserRole) {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view all leave credits');
    }

    return this.prisma.teacherLeaveCredit.findMany({
      where: { deletedAt: null },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            requiresSubstituteCredit: true,
          },
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { creditedAt: 'desc' },
    });
  }

  async revokeCredit(
    creditId: string,
    adminId: string,
    userRole: UserRole,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can revoke leave credits');
    }

    const credit = await this.prisma.teacherLeaveCredit.findFirst({
      where: { id: creditId, deletedAt: null },
    });

    if (!credit) {
      throw new NotFoundException('Leave credit not found');
    }

    const now = new Date();
    const creditSum = await this.prisma.teacherLeaveCredit.aggregate({
      where: {
        teacherId: credit.teacherId,
        leaveTypeId: credit.leaveTypeId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _sum: { days: true },
    });

    const usedSum = await this.prisma.teacherLeaveRequest.aggregate({
      where: {
        teacherId: credit.teacherId,
        leaveTypeId: credit.leaveTypeId,
        status: 'APPROVED',
        deletedAt: null,
      },
      _sum: { days: true },
    });

    const totalCredits = creditSum._sum.days ?? 0;
    const totalUsed = usedSum._sum.days ?? 0;
    const availableCredits = Math.max(totalCredits - totalUsed, 0);

    if (availableCredits < credit.days) {
      throw new BadRequestException(
        'Cannot deallocate this credit because it has already been consumed',
      );
    }

    const revokedCredit = await this.prisma.teacherLeaveCredit.update({
      where: { id: creditId },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
        updatedById: adminId,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'TEACHER_LEAVE_CREDIT_REVOKED',
      module: 'TEACHER_LEAVE_CREDIT',
      details: {
        creditId: credit.id,
        teacherId: credit.teacherId,
        leaveTypeId: credit.leaveTypeId,
        days: credit.days,
        reason: reason || null,
      },
      ipAddress,
      userAgent,
    });

    return revokedCredit;
  }
}
