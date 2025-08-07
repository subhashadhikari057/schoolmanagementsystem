import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { CreateSubjectDtoType, UpdateSubjectDtoType } from '../dto/subject.dto';

@Injectable()
export class SubjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a new subject (only if code is unique)
   */
  async create(
    dto: CreateSubjectDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.subject.findUnique({
      where: { code: dto.code },
    });

    if (existing) throw new ConflictException('Subject code already exists');

    // Use transaction to create subject and class assignments together
    const result = await this.prisma.$transaction(async tx => {
      // Create the subject
      const subject = await tx.subject.create({
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          maxMarks: dto.maxMarks || 100,
          passMarks: dto.passMarks || 40,
          createdById: createdBy,
        },
      });

      // Create class assignments if provided
      if (dto.classAssignments && dto.classAssignments.length > 0) {
        const classAssignmentData = dto.classAssignments.map(assignment => ({
          classId: assignment.classId,
          subjectId: subject.id,
          teacherId: assignment.teacherId || null,
          createdById: createdBy,
        }));

        await tx.classSubject.createMany({
          data: classAssignmentData,
          skipDuplicates: true,
        });
      }

      // Create teacher assignments if provided
      if (dto.teacherIds && dto.teacherIds.length > 0) {
        const teacherAssignmentData = dto.teacherIds.map(teacherId => ({
          teacherId,
          subjectId: subject.id,
          createdById: createdBy,
        }));

        await tx.teacherSubject.createMany({
          data: teacherAssignmentData,
          skipDuplicates: true,
        });
      }

      return subject;
    });

    await this.audit.record({
      userId: createdBy,
      action: 'CREATE_SUBJECT',
      module: 'subject',
      status: 'SUCCESS',
      details: {
        id: result.id,
        code: result.code,
        classAssignments: dto.classAssignments?.length || 0,
      },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  /**
   * Get all non-deleted subjects with class assignments
   */
  async findAll() {
    return this.prisma.subject.findMany({
      where: { deletedAt: null },
      include: {
        assignedClasses: {
          include: {
            class: {
              select: {
                id: true,
                grade: true,
                section: true,
              },
            },
            teacher: {
              select: {
                id: true,
                user: {
                  select: {
                    fullName: true,
                  },
                },
                designation: true,
              },
            },
          },
        },
        teacherAssignments: {
          include: {
            teacher: {
              select: {
                id: true,
                user: {
                  select: {
                    fullName: true,
                  },
                },
                designation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single subject by ID
   */
  async findById(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (!subject || subject.deletedAt) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  /**
   * Update subject by ID
   */
  async update(
    id: string,
    dto: UpdateSubjectDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (!subject || subject.deletedAt) {
      throw new NotFoundException('Subject not found');
    }

    // Separate DTO fields from relation data
    const { classAssignments, teacherIds, ...subjectData } = dto;

    console.log('Original DTO:', dto);
    console.log('Subject data after extraction:', subjectData);
    console.log('Class assignments:', classAssignments);
    console.log('Teacher IDs:', teacherIds);

    // Ensure only valid Subject model fields are passed to Prisma
    const validSubjectFields = {
      ...(subjectData.name && { name: subjectData.name }),
      ...(subjectData.code && { code: subjectData.code }),
      ...(subjectData.description && { description: subjectData.description }),
      ...(subjectData.maxMarks && { maxMarks: subjectData.maxMarks }),
      ...(subjectData.passMarks && { passMarks: subjectData.passMarks }),
    };

    // Update subject using transaction to handle relations
    const updated = await this.prisma.$transaction(async prisma => {
      // Update the subject basic fields
      const updatedSubject = await prisma.subject.update({
        where: { id },
        data: {
          ...validSubjectFields,
          updatedById: updatedBy,
          updatedAt: new Date(),
        },
      });

      // Handle class assignments if provided
      if (classAssignments !== undefined) {
        // Delete existing class assignments
        await prisma.classSubject.deleteMany({
          where: { subjectId: id },
        });

        // Create new class assignments
        if (classAssignments.length > 0) {
          await prisma.classSubject.createMany({
            data: classAssignments.map(assignment => ({
              subjectId: id,
              classId: assignment.classId,
              teacherId: assignment.teacherId || null,
              createdById: updatedBy,
            })),
          });
        }
      }

      // Handle teacher assignments if provided
      if (teacherIds !== undefined) {
        // Delete existing teacher assignments
        await prisma.teacherSubject.deleteMany({
          where: { subjectId: id },
        });

        // Create new teacher assignments
        if (teacherIds.length > 0) {
          await prisma.teacherSubject.createMany({
            data: teacherIds.map(teacherId => ({
              subjectId: id,
              teacherId,
              createdById: updatedBy,
            })),
          });
        }
      }

      // Return updated subject with relations
      return await prisma.subject.findUnique({
        where: { id },
        include: {
          assignedClasses: {
            include: {
              class: {
                select: {
                  id: true,
                  grade: true,
                  section: true,
                },
              },
              teacher: {
                select: {
                  id: true,
                  designation: true,
                  user: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
          teacherAssignments: {
            include: {
              teacher: {
                select: {
                  id: true,
                  designation: true,
                  user: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_SUBJECT',
      module: 'subject',
      status: 'SUCCESS',
      details: { id, updatedFields: Object.keys(dto) },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  /**
   * Soft delete a subject with foreign key constraint checking
   */
  async softDelete(
    id: string,
    deletedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        assignedClasses: {
          include: {
            class: {
              select: {
                grade: true,
                section: true,
              },
            },
          },
        },
        teacherAssignments: {
          include: {
            teacher: {
              select: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subject || subject.deletedAt) {
      throw new NotFoundException('Subject not found or already deleted');
    }

    // Check for existing relationships
    const affectedRelations: string[] = [];

    if (subject.assignedClasses.length > 0) {
      const classes = subject.assignedClasses.map(
        ac => `Grade ${ac.class.grade} Section ${ac.class.section}`,
      );
      affectedRelations.push(
        `${subject.assignedClasses.length} class assignment(s): ${classes.join(', ')}`,
      );
    }

    if (subject.teacherAssignments.length > 0) {
      const teachers = subject.teacherAssignments.map(
        ta => ta.teacher.user.fullName,
      );
      affectedRelations.push(
        `${subject.teacherAssignments.length} teacher assignment(s): ${teachers.join(', ')}`,
      );
    }

    // If there are relationships, provide warning but allow deletion (soft delete)
    if (affectedRelations.length > 0) {
      // First remove the relationships, then soft delete the subject
      await this.prisma.$transaction(async tx => {
        // Remove class assignments
        await tx.classSubject.deleteMany({
          where: { subjectId: id },
        });

        // Remove teacher assignments
        await tx.teacherSubject.deleteMany({
          where: { subjectId: id },
        });

        // Soft delete the subject
        await tx.subject.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedById: deletedBy,
          },
        });
      });

      await this.audit.record({
        userId: deletedBy,
        action: 'DELETE_SUBJECT_WITH_RELATIONS',
        module: 'subject',
        status: 'SUCCESS',
        details: {
          id,
          subjectName: subject.name,
          affectedRelations: affectedRelations.length,
          relations: affectedRelations,
        },
        ipAddress: ip,
        userAgent,
      });

      return {
        message: 'Subject and all related assignments deleted successfully',
        id,
        affectedRelations,
      };
    } else {
      // No relationships, simple soft delete
      await this.prisma.subject.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: deletedBy,
        },
      });

      await this.audit.record({
        userId: deletedBy,
        action: 'DELETE_SUBJECT',
        module: 'subject',
        status: 'SUCCESS',
        details: { id, subjectName: subject.name },
        ipAddress: ip,
        userAgent,
      });

      return { message: 'Subject deleted successfully', id };
    }
  }
}
