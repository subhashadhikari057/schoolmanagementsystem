import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from '../dto/assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a new assignment
   * Only teachers and super admins can create assignments
   */
  async create(
    dto: CreateAssignmentDto,
    createdById: string,
    ip?: string,
    userAgent?: string,
  ) {
    let teacherId = dto.teacherId;

    // If teacherId is not provided, try to get it from the authenticated user
    if (!teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: createdById, deletedAt: null },
      });

      if (teacher) {
        teacherId = teacher.id;
      } else {
        throw new NotFoundException(
          'Teacher ID is required when creating assignment as non-teacher user',
        );
      }
    }
    // Validate that the class exists
    const classRecord = await this.prisma.class.findUnique({
      where: { id: dto.classId },
    });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Class not found');
    }

    // Validate that the subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });

    if (!subject || subject.deletedAt) {
      throw new NotFoundException('Subject not found');
    }

    // Validate that the teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    const assignment = await this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: teacherId,
        dueDate: dto.dueDate,
        additionalMetadata: dto.additionalMetadata || {},
        createdById,
      },
      include: {
        class: {
          select: { grade: true, section: true },
        },
        subject: {
          select: { name: true, code: true },
        },
        teacher: {
          select: { user: { select: { fullName: true } } },
        },
      },
    });

    // Record audit
    await this.audit.record({
      userId: createdById,
      action: 'CREATE_ASSIGNMENT',
      module: 'assignment',
      status: 'SUCCESS',
      details: {
        assignmentId: assignment.id,
        title: assignment.title,
        classId: assignment.classId,
        subjectId: assignment.subjectId,
      },
      ipAddress: ip,
      userAgent,
    });

    return assignment;
  }

  /**
   * Get all assignments with optional filtering
   */
  async findAll(filters?: {
    classId?: string;
    subjectId?: string;
    teacherId?: string;
  }) {
    const whereClause: any = { deletedAt: null };

    if (filters?.classId) {
      whereClause.classId = filters.classId;
    }
    if (filters?.subjectId) {
      whereClause.subjectId = filters.subjectId;
    }
    if (filters?.teacherId) {
      whereClause.teacherId = filters.teacherId;
    }

    return this.prisma.assignment.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            grade: true,
            section: true,
            students: {
              where: { deletedAt: null },
              select: {
                id: true,
                rollNumber: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        subject: {
          select: { name: true, code: true },
        },
        teacher: {
          select: { user: { select: { fullName: true } } },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                rollNumber: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true,
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get assignment by ID
   */
  async findById(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            grade: true,
            section: true,
            students: {
              where: { deletedAt: null },
              select: {
                id: true,
                rollNumber: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        subject: {
          select: { name: true, code: true },
        },
        teacher: {
          select: { user: { select: { fullName: true, email: true } } },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                rollNumber: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true,
          },
        },
      },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }

  /**
   * Update assignment
   */
  async update(
    id: string,
    dto: UpdateAssignmentDto,
    updatedById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existingAssignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!existingAssignment || existingAssignment.deletedAt) {
      throw new NotFoundException('Assignment not found');
    }

    // Validate relations if they are being updated
    if (dto.classId) {
      const classRecord = await this.prisma.class.findUnique({
        where: { id: dto.classId },
      });
      if (!classRecord || classRecord.deletedAt) {
        throw new NotFoundException('Class not found');
      }
    }

    if (dto.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: dto.subjectId },
      });
      if (!subject || subject.deletedAt) {
        throw new NotFoundException('Subject not found');
      }
    }

    let updateTeacherId = dto.teacherId;

    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
      });
      if (!teacher || teacher.deletedAt) {
        throw new NotFoundException('Teacher not found');
      }
      updateTeacherId = dto.teacherId;
    }

    const updateData: any = { ...dto };
    if (updateTeacherId) {
      updateData.teacherId = updateTeacherId;
    }

    const updatedAssignment = await this.prisma.assignment.update({
      where: { id },
      data: {
        ...updateData,
        updatedById,
        updatedAt: new Date(),
      },
      include: {
        class: {
          select: {
            id: true,
            grade: true,
            section: true,
            students: {
              where: { deletedAt: null },
              select: {
                id: true,
                rollNumber: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        teacher: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true } },
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                rollNumber: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true,
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    // Record audit
    await this.audit.record({
      userId: updatedById,
      action: 'UPDATE_ASSIGNMENT',
      module: 'assignment',
      status: 'SUCCESS',
      details: {
        assignmentId: id,
        changes: dto,
      },
      ipAddress: ip,
      userAgent,
    });

    return updatedAssignment;
  }

  /**
   * Soft delete assignment
   */
  async delete(
    id: string,
    deletedById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Assignment not found');
    }

    const deletedAssignment = await this.prisma.assignment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    });

    // Record audit
    await this.audit.record({
      userId: deletedById,
      action: 'DELETE_ASSIGNMENT',
      module: 'assignment',
      status: 'SUCCESS',
      details: {
        assignmentId: id,
        title: assignment.title,
      },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Assignment deleted successfully' };
  }

  /**
   * Get assignments for a specific teacher
   */
  async findByTeacher(teacherId: string) {
    return this.findAll({ teacherId });
  }

  /**
   * Get assignments for a specific class
   */
  async findByClass(classId: string) {
    return this.findAll({ classId });
  }

  /**
   * Get assignments for a specific subject
   */
  async findBySubject(subjectId: string) {
    return this.findAll({ subjectId });
  }
}
