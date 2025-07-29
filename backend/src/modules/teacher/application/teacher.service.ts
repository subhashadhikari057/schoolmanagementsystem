import {
    Injectable,
    NotFoundException,
    ConflictException,
  } from '@nestjs/common';
  import { PrismaService } from '../../../infrastructure/database/prisma.service';
  import { AuditService } from '../../../shared/logger/audit.service';
  import {
    CreateTeacherDtoType,
    UpdateTeacherByAdminDtoType,
    UpdateTeacherSelfDtoType,
  } from '../dto/teacher.dto';
  import { hashPassword } from '../../../shared/auth/hash.util';
  import { generateRandomPassword } from '../../../shared/utils/password.util';
  
  @Injectable()
  export class TeacherService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly audit: AuditService,
    ) {}
    async create(dto: CreateTeacherDtoType, createdBy: string, ip?: string, userAgent?: string) {
        const { user, profile } = dto;
    
        const existingUser = await this.prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existingUser) throw new ConflictException('Email already exists');
    
        const rawPassword = user.password || generateRandomPassword();
        const passwordHash = await hashPassword(rawPassword);
    
        const newUser = await this.prisma.user.create({
          data: {
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            passwordHash,
            createdById: createdBy,
            roles: {
              create: { role: { connect: { name: 'TEACHER' } } },
            },
          },
        });
    
        const newTeacher = await this.prisma.teacher.create({
          data: {
            userId: newUser.id,
            qualification: profile.qualification,
            designation: profile.designation,
            employmentDate: new Date(profile.dateOfJoining),
            createdById: createdBy,
            profile: {
              create: {
                bio: profile.bio,
                contactInfo: {
                  phone: user.phone,
                  email: user.email,
                },
                socialLinks: profile.socialLinks || {},
                createdById: createdBy,
              },
            },
          },
          include: { profile: true },
        });
    
        await this.audit.record({
          userId: createdBy,
          action: 'CREATE_TEACHER',
          module: 'teacher',
          status: 'SUCCESS',
          details: { teacherId: newTeacher.id, userId: newUser.id },
          ipAddress: ip,
          userAgent,
        });
    
        return {
          teacher: {
            id: newTeacher.id,
            fullName: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
          },
          temporaryPassword: user.password ? undefined : rawPassword,
        };
      }
        /**
   * Get list of all active teachers (for admin use)
   */
  async findAll() {
    return this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get teacher by teacher ID (for admin/teacher/student)
   */
  async findById(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        profile: true,
        subjects: {
          include: {
            // Add subject relation here when model is defined
          },
        },
      },
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  /**
   * Get teacher by logged-in user ID (for /me)
   */
  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: true,
        profile: true,
        subjects: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }
  /**
   * Admin or Superadmin updates any teacher
   */
  async updateByAdmin(
    id: string,
    dto: UpdateTeacherByAdminDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    if (dto.fullName || dto.email || dto.phone) {
      await this.prisma.user.update({
        where: { id: teacher.userId },
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          updatedById: updatedBy,
          updatedAt: new Date(),
        },
      });
    }

    if (dto.profile) {
      await this.prisma.teacherProfile.update({
        where: { teacherId: teacher.id },
        data: {
          ...dto.profile,
          updatedById: updatedBy,
          updatedAt: new Date(),
        },
      });
    }

    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_TEACHER',
      module: 'teacher',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Teacher updated successfully', id };
  }

  /**
   * Logged-in teacher updates their own limited profile
   */
  async updateSelf(
    userId: string,
    dto: UpdateTeacherSelfDtoType,
    ip?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    if (dto.fullName || dto.phone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          updatedAt: new Date(),
        },
      });
    }

    if (dto.profile) {
      await this.prisma.teacherProfile.update({
        where: { teacherId: teacher.id },
        data: {
          ...dto.profile,
          updatedAt: new Date(),
        },
      });
    }

    await this.audit.record({
      userId,
      action: 'UPDATE_SELF_TEACHER',
      module: 'teacher',
      status: 'SUCCESS',
      details: { updatedFields: Object.keys(dto) },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Profile updated successfully' };
  }

  /**
   * Soft delete teacher and user, revoke sessions
   */
  async softDelete(
    id: string,
    deletedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found or already deleted');
    }

    await this.prisma.teacher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: deletedBy,
      },
    });

    await this.prisma.user.update({
      where: { id: teacher.userId },
      data: {
        deletedAt: new Date(),
        deletedById: deletedBy,
        isActive: false,
      },
    });

    await this.prisma.userSession.updateMany({
      where: { userId: teacher.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      userId: deletedBy,
      action: 'DELETE_TEACHER',
      module: 'teacher',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Teacher soft-deleted', id };
  }
  /**
   * Get subjects assigned to a teacher
   */
  async getSubjects(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            // You can later join actual subject details if Subject model exists
          },
        },
      },
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher.subjects;
  }

  /**
   * Assign one or more subjects to a teacher (Admin only)
   */
  async assignSubjects(
    teacherId: string,
    subjectIds: string[],
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    const data = subjectIds.map((subjectId) => ({
      teacherId,
      subjectId,
      createdById: actorId,
    }));

    await this.prisma.teacherSubject.createMany({
      data,
      skipDuplicates: true,
    });

    await this.audit.record({
      userId: actorId,
      action: 'ASSIGN_SUBJECTS',
      module: 'teacher',
      status: 'SUCCESS',
      details: { teacherId, subjectIds },
      ipAddress: ip,
      userAgent,
    });

    return {
      message: 'Subjects assigned successfully',
      teacherId,
      subjectIds,
    };
  }

  /**
   * Remove a subject assignment from a teacher
   */
  async removeSubject(
    teacherId: string,
    subjectId: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    await this.prisma.teacherSubject.deleteMany({
      where: {
        teacherId,
        subjectId,
      },
    });

    await this.audit.record({
      userId: actorId,
      action: 'REMOVE_SUBJECT',
      module: 'teacher',
      status: 'SUCCESS',
      details: { teacherId, subjectId },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Subject unassigned successfully' };
  }

  /**
   * Get classes assigned to teacher (stubbed for now)
   */
  async getAssignedClasses(teacherId: string) {
    return { message: 'Class assignment not implemented yet' };
  }

  /**
   * Get teacher profile only
   */
  async getProfileOnly(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  
    if (!teacher || teacher.deletedAt || !teacher.profile) {
      throw new NotFoundException('Teacher or profile not found');
    }
  
    return teacher.profile;
  }
}
  