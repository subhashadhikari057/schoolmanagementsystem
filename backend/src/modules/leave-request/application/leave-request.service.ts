import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { UserRole } from '@sms/shared-types';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from '../dto';
import { LeaveRequestStatus } from '../enums/leave-request-status.enum';
import { LeaveRequestType } from '../enums/leave-request-type.enum';

@Injectable()
export class LeaveRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new leave request
   * Only students can create leave requests
   */
  async create(
    data: CreateLeaveRequestDto,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Only students can create leave requests
    if (userRole !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can create leave requests');
    }

    // Find the student
    const student = await this.prisma.student.findFirst({
      where: { userId, deletedAt: null },
      include: {
        class: {
          include: {
            classTeacher: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Calculate days between start and end date
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (days <= 0) {
      throw new BadRequestException('End date must be after start date');
    }

    // Create the leave request
    const leaveRequest = await this.prisma.leaveRequest.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: LeaveRequestStatus.PENDING_PARENT_APPROVAL,
        startDate,
        endDate,
        days,
        studentId: student.id,
        createdById: userId,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
      },
    });

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_CREATED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId: leaveRequest.id },
      ipAddress,
      userAgent,
    });

    return leaveRequest;
  }

  /**
   * Get all leave requests based on user role
   */
  async findAll(userId: string, userRole: UserRole, query: any = {}) {
    const { status, type, studentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = { deletedAt: null };

    // Add filters
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (studentId) whereClause.studentId = studentId;

    // Role-based access control
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      // Super admin and admin can see all leave requests
      // No additional filters needed
    } else if (userRole === UserRole.TEACHER) {
      // Teachers can see leave requests from their classes
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
        include: {
          classesAsTeacher: {
            select: { id: true },
          },
        },
      });

      if (teacher?.classesAsTeacher?.length) {
        const classIds = teacher.classesAsTeacher.map(c => c.id);
        whereClause.student = {
          classId: { in: classIds },
        };
      } else {
        whereClause.student = { classId: 'no-class' }; // No results
      }
    } else if (userRole === UserRole.PARENT) {
      // Parents can see leave requests from their children
      const parent = await this.prisma.parent.findFirst({
        where: { userId, deletedAt: null },
        include: {
          children: {
            select: { studentId: true },
          },
        },
      });

      if (parent?.children?.length) {
        const studentIds = parent.children.map(c => c.studentId);
        whereClause.studentId = { in: studentIds };
      } else {
        whereClause.studentId = 'no-children'; // No results
      }
    } else if (userRole === UserRole.STUDENT) {
      // Students can only see their own leave requests
      const student = await this.prisma.student.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true },
      });

      if (student) {
        whereClause.studentId = student.id;
      } else {
        whereClause.studentId = 'no-student'; // No results
      }
    } else {
      throw new ForbiddenException(
        'You are not allowed to view leave requests',
      );
    }

    const [leaveRequests, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
              class: {
                select: {
                  name: true,
                  grade: true,
                  section: true,
                },
              },
            },
          },
          parent: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
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
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.leaveRequest.count({ where: whereClause }),
    ]);

    return {
      leaveRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific leave request by ID
   */
  async findOne(id: string, userId: string, userRole: UserRole) {
    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
        parent: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
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
        attachments: true,
        auditLogs: {
          include: {
            performer: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: { performedAt: 'desc' },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check access permissions
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      // Super admin and admin can access all leave requests
      return leaveRequest;
    } else if (userRole === UserRole.TEACHER) {
      // Teachers can access leave requests from their classes
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
        include: {
          classesAsTeacher: {
            select: { id: true },
          },
        },
      });

      if (
        teacher?.classesAsTeacher?.some(
          c => c.id === leaveRequest.student.classId,
        )
      ) {
        return leaveRequest;
      }
    } else if (userRole === UserRole.PARENT) {
      // Parents can access leave requests from their children
      const parent = await this.prisma.parent.findFirst({
        where: { userId, deletedAt: null },
        include: {
          children: {
            select: { studentId: true },
          },
        },
      });

      if (parent?.children?.some(c => c.studentId === leaveRequest.studentId)) {
        return leaveRequest;
      }
    } else if (userRole === UserRole.STUDENT) {
      // Students can only access their own leave requests
      const student = await this.prisma.student.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true },
      });

      if (student?.id === leaveRequest.studentId) {
        return leaveRequest;
      }
    }

    throw new ForbiddenException(
      'You are not allowed to access this leave request',
    );
  }

  /**
   * Update a leave request
   * Only the creator (student) can update, or super admin/admin
   */
  async update(
    id: string,
    data: UpdateLeaveRequestDto,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: { select: { userId: true } },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check if user can update
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      if (leaveRequest.student.userId !== userId) {
        throw new ForbiddenException(
          'You can only update your own leave requests',
        );
      }

      // Students can only update if status is still pending
      if (leaveRequest.status !== LeaveRequestStatus.PENDING_PARENT_APPROVAL) {
        throw new ForbiddenException(
          'Cannot update leave request after approval process has started',
        );
      }
    }

    // Calculate days if dates are being updated
    let days = leaveRequest.days;
    if (data.start_date || data.end_date) {
      const startDate = data.start_date
        ? new Date(data.start_date)
        : new Date(leaveRequest.startDate);
      const endDate = data.end_date
        ? new Date(data.end_date)
        : new Date(leaveRequest.endDate);
      days =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

      if (days <= 0) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Prepare update data
    const updateData: any = {
      days,
      updatedById: userId,
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.start_date !== undefined)
      updateData.startDate = new Date(data.start_date);
    if (data.end_date !== undefined)
      updateData.endDate = new Date(data.end_date);

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
      },
    });

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_UPDATED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId: id, changes: data },
      ipAddress,
      userAgent,
    });

    return updatedLeaveRequest;
  }

  /**
   * Delete a leave request
   * Only the creator (student) can delete, or super admin/admin
   */
  async delete(
    id: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: { select: { userId: true } },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check if user can delete
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      if (leaveRequest.student.userId !== userId) {
        throw new ForbiddenException(
          'You can only delete your own leave requests',
        );
      }

      // Students can only delete if status is still pending
      if (leaveRequest.status !== LeaveRequestStatus.PENDING_PARENT_APPROVAL) {
        throw new ForbiddenException(
          'Cannot delete leave request after approval process has started',
        );
      }
    }

    // Soft delete
    await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_DELETED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId: id },
      ipAddress,
      userAgent,
    });

    return { message: 'Leave request deleted successfully' };
  }

  /**
   * Approve leave request by parent
   * Only parents can approve their children's leave requests
   */
  async approveByParent(
    id: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can approve leave requests');
    }

    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            parents: {
              include: {
                parent: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check if this parent is linked to the student
    const isParentLinked =
      leaveRequest.student?.parents?.some(p => p.parent?.userId === userId) ||
      false;

    if (!isParentLinked) {
      throw new ForbiddenException(
        'You can only approve leave requests for your own children',
      );
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING_PARENT_APPROVAL) {
      throw new BadRequestException(
        'Leave request is not pending parent approval',
      );
    }

    // Find the parent record
    const parent = await this.prisma.parent.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.PENDING_TEACHER_APPROVAL,
        parentId: parent.id,
        parentApprovedAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
        parent: {
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

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_PARENT_APPROVED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId: id },
      ipAddress,
      userAgent,
    });

    return updatedLeaveRequest;
  }

  /**
   * Approve leave request by teacher
   * Only class teachers can approve leave requests
   */
  async approveByTeacher(
    id: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can approve leave requests');
    }

    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            class: {
              select: {
                classTeacherId: true,
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check if this teacher is the class teacher
    if (leaveRequest.student.class.classTeacherId === null) {
      throw new BadRequestException('No class teacher assigned to this class');
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!teacher || teacher.id !== leaveRequest.student.class.classTeacherId) {
      throw new ForbiddenException(
        'You can only approve leave requests from your own class',
      );
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING_TEACHER_APPROVAL) {
      throw new BadRequestException(
        'Leave request is not pending teacher approval',
      );
    }

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.APPROVED,
        teacherId: teacher.id,
        teacherApprovedAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
        parent: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
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

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_TEACHER_APPROVED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId: id },
      ipAddress,
      userAgent,
    });

    return updatedLeaveRequest;
  }

  /**
   * Reject leave request by parent
   */
  async rejectByParent(
    id: string,
    reason: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can reject leave requests');
    }

    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            parents: {
              include: {
                parent: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check if this parent is linked to the student
    const isParentLinked =
      leaveRequest.student?.parents?.some(p => p.parent?.userId === userId) ||
      false;

    if (!isParentLinked) {
      throw new ForbiddenException(
        'You can only reject leave requests for your own children',
      );
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING_PARENT_APPROVAL) {
      throw new BadRequestException(
        'Leave request is not pending parent approval',
      );
    }

    // Find the parent record
    const parent = await this.prisma.parent.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.REJECTED,
        parentId: parent.id,
        parentRejectedAt: new Date(),
        parentRejectionReason: reason,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
        parent: {
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

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_PARENT_REJECTED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId: id, reason },
      ipAddress,
      userAgent,
    });

    return updatedLeaveRequest;
  }

  /**
   * Reject leave request by teacher
   */
  async rejectByTeacher(
    id: string,
    reason: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can reject leave requests');
    }

    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            class: {
              select: {
                classTeacherId: true,
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check if this teacher is the class teacher
    if (leaveRequest.student.class.classTeacherId === null) {
      throw new BadRequestException('No class teacher assigned to this class');
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!teacher || teacher.id !== leaveRequest.student.class.classTeacherId) {
      throw new ForbiddenException(
        'You can only reject leave requests from your own class',
      );
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING_TEACHER_APPROVAL) {
      throw new BadRequestException(
        'Leave request is not pending teacher approval',
      );
    }

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.REJECTED,
        teacherId: teacher.id,
        teacherRejectedAt: new Date(),
        teacherRejectionReason: reason,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
        parent: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
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

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_TEACHER_REJECTED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId: id, reason },
      ipAddress,
      userAgent,
    });

    return updatedLeaveRequest;
  }

  /**
   * Cancel leave request
   * Only the creator (student) can cancel, or super admin/admin
   */
  async cancel(
    id: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: { select: { userId: true } },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check if user can cancel
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      if (leaveRequest.student.userId !== userId) {
        throw new ForbiddenException(
          'You can only cancel your own leave requests',
        );
      }

      // Students can only cancel if status is still pending
      if (leaveRequest.status !== LeaveRequestStatus.PENDING_PARENT_APPROVAL) {
        throw new ForbiddenException(
          'Cannot cancel leave request after approval process has started',
        );
      }
    }

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.CANCELLED,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
      },
    });

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_CANCELLED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId: id },
      ipAddress,
      userAgent,
    });

    return updatedLeaveRequest;
  }
}
