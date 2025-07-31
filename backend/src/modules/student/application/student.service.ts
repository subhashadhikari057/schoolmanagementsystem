import {
    Injectable,
    ConflictException,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from '../../../infrastructure/database/prisma.service';
  import { CreateStudentDtoType, UpdateStudentDtoType } from '../dto/student.dto';
  import { hashPassword } from '../../../shared/auth/hash.util';
  import { generateRandomPassword } from '../../../shared/utils/password.util';
  import { AuditService } from '../../../shared/logger/audit.service';
  import { CreateParentLinkDtoType } from '../dto/parent-link.dto';
import { GetAllStudentsQueryDtoType } from '../dto/get-all.dto';
import { CreateStudentProfileDtoType, UpdateStudentProfileDtoType } from '../dto/student-profile.dto';
  @Injectable()
  export class StudentService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly audit: AuditService,
    ) {}
  
    async create(
      dto: CreateStudentDtoType,
      createdBy: string,
      ip?: string,
      userAgent?: string,
    ) {
      const { user, parents, profile, ...studentData } = dto;
    
      // 1. Check if student email already exists
      const existingStudentUser = await this.prisma.user.findUnique({
        where: { email: user.email },
      });
      if (existingStudentUser) throw new ConflictException('Student email already exists');
    
      // 2. Generate or hash password for student
      const studentPassword = user.password || generateRandomPassword();
      const passwordHash = await hashPassword(studentPassword);
    
      // 3. Create student user
      const newStudentUser = await this.prisma.user.create({
        data: {
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          passwordHash,
          isActive: true,
          createdById: createdBy,
          roles: {
            create: {
              role: { connect: { name: 'STUDENT' } },
            },
          },
        },
      });
    
      // 4. Create student record
      const newStudent = await this.prisma.student.create({
        data: {
          userId: newStudentUser.id,
          classId: studentData.classId,
          sectionId: studentData.sectionId,
          rollNumber: studentData.rollNumber,
          dob: new Date(studentData.dob),
          gender: studentData.gender,
          additionalMetadata: studentData.additionalMetadata ?? {},
          createdById: createdBy,
        },
      });
    
      // ✅ 5. Optionally create student profile
      if (
        profile &&
        (profile.bio ||
          profile.profilePhotoUrl ||
          profile.emergencyContact ||
          profile.interests ||
          profile.additionalData)
      ) {
        await this.prisma.studentProfile.create({
          data: {
            studentId: newStudent.id,
            bio: profile.bio,
            profilePhotoUrl: profile.profilePhotoUrl,
            emergencyContact: profile.emergencyContact ?? {},
            interests: profile.interests ?? {},
            additionalData: profile.additionalData ?? {},
            createdById: createdBy,
          },
        });
      }
    
      // 6. Handle parent creation + linking
      let primaryParentUser: any = null;
      let primaryParentPassword: string | undefined = undefined;
    
      for (const parent of parents) {
        const existingParentUser = await this.prisma.user.findUnique({
          where: { email: parent.email },
        });
    
        let parentUserId: string | undefined;
    
        if (existingParentUser) {
          parentUserId = existingParentUser.id;
        } else if (parent.isPrimary) {
          const rawPassword = generateRandomPassword();
          const hashedPassword = await hashPassword(rawPassword);
    
          const newParentUser = await this.prisma.user.create({
            data: {
              email: parent.email,
              phone: parent.phone,
              fullName: parent.fullName,
              passwordHash: hashedPassword,
              isActive: true,
              createdById: createdBy,
              roles: {
                create: {
                  role: { connect: { name: 'PARENT' } },
                },
              },
            },
          });
    
          parentUserId = newParentUser.id;
          primaryParentUser = newParentUser;
          primaryParentPassword = rawPassword;
        }
    
        // Link parent to student if parentUserId exists
        if (parentUserId) {
          await this.prisma.parentStudentLink.upsert({
            where: {
              parentId_studentId: {
                parentId: parentUserId,
                studentId: newStudent.id,
              },
            },
            update: {},
            create: {
              parentId: parentUserId,
              studentId: newStudent.id,
              relationship: parent.relationship,
              isPrimary: parent.isPrimary,
              createdById: createdBy,
            },
          });
        }
      }
    
      // 7. Audit
      await this.audit.record({
        userId: createdBy,
        action: 'CREATE_STUDENT',
        module: 'student',
        status: 'SUCCESS',
        details: { studentId: newStudent.id, userId: newStudentUser.id },
        ipAddress: ip,
        userAgent,
      });
    
      // 8. Return
      return {
        student: {
          id: newStudent.id,
          fullName: newStudentUser.fullName,
          email: newStudentUser.email,
          phone: newStudentUser.phone,
        },
        temporaryPassword: user.password ? undefined : studentPassword,
        parentAccount: primaryParentUser && primaryParentPassword
          ? {
              fullName: primaryParentUser.fullName,
              email: primaryParentUser.email,
              phone: primaryParentUser.phone,
              temporaryPassword: primaryParentPassword,
            }
          : undefined,
      };
    }
    
      
      


    async findChildrenOfParent(userId: string) {
        const links = await this.prisma.parentStudentLink.findMany({
          where: {
            parentId: userId,
            deletedAt: null,
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
                class: true,
                section: true,
                profile: true,
              },
            },
          },
        });
      
        return links.map((link) => ({
          relationship: link.relationship,
          isPrimary: link.isPrimary,
          student: {
            id: link.student.id,
            fullName: link.student.user.fullName,
            email: link.student.user.email,
            phone: link.student.user.phone,
            rollNumber: link.student.rollNumber,
            class: link.student.class,
            section: link.student.section,
            profile: link.student.profile,
          },
        }));
      }

      
      async findById(
        studentId: string,
        currentUser: { id: string; roleNames: string[] },
      ) {
        const student = await this.prisma.student.findUnique({
          where: { id: studentId },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
            class: true,
            section: true,
            profile: true, // include profile if exists
          },
        });
      
        if (!student || student.deletedAt)
          throw new NotFoundException('Student not found');
      
        const { id: userId, roleNames } = currentUser;
      
        const isAdminOrTeacher = roleNames.some((r) =>
          ['SUPERADMIN', 'ADMIN', 'TEACHER'].includes(r),
        );
      
        const isSelf = student.userId === userId;
      
        const isParent = roleNames.includes('PARENT');
        const isLinkedParent = isParent
          ? await this.prisma.parentStudentLink.findFirst({
              where: { parentId: userId, studentId },
            })
          : null;
      
        if (!isAdminOrTeacher && !isSelf && !isLinkedParent)
          throw new NotFoundException('You do not have access to this student');
      
        return {
          id: student.id,
          fullName: student.user.fullName,
          email: student.user.email,
          phone: student.user.phone,
          rollNumber: student.rollNumber,
          class: student.class,
          section: student.section,
          dob: student.dob,
          gender: student.gender,
          profile: student.profile,
          additionalMetadata: student.additionalMetadata,
        };
      }
      




      async updateByAdmin(
        studentId: string,
        dto: UpdateStudentDtoType,
        updatedBy: string,
        ip?: string,
        userAgent?: string,
      ) {
        const student = await this.prisma.student.findUnique({
          where: { id: studentId },
          include: { user: true },
        });
      
        if (!student || student.deletedAt)
          throw new NotFoundException('Student not found');
      
        const updates: any = {};
      
        // ✅ Update user fields
        if (dto.fullName || dto.phone || dto.email) {
          await this.prisma.user.update({
            where: { id: student.userId },
            data: {
              fullName: dto.fullName ?? student.user.fullName,
              phone: dto.phone ?? student.user.phone,
              email: dto.email ?? student.user.email, // ✅ added
              updatedAt: new Date(),
              updatedById: updatedBy,
            },
          });
        }
      
        // ✅ Update student-specific fields
        if (
          dto.classId ||
          dto.sectionId ||
          dto.rollNumber ||
          dto.dob ||
          dto.gender ||
          dto.additionalMetadata
        ) {
          updates.classId = dto.classId ?? student.classId;
          updates.sectionId = dto.sectionId ?? student.sectionId;
          updates.rollNumber = dto.rollNumber ?? student.rollNumber;
          updates.dob = dto.dob ? new Date(dto.dob) : student.dob;
          updates.gender = dto.gender ?? student.gender;
          updates.additionalMetadata = dto.additionalMetadata ?? student.additionalMetadata;
      
          updates.updatedAt = new Date();
          updates.updatedById = updatedBy;
      
          await this.prisma.student.update({
            where: { id: studentId },
            data: updates,
          });
        }
      
        await this.audit.record({
          userId: updatedBy,
          action: 'UPDATE_STUDENT',
          module: 'student',
          status: 'SUCCESS',
          details: { id: studentId },
          ipAddress: ip,
          userAgent,
        });
      
        return { message: 'Student updated successfully', id: studentId };
      }
      

      async updateSelf(
        userId: string,
        dto: UpdateStudentDtoType & UpdateStudentProfileDtoType,
        ip?: string,
        userAgent?: string,
      ) {
        const student = await this.prisma.student.findFirst({
          where: { userId, deletedAt: null },
          include: { user: true },
        });
      
        if (!student) throw new NotFoundException('Student not found');
      
        // Update basic fields
        if (dto.fullName || dto.phone) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              fullName: dto.fullName ?? student.user.fullName,
              phone: dto.phone ?? student.user.phone,
              updatedAt: new Date(),
            },
          });
        }
      
        const updates: any = {};
        if (dto.dob) updates.dob = new Date(dto.dob);
        if (dto.gender) updates.gender = dto.gender;
        if (dto.additionalMetadata) updates.additionalMetadata = dto.additionalMetadata;
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date();
          await this.prisma.student.update({
            where: { id: student.id },
            data: updates,
          });
        }
      
        // ✅ Upsert profile fields too
        const hasProfileData =
          dto.bio || dto.profilePhotoUrl || dto.emergencyContact || dto.interests || dto.additionalData;
        if (hasProfileData) {
          await this.prisma.studentProfile.upsert({
            where: { studentId: student.id },
            update: {
              bio: dto.bio,
              profilePhotoUrl: dto.profilePhotoUrl,
              emergencyContact: dto.emergencyContact ?? {},
              interests: dto.interests ?? {},
              additionalData: dto.additionalData ?? {},
              updatedAt: new Date(),
              updatedById: userId,
            },
            create: {
              studentId: student.id,
              bio: dto.bio,
              profilePhotoUrl: dto.profilePhotoUrl,
              emergencyContact: dto.emergencyContact ?? {},
              interests: dto.interests ?? {},
              additionalData: dto.additionalData ?? {},
              createdById: userId,
            },
          });
        }
      
        await this.audit.record({
          userId,
          action: 'UPDATE_SELF_STUDENT',
          module: 'student',
          status: 'SUCCESS',
          details: { updatedFields: Object.keys(dto) },
          ipAddress: ip,
          userAgent,
        });
      
        return { message: 'Student profile updated successfully' };
      }
      

  async softDelete(
    id: string,
    deletedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
  
    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found or already deleted');
    }
  
    // 1. Soft-delete student
    await this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: deletedBy,
      },
    });
  
    // 2. Deactivate student user
    await this.prisma.user.update({
      where: { id: student.userId },
      data: {
        deletedAt: new Date(),
        deletedById: deletedBy,
        isActive: false,
      },
    });
  
    // 3. Revoke active sessions
    await this.prisma.userSession.updateMany({
      where: { userId: student.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  
    // 4. Log audit
    await this.audit.record({
      userId: deletedBy,
      action: 'DELETE_STUDENT',
      module: 'student',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });
  
    return { message: 'Student soft-deleted', id };
  }
  

  //parents links

  async addParentToStudent(
    studentId: string,
    dto: CreateParentLinkDtoType,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: true },
    });
    if (!student || student.deletedAt) throw new NotFoundException('Student not found');
  
    const existingLink = await this.prisma.parentStudentLink.findFirst({
      where: { studentId, parentId: dto.parentId },
    });
    if (existingLink) throw new ConflictException('Parent already linked');
  
    if (dto.isPrimary) {
      await this.prisma.parentStudentLink.updateMany({
        where: { studentId },
        data: { isPrimary: false },
      });
    }
  
    await this.prisma.parentStudentLink.create({
      data: {
        studentId,
        parentId: dto.parentId,
        isPrimary: dto.isPrimary || false,
        createdById: actorId,
      },
    });
  
    await this.audit.record({
      userId: actorId,
      action: 'ADD_PARENT_LINK',
      module: 'student',
      status: 'SUCCESS',
      details: { studentId, parentId: dto.parentId },
      ipAddress: ip,
      userAgent,
    });
  
    return { message: 'Parent linked successfully' };
  }

  async unlinkParent(
    studentId: string,
    parentId: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    await this.prisma.parentStudentLink.deleteMany({
      where: { studentId, parentId },
    });
  
    await this.audit.record({
      userId: actorId,
      action: 'REMOVE_PARENT_LINK',
      module: 'student',
      status: 'SUCCESS',
      details: { studentId, parentId },
      ipAddress: ip,
      userAgent,
    });
  
    return { message: 'Parent unlinked successfully' };
  }

  

  async makeParentPrimary(
    studentId: string,
    parentId: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const link = await this.prisma.parentStudentLink.findFirst({
      where: { studentId, parentId },
    });
    if (!link) throw new NotFoundException('Parent not linked to this student');
  
    await this.prisma.parentStudentLink.updateMany({
      where: { studentId },
      data: { isPrimary: false },
    });
  
    await this.prisma.parentStudentLink.update({
      where: { id: link.id },
      data: { isPrimary: true },
    });
  
    await this.audit.record({
      userId: actorId,
      action: 'MAKE_PRIMARY_PARENT',
      module: 'student',
      status: 'SUCCESS',
      details: { studentId, parentId },
      ipAddress: ip,
      userAgent,
    });
  
    return { message: 'Parent marked as primary' };
  }

  
  async getStudentParents(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parents: {
          where: { deletedAt: null },
          include: {
            parent: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  
    if (!student || student.deletedAt)
      throw new NotFoundException('Student not found');
  
    return student.parents.map((link) => ({
      id: link.parent.id,
      fullName: link.parent.fullName,
      email: link.parent.email,
      phone: link.parent.phone,
      isPrimary: link.isPrimary,
    }));
  }
  

  async findAll(query: GetAllStudentsQueryDtoType) {
    const { page, limit, classId, sectionId, search } = query;
    const offset = (page - 1) * limit;
  
    const where: any = {
      deletedAt: null,
      ...(classId && { classId }),
      ...(sectionId && { sectionId }),
      user: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    };
  
    const [students, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        include: {
          user: {
            select: { fullName: true, email: true, phone: true },
          },
          class: true,
          section: true,
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);
  
    return {
      total,
      page,
      limit,
      students: students.map((s) => ({
        id: s.id,
        fullName: s.user.fullName,
        email: s.user.email,
        phone: s.user.phone,
        rollNumber: s.rollNumber,
        class: s.class,
        section: s.section,
      })),
    };
  }


  async upsertProfile(
    studentId: string,
    dto: CreateStudentProfileDtoType | UpdateStudentProfileDtoType,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
  
    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }
  
    await this.prisma.studentProfile.upsert({
      where: { studentId },
      update: {
        bio: dto.bio,
        profilePhotoUrl: dto.profilePhotoUrl,
        emergencyContact: dto.emergencyContact ?? {},
        interests: dto.interests ?? {},
        additionalData: dto.additionalData ?? {},
        updatedAt: new Date(),
        updatedById: actorId,
      },
      create: {
        studentId,
        bio: dto.bio,
        profilePhotoUrl: dto.profilePhotoUrl,
        emergencyContact: dto.emergencyContact ?? {},
        interests: dto.interests ?? {},
        additionalData: dto.additionalData ?? {},
        createdById: actorId,
      },
    });
  
    await this.audit.record({
      userId: actorId,
      action: 'UPSERT_STUDENT_PROFILE',
      module: 'student',
      status: 'SUCCESS',
      details: { studentId },
      ipAddress: ip,
      userAgent,
    });
  
    return { message: 'Student profile saved successfully' };
  }


  async getProfileById(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        profile: true,
      },
    });
  
    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }
  
    return student.profile || {};
  }

  async getAllParents(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
  
    const where: any = {
      roles: {
        some: {
          role: { name: 'PARENT' },
        },
      },
    };
  
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
  
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
  
    return {
      data,
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    };
  }
  
  


  

      
  }
  
  