import {
    Injectable,
    NotFoundException,
    ConflictException,
  } from '@nestjs/common';
  import { PrismaService } from '../../../infrastructure/database/prisma.service';
  import { AuditService } from '../../../shared/logger/audit.service';
  import {
    CreateClassDtoType,
    UpdateClassDtoType,
  } from '../dto/class.dto';
  
  @Injectable()
  export class ClassService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly audit: AuditService,
    ) {}
  
    /**
     * Create a new class
     */
    async create(dto: CreateClassDtoType, createdById: string, ip?: string, userAgent?: string) {
      const exists = await this.prisma.class.findFirst({
        where: {
          name: dto.name,
          section: dto.section,
          deletedAt: null,
        },
      });
  
      if (exists) {
        throw new ConflictException('Class with this name and section already exists');
      }
  
      const newClass = await this.prisma.class.create({
        data: {
          name: dto.name,
          section: dto.section,
          createdById,
        },
      });
  
      await this.audit.record({
        userId: createdById,
        action: 'CREATE_CLASS',
        module: 'class',
        status: 'SUCCESS',
        details: { id: newClass.id, name: dto.name, section: dto.section },
        ipAddress: ip,
        userAgent,
      });
  
      return { message: 'Class created successfully', class: newClass };
    }
  
    /**
     * Get all active classes
     */
    async findAll() {
      return this.prisma.class.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      });
    }
  
    /**
     * Get a class by ID
     */
    async findById(id: string) {
      const classRecord = await this.prisma.class.findUnique({
        where: { id },
      });
  
      if (!classRecord || classRecord.deletedAt) {
        throw new NotFoundException('Class not found');
      }
  
      return classRecord;
    }
  
    /**
     * Update a class by ID
     */
    async update(id: string, dto: UpdateClassDtoType, updatedById: string, ip?: string, userAgent?: string) {
      const classRecord = await this.prisma.class.findUnique({ where: { id } });
  
      if (!classRecord || classRecord.deletedAt) {
        throw new NotFoundException('Class not found');
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
    async softDelete(id: string, deletedById: string, ip?: string, userAgent?: string) {
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
  