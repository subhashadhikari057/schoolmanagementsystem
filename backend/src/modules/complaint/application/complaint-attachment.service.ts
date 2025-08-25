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
export class ComplaintAttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async uploadAttachments(
    complaintId: string,
    files: Express.Multer.File[],
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify complaint exists and user has access
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Check access permissions
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      complaint.complainantId !== userId &&
      complaint.assignedToId !== userId &&
      complaint.recipientId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to upload attachments to this complaint',
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

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File ${file.originalname} has unsupported type. Allowed types: images (jpg, jpeg, png, gif, webp), PDF, DOC, DOCX`,
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
      complaintId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: getFileUrl(file.filename, 'complaints'),
    }));

    await this.prisma.complaintAttachment.createMany({
      data: attachmentData,
    });

    // Record audit
    await this.auditService.record({
      userId,
      action: 'COMPLAINT_ATTACHMENTS_UPLOADED',
      module: 'COMPLAINT',
      ipAddress,
      userAgent,
      details: {
        complaintId,
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
    complaintId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      complaint.complainantId !== userId &&
      complaint.assignedToId !== userId &&
      complaint.recipientId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this complaint');
    }

    return this.prisma.complaintAttachment.findMany({
      where: { complaintId },
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
    const attachment = await this.prisma.complaintAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        complaint: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check access permissions - only complainant, assigned person, or admin can delete
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole) &&
      attachment.complaint.complainantId !== userId &&
      attachment.complaint.assignedToId !== userId
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
      'complaints',
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
    await this.prisma.complaintAttachment.delete({
      where: { id: attachmentId },
    });

    // Record audit
    await this.auditService.record({
      userId,
      action: 'COMPLAINT_ATTACHMENT_DELETED',
      module: 'COMPLAINT',
      ipAddress,
      userAgent,
      details: {
        complaintId: attachment.complaintId,
        attachmentId,
        fileName: attachment.originalName,
      },
    });

    return {
      message: 'Attachment deleted successfully',
    };
  }
}
