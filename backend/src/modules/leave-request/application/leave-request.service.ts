import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
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
import { TeacherLeaveUsageService } from './teacher-leave-usage.service';
import {
  LeaveTypeGenderRule,
  LeaveTypeLimitPeriod,
} from '../../leave-type/enums';

@Injectable()
export class LeaveRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly leaveUsageService: TeacherLeaveUsageService,
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

    const days = this.calculateLeaveDays(data.start_date, data.end_date);
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

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
        const { LeaveRequestAttachmentService } =
          await import('./leave-request-attachment.service');
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

    // Convert page and limit to numbers to ensure proper types for Prisma
    const pageNumber = parseInt(page.toString(), 10) || 1;
    const limitNumber = parseInt(limit.toString(), 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

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
        take: limitNumber,
      }),
      this.prisma.leaveRequest.count({ where: whereClause }),
    ]);

    return {
      leaveRequests,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
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
      const startDateString =
        data.start_date ?? this.formatDateOnly(leaveRequest.startDate);
      const endDateString =
        data.end_date ?? this.formatDateOnly(leaveRequest.endDate);
      days = this.calculateLeaveDays(startDateString, endDateString);

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
   * Superadmin approve student leave request
   * Only superadmin can approve, and only after parent has already approved
   */
  async adminApproveStudentLeave(
    id: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only superadmin can approve student leave requests',
      );
    }

    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Superadmin can only approve if parent has already approved (status = PENDING_TEACHER_APPROVAL)
    if (leaveRequest.status !== LeaveRequestStatus.PENDING_TEACHER_APPROVAL) {
      if (leaveRequest.status === LeaveRequestStatus.PENDING_PARENT_APPROVAL) {
        throw new ForbiddenException(
          'Cannot approve: Parent approval required first',
        );
      } else if (leaveRequest.status === LeaveRequestStatus.APPROVED) {
        throw new ConflictException('Leave request is already approved');
      } else if (leaveRequest.status === LeaveRequestStatus.REJECTED) {
        throw new ConflictException('Cannot approve a rejected leave request');
      } else if (leaveRequest.status === LeaveRequestStatus.CANCELLED) {
        throw new ConflictException('Cannot approve a cancelled leave request');
      } else {
        throw new ForbiddenException(
          'Invalid leave request status for approval',
        );
      }
    }

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.APPROVED,
        updatedAt: new Date(),
        updatedById: userId,
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
      },
    });

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_SUPERADMIN_APPROVED',
      module: 'LEAVE_REQUEST',
      details: {
        leaveRequestId: id,
        approvedBy: 'Superadmin',
        adminId: userId,
      },
      ipAddress,
      userAgent,
    });

    return updatedLeaveRequest;
  }

  /**
   * Superadmin reject student leave request
   * Only superadmin can reject student leave requests
   */
  async adminRejectStudentLeave(
    id: string,
    reason: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only superadmin can reject student leave requests',
      );
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required');
    }

    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Admin can reject any status except already rejected
    if (leaveRequest.status === LeaveRequestStatus.REJECTED) {
      throw new ConflictException('Leave request is already rejected');
    }

    if (leaveRequest.status === LeaveRequestStatus.CANCELLED) {
      throw new ConflictException('Cannot reject a cancelled leave request');
    }

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.REJECTED,
        teacherRejectedAt: new Date(), // Use existing teacher rejection fields for superadmin actions
        teacherRejectionReason: `Superadmin Rejection: ${reason}`,
        updatedAt: new Date(),
        updatedById: userId,
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
      },
    });

    // Log the action
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_SUPERADMIN_REJECTED',
      module: 'LEAVE_REQUEST',
      details: {
        leaveRequestId: id,
        rejectedBy: 'Superadmin',
        adminId: userId,
        reason,
      },
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
   * Calculate days between two dates (inclusive)
   * This is a shared utility method that matches frontend logic exactly
   */
  private calculateLeaveDays(startDateStr: string, endDateStr: string): number {
    try {
      // Parse dates consistently - expect YYYY-MM-DD format
      const startDateMatch = startDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const endDateMatch = endDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (!startDateMatch || !endDateMatch) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }

      const [, startYear, startMonth, startDay] = startDateMatch.map(Number);
      const [, endYear, endMonth, endDay] = endDateMatch.map(Number);

      // Create dates in local timezone to avoid UTC issues
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);

      // Validate date objects
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date values');
      }

      return this.countLeaveDaysExcludingSaturday(startDate, endDate);
    } catch (error) {
      throw new BadRequestException(`Date calculation error: ${error.message}`);
    }
  }

  private countLeaveDaysExcludingSaturday(
    startDate: Date,
    endDate: Date,
  ): number {
    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date values');
    }

    if (start > end) {
      return 0;
    }

    let count = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const dayOfWeek = cursor.getDay();
      if (dayOfWeek !== 6) {
        count += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return count;
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeGenderValue(
    gender?: string | null,
  ): LeaveTypeGenderRule | 'UNKNOWN' {
    if (!gender) return 'UNKNOWN';
    const normalized = gender.toString().trim().toLowerCase();
    if (['male', 'm'].includes(normalized)) return LeaveTypeGenderRule.MALE;
    if (['female', 'f'].includes(normalized)) return LeaveTypeGenderRule.FEMALE;
    return 'UNKNOWN';
  }

  private getWeekKey(date: Date): string {
    const utcDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const dayIndex = utcDate.getUTCDay();
    const weekStart = new Date(utcDate);
    weekStart.setUTCDate(weekStart.getUTCDate() - dayIndex);
    return weekStart.toISOString().slice(0, 10);
  }

  private buildDayCountByWeek(startDate: Date, endDate: Date) {
    const map = new Map<string, number>();
    const cursor = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      ),
    );
    const end = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
      ),
    );

    while (cursor <= end) {
      if (cursor.getUTCDay() !== 6) {
        const key = this.getWeekKey(cursor);
        map.set(key, (map.get(key) || 0) + 1);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return map;
  }

  private buildDayCountByYear(startDate: Date, endDate: Date) {
    const map = new Map<number, number>();
    const cursor = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      ),
    );
    const end = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
      ),
    );

    while (cursor <= end) {
      if (cursor.getUTCDay() !== 6) {
        const year = cursor.getUTCFullYear();
        map.set(year, (map.get(year) || 0) + 1);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return map;
  }

  private calculateTenureMonths(joiningDate: Date, asOfDate: Date) {
    const start = new Date(
      Date.UTC(
        joiningDate.getUTCFullYear(),
        joiningDate.getUTCMonth(),
        joiningDate.getUTCDate(),
      ),
    );
    const end = new Date(
      Date.UTC(
        asOfDate.getUTCFullYear(),
        asOfDate.getUTCMonth(),
        asOfDate.getUTCDate(),
      ),
    );

    if (end < start) return 0;

    let months =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth());

    if (end.getUTCDate() < start.getUTCDate()) {
      months -= 1;
    }

    return Math.max(months, 0);
  }

  private calculateEntitlementForYear(
    leaveType: any,
    teacher: any,
    asOfDate: Date,
  ) {
    if (!leaveType.prorateOnTenure) {
      return leaveType.maxDays;
    }

    const prorationMonths = leaveType.proratePeriodMonths || 12;
    const tenureMonths = this.calculateTenureMonths(
      teacher.joiningDate,
      asOfDate,
    );

    if (tenureMonths >= prorationMonths) {
      return leaveType.maxDays;
    }

    const prorated = Math.floor(
      (tenureMonths / prorationMonths) * leaveType.maxDays,
    );

    return Math.max(prorated, 0);
  }

  private async getTeacherLeaveRequestsForValidation(params: {
    teacherId: string;
    leaveTypeId: string;
    startDate?: Date;
    endDate?: Date;
    excludeRequestId?: string;
  }) {
    const where: any = {
      teacherId: params.teacherId,
      leaveTypeId: params.leaveTypeId,
      deletedAt: null,
      status: {
        in: [
          TeacherLeaveRequestStatus.PENDING_ADMINISTRATION,
          TeacherLeaveRequestStatus.APPROVED,
        ],
      },
    };

    if (params.excludeRequestId) {
      where.id = { not: params.excludeRequestId };
    }

    if (params.startDate && params.endDate) {
      where.startDate = { lte: params.endDate };
      where.endDate = { gte: params.startDate };
    }

    return this.prisma.teacherLeaveRequest.findMany({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        days: true,
        status: true,
      },
    });
  }

  private async calculateCarryForwardDays(
    leaveType: any,
    teacher: any,
    requestYear: number,
  ) {
    const carryLimits = [
      leaveType.carryForwardLimit,
      leaveType.encashAfterLimit,
    ].filter(
      (value: number | null | undefined) => typeof value === 'number',
    ) as number[];
    const carryLimit = carryLimits.length > 0 ? Math.min(...carryLimits) : 0;
    if (!carryLimit || carryLimit <= 0) {
      return 0;
    }

    const joiningYear = teacher.joiningDate
      ? teacher.joiningDate.getUTCFullYear()
      : requestYear;
    const leaveTypeCreatedYear = leaveType.createdAt
      ? new Date(leaveType.createdAt).getUTCFullYear()
      : requestYear;
    const startYear = Math.max(joiningYear, leaveTypeCreatedYear);
    let carryForward = 0;

    for (let year = startYear; year < requestYear; year += 1) {
      const yearEnd = new Date(Date.UTC(year, 11, 31));
      const entitlement = this.calculateEntitlementForYear(
        leaveType,
        teacher,
        yearEnd,
      );

      const existingRequests = await this.prisma.teacherLeaveRequest.findMany({
        where: {
          teacherId: teacher.id,
          leaveTypeId: leaveType.id,
          status: TeacherLeaveRequestStatus.APPROVED,
          deletedAt: null,
          startDate: { lte: new Date(Date.UTC(year, 11, 31)) },
          endDate: { gte: new Date(Date.UTC(year, 0, 1)) },
        },
        select: { startDate: true, endDate: true },
      });

      let usedDays = 0;
      existingRequests.forEach(request => {
        const counts = this.buildDayCountByYear(
          request.startDate,
          request.endDate,
        );
        usedDays += counts.get(year) || 0;
      });

      const unused = Math.max(entitlement - usedDays, 0);
      carryForward = Math.min(carryLimit, carryForward + unused);
    }

    return carryForward;
  }

  private async getAvailableLeaveCredits(
    teacherId: string,
    leaveTypeId: string,
    excludeRequestId?: string,
  ) {
    const now = new Date();
    const creditSum = await this.prisma.teacherLeaveCredit.aggregate({
      where: {
        teacherId,
        leaveTypeId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _sum: { days: true },
    });

    const usedSum = await this.prisma.teacherLeaveRequest.aggregate({
      where: {
        teacherId,
        leaveTypeId,
        deletedAt: null,
        status: {
          in: [
            TeacherLeaveRequestStatus.PENDING_ADMINISTRATION,
            TeacherLeaveRequestStatus.APPROVED,
          ],
        },
        ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
      },
      _sum: { days: true },
    });

    const credits = creditSum._sum.days || 0;
    const used = usedSum._sum.days || 0;

    return credits - used;
  }

  private async validateTeacherLeavePolicy(params: {
    teacher: any;
    leaveType: any;
    startDate: Date;
    endDate: Date;
    requestedDays: number;
    excludeRequestId?: string;
  }) {
    const { teacher, leaveType, startDate, endDate, requestedDays } = params;

    if (leaveType.status !== 'ACTIVE') {
      throw new BadRequestException('Selected leave type is inactive');
    }

    if (
      leaveType.eligibilityGender &&
      leaveType.eligibilityGender !== LeaveTypeGenderRule.ANY
    ) {
      const teacherGender = this.normalizeGenderValue(teacher.gender);
      if (teacherGender === 'UNKNOWN') {
        throw new BadRequestException(
          'Teacher gender is missing. Please update your profile before requesting this leave type.',
        );
      }

      if (teacherGender !== leaveType.eligibilityGender) {
        throw new BadRequestException(
          `This leave type is only available for ${leaveType.eligibilityGender.toLowerCase()} teachers.`,
        );
      }
    }

    if (leaveType.limitPeriod === LeaveTypeLimitPeriod.YEAR) {
      const startYear = startDate.getUTCFullYear();
      const endYear = endDate.getUTCFullYear();
      if (startYear !== endYear) {
        throw new BadRequestException(
          'Leave request cannot span multiple years for this leave type. Please split the request by year.',
        );
      }

      const entitlement = this.calculateEntitlementForYear(
        leaveType,
        teacher,
        startDate,
      );
      const carryForward = await this.calculateCarryForwardDays(
        leaveType,
        teacher,
        startYear,
      );
      const existingRequests = await this.getTeacherLeaveRequestsForValidation({
        teacherId: teacher.id,
        leaveTypeId: leaveType.id,
        startDate: new Date(Date.UTC(startYear, 0, 1)),
        endDate: new Date(Date.UTC(startYear, 11, 31)),
        excludeRequestId: params.excludeRequestId,
      });

      let usedDays = 0;
      existingRequests.forEach(request => {
        const counts = this.buildDayCountByYear(
          request.startDate,
          request.endDate,
        );
        usedDays += counts.get(startYear) || 0;
      });

      const available = Math.max(entitlement + carryForward - usedDays, 0);

      if (requestedDays > available) {
        throw new BadRequestException(
          `Insufficient leave balance. Available: ${available} day(s). Requested: ${requestedDays} day(s).`,
        );
      }
    }

    if (leaveType.limitPeriod === LeaveTypeLimitPeriod.WEEK) {
      const requestedWeekMap = this.buildDayCountByWeek(startDate, endDate);
      const existingRequests = await this.getTeacherLeaveRequestsForValidation({
        teacherId: teacher.id,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        excludeRequestId: params.excludeRequestId,
      });

      const existingWeekMap = new Map<string, number>();
      existingRequests.forEach(request => {
        const counts = this.buildDayCountByWeek(
          request.startDate,
          request.endDate,
        );
        counts.forEach((count, key) => {
          existingWeekMap.set(key, (existingWeekMap.get(key) || 0) + count);
        });
      });

      requestedWeekMap.forEach((requestedCount, key) => {
        const existingCount = existingWeekMap.get(key) || 0;
        if (existingCount + requestedCount > leaveType.maxDays) {
          throw new BadRequestException(
            `Weekly leave limit exceeded. Week ${key} allows ${leaveType.maxDays} day(s).`,
          );
        }
      });
    }

    if (leaveType.limitPeriod === LeaveTypeLimitPeriod.LIFETIME) {
      const existingRequests = await this.getTeacherLeaveRequestsForValidation({
        teacherId: teacher.id,
        leaveTypeId: leaveType.id,
        excludeRequestId: params.excludeRequestId,
      });
      const usedDays = existingRequests.reduce(
        (total, request) => total + request.days,
        0,
      );
      const available = Math.max(leaveType.maxDays - usedDays, 0);

      if (requestedDays > available) {
        throw new BadRequestException(
          `Lifetime leave limit exceeded. Available: ${available} day(s).`,
        );
      }
    }

    if (leaveType.requiresSubstituteCredit) {
      const availableCredits = await this.getAvailableLeaveCredits(
        teacher.id,
        leaveType.id,
        params.excludeRequestId,
      );
      if (requestedDays > availableCredits) {
        throw new BadRequestException(
          `Insufficient substitute leave credits. Available: ${availableCredits} day(s).`,
        );
      }
    }
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

    // Validate date format first
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (
      !datePattern.test(createTeacherLeaveRequestDto.startDate) ||
      !datePattern.test(createTeacherLeaveRequestDto.endDate)
    ) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }

    // Calculate days using the same method as frontend
    const calculatedDays = this.calculateLeaveDays(
      createTeacherLeaveRequestDto.startDate,
      createTeacherLeaveRequestDto.endDate,
    );

    // Parse dates for additional validation
    const startDate = new Date(
      createTeacherLeaveRequestDto.startDate + 'T00:00:00.000Z',
    );
    const endDate = new Date(
      createTeacherLeaveRequestDto.endDate + 'T00:00:00.000Z',
    );
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Validate date logic
    if (startDate < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    if (calculatedDays <= 0) {
      throw new BadRequestException(
        'Invalid date range. End date must be after or equal to start date',
      );
    }

    // Validate that frontend calculated days match backend calculation
    // Note: Transform decorator in DTO should handle string-to-number conversion
    const receivedDays =
      typeof createTeacherLeaveRequestDto.days === 'string'
        ? parseInt(createTeacherLeaveRequestDto.days, 10)
        : createTeacherLeaveRequestDto.days;

    if (calculatedDays !== receivedDays) {
      throw new BadRequestException(
        `Days calculation mismatch. Expected: ${calculatedDays}, received: ${receivedDays}. Please refresh the form and try again.`,
      );
    }

    const leaveType = await this.prisma.leaveType.findFirst({
      where: {
        id: createTeacherLeaveRequestDto.leaveTypeId,
        deletedAt: null,
      },
    });

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    await this.validateTeacherLeavePolicy({
      teacher,
      leaveType,
      startDate,
      endDate,
      requestedDays: calculatedDays,
    });

    const teacherLeaveRequest = await this.prisma.teacherLeaveRequest.create({
      data: {
        title: createTeacherLeaveRequestDto.title,
        description: createTeacherLeaveRequestDto.description,
        leaveTypeId: createTeacherLeaveRequestDto.leaveTypeId,
        status: TeacherLeaveRequestStatus.PENDING_ADMINISTRATION,
        startDate: new Date(
          createTeacherLeaveRequestDto.startDate + 'T00:00:00.000Z',
        ),
        endDate: new Date(
          createTeacherLeaveRequestDto.endDate + 'T00:00:00.000Z',
        ),
        days: calculatedDays,
        teacherId: teacher.id,
        createdById: userId,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            isPaid: true,
            maxDays: true,
            paidDays: true,
            limitPeriod: true,
            eligibilityGender: true,
            prorateOnTenure: true,
            proratePeriodMonths: true,
            carryForwardLimit: true,
            encashAfterLimit: true,
            requiresSubstituteCredit: true,
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
    if (
      createTeacherLeaveRequestDto.attachments &&
      createTeacherLeaveRequestDto.attachments.length > 0
    ) {
      try {
        // Import the attachment service dynamically to avoid circular dependencies
        const { LeaveRequestAttachmentService } =
          await import('./leave-request-attachment.service');
        const attachmentService = new LeaveRequestAttachmentService(
          this.prisma,
          this.auditService,
        );

        await attachmentService.uploadTeacherLeaveRequestAttachments(
          teacherLeaveRequest.id,
          createTeacherLeaveRequestDto.attachments,
          userId,
          userRole,
          ipAddress,
          userAgent,
        );
      } catch (attachmentError) {
        console.error(
          'Error uploading teacher leave request attachments:',
          attachmentError,
        );
        // Don't fail the leave request creation if attachments fail
        // The leave request is still created successfully
      }
    }

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
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            isPaid: true,
            maxDays: true,
            paidDays: true,
            limitPeriod: true,
            eligibilityGender: true,
            prorateOnTenure: true,
            proratePeriodMonths: true,
            carryForwardLimit: true,
            encashAfterLimit: true,
            requiresSubstituteCredit: true,
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
          leaveType: {
            select: {
              id: true,
              name: true,
              description: true,
              isPaid: true,
              maxDays: true,
              paidDays: true,
              limitPeriod: true,
              eligibilityGender: true,
              prorateOnTenure: true,
              proratePeriodMonths: true,
              carryForwardLimit: true,
              encashAfterLimit: true,
              requiresSubstituteCredit: true,
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
        include: {
          leaveType: true,
          teacher: true,
        },
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

    if (actionDto.status === TeacherLeaveRequestStatus.APPROVED) {
      await this.validateTeacherLeavePolicy({
        teacher: teacherLeaveRequest.teacher,
        leaveType: teacherLeaveRequest.leaveType,
        startDate: teacherLeaveRequest.startDate,
        endDate: teacherLeaveRequest.endDate,
        requestedDays: teacherLeaveRequest.days,
        excludeRequestId: teacherLeaveRequest.id,
      });
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
          leaveType: {
            select: {
              id: true,
              name: true,
              description: true,
              isPaid: true,
              maxDays: true,
              paidDays: true,
              limitPeriod: true,
              eligibilityGender: true,
              prorateOnTenure: true,
              proratePeriodMonths: true,
              carryForwardLimit: true,
              encashAfterLimit: true,
              requiresSubstituteCredit: true,
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
      });

    // Update leave usage if approved
    if (actionDto.status === TeacherLeaveRequestStatus.APPROVED) {
      try {
        await this.leaveUsageService.updateUsageOnApproval(
          teacherLeaveRequest.teacherId,
          teacherLeaveRequest.leaveTypeId,
          teacherLeaveRequest.days,
          id,
          adminId,
          ipAddress,
          userAgent,
        );
      } catch (usageError) {
        console.error('Error updating leave usage:', usageError);
        // Don't fail the approval if usage tracking fails
        // The leave request is still approved successfully
      }
    }

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
          leaveType: {
            select: {
              id: true,
              name: true,
              description: true,
              isPaid: true,
              maxDays: true,
              paidDays: true,
              limitPeriod: true,
              eligibilityGender: true,
              prorateOnTenure: true,
              proratePeriodMonths: true,
              carryForwardLimit: true,
              encashAfterLimit: true,
              requiresSubstituteCredit: true,
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
      });

    // Decrease usage if the request was previously approved
    if (teacherLeaveRequest.status === TeacherLeaveRequestStatus.APPROVED) {
      try {
        await this.leaveUsageService.decreaseUsageOnCancellation(
          teacherLeaveRequest.teacherId,
          teacherLeaveRequest.leaveTypeId,
          teacherLeaveRequest.days,
          id,
          userId,
          userRole,
          ipAddress,
          userAgent,
        );
      } catch (usageError) {
        console.error('Error decreasing leave usage:', usageError);
        // Don't fail the cancellation if usage tracking fails
        // The leave request is still cancelled successfully
      }
    }

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
