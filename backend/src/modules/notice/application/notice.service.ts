import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  CreateNoticeDtoType,
  UpdateNoticeDtoType,
  NoticeQueryDtoType,
} from '../dto/notice.dto';
import { NoticeRecipientType } from '@prisma/client';
import { getFileUrl } from '../../../shared/utils/file-upload.util';

@Injectable()
export class NoticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a new notice and assign recipients based on recipient type
   */
  async create(
    dto: CreateNoticeDtoType,
    createdBy: string,
    files?: Express.Multer.File[],
    ip?: string,
    userAgent?: string,
  ) {
    // Validate class exists if recipient type is CLASS
    if (
      dto.recipientType === NoticeRecipientType.CLASS &&
      dto.selectedClassId
    ) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: dto.selectedClassId, deletedAt: null },
      });
      if (!classExists) {
        throw new BadRequestException('Selected class does not exist');
      }
    }

    // Create the notice
    const notice = await this.prisma.notice.create({
      data: {
        title: dto.title,
        content: dto.content,
        priority: dto.priority,
        recipientType: dto.recipientType,
        selectedClassId: dto.selectedClassId,
        category: dto.category,
        publishDate: dto.publishDate,
        expiryDate: dto.expiryDate,
        status: dto.status, // Use the status from DTO
        sendEmailNotification: dto.sendEmailNotification,
        createdById: createdBy,
      },
      include: {
        selectedClass: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // Handle attachments if provided
    if (files && files.length > 0) {
      const attachmentData = files.map(file => ({
        noticeId: notice.id,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        // Use folder "notices"; controller maps to uploads/notices/attachments
        url: getFileUrl(file.filename, 'notices'),
      }));

      await this.prisma.noticeAttachment.createMany({
        data: attachmentData,
      });
    }

    // Assign recipients based on recipient type
    await this.assignRecipients(
      notice.id,
      dto.recipientType,
      dto.selectedClassId,
    );

    // Audit log
    await this.audit.log({
      action: 'CREATE',
      module: 'NOTICE',
      userId: createdBy,
      details: {
        entityId: notice.id,
        entityType: 'Notice',
        title: notice.title,
        recipientType: notice.recipientType,
        priority: notice.priority,
      },
      ipAddress: ip,
      userAgent,
    });

    return notice;
  }

  /**
   * Get all notices with pagination and filters
   */
  async findAll(query: NoticeQueryDtoType) {
    const {
      page,
      limit,
      search,
      priority,
      recipientType,
      category,
      status,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (priority) where.priority = priority;
    if (recipientType) where.recipientType = recipientType;
    if (category) where.category = category;
    if (status) where.status = status;

    if (startDate || endDate) {
      (where as any).publishDate = {};
      if (startDate) (where as any).publishDate.gte = startDate;
      if (endDate) (where as any).publishDate.lte = endDate;
    }

    const [notices, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          selectedClass: {
            select: { id: true, name: true, grade: true, section: true },
          },
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
          attachments: {
            orderBy: { uploadedAt: 'desc' },
          },
          _count: {
            select: { recipients: true },
          },
        },
      }),
      this.prisma.notice.count({ where }),
    ]);

    return {
      notices: notices.map(notice => ({
        ...notice,
        recipientCount: notice._count.recipients,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single notice by ID
   */
  async findOne(id: string) {
    // Guard against invalid IDs early
    if (!id) {
      throw new BadRequestException('Notice ID is required');
    }

    const notice = await this.prisma.notice.findFirst({
      where: { id, deletedAt: null },
      include: {
        selectedClass: {
          select: { id: true, name: true, grade: true, section: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        recipients: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { recipients: true },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException(`Notice with id ${id} not found`);
    }

    // Ensure attachments is always an array (even if null)
    const safeAttachments = notice.attachments || [];

    return {
      ...notice,
      attachments: safeAttachments,
      recipientCount: notice._count?.recipients || 0,
      _count: undefined,
    };
  }

  /**
   * Update a notice
   */
  async update(
    id: string,
    dto: UpdateNoticeDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existingNotice = await this.prisma.notice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingNotice) {
      throw new NotFoundException('Notice not found');
    }

    // Validate class exists if recipient type is CLASS
    if (
      dto.recipientType === NoticeRecipientType.CLASS &&
      dto.selectedClassId
    ) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: dto.selectedClassId, deletedAt: null },
      });
      if (!classExists) {
        throw new BadRequestException('Selected class does not exist');
      }
    }

    // Update the notice
    const updatedNotice = await this.prisma.notice.update({
      where: { id },
      data: {
        ...dto,
        updatedById: updatedBy,
        updatedAt: new Date(),
      },
      include: {
        selectedClass: {
          select: { id: true, name: true, grade: true, section: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // If recipient type changed, reassign recipients
    if (
      dto.recipientType &&
      dto.recipientType !== existingNotice.recipientType
    ) {
      await this.reassignRecipients(id, dto.recipientType, dto.selectedClassId);
    }

    // Audit log
    await this.audit.log({
      action: 'UPDATE',
      module: 'NOTICE',
      userId: updatedBy,
      details: {
        entityId: id,
        entityType: 'Notice',
        title: updatedNotice.title,
        recipientType: updatedNotice.recipientType,
        priority: updatedNotice.priority,
      },
      ipAddress: ip,
      userAgent,
    });

    return updatedNotice;
  }

  /**
   * Soft delete a notice
   */
  async remove(id: string, deletedBy: string, ip?: string, userAgent?: string) {
    const notice = await this.prisma.notice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    await this.prisma.notice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: deletedBy,
      },
    });

    // Audit log
    await this.audit.log({
      action: 'DELETE',
      module: 'NOTICE',
      userId: deletedBy,
      details: {
        entityId: id,
        entityType: 'Notice',
        title: notice.title,
        recipientType: notice.recipientType,
      },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Notice deleted successfully' };
  }

  /**
   * Get notices for a specific user (based on their role)
   */
  async getNoticesForUser(userId: string, query: NoticeQueryDtoType) {
    const { page, limit, search, priority, category, status } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      notice: {
        deletedAt: null,
      },
      userId,
    };

    if (search) {
      (where.notice as any).OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (priority) (where.notice as any).priority = priority;
    if (category) (where.notice as any).category = category;
    if (status) (where.notice as any).status = status;

    const [recipients, total] = await Promise.all([
      this.prisma.noticeRecipient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          notice: {
            include: {
              selectedClass: {
                select: { id: true, name: true, grade: true, section: true },
              },
              createdBy: {
                select: { id: true, fullName: true, email: true },
              },
              attachments: {
                orderBy: { uploadedAt: 'desc' },
              },
            },
          },
        },
      }),
      this.prisma.noticeRecipient.count({ where }),
    ]);

    return {
      notices: recipients.map(recipient => ({
        ...recipient.notice,
        readAt: recipient.readAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark a notice as read for a user
   */
  async markAsRead(noticeId: string, userId: string) {
    const recipient = await this.prisma.noticeRecipient.findUnique({
      where: { noticeId_userId: { noticeId, userId } },
    });

    if (!recipient) {
      throw new NotFoundException('Notice recipient not found');
    }

    return this.prisma.noticeRecipient.update({
      where: { noticeId_userId: { noticeId, userId } },
      data: { readAt: new Date() },
    });
  }

  /**
   * Get available classes for notice recipients
   */
  async getAvailableClasses() {
    return this.prisma.class.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        grade: true,
        section: true,
        shift: true,
        currentEnrollment: true,
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });
  }

  /**
   * Assign recipients to a notice based on recipient type
   */
  private async assignRecipients(
    noticeId: string,
    recipientType: NoticeRecipientType,
    selectedClassId?: string,
  ) {
    let userIds: string[] = [];

    switch (recipientType) {
      case NoticeRecipientType.ALL: {
        // Get all active users
        const allUsers = await this.prisma.user.findMany({
          where: { deletedAt: null, isActive: true },
          select: { id: true },
        });
        userIds = allUsers.map(user => user.id);
        break;
      }

      case NoticeRecipientType.STUDENT: {
        // Get all students
        const students = await this.prisma.student.findMany({
          where: { deletedAt: null },
          include: { user: { select: { id: true } } },
        });
        userIds = students
          .map(student => student.user?.id)
          .filter(Boolean) as string[];
        break;
      }

      case NoticeRecipientType.PARENT: {
        // Get all parents
        const parents = await this.prisma.parent.findMany({
          where: { deletedAt: null },
          include: { user: { select: { id: true } } },
        });
        userIds = parents
          .map(parent => parent.user?.id)
          .filter(Boolean) as string[];
        break;
      }

      case NoticeRecipientType.TEACHER: {
        // Get all teachers
        const teachers = await this.prisma.teacher.findMany({
          where: { deletedAt: null },
          include: { user: { select: { id: true } } },
        });
        userIds = teachers
          .map(teacher => teacher.user?.id)
          .filter(Boolean) as string[];
        break;
      }

      case NoticeRecipientType.STAFF: {
        // Get all staff
        const staff = await this.prisma.staff.findMany({
          where: { deletedAt: null },
          include: { user: { select: { id: true } } },
        });
        userIds = staff
          .map(staffMember => staffMember.user?.id)
          .filter(Boolean) as string[];
        break;
      }

      case NoticeRecipientType.CLASS: {
        if (!selectedClassId) {
          throw new BadRequestException(
            'Class ID is required for class recipients',
          );
        }
        // Get all students in the selected class
        const classStudents = await this.prisma.student.findMany({
          where: {
            classId: selectedClassId,
            deletedAt: null,
          },
          include: { user: { select: { id: true } } },
        });
        userIds = classStudents
          .map(student => student.user?.id)
          .filter(Boolean) as string[];
        break;
      }
    }

    // Create recipient records
    if (userIds.length > 0) {
      const recipientData = userIds.map(userId => ({
        noticeId,
        userId,
      }));

      await this.prisma.noticeRecipient.createMany({
        data: recipientData,
        skipDuplicates: true,
      });
    }
  }

  /**
   * Reassign recipients when recipient type changes
   */
  private async reassignRecipients(
    noticeId: string,
    recipientType: NoticeRecipientType,
    selectedClassId?: string,
  ) {
    // Delete existing recipients
    await this.prisma.noticeRecipient.deleteMany({
      where: { noticeId },
    });

    // Assign new recipients
    await this.assignRecipients(noticeId, recipientType, selectedClassId);
  }
}
