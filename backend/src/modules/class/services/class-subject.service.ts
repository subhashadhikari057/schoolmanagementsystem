import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  CreateClassSubjectDto,
  UpdateClassSubjectDto,
  GetClassSubjectsDto,
  BulkAssignClassSubjectsDto,
  ClassSubjectResponseDto,
} from '@sms/shared-types';

@Injectable()
export class ClassSubjectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all subjects assigned to a class with optional teacher and subject details
   */
  async getClassSubjects(
    params: GetClassSubjectsDto,
  ): Promise<ClassSubjectResponseDto[]> {
    const {
      classId,
      includeTeacher = true,
      includeSubjectDetails = true,
    } = params;
    // Verify class exists
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId, deletedAt: null },
    });

    if (!classExists) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const classSubjects = await this.prisma.classSubject.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      include: {
        subject: includeSubjectDetails
          ? {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
                maxMarks: true,
                passMarks: true,
              },
            }
          : false,
        teacher: includeTeacher
          ? {
              select: {
                id: true,
                userId: true,
                employeeId: true,
                designation: true,
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            }
          : false,
      },
      orderBy: [{ subject: { name: 'asc' } }],
    });

    return classSubjects as ClassSubjectResponseDto[];
  }

  /**
   * Assign a subject to a class
   */
  async assignSubjectToClass(
    createDto: CreateClassSubjectDto,
    userId: string,
  ): Promise<ClassSubjectResponseDto> {
    const { classId, subjectId, teacherId } = createDto;

    // Verify class exists
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId, deletedAt: null },
    });

    if (!classExists) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // Verify subject exists
    const subjectExists = await this.prisma.subject.findUnique({
      where: { id: subjectId, deletedAt: null },
    });

    if (!subjectExists) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    // Verify teacher exists if provided
    if (teacherId) {
      const teacherExists = await this.prisma.teacher.findUnique({
        where: { id: teacherId, deletedAt: null },
      });

      if (!teacherExists) {
        throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
      }
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.classSubject.findFirst({
      where: {
        classId,
        subjectId,
        deletedAt: null,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(`Subject is already assigned to this class`);
    }

    const classSubject = await this.prisma.classSubject.create({
      data: {
        classId,
        subjectId,
        teacherId,
        createdById: userId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            maxMarks: true,
            passMarks: true,
          },
        },
        teacher: teacherId
          ? {
              select: {
                id: true,
                userId: true,
                employeeId: true,
                designation: true,
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            }
          : false,
      },
    });

    return classSubject as ClassSubjectResponseDto;
  }

  /**
   * Update a class subject assignment (mainly for teacher changes)
   */
  async updateClassSubject(
    id: string,
    updateDto: UpdateClassSubjectDto,
    userId: string,
  ): Promise<ClassSubjectResponseDto> {
    // Verify assignment exists
    const existingAssignment = await this.prisma.classSubject.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingAssignment) {
      throw new NotFoundException(
        `Class subject assignment with ID ${id} not found`,
      );
    }

    // Verify teacher exists if being updated
    if (updateDto.teacherId) {
      const teacherExists = await this.prisma.teacher.findUnique({
        where: { id: updateDto.teacherId, deletedAt: null },
      });

      if (!teacherExists) {
        throw new NotFoundException(
          `Teacher with ID ${updateDto.teacherId} not found`,
        );
      }
    }

    const updatedAssignment = await this.prisma.classSubject.update({
      where: { id },
      data: {
        ...updateDto,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            maxMarks: true,
            passMarks: true,
          },
        },
        teacher: {
          select: {
            id: true,
            userId: true,
            employeeId: true,
            designation: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedAssignment as ClassSubjectResponseDto;
  }

  /**
   * Remove a subject from a class (soft delete)
   */
  async removeSubjectFromClass(id: string, userId: string): Promise<void> {
    const existingAssignment = await this.prisma.classSubject.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingAssignment) {
      throw new NotFoundException(
        `Class subject assignment with ID ${id} not found`,
      );
    }

    await this.prisma.classSubject.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });
  }

  /**
   * Bulk assign multiple subjects to a class
   */
  async bulkAssignSubjects(
    bulkDto: BulkAssignClassSubjectsDto,
    userId: string,
  ): Promise<ClassSubjectResponseDto[]> {
    const { classId, assignments } = bulkDto;

    // Verify class exists
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId, deletedAt: null },
    });

    if (!classExists) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // Use transaction for bulk operations
    const results = await this.prisma.$transaction(async tx => {
      const createdAssignments: ClassSubjectResponseDto[] = [];

      for (const assignment of assignments) {
        const { subjectId, teacherId } = assignment;

        // Check if assignment already exists
        const existingAssignment = await tx.classSubject.findFirst({
          where: {
            classId,
            subjectId,
            deletedAt: null,
          },
        });

        if (!existingAssignment) {
          const created = await tx.classSubject.create({
            data: {
              classId,
              subjectId,
              teacherId,
              createdById: userId,
            },
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  description: true,
                  maxMarks: true,
                  passMarks: true,
                },
              },
              teacher: teacherId
                ? {
                    select: {
                      id: true,
                      userId: true,
                      employeeId: true,
                      designation: true,
                      user: {
                        select: {
                          id: true,
                          fullName: true,
                          email: true,
                        },
                      },
                    },
                  }
                : false,
            },
          });
          createdAssignments.push(created as ClassSubjectResponseDto);
        }
      }

      return createdAssignments;
    });

    return results as ClassSubjectResponseDto[];
  }

  /**
   * Get available subjects for a class (not yet assigned)
   */
  async getAvailableSubjectsForClass(classId: string) {
    // Verify class exists
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId, deletedAt: null },
    });

    if (!classExists) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // Get already assigned subject IDs
    const assignedSubjects = await this.prisma.classSubject.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      select: { subjectId: true },
    });

    const assignedSubjectIds = assignedSubjects.map(cs => cs.subjectId);

    // Get all subjects not assigned to this class
    const availableSubjects = await this.prisma.subject.findMany({
      where: {
        id: { notIn: assignedSubjectIds },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        maxMarks: true,
        passMarks: true,
      },
      orderBy: { name: 'asc' },
    });

    return availableSubjects;
  }
}
