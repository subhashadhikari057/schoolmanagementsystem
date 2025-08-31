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
export class AssignmentAttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async uploadAttachments(
    assignmentId: string,
    files: Express.Multer.File[],
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify assignment exists and user has access
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        teacher: {
          select: { userId: true },
        },
      },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Assignment not found');
    }

    // Check access permissions - only the teacher who created the assignment or admin can upload
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      assignment.teacher.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to upload attachments to this assignment',
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
      assignmentId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: getFileUrl(file.filename, 'assignments'),
    }));

    await this.prisma.assignmentAttachment.createMany({
      data: attachmentData,
    });

    // Record audit
    await this.auditService.record({
      userId,
      action: 'ASSIGNMENT_ATTACHMENTS_UPLOADED',
      module: 'ASSIGNMENT',
      ipAddress,
      userAgent,
      details: {
        assignmentId,
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
    assignmentId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        teacher: {
          select: { userId: true },
        },
        class: {
          select: { students: { select: { userId: true } } },
        },
      },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Assignment not found');
    }

    // Check access permissions - teacher, students in the class, or admin can view
    const isTeacher = assignment.teacher.userId === userId;
    const isStudentInClass = assignment.class.students.some(
      student => student.userId === userId,
    );

    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      !isTeacher &&
      !isStudentInClass
    ) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    return this.prisma.assignmentAttachment.findMany({
      where: { assignmentId },
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
    const attachment = await this.prisma.assignmentAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        assignment: {
          include: {
            teacher: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check access permissions - only the teacher who created the assignment or admin can delete
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      attachment.assignment.teacher.userId !== userId
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
      'assignments',
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
    await this.prisma.assignmentAttachment.delete({
      where: { id: attachmentId },
    });

    // Record audit
    await this.auditService.record({
      userId,
      action: 'ASSIGNMENT_ATTACHMENT_DELETED',
      module: 'ASSIGNMENT',
      ipAddress,
      userAgent,
      details: {
        assignmentId: attachment.assignmentId,
        attachmentId,
        fileName: attachment.originalName,
      },
    });

    return {
      message: 'Attachment deleted successfully',
    };
  }
}
