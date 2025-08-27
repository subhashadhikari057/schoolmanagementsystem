import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { UserRole } from '@sms/shared-types';
import { getFileUrl } from '../../../shared/utils/file-upload.util';

@Injectable()
export class SubmissionAttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async uploadAttachments(
    submissionId: string,
    files: Express.Multer.File[],
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify submission exists and user has access
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: { userId: true },
        },
        assignment: {
          include: {
            teacher: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!submission || submission.deletedAt) {
      throw new NotFoundException('Submission not found');
    }

    // Check access permissions - only the student who created the submission, the teacher, or admin can upload
    const isStudent = submission.student.userId === userId;
    const isTeacher = submission.assignment.teacher.userId === userId;

    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      !isStudent &&
      !isTeacher
    ) {
      throw new ForbiddenException(
        'You do not have permission to upload attachments to this submission',
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate file types and sizes
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'text/plain',
      'application/rtf',
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File ${file.originalname} has unsupported type. Allowed types: images (jpg, jpeg, png, gif, webp), PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF`,
        );
      }

      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large. Maximum size is 10MB`,
        );
      }
    }

    // Create attachment records
    const attachmentData = files.map(file => ({
      submissionId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: getFileUrl(file.filename, 'submissions'),
    }));

    await this.prisma.submissionAttachment.createMany({
      data: attachmentData,
    });

    // Record audit
    await this.auditService.record({
      userId,
      action: 'SUBMISSION_ATTACHMENTS_UPLOADED',
      module: 'ASSIGNMENT',
      ipAddress,
      userAgent,
      details: {
        submissionId,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        attachmentCount: files.length,
        fileNames: files.map(f => f.originalname),
      },
    });

    return {
      message: `${files.length} attachment(s) uploaded successfully`,
      attachments: attachmentData,
    };
  }

  async getAttachments(
    submissionId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: { userId: true },
        },
        assignment: {
          include: {
            teacher: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!submission || submission.deletedAt) {
      throw new NotFoundException('Submission not found');
    }

    // Check access permissions - student, teacher, or admin can view
    const isStudent = submission.student.userId === userId;
    const isTeacher = submission.assignment.teacher.userId === userId;

    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      !isStudent &&
      !isTeacher
    ) {
      throw new ForbiddenException('You do not have access to this submission');
    }

    return this.prisma.submissionAttachment.findMany({
      where: { submissionId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async deleteAttachment(
    attachmentId: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const attachment = await this.prisma.submissionAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        submission: {
          include: {
            student: {
              select: { userId: true },
            },
            assignment: {
              include: {
                teacher: {
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check access permissions - only the student who created the submission, the teacher, or admin can delete
    const isStudent = attachment.submission.student.userId === userId;
    const isTeacher =
      attachment.submission.assignment.teacher.userId === userId;

    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      !isStudent &&
      !isTeacher
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this attachment',
      );
    }

    // Delete the file from storage
    const fs = await import('fs/promises');
    const path = await import('path');

    const filePath = path.join(
      process.cwd(),
      'uploads',
      'submissions',
      'attachments',
      attachment.filename,
    );

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Log error but continue with database deletion
      console.error('Error deleting file from storage:', error);
    }

    // Delete from database
    await this.prisma.submissionAttachment.delete({
      where: { id: attachmentId },
    });

    // Record audit
    await this.auditService.record({
      userId,
      action: 'SUBMISSION_ATTACHMENT_DELETED',
      module: 'ASSIGNMENT',
      ipAddress,
      userAgent,
      details: {
        submissionId: attachment.submissionId,
        assignmentId: attachment.submission.assignmentId,
        attachmentId,
        fileName: attachment.originalName,
      },
    });

    return {
      message: 'Attachment deleted successfully',
    };
  }
}
