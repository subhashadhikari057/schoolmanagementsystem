import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { CreateSectionDtoType, UpdateSectionDtoType } from '../dto/section.dto';

@Injectable()
export class SectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateSectionDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.section.findFirst({
      where: {
        name: dto.name,
        classId: dto.classId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Section with this name already exists in this class',
      );
    }

    const section = await this.prisma.section.create({
      data: {
        name: dto.name,
        classId: dto.classId,
        createdById: createdBy,
      },
    });

    await this.audit.record({
      userId: createdBy,
      action: 'CREATE_SECTION',
      module: 'section',
      status: 'SUCCESS',
      details: { sectionId: section.id, name: section.name },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Section created successfully', id: section.id };
  }

  async findAll() {
    return this.prisma.section.findMany({
      where: { deletedAt: null },
      include: {
        class: {
          select: { id: true, grade: true, section: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });

    if (!section || section.deletedAt) {
      throw new NotFoundException('Section not found');
    }

    return section;
  }

  async update(
    id: string,
    dto: UpdateSectionDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const section = await this.prisma.section.findUnique({ where: { id } });
    if (!section || section.deletedAt) {
      throw new NotFoundException('Section not found');
    }

    await this.prisma.section.update({
      where: { id },
      data: {
        ...dto,
        updatedById: updatedBy,
        updatedAt: new Date(),
      },
    });

    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_SECTION',
      module: 'section',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Section updated successfully', id };
  }

  async softDelete(
    id: string,
    deletedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const section = await this.prisma.section.findUnique({ where: { id } });
    if (!section || section.deletedAt) {
      throw new NotFoundException('Section not found or already deleted');
    }

    await this.prisma.section.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: deletedBy,
      },
    });

    await this.audit.record({
      userId: deletedBy,
      action: 'DELETE_SECTION',
      module: 'section',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Section soft-deleted', id };
  }
}
