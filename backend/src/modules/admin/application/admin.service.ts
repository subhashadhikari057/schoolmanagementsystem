// src/modules/admin/application/admin.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { CreateAdminDtoType, UpdateAdminDtoType } from '../dto/admin.dto';
import { hashPassword } from '../../../shared/auth/hash.util';
import { generateRandomPassword } from '../../../shared/utils/password.util'; // 👈 Add this util

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateAdminDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    // 👇 Auto-generate password if missing
    const rawPassword = dto.password || generateRandomPassword();
    const passwordHash = await hashPassword(rawPassword);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        fullName: dto.fullName,
        passwordHash,
        createdById: createdBy,
        roles: {
          create: {
            role: {
              connect: { name: 'ADMIN' },
            },
          },
        },
      },
    });

    await this.audit.record({
      userId: createdBy,
      action: 'CREATE_ADMIN',
      module: 'admin',
      status: 'SUCCESS',
      details: { adminId: user.id, email: dto.email },
      ipAddress: ip,
      userAgent,
    });

    return {
      admin: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      temporaryPassword: dto.password ? undefined : rawPassword, // only return if auto-generated
    };
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        roles: {
          some: {
            role: { name: 'ADMIN' },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateAdminDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('Admin not found or already deleted');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
        updatedById: updatedBy,
      },
    });

    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_ADMIN',
      module: 'admin',
      status: 'SUCCESS',
      details: { id, updatedFields: Object.keys(dto) },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Admin updated', id };
  }

  async softDelete(
    id: string,
    deletedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('Admin not found or already deleted');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: deletedBy,
      },
    });

    await this.prisma.userSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      userId: deletedBy,
      action: 'DELETE_ADMIN',
      module: 'admin',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Admin soft-deleted', id };
  }
}
