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
export class LeaveRequestAttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async uploadAttachments(
    leaveRequestId: string,
    files: Express.Multer.File[],
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify leave request exists and user has access
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        student: {
          include: {
            user: true,
            parents: {
              include: {
                parent: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check access permissions - only the student who created it, their parent, teacher, or admin can upload
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      leaveRequest.student.userId !== userId &&
      !leaveRequest.student.parents.some(p => p.parent.userId === userId)
    ) {
      throw new ForbiddenException(
        'You do not have permission to upload attachments to this leave request',
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
    ];

    const maxFileSize = 5 * 1024 * 1024; // 5MB for leave requests

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File ${file.originalname} has unsupported type. Allowed types: images (jpg, jpeg, png, gif, webp), PDF, DOC, DOCX`,
        );
      }

      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large. Maximum size is 5MB`,
        );
      }
    }

    // Create attachment records
    const attachmentData = files.map(file => ({
      leaveRequestId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: getFileUrl(file.filename, 'leave-requests'),
    }));

    await this.prisma.leaveRequestAttachment.createMany({
      data: attachmentData,
    });

    // Record audit
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_ATTACHMENTS_UPLOADED',
      module: 'LEAVE_REQUEST',
      details: { leaveRequestId, fileCount: files.length },
      ipAddress,
      userAgent,
    });

    return {
      message: 'Attachments uploaded successfully',
      fileCount: files.length,
    };
  }

  async getAttachments(
    leaveRequestId: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Verify leave request exists and user has access
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        student: {
          include: {
            user: true,
            parents: {
              include: {
                parent: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check access permissions
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      leaveRequest.student.userId !== userId &&
      !leaveRequest.student.parents.some(p => p.parent.userId === userId)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view attachments for this leave request',
      );
    }

    const attachments = await this.prisma.leaveRequestAttachment.findMany({
      where: { leaveRequestId },
      orderBy: { uploadedAt: 'desc' },
    });

    return attachments;
  }

  async deleteAttachment(
    attachmentId: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const attachment = await this.prisma.leaveRequestAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        leaveRequest: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check access permissions
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      attachment.leaveRequest.student.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this attachment',
      );
    }

    // Delete the file from storage
    const fs = await import('fs/promises');
    try {
      await fs.unlink(attachment.filename);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete the attachment record
    await this.prisma.leaveRequestAttachment.delete({
      where: { id: attachmentId },
    });

    // Record audit
    await this.auditService.log({
      userId,
      action: 'LEAVE_REQUEST_ATTACHMENT_DELETED',
      module: 'LEAVE_REQUEST',
      details: { attachmentId, leaveRequestId: attachment.leaveRequestId },
      ipAddress,
      userAgent,
    });

    return { message: 'Attachment deleted successfully' };
  }
}
