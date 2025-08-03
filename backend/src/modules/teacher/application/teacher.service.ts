import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { hashPassword } from '../../../shared/auth/hash.util';
import { AuditService } from '../../../shared/logger/audit.service';
import { generateRandomPassword } from '../../../shared/utils/password.util';
import {
  CreateTeacherDtoType,
  UpdateTeacherByAdminDtoType,
  UpdateTeacherSelfDtoType,
} from '../dto/teacher.dto';

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateTeacherDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const { user, profile } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existingUser)
      throw new ConflictException('User with this email already exists');

    if (user.phone && user.phone !== '') {
      const existingUserPhone = await this.prisma.user.findUnique({
        where: { phone: user.phone },
      });
      if (existingUserPhone)
        throw new ConflictException(
          'User with this phone number already exists',
        );
    }

    const rawPassword = user.password || generateRandomPassword();
    const passwordHash = await hashPassword(rawPassword);

    const { teacher, teacherUser } = await this.prisma.$transaction(
      async tx => {
        const newUser = await tx.user.create({
          data: {
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            passwordHash,
            createdById: createdBy,
            roles: {
              create: { role: { connect: { name: 'TEACHER' } } },
            },
            needPasswordChange: user.password ? false : true, // in case of user created with temporary password
          },
        });
        const newTeacher = await tx.teacher.create({
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

        return {
          teacher: newTeacher,
          teacherUser: newUser,
        };
      },
    );

    await this.audit.record({
      userId: createdBy,
      action: 'CREATE_TEACHER',
      module: 'teacher',
      status: 'SUCCESS',
      details: { teacherId: teacher.id, userId: teacherUser.id },
      ipAddress: ip,
      userAgent,
    });

    return {
      teacher: {
        id: teacher.id,
        fullName: teacherUser.fullName,
        email: teacherUser.email,
        phone: teacherUser.phone,
      },
      temporaryPassword: user.password ? undefined : rawPassword,
    };
  }

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

  async findById(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        profile: true,
        subjects: {
          include: {
            subject: true, // ✅ Include full subject details
          },
        },
        classAssignments: {
          include: {
            class: true, // ✅ Optional: include class details
          },
        },
      },
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    const { classAssignments, ...rest } = teacher;

    return {
      ...rest,
      assignedClasses: classAssignments,
    };
  }

  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: true,
        profile: true,
        subjects: true,
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async updateByAdmin(
    id: string,
    dto: UpdateTeacherByAdminDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found');

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

  async softDelete(
    id: string,
    deletedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found or already deleted');

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

  async getSubjects(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { subjects: true },
    });
    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found');
    return teacher.subjects;
  }

  async assignSubjects(
    teacherId: string,
    subjectIds: string[],
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found');

    const data = subjectIds.map(subjectId => ({
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

    return { message: 'Subjects assigned successfully', teacherId, subjectIds };
  }

  async removeSubject(
    teacherId: string,
    subjectId: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    await this.prisma.teacherSubject.deleteMany({
      where: { teacherId, subjectId },
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

  async getProfileOnly(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!teacher || teacher.deletedAt || !teacher.profile)
      throw new NotFoundException('Teacher or profile not found');
    return teacher.profile;
  }

  async assignClasses(
    teacherId: string,
    assignments: { classId: string; sectionId?: string }[],
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate and prepare data
    const validatedAssignments: {
      teacherId: string;
      classId: string;
      sectionId?: string | null;
      createdById: string;
    }[] = [];

    for (const { classId, sectionId } of assignments) {
      const classRecord = await this.prisma.class.findUnique({
        where: { id: classId },
      });
      if (!classRecord || classRecord.deletedAt) {
        throw new NotFoundException(`Class not found: ${classId}`);
      }

      if (sectionId) {
        const sectionRecord = await this.prisma.section.findUnique({
          where: { id: sectionId },
        });
        if (!sectionRecord || sectionRecord.deletedAt) {
          throw new NotFoundException(`Section not found: ${sectionId}`);
        }
        if (sectionRecord.classId !== classId) {
          throw new ConflictException(
            `Section ${sectionId} does not belong to Class ${classId}`,
          );
        }
      }

      validatedAssignments.push({
        teacherId,
        classId,
        sectionId: sectionId ?? null,
        createdById: actorId,
      });
    }

    // Perform bulk insert
    await this.prisma.teacherClass.createMany({
      data: validatedAssignments,
      skipDuplicates: true,
    });

    // Record audit
    await this.audit.record({
      userId: actorId,
      action: 'ASSIGN_CLASSES',
      module: 'teacher',
      status: 'SUCCESS',
      details: { teacherId, assignments },
      ipAddress: ip,
      userAgent,
    });

    return {
      message: 'Classes assigned successfully',
      teacherId,
      assignments,
    };
  }

  async getAssignedClasses(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        classAssignments: {
          where: { deletedAt: null },
          include: {
            class: true,
            section: true, // ✅ Include section info
          },
        },
      },
    });

    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found');

    return teacher.classAssignments.map(assignment => ({
      class: assignment.class,
      section: assignment.section ?? null, // may be null
    }));
  }

  async removeClass(
    teacherId: string,
    classId: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
    sectionId?: string, // ✅ optional
  ) {
    await this.prisma.teacherClass.deleteMany({
      where: {
        teacherId,
        classId,
        sectionId: sectionId ?? null, // ✅ match null if not provided
      },
    });

    await this.audit.record({
      userId: actorId,
      action: 'REMOVE_CLASS',
      module: 'teacher',
      status: 'SUCCESS',
      details: { teacherId, classId, sectionId },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Class unassigned successfully' };
  }

  async removeAllClasses(
    teacherId: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
    classId?: string,
    sectionId?: string,
  ) {
    const where: any = { teacherId };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (classId) where.classId = classId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (sectionId) where.sectionId = sectionId;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    await this.prisma.teacherClass.deleteMany({ where });

    await this.audit.record({
      userId: actorId,
      action: 'REMOVE_ALL_CLASSES',
      module: 'teacher',
      status: 'SUCCESS',
      details: { teacherId, classId, sectionId },
      ipAddress: ip,
      userAgent,
    });

    return {
      message: 'Classes unassigned successfully',
      filters: { classId, sectionId },
    };
  }
}
