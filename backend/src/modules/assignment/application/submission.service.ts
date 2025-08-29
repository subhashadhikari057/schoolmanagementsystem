import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
} from '../dto/submission.dto';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create or update a submission
   */
  async createOrUpdate(
    dto: CreateSubmissionDto,
    createdById: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Validate that the assignment exists
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: dto.assignmentId },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Assignment not found');
    }

    // Validate that the student exists
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    // Check if submission already exists
    const existingSubmission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: dto.assignmentId,
          studentId: dto.studentId,
        },
      },
    });

    let submission;
    let action;

    if (existingSubmission) {
      // Update existing submission
      submission = await this.prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          submittedAt: dto.submittedAt || new Date(),
          isCompleted: dto.isCompleted,
          feedback: dto.feedback,
          studentNotes: dto.studentNotes,
          fileLinks: dto.fileLinks || [],
          updatedById: createdById,
          updatedAt: new Date(),
        },
        include: {
          assignment: {
            select: { title: true },
          },
          student: {
            select: {
              rollNumber: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });
      action = 'UPDATE_SUBMISSION';
    } else {
      // Create new submission
      submission = await this.prisma.submission.create({
        data: {
          assignmentId: dto.assignmentId,
          studentId: dto.studentId,
          submittedAt: dto.submittedAt || new Date(),
          isCompleted: dto.isCompleted,
          feedback: dto.feedback,
          studentNotes: dto.studentNotes,
          fileLinks: dto.fileLinks || [],
          createdById,
        },
        include: {
          assignment: {
            select: { title: true },
          },
          student: {
            select: {
              rollNumber: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });
      action = 'CREATE_SUBMISSION';
    }

    // Record audit
    await this.audit.record({
      userId: createdById,
      action,
      module: 'assignment',
      status: 'SUCCESS',
      details: {
        submissionId: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        isCompleted: submission.isCompleted,
      },
      ipAddress: ip,
      userAgent,
    });

    return submission;
  }

  /**
   * Get all submissions for an assignment
   */
  async findByAssignment(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Assignment not found');
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        assignmentId,
        deletedAt: null,
      },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            url: true,
            size: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return submissions;
  }

  /**
   * Get all submissions by a student
   */
  async findByStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.submission.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            subject: { select: { name: true } },
            class: { select: { grade: true, section: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Get submission history for a specific assignment and student
   */
  async findByAssignmentAndStudent(assignmentId: string, studentId: string) {
    // Validate that the assignment exists
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Assignment not found');
    }

    // Validate that the student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.submission.findMany({
      where: {
        assignmentId,
        studentId,
        deletedAt: null,
      },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            subject: { select: { name: true } },
            class: { select: { grade: true, section: true } },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            url: true,
            size: true,
            mimeType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Grade a submission (mark as complete/incomplete)
   */
  async gradeSubmission(
    submissionId: string,
    dto: UpdateSubmissionDto,
    gradedById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.deletedAt) {
      throw new NotFoundException('Submission not found');
    }

    const updatedSubmission = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        isCompleted: dto.isCompleted,
        feedback: dto.feedback,
        updatedById: gradedById,
        updatedAt: new Date(),
      },
      include: {
        assignment: {
          select: { title: true },
        },
        student: {
          select: {
            rollNumber: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    // Record audit
    await this.audit.record({
      userId: gradedById,
      action: 'GRADE_SUBMISSION',
      module: 'assignment',
      status: 'SUCCESS',
      details: {
        submissionId,
        isCompleted: dto.isCompleted,
        feedback: dto.feedback,
      },
      ipAddress: ip,
      userAgent,
    });

    return updatedSubmission;
  }

  /**
   * Get submission by ID
   */
  async findById(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            subject: { select: { name: true } },
            class: { select: { grade: true, section: true } },
          },
        },
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!submission || submission.deletedAt) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  /**
   * Delete submission
   */
  async delete(
    id: string,
    deletedById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });

    if (!submission || submission.deletedAt) {
      throw new NotFoundException('Submission not found');
    }

    await this.prisma.submission.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    });

    // Record audit
    await this.audit.record({
      userId: deletedById,
      action: 'DELETE_SUBMISSION',
      module: 'assignment',
      status: 'SUCCESS',
      details: {
        submissionId: id,
      },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Submission deleted successfully' };
  }
}
