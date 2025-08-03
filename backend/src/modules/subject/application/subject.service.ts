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

    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        createdById: createdBy,
      },
    });

    await this.audit.record({
      userId: createdBy,
      action: 'CREATE_SUBJECT',
      module: 'subject',
      status: 'SUCCESS',
      details: { id: subject.id, code: subject.code },
      ipAddress: ip,
      userAgent,
    });

    return subject;
  }

  /**
   * Get all non-deleted subjects
   */
  async findAll() {
    return this.prisma.subject.findMany({
      where: { deletedAt: null },
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

    const updated = await this.prisma.subject.update({
      where: { id },
      data: {
        ...dto,
        updatedById: updatedBy,
        updatedAt: new Date(),
      },
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
   * Soft delete a subject
   */
  async softDelete(
    id: string,
    deletedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (!subject || subject.deletedAt) {
      throw new NotFoundException('Subject not found or already deleted');
    }

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
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Subject deleted successfully', id };
  }
}
