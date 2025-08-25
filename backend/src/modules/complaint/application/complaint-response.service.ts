import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { UserRole } from '@sms/shared-types';

@Injectable()
export class ComplaintResponseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    complaintId: string,
    data: any,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Only admin, assigned, recipient, or complainant can respond
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');

    // Super admin and admin can respond to any complaint
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      // Allow response
    }
    // Check basic access: complainant, recipient, assigned
    else if (
      complaint.complainantId === userId ||
      complaint.recipientId === userId ||
      complaint.assignedToId === userId
    ) {
      // Allow response
    }
    // For teachers, check if they are the class teacher of the student who created the complaint
    else if (userRole === UserRole.TEACHER) {
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
          // Allow response
        } else {
          throw new ForbiddenException('You cannot respond to this complaint');
        }
      } else {
        throw new ForbiddenException('You cannot respond to this complaint');
      }
    } else {
      throw new ForbiddenException('You cannot respond to this complaint');
    }
    const response = await this.prisma.complaintResponse.create({
      data: {
        ...data,
        complaintId,
        responderId: userId,
      },
      include: {
        responder: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
    await this.auditService.record({
      userId,
      action: 'COMPLAINT_RESPONSE_CREATED',
      module: 'COMPLAINT',
      ipAddress,
      userAgent,
      details: { complaintId, responseId: response.id },
    });
    return response;
  }

  async findAll(complaintId: string, userId: string, userRole: UserRole) {
    // Only those with access to the complaint can see responses
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');

    // Super admin and admin can see responses for any complaint
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      // Allow access
    }
    // Check basic access: complainant, recipient, assigned
    else if (
      complaint.complainantId === userId ||
      complaint.recipientId === userId ||
      complaint.assignedToId === userId
    ) {
      // Allow access
    }
    // For teachers, check if they are the class teacher of the student who created the complaint
    else if (userRole === UserRole.TEACHER) {
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
          // Allow access
        } else {
          throw new ForbiddenException(
            'You do not have access to this complaint',
          );
        }
      } else {
        throw new ForbiddenException(
          'You do not have access to this complaint',
        );
      }
    } else {
      throw new ForbiddenException('You do not have access to this complaint');
    }
    const responses = await this.prisma.complaintResponse.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'asc' },
      include: {
        responder: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // Add respondent type information
    const responsesWithType = await Promise.all(
      responses.map(async response => {
        // Determine the respondent type by checking user roles
        const userWithRoles = await this.prisma.user.findUnique({
          where: { id: response.responderId },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        let respondentType = 'Unknown';
        if (userWithRoles?.roles && userWithRoles.roles.length > 0) {
          const roleNames = userWithRoles.roles.map(ur => ur.role.name);
          if (roleNames.includes('SUPER_ADMIN')) {
            respondentType = 'Super Admin';
          } else if (roleNames.includes('ADMIN')) {
            respondentType = 'Admin';
          } else if (roleNames.includes('TEACHER')) {
            respondentType = 'Teacher';
          } else if (roleNames.includes('STUDENT')) {
            respondentType = 'Student';
          } else if (roleNames.includes('PARENT')) {
            respondentType = 'Parent';
          }
        }

        return {
          ...response,
          respondentType,
        };
      }),
    );

    return responsesWithType;
  }
}
