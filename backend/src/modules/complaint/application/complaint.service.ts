import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  UserRole,
  ComplaintStatus,
  CreateComplaintDto,
} from '@sms/shared-types';

@Injectable()
export class ComplaintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new complaint
   *
   * For CLASS_TEACHER recipient type:
   * - Students: automatically assigned to their own class teacher
   * - Parents: automatically assigned to their first child's class teacher
   *   TODO: Later implement logic for multiple children in different classes
   */
  async create(
    data: CreateComplaintDto,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Only students, teachers, parents can create
    if (
      ![UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT].includes(userRole)
    ) {
      throw new ForbiddenException('You are not allowed to create complaints');
    }

    // Extract only the fields that should be in CreateComplaintDto
    const { title, description, type, priority, recipientType, recipientId } =
      data;

    // Convert empty string to null for optional foreign keys
    let cleanRecipientId =
      recipientId && recipientId.trim() !== '' ? recipientId : null;

    // If recipientType is CLASS_TEACHER and no specific recipientId is provided,
    // find the student's class teacher automatically
    if (
      recipientType === 'CLASS_TEACHER' &&
      !cleanRecipientId &&
      (userRole === UserRole.STUDENT || userRole === UserRole.PARENT)
    ) {
      console.log(
        `Auto-assigning class teacher for ${userRole} with userId: ${userId}`,
      );
      if (userRole === UserRole.STUDENT) {
        // For students: find their own class teacher
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

        if (student?.class?.classTeacherId) {
          // Get the teacher's user ID
          const teacher = await this.prisma.teacher.findUnique({
            where: { id: student.class.classTeacherId },
            select: { userId: true },
          });

          if (teacher) {
            cleanRecipientId = teacher.userId;
          }
        }
      } else if (userRole === UserRole.PARENT) {
        // For parents: find their children's class teachers
        console.log(
          'Processing parent complaint - finding children and class teachers',
        );
        const parent = await this.prisma.parent.findFirst({
          where: { userId, deletedAt: null },
          include: {
            children: {
              include: {
                student: {
                  include: {
                    class: {
                      include: {
                        classTeacher: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (parent?.children && parent.children.length > 0) {
          // For now, just use the first child's class teacher
          // TODO: Later implement logic for multiple children in different classes
          const firstChild = parent.children[0];

          if (firstChild.student?.class?.classTeacherId) {
            const teacher = await this.prisma.teacher.findUnique({
              where: { id: firstChild.student.class.classTeacherId },
              select: { userId: true },
            });

            if (teacher) {
              cleanRecipientId = teacher.userId;
              console.log(
                `Assigned class teacher with userId: ${cleanRecipientId} for child in class ${firstChild.student.class.name}`,
              );
            }
          }
        }
      }
    }

    console.log(
      `Creating complaint with recipientId: ${cleanRecipientId}, recipientType: ${recipientType}`,
    );
    const complaint = await this.prisma.complaint.create({
      data: {
        title,
        description,
        type,
        priority,
        recipientType,
        recipientId: cleanRecipientId,
        complainantId: userId,
        complainantType: userRole,
        status: ComplaintStatus.OPEN,
      },
    });
    await this.auditService.record({
      userId,
      action: 'COMPLAINT_CREATED',
      module: 'COMPLAINT',
      ipAddress,
      userAgent,
      details: { complaintId: complaint.id },
    });
    return complaint;
  }

  async findAll(userId: string, userRole: UserRole, filters: any = {}) {
    // Admins see all, others see their own or assigned/recipient
    let where: any = {};
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      // Optionally filter by status/type/priority
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.priority) where.priority = filters.priority;
    } else if (userRole === UserRole.TEACHER) {
      // For teachers, also include complaints where they are the class teacher
      // First, get the teacher's ID
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true },
      });

      if (teacher) {
        // Get all classes where this teacher is the class teacher
        const classTeacherClasses = await this.prisma.class.findMany({
          where: { classTeacherId: teacher.id, deletedAt: null },
          select: { id: true },
        });

        const classIds = classTeacherClasses.map(cls => cls.id);

        // Get all students in these classes
        const studentsInClasses = await this.prisma.student.findMany({
          where: {
            classId: { in: classIds },
            deletedAt: null,
          },
          select: { userId: true },
        });

        const studentUserIds = studentsInClasses.map(student => student.userId);

        where = {
          OR: [
            { complainantId: userId },
            { recipientId: userId },
            { assignedToId: userId },
            // Include complaints from students in classes where this teacher is the class teacher
            // AND the complaint is addressed to CLASS_TEACHER
            {
              AND: [
                { complainantId: { in: studentUserIds } },
                { recipientType: 'CLASS_TEACHER' },
              ],
            },
          ],
        };
      } else {
        // Fallback to basic filtering if teacher record not found
        where = {
          OR: [
            { complainantId: userId },
            { recipientId: userId },
            { assignedToId: userId },
          ],
        };
      }
    } else {
      where = {
        OR: [
          { complainantId: userId },
          { recipientId: userId },
          { assignedToId: userId },
        ],
      };
    }
    return this.prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            attachments: true,
            responses: true,
          },
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        complainant: {
          select: { id: true, fullName: true, email: true },
        },
        recipient: {
          select: { id: true, fullName: true, email: true },
        },
        assignedTo: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    console.log('ComplaintService.findOne called with:', {
      id,
      userId,
      userRole,
    });

    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            responder: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        complainant: {
          select: { id: true, fullName: true, email: true },
        },
        recipient: {
          select: { id: true, fullName: true, email: true },
        },
        assignedTo: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    console.log('Complaint found:', complaint ? 'Yes' : 'No');
    if (complaint) {
      console.log('Complaint details:', {
        id: complaint.id,
        complainantId: complaint.complainantId,
        recipientId: complaint.recipientId,
        assignedToId: complaint.assignedToId,
        status: complaint.status,
      });
    }

    if (!complaint) throw new NotFoundException('Complaint not found');

    // Super admin and admin can access all complaints
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      console.log('Access granted: Admin/Super Admin');
      return complaint;
    }

    // Check basic access: complainant, recipient, assigned
    if (
      complaint.complainantId === userId ||
      complaint.recipientId === userId ||
      complaint.assignedToId === userId
    ) {
      console.log('Access granted: Direct relationship');
      return complaint;
    }

    // For teachers, check if they are the class teacher of the student who created the complaint
    if (userRole === UserRole.TEACHER) {
      console.log('Checking teacher access...');
      // Get the teacher record
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true },
      });

      console.log('Teacher record found:', teacher ? 'Yes' : 'No');

      if (teacher) {
        // Check if the student is in a class where this teacher is the class teacher
        const student = await this.prisma.student.findFirst({
          where: {
            userId: complaint.complainantId,
            deletedAt: null,
          },
          include: {
            class: {
              select: { classTeacherId: true },
            },
          },
        });

        console.log('Student record found:', student ? 'Yes' : 'No');
        if (student) {
          console.log(
            'Student class teacher ID:',
            student.class?.classTeacherId,
          );
          console.log('Teacher ID:', teacher.id);
        }

        if (student?.class?.classTeacherId === teacher.id) {
          console.log('Access granted: Class teacher relationship');
          return complaint;
        }
      }
    }

    console.log('Access denied: No valid relationship found');
    throw new ForbiddenException('You do not have access to this complaint');
  }

  async update(
    id: string,
    updateData: any,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const complaint = await this.findOne(id, userId, userRole);

    // Super admin and admin can update any complaint
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      // Allow update
    }
    // Complainant can update if complaint is open
    else if (
      complaint.complainantId === userId &&
      complaint.status === 'OPEN'
    ) {
      // Allow update
    }
    // Recipient or assigned person can update (for status changes, responses, etc.)
    else if (
      complaint.recipientId === userId ||
      complaint.assignedToId === userId
    ) {
      // Allow update
    }
    // For teachers, check if they are the class teacher of the student
    else if (
      userRole === UserRole.TEACHER &&
      complaint.recipientType === 'CLASS_TEACHER'
    ) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true },
      });

      if (teacher) {
        const student = await this.prisma.student.findFirst({
          where: {
            userId: complaint.complainantId,
            deletedAt: null,
          },
          include: {
            class: {
              select: { classTeacherId: true },
            },
          },
        });

        if (student?.class?.classTeacherId === teacher.id) {
          // Allow update
        } else {
          throw new ForbiddenException('You cannot update this complaint');
        }
      } else {
        throw new ForbiddenException('You cannot update this complaint');
      }
    } else {
      throw new ForbiddenException('You cannot update this complaint');
    }
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: updateData,
    });
    await this.auditService.record({
      userId,
      action: 'COMPLAINT_UPDATED',
      module: 'COMPLAINT',
      ipAddress,
      userAgent,
      details: { complaintId: id, changes: updateData },
    });
    return updated;
  }

  async assign(
    id: string,
    assignedToId: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Only admin can assign
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      throw new ForbiddenException('Only admin can assign complaints');
    }
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        assignedToId,
        assignedAt: new Date(),
        status: 'IN_PROGRESS',
      },
    });
    await this.auditService.record({
      userId,
      action: 'COMPLAINT_ASSIGNED',
      module: 'COMPLAINT',
      ipAddress,
      userAgent,
      details: { complaintId: id, assignedToId },
    });
    return updated;
  }

  async resolve(
    id: string,
    resolution: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const complaint = await this.findOne(id, userId, userRole);
    // Only admin, assigned, or recipient can resolve
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      complaint.assignedToId !== userId &&
      complaint.recipientId !== userId
    ) {
      throw new ForbiddenException('You cannot resolve this complaint');
    }
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
      },
    });
    await this.auditService.record({
      userId,
      action: 'COMPLAINT_RESOLVED',
      module: 'COMPLAINT',
      ipAddress,
      userAgent,
      details: { complaintId: id, resolution },
    });
    return updated;
  }

  async delete(
    id: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const complaint = await this.findOne(id, userId, userRole);

    // Only complainant can delete their own complaint, or admin/super admin
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      complaint.complainantId !== userId
    ) {
      throw new ForbiddenException(
        'Only the complainant can delete their own complaint',
      );
    }

    // Delete all related data first
    await this.prisma.complaintResponse.deleteMany({
      where: { complaintId: id },
    });

    await this.prisma.complaintAttachment.deleteMany({
      where: { complaintId: id },
    });

    // Delete the complaint
    await this.prisma.complaint.delete({
      where: { id },
    });

    await this.auditService.record({
      userId,
      action: 'COMPLAINT_DELETED',
      module: 'COMPLAINT',
      ipAddress,
      userAgent,
      details: { complaintId: id },
    });

    return { success: true };
  }
}
