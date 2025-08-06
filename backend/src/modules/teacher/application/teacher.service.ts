import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { hashPassword } from '../../../shared/auth/hash.util';
import { AuditService } from '../../../shared/logger/audit.service';
import { generateRandomPassword } from '../../../shared/utils/password.util';
import { getFileUrl } from '../../../shared/utils/file-upload.util';
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
    profilePicture?: Express.Multer.File,
    ip?: string,
    userAgent?: string,
  ) {
    const { user, personal, professional, subjects, salary, additional } = dto;

    // Check for existing email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existingUser)
      throw new ConflictException('User with this email already exists');

    // Check for existing phone
    if (user.phone) {
      const existingUserPhone = await this.prisma.user.findUnique({
        where: { phone: user.phone },
      });
      if (existingUserPhone)
        throw new ConflictException(
          'User with this phone number already exists',
        );
    }

    // Check for existing employee ID
    if (professional.employeeId) {
      const existingEmployee = await this.prisma.teacher.findFirst({
        where: { employeeId: professional.employeeId },
      });
      if (existingEmployee)
        throw new ConflictException('Employee ID already exists');
    }

    const rawPassword = user.password || generateRandomPassword();
    const passwordHash = await hashPassword(rawPassword);
    const fullName = `${user.firstName} ${user.lastName}`;

    // Generate profile picture URL if file is uploaded
    const profilePhotoUrl = profilePicture
      ? getFileUrl(profilePicture.filename, 'teachers')
      : undefined;

    const { teacher, teacherUser } = await this.prisma.$transaction(
      async tx => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email: user.email,
            phone: user.phone,
            fullName,
            passwordHash,
            createdById: createdBy,
            roles: {
              create: { role: { connect: { name: 'TEACHER' } } },
            },
            needPasswordChange: user.password ? false : true,
          },
        });

        // Create teacher
        const newTeacher = await tx.teacher.create({
          data: {
            userId: newUser.id,
            // Professional Information
            employeeId: professional.employeeId,
            qualification: professional.highestQualification,
            specialization: professional.specialization,
            designation: professional.designation || 'Teacher',
            department: professional.department,
            employmentDate: new Date(professional.joiningDate),
            experienceYears: professional.experienceYears,

            // Personal Information
            dob: personal?.dateOfBirth
              ? new Date(personal.dateOfBirth)
              : new Date(),
            dateOfBirth: personal?.dateOfBirth
              ? new Date(personal.dateOfBirth)
              : new Date(),
            gender: personal?.gender || 'Not Specified',
            joiningDate: new Date(professional.joiningDate),
            bloodGroup: personal?.bloodGroup,
            address: personal?.address,

            // Salary Information
            basicSalary: salary?.basicSalary || 0,
            allowances: salary?.allowances || 0,
            totalSalary: salary?.totalSalary || 0,

            // Class Teacher Assignment
            isClassTeacher: subjects?.isClassTeacher || false,

            // Additional Information
            languagesKnown: additional?.languagesKnown || [],
            certifications: additional?.certifications,
            previousExperience: additional?.previousExperience,

            createdById: createdBy,
            profile: {
              create: {
                bio: additional?.bio,
                profilePhotoUrl,
                contactInfo: {
                  phone: user.phone,
                  email: user.email,
                },
                socialLinks: additional?.socialLinks || {},
                // createdById: createdBy, // Field doesn't exist in TeacherProfile
              },
            },
          },
          include: { profile: true, user: true },
        });

        // Assign subjects if provided
        if (subjects?.subjects && subjects.subjects.length > 0) {
          const subjectAssignments = subjects.subjects.map(subjectId => ({
            teacherId: newTeacher.id,
            subjectId,
            createdById: createdBy,
          }));

          await tx.teacherSubject.createMany({
            data: subjectAssignments,
            skipDuplicates: true,
          });
        }

        // Assign class teacher role if provided
        if (subjects?.isClassTeacher && dto.professional) {
          // For now, we'll store class/section in additional data
          // Later when class/section IDs are provided, we can create TeacherClass records
          // Note: Frontend form data has class/section but we need to handle the mapping
        }

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
      details: {
        teacherId: teacher.id,
        userId: teacherUser.id,
        hasProfilePicture: !!profilePicture,
        subjectsAssigned: subjects?.subjects?.length || 0,
      },
      ipAddress: ip,
      userAgent,
    });

    return {
      teacher: {
        id: teacher.id,
        fullName: teacherUser.fullName,
        email: teacherUser.email,
        phone: teacherUser.phone,
        employeeId: teacher.employeeId,
        profilePhotoUrl: teacher.profile?.profilePhotoUrl,
      },
      temporaryPassword: user.password ? undefined : rawPassword,
    };
  }

  async findAll() {
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        profile: {
          select: {
            profilePhotoUrl: true,
            bio: true,
            contactInfo: true,
            socialLinks: true,
          },
        },
        subjectAssignments: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        classAssignments: {
          include: {
            class: {
              select: {
                id: true,
                grade: true,
                section: true,
              },
            },
            section: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match TeacherListResponse interface
    return teachers.map(teacher => ({
      id: teacher.id,
      fullName: teacher.user.fullName,
      email: teacher.user.email,
      phone: teacher.user.phone,
      employeeId: teacher.employeeId,
      designation: teacher.designation,
      department: teacher.department,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      employmentStatus: teacher.employmentStatus,
      employmentDate: teacher.employmentDate?.toISOString(),
      experienceYears: teacher.experienceYears,

      // Personal Information
      dateOfBirth: teacher.dateOfBirth?.toISOString(),
      gender: teacher.gender,
      bloodGroup: teacher.bloodGroup,
      address: teacher.address,

      // Salary Information (for admin view)
      basicSalary: teacher.basicSalary
        ? parseFloat(teacher.basicSalary.toString())
        : undefined,
      allowances: teacher.allowances
        ? parseFloat(teacher.allowances.toString())
        : undefined,
      totalSalary: teacher.totalSalary
        ? parseFloat(teacher.totalSalary.toString())
        : undefined,

      // Class Teacher Status
      isClassTeacher: teacher.isClassTeacher,

      // Additional Information
      languagesKnown: Array.isArray(teacher.languagesKnown)
        ? (teacher.languagesKnown as string[])
        : [],
      certifications: teacher.certifications,
      previousExperience: teacher.previousExperience,

      // Profile Information
      profilePhotoUrl: teacher.profile?.profilePhotoUrl,
      bio: teacher.profile?.bio,
      contactInfo: teacher.profile?.contactInfo as any,
      socialLinks: teacher.profile?.socialLinks as any,

      // System fields
      isActive: teacher.user.isActive,
      lastLoginAt: teacher.user.lastLoginAt?.toISOString(),
      createdAt: teacher.createdAt.toISOString(),
      updatedAt: teacher.updatedAt?.toISOString(),

      // Subject assignments
      subjects: teacher.subjectAssignments.map(ts => ({
        id: ts.subject.id,
        name: ts.subject.name,
        code: ts.subject.code,
      })),

      // Class assignments (if class teacher)
      classAssignments: teacher.classAssignments.map(ca => ({
        id: ca.id,
        className: `Grade ${ca.class.grade}${ca.class.section}`,
        sectionName: ca.section?.name || 'No Section',
      })),
    }));
  }

  async findById(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        profile: true,
        subjectAssignments: {
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

    // const { classAssignments, ...rest } = teacher; // classAssignments doesn't exist

    return {
      ...teacher,
      assignedClasses: teacher.classAssignments,
    };
  }

  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: true,
        profile: true,
        subjectAssignments: true,
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

    // Update user information
    if (dto.user) {
      const fullName =
        dto.user.firstName && dto.user.lastName
          ? `${dto.user.firstName} ${dto.user.lastName}`
          : undefined;

      await this.prisma.user.update({
        where: { id: teacher.userId },
        data: {
          fullName,
          email: dto.user.email,
          phone: dto.user.phone,
          // updatedById: updatedBy, // Field doesn't exist in TeacherProfile
          updatedAt: new Date(),
        },
      });
    }

    // Update teacher fields
    const teacherUpdateData: any = {};

    if (dto.personal) {
      if (dto.personal.dateOfBirth)
        teacherUpdateData.dateOfBirth = new Date(dto.personal.dateOfBirth);
      if (dto.personal.gender) teacherUpdateData.gender = dto.personal.gender;
      if (dto.personal.bloodGroup)
        teacherUpdateData.bloodGroup = dto.personal.bloodGroup;
      if (dto.personal.address)
        teacherUpdateData.address = dto.personal.address;
    }

    if (dto.professional) {
      if (dto.professional.employeeId)
        teacherUpdateData.employeeId = dto.professional.employeeId;
      if (dto.professional.designation)
        teacherUpdateData.designation = dto.professional.designation;
      if (dto.professional.highestQualification)
        teacherUpdateData.qualification = dto.professional.highestQualification;
      if (dto.professional.specialization)
        teacherUpdateData.specialization = dto.professional.specialization;
      if (dto.professional.department)
        teacherUpdateData.department = dto.professional.department;
      if (dto.professional.joiningDate)
        teacherUpdateData.employmentDate = new Date(
          dto.professional.joiningDate,
        );
      if (dto.professional.experienceYears)
        teacherUpdateData.experienceYears = dto.professional.experienceYears;
    }

    if (dto.salary) {
      if (dto.salary.basicSalary !== undefined)
        teacherUpdateData.basicSalary = dto.salary.basicSalary;
      if (dto.salary.allowances !== undefined)
        teacherUpdateData.allowances = dto.salary.allowances;
      if (dto.salary.totalSalary !== undefined)
        teacherUpdateData.totalSalary = dto.salary.totalSalary;
    }

    if (dto.subjects) {
      if (dto.subjects.isClassTeacher !== undefined)
        teacherUpdateData.isClassTeacher = dto.subjects.isClassTeacher;
    }

    if (dto.additional) {
      if (dto.additional.languagesKnown)
        teacherUpdateData.languagesKnown = dto.additional.languagesKnown;
      if (dto.additional.certifications)
        teacherUpdateData.certifications = dto.additional.certifications;
      if (dto.additional.previousExperience)
        teacherUpdateData.previousExperience =
          dto.additional.previousExperience;
    }

    if (Object.keys(teacherUpdateData).length > 0) {
      teacherUpdateData.updatedById = updatedBy;
      teacherUpdateData.updatedAt = new Date();

      await this.prisma.teacher.update({
        where: { id },
        data: teacherUpdateData,
      });
    }

    // Update teacher profile
    if (dto.additional && (dto.additional.bio || dto.additional.socialLinks)) {
      await this.prisma.teacherProfile.update({
        where: { teacherId: teacher.id },
        data: {
          bio: dto.additional.bio,
          socialLinks: dto.additional.socialLinks,
          // updatedById: updatedBy, // Field doesn't exist in TeacherProfile
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

    // Update user information
    if (dto.user) {
      const fullName =
        dto.user.firstName && dto.user.lastName
          ? `${dto.user.firstName} ${dto.user.lastName}`
          : undefined;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName,
          phone: dto.user.phone,
          updatedAt: new Date(),
        },
      });
    }

    // Update teacher address
    if (dto.personal?.address) {
      await this.prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          address: dto.personal.address,
          updatedAt: new Date(),
        },
      });
    }

    // Update teacher profile
    if (dto.additional && (dto.additional.bio || dto.additional.socialLinks)) {
      await this.prisma.teacherProfile.update({
        where: { teacherId: teacher.id },
        data: {
          bio: dto.additional.bio,
          socialLinks: dto.additional.socialLinks,
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
      include: { subjectAssignments: true },
    });
    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found');
    return teacher.subjectAssignments;
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
