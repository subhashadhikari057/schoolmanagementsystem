import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { CreateClassDtoType, UpdateClassDtoType } from '../dto/class.dto';

@Injectable()
export class ClassService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a new class (no section logic anymore)
   */
  async create(
    dto: CreateClassDtoType,
    createdById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const exists = await this.prisma.class.findFirst({
      where: {
        grade: dto.grade,
        section: dto.section,
        deletedAt: null,
      },
    });

    if (exists) {
      throw new ConflictException(
        'Class with this grade and section already exists',
      );
    }

    const newClass = await this.prisma.class.create({
      data: {
        grade: dto.grade,
        section: dto.section,
        capacity: dto.capacity,
        roomId: dto.roomId,
      },
    });

    await this.audit.record({
      userId: createdById,
      action: 'CREATE_CLASS',
      module: 'class',
      status: 'SUCCESS',
      details: { id: newClass.id, grade: dto.grade, section: dto.section },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Class created successfully', class: newClass };
  }

  /**
   * Get all active classes (with sections included)
   */
  async findAll() {
    return this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        sections: {
          where: { deletedAt: null }, // 🔧 Only include active sections
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { grade: 'asc' },
    });
  }

  /**
   * Get a class by ID (with sections)
   */
  async findById(id: string) {
    const classRecord = await this.prisma.class.findUnique({
      where: { id },
      include: {
        sections: {
          where: { deletedAt: null }, // 🔧 Only include active sections
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Class not found');
    }

    return classRecord;
  }

  /**
   * Update a class by ID (only name now)
   */
  async update(
    id: string,
    dto: UpdateClassDtoType,
    updatedById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const classRecord = await this.prisma.class.findUnique({ where: { id } });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Class not found');
    }

    // Check for duplicate name if name is being updated
    if (
      (dto.grade && dto.grade !== classRecord.grade) ||
      (dto.section && dto.section !== classRecord.section)
    ) {
      const exists = await this.prisma.class.findFirst({
        where: {
          grade: dto.grade || classRecord.grade,
          section: dto.section || classRecord.section,
          deletedAt: null,
          id: { not: id }, // Exclude current class from check
        },
      });

      if (exists) {
        throw new ConflictException('Class with this name already exists');
      }
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: {
        ...dto,
        updatedById,
        updatedAt: new Date(),
      },
    });

    await this.audit.record({
      userId: updatedById,
      action: 'UPDATE_CLASS',
      module: 'class',
      status: 'SUCCESS',
      details: { id, updates: dto },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Class updated successfully', class: updated };
  }

  /**
   * Soft-delete a class by ID
   */
  async softDelete(
    id: string,
    deletedById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const classRecord = await this.prisma.class.findUnique({ where: { id } });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Class not found or already deleted');
    }

    await this.prisma.class.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    });

    await this.audit.record({
      userId: deletedById,
      action: 'DELETE_CLASS',
      module: 'class',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Class deleted successfully', id };
  }
}
