import {
  Injectable,
  ForbiddenException,
  NotFoundException,
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
}
