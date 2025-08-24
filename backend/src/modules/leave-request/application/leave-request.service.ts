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
import { CreateTeacherLeaveRequestDto } from '../dto/create-teacher-leave-request.dto';
import { TeacherLeaveRequestStatus } from '../enums/teacher-leave-request-status.enum';
import { AdminLeaveRequestActionDto } from '../dto/admin-leave-request-action.dto';

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
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        class: {
          include: {
            classTeacher: {
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
        },
        parents: {
          where: { isPrimary: true, deletedAt: null },
          include: {
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
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get the primary parent and class teacher
    const primaryParent = student.parents.find(p => p.isPrimary);
    const classTeacher = student.class.classTeacher;

    console.log('Leave request creation - Found relationships:', {
      studentId: student.id,
      studentName: student.user?.fullName,
      primaryParent: primaryParent
        ? {
            id: primaryParent.parent.id,
            name: primaryParent.parent.user?.fullName,
          }
        : null,
      classTeacher: classTeacher
        ? {
            id: classTeacher.id,
            name: classTeacher.user?.fullName,
          }
        : null,
    });

    if (!primaryParent) {
      throw new BadRequestException(
        'Student must have a primary parent assigned. Please contact the administration to set up parent information.',
      );
    }

    if (!classTeacher) {
      throw new BadRequestException(
        'Student must have a class teacher assigned. Please contact the administration to set up class teacher information.',
      );
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
        parentId: primaryParent.parent.id,
        teacherId: classTeacher.id,
        createdById: userId,
      },
      include: {
        student: {
          select: {
            rollNumber: true,
            classId: true,
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

    // Process attachments if any
    if (data.attachments && data.attachments.length > 0) {
      try {
        // Import the attachment service dynamically to avoid circular dependencies
        const { LeaveRequestAttachmentService } = await import(
          './leave-request-attachment.service'
        );
        const attachmentService = new LeaveRequestAttachmentService(
          this.prisma,
          this.auditService,
        );

        await attachmentService.uploadAttachments(
          leaveRequest.id,
          data.attachments,
          userId,
          userRole,
          ipAddress,
          userAgent,
        );
      } catch (attachmentError) {
        console.error('Error uploading attachments:', attachmentError);
        // Don't fail the leave request creation if attachments fail
        // The leave request is still created successfully
      }
    }

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_CREATED',
      module: 'LEAVE_REQUEST',
      details: {
        leaveRequestId: leaveRequest.id,
        parentId: primaryParent.parent.id,
        teacherId: classTeacher.id,
        studentId: student.id,
      },
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
            select: {
              rollNumber: true,
              classId: true,
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
          select: {
            rollNumber: true,
            classId: true,
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

  /**
   * Create teacher leave request
   * Teachers can create leave requests that go directly to admin approval
   */
  async createTeacherLeaveRequest(
    createTeacherLeaveRequestDto: CreateTeacherLeaveRequestDto,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.TEACHER) {
      throw new ForbiddenException(
        'Only teachers can create teacher leave requests',
      );
    }

    // Find the teacher
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate dates
    const startDate = new Date(createTeacherLeaveRequestDto.startDate);
    const endDate = new Date(createTeacherLeaveRequestDto.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // Calculate days difference
    const daysDiff =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (daysDiff !== createTeacherLeaveRequestDto.days) {
      throw new BadRequestException(
        'Days calculation does not match start and end dates',
      );
    }

    const teacherLeaveRequest = await this.prisma.teacherLeaveRequest.create({
      data: {
        title: createTeacherLeaveRequestDto.title,
        description: createTeacherLeaveRequestDto.description,
        type: createTeacherLeaveRequestDto.type,
        status: TeacherLeaveRequestStatus.PENDING_ADMINISTRATION,
        startDate,
        endDate,
        days: daysDiff,
        teacherId: teacher.id,
        createdById: userId,
      },
      include: {
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
      action: 'TEACHER_LEAVE_REQUEST_CREATED',
      module: 'TEACHER_LEAVE_REQUEST',
      details: { teacherLeaveRequestId: teacherLeaveRequest.id },
      ipAddress,
      userAgent,
    });

    return teacherLeaveRequest;
  }

  /**
   * Get teacher leave requests
   * Teachers can see their own requests, admins can see all
   */
  async getTeacherLeaveRequests(
    userId: string,
    userRole: UserRole,
    teacherId?: string,
  ) {
    const whereClause: any = { deletedAt: null };

    if (userRole === UserRole.TEACHER) {
      // Teachers can only see their own requests
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
      });
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
      whereClause.teacherId = teacher.id;
    } else if (
      userRole === UserRole.SUPER_ADMIN ||
      userRole === UserRole.ADMIN
    ) {
      // Admins can see all or filter by specific teacher
      if (teacherId) {
        whereClause.teacherId = teacherId;
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.teacherLeaveRequest.findMany({
      where: whereClause,
      include: {
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
          orderBy: { performedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get teacher leave request by ID
   */
  async getTeacherLeaveRequestById(
    id: string,
    userId: string,
    userRole: UserRole,
  ) {
    const teacherLeaveRequest = await this.prisma.teacherLeaveRequest.findFirst(
      {
        where: { id, deletedAt: null },
        include: {
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
            orderBy: { performedAt: 'desc' },
          },
        },
      },
    );

    if (!teacherLeaveRequest) {
      throw new NotFoundException('Teacher leave request not found');
    }

    // Check permissions
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
      });
      if (!teacher || teacher.id !== teacherLeaveRequest.teacherId) {
        throw new ForbiddenException(
          'You can only view your own leave requests',
        );
      }
    } else if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return teacherLeaveRequest;
  }

  /**
   * Admin approve/reject teacher leave request
   */
  async adminActionOnTeacherLeaveRequest(
    id: string,
    adminId: string,
    userRole: UserRole,
    actionDto: AdminLeaveRequestActionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can approve/reject teacher leave requests',
      );
    }

    const teacherLeaveRequest = await this.prisma.teacherLeaveRequest.findFirst(
      {
        where: { id, deletedAt: null },
      },
    );

    if (!teacherLeaveRequest) {
      throw new NotFoundException('Teacher leave request not found');
    }

    if (
      teacherLeaveRequest.status !==
      TeacherLeaveRequestStatus.PENDING_ADMINISTRATION
    ) {
      throw new BadRequestException(
        'Leave request is not pending administration approval',
      );
    }

    const updateData: any = {
      status: actionDto.status,
      adminId,
      updatedById: adminId,
      updatedAt: new Date(),
    };

    if (actionDto.status === TeacherLeaveRequestStatus.APPROVED) {
      updateData.approvedAt = new Date();
    } else if (actionDto.status === TeacherLeaveRequestStatus.REJECTED) {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = actionDto.rejectionReason;
    }

    const updatedTeacherLeaveRequest =
      await this.prisma.teacherLeaveRequest.update({
        where: { id },
        data: updateData,
        include: {
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
      userId: adminId,
      action: `TEACHER_LEAVE_REQUEST_${actionDto.status}`,
      module: 'TEACHER_LEAVE_REQUEST',
      details: {
        teacherLeaveRequestId: id,
        status: actionDto.status,
        rejectionReason: actionDto.rejectionReason,
      },
      ipAddress,
      userAgent,
    });

    return updatedTeacherLeaveRequest;
  }

  /**
   * Cancel teacher leave request
   * Only the creator (teacher) can cancel, or super admin/admin
   */
  async cancelTeacherLeaveRequest(
    id: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const teacherLeaveRequest = await this.prisma.teacherLeaveRequest.findFirst(
      {
        where: { id, deletedAt: null },
        include: {
          teacher: { select: { userId: true } },
        },
      },
    );

    if (!teacherLeaveRequest) {
      throw new NotFoundException('Teacher leave request not found');
    }

    // Check if user can cancel
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      if (teacherLeaveRequest.teacher.userId !== userId) {
        throw new ForbiddenException(
          'You can only cancel your own leave requests',
        );
      }

      // Teachers can only cancel if status is still pending
      if (
        teacherLeaveRequest.status !==
        TeacherLeaveRequestStatus.PENDING_ADMINISTRATION
      ) {
        throw new ForbiddenException(
          'Cannot cancel leave request after approval process has started',
        );
      }
    }

    const updatedTeacherLeaveRequest =
      await this.prisma.teacherLeaveRequest.update({
        where: { id },
        data: {
          status: TeacherLeaveRequestStatus.CANCELLED,
          updatedById: userId,
          updatedAt: new Date(),
        },
        include: {
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
      action: 'TEACHER_LEAVE_REQUEST_CANCELLED',
      module: 'TEACHER_LEAVE_REQUEST',
      details: { teacherLeaveRequestId: id },
      ipAddress,
      userAgent,
    });

    return updatedTeacherLeaveRequest;
  }
}
