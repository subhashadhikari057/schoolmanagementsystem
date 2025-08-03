import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  CreateStudentDtoType,
  UpdateStudentDtoType,
  CreateStudentWithNewParentsDtoType,
  CreateStudentWithExistingParentsDtoType,
} from '../dto/student.dto';
import { hashPassword } from '../../../shared/auth/hash.util';
import { generateRandomPassword } from '../../../shared/utils/password.util';
import { AuditService } from '../../../shared/logger/audit.service';
import { CreateParentLinkDtoType } from '../dto/parent-link.dto';
import { GetAllStudentsQueryDtoType } from '../dto/get-all.dto';
import {
  CreateStudentProfileDtoType,
  UpdateStudentProfileDtoType,
} from '../dto/student-profile.dto';
@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ✅ Create student with new parents
  async createStudentWithNewParents(
    dto: CreateStudentWithNewParentsDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const { user, parents, profile, ...studentData } = dto;

    // 1. Check if student email already exists
    const existingStudentUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existingStudentUser)
      throw new ConflictException('Student email already exists');

    // 2. Check if any parent email already exists
    for (const parent of parents) {
      const existingParent = await this.prisma.user.findUnique({
        where: { email: parent.email },
      });
      if (existingParent) {
        throw new ConflictException(
          `Parent with email ${parent.email} already exists. Use the existing parents API instead.`,
        );
      }
    }

    try {
      // ✅ Begin transaction
      const result = await this.prisma.$transaction(async tx => {
        // 3. Generate or hash student password
        const studentPassword = user.password || generateRandomPassword();
        const passwordHash = await hashPassword(studentPassword);

        // 4. Create student user
        const newStudentUser = await tx.user.create({
          data: {
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            passwordHash,
            isActive: true,
            needPasswordChange: user.password ? false : true, // ✅ Force change if auto-generated
            createdById: createdBy,
            roles: {
              create: {
                role: { connect: { name: 'STUDENT' } },
              },
            },
          },
        });

        // 5. Create student record
        const newStudent = await tx.student.create({
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

        // 6. Profile (optional)
        if (
          profile &&
          (profile.bio ||
            profile.profilePhotoUrl ||
            profile.emergencyContact ||
            profile.interests ||
            profile.additionalData)
        ) {
          await tx.studentProfile.create({
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

        // 7. Create parents (user accounts + contact records)
        const createdParents: any[] = [];
        let primaryParentUser: any = null;

        for (const parent of parents) {
          if (parent.isPrimary || parent.createUserAccount) {
            // ✅ Create full user account for primary parent or if explicitly requested
            const parentPassword = parent.password || generateRandomPassword();
            const parentPasswordHash = await hashPassword(parentPassword);

            const newParentUser = await tx.user.create({
              data: {
                email: parent.email,
                phone: parent.phone,
                fullName: parent.fullName,
                passwordHash: parentPasswordHash,
                isActive: true,
                needPasswordChange: parent.password ? false : true, // ✅ Force change if auto-generated
                createdById: createdBy,
                roles: {
                  create: {
                    role: { connect: { name: 'PARENT' } },
                  },
                },
              },
            });

            // Link parent user to student
            await tx.parentStudentLink.create({
              data: {
                parentId: newParentUser.id,
                studentId: newStudent.id,
                relationship: parent.relationship,
                isPrimary: parent.isPrimary,
                createdById: createdBy,
              },
            });

            createdParents.push({
              user: newParentUser,
              temporaryPassword: parent.password ? undefined : parentPassword,
              isUserAccount: true,
            });

            if (parent.isPrimary) {
              primaryParentUser = newParentUser;
            }
          } else {
            // ✅ Create contact-only record for non-primary parents
            await tx.parentStudentLink.create({
              data: {
                parentId: null, // No user account
                studentId: newStudent.id,
                relationship: parent.relationship,
                isPrimary: false,
                contactName: parent.fullName,
                contactEmail: parent.email,
                contactPhone: parent.phone,
                createdById: createdBy,
              },
            });

            createdParents.push({
              contact: {
                fullName: parent.fullName,
                email: parent.email,
                phone: parent.phone,
              },
              isUserAccount: false,
            });
          }
        }

        return {
          student: newStudent,
          studentUser: newStudentUser,
          studentPassword,
          parents: createdParents,
          primaryParentUser,
        };
      });

      // 8. Audit log (outside transaction)
      await this.audit.record({
        userId: createdBy,
        action: 'CREATE_STUDENT_WITH_NEW_PARENTS',
        module: 'student',
        status: 'SUCCESS',
        details: {
          studentId: result.student.id,
          userId: result.studentUser.id,
          parentsCount: result.parents.length,
        },
        ipAddress: ip,
        userAgent,
      });

      // 9. Return clean result
      return {
        student: {
          id: result.student.id,
          fullName: result.studentUser.fullName,
          email: result.studentUser.email,
          phone: result.studentUser.phone,
        },
        studentTemporaryPassword: user.password
          ? undefined
          : result.studentPassword,
        parents: result.parents.map(p => ({
          ...(p.isUserAccount
            ? {
                id: p.user.id,
                fullName: p.user.fullName,
                email: p.user.email,
                phone: p.user.phone,
                temporaryPassword: p.temporaryPassword,
                hasUserAccount: true,
              }
            : {
                fullName: p.contact.fullName,
                email: p.contact.email,
                phone: p.contact.phone,
                hasUserAccount: false,
              }),
        })),
      };
    } catch (err) {
      throw new InternalServerErrorException(
        'Student and parent creation failed',
      );
    }
  }

  // ✅ Create student with existing parents
  async createStudentWithExistingParents(
    dto: CreateStudentWithExistingParentsDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const { user, parents, profile, ...studentData } = dto;

    // 1. Check if student email already exists
    const existingStudentUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existingStudentUser)
      throw new ConflictException('Student email already exists');

    // 2. Verify PRIMARY parent exists as user, others can be contacts
    const primaryParent = parents.find(p => p.isPrimary);
    if (!primaryParent) {
      throw new BadRequestException(
        'At least one parent must be marked as primary',
      );
    }

    // Check if primary parent exists as user
    const primaryParentUser = await this.prisma.user.findUnique({
      where: { email: primaryParent.email },
      include: { roles: { include: { role: true } } },
    });

    if (!primaryParentUser) {
      throw new BadRequestException(
        `Primary parent with email ${primaryParent.email} not found. Please create parent first or use the new parents creation API.`,
      );
    }

    // Verify primary parent has PARENT role
    const hasParentRole = primaryParentUser.roles.some(
      r => r.role.name === 'PARENT',
    );
    if (!hasParentRole) {
      throw new BadRequestException(
        `User ${primaryParent.email} is not a parent.`,
      );
    }

    // Check other parents (can be users or new contacts)
    const parentUsers: any[] = [
      {
        ...primaryParentUser,
        relationship: primaryParent.relationship,
        isPrimary: true,
      },
    ];

    for (const parent of parents.filter(p => !p.isPrimary)) {
      const existingParent = await this.prisma.user.findUnique({
        where: { email: parent.email },
        include: { roles: { include: { role: true } } },
      });

      if (existingParent) {
        // Existing user - verify parent role
        const hasParentRole = existingParent.roles.some(
          r => r.role.name === 'PARENT',
        );
        if (!hasParentRole) {
          throw new BadRequestException(
            `User ${parent.email} is not a parent.`,
          );
        }
        parentUsers.push({
          ...existingParent,
          relationship: parent.relationship,
          isPrimary: false,
        });
      } else {
        // New contact - will be created as contact-only
        parentUsers.push({
          email: parent.email,
          fullName: parent.fullName || parent.email.split('@')[0], // Use provided name or extract from email
          relationship: parent.relationship,
          isPrimary: false,
          isNewContact: true,
        });
      }
    }

    try {
      // ✅ Begin transaction
      const result = await this.prisma.$transaction(async tx => {
        // 3. Generate or hash student password
        const studentPassword = user.password || generateRandomPassword();
        const passwordHash = await hashPassword(studentPassword);

        // 4. Create student user
        const newStudentUser = await tx.user.create({
          data: {
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            passwordHash,
            isActive: true,
            needPasswordChange: user.password ? false : true, // ✅ Force change if auto-generated
            createdById: createdBy,
            roles: {
              create: {
                role: { connect: { name: 'STUDENT' } },
              },
            },
          },
        });

        // 5. Create student record
        const newStudent = await tx.student.create({
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

        // 6. Profile (optional)
        if (
          profile &&
          (profile.bio ||
            profile.profilePhotoUrl ||
            profile.emergencyContact ||
            profile.interests ||
            profile.additionalData)
        ) {
          await tx.studentProfile.create({
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

        // 7. Link parents to new student (both users and contacts)
        let primaryParentUser: any = null;

        for (const parent of parentUsers) {
          if (parent.isNewContact) {
            // Create contact-only link for new contacts
            await tx.parentStudentLink.create({
              data: {
                parentId: null, // No user account
                studentId: newStudent.id,
                relationship: parent.relationship,
                isPrimary: false,
                contactName: parent.fullName,
                contactEmail: parent.email,
                contactPhone: null,
                createdById: createdBy,
              },
            });
          } else {
            // Link existing user
            const existingLink = await tx.parentStudentLink.findFirst({
              where: { parentId: parent.id, studentId: newStudent.id },
            });

            if (!existingLink) {
              await tx.parentStudentLink.create({
                data: {
                  parentId: parent.id,
                  studentId: newStudent.id,
                  relationship: parent.relationship,
                  isPrimary: parent.isPrimary,
                  createdById: createdBy,
                },
              });
            }

            if (parent.isPrimary) {
              primaryParentUser = parent;
            }
          }
        }

        return {
          student: newStudent,
          studentUser: newStudentUser,
          studentPassword,
          primaryParentUser,
        };
      });

      // 8. Audit log (outside transaction)
      await this.audit.record({
        userId: createdBy,
        action: 'CREATE_STUDENT_WITH_EXISTING_PARENTS',
        module: 'student',
        status: 'SUCCESS',
        details: {
          studentId: result.student.id,
          userId: result.studentUser.id,
          linkedParentsCount: parentUsers.length,
          primaryParentExists: true,
          newContactsCreated: parentUsers.filter(p => p.isNewContact).length,
        },
        ipAddress: ip,
        userAgent,
      });

      // 9. Return clean result
      return {
        student: {
          id: result.student.id,
          fullName: result.studentUser.fullName,
          email: result.studentUser.email,
          phone: result.studentUser.phone,
        },
        studentTemporaryPassword: user.password
          ? undefined
          : result.studentPassword,
        primaryParent: result.primaryParentUser
          ? {
              id: result.primaryParentUser.id,
              fullName: result.primaryParentUser.fullName,
              email: result.primaryParentUser.email,
              phone: result.primaryParentUser.phone,
            }
          : undefined,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        'Student creation with existing parents failed: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      );
    }
  }

  // ✅ Legacy method (keeping for backward compatibility)
  async create(
    dto: CreateStudentDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Delegate to the new method for backward compatibility
    return this.createStudentWithNewParents(dto, createdBy, ip, userAgent);
  }

  // ✅ Alias for backward compatibility
  async createSiblingStudent(
    dto: CreateStudentWithExistingParentsDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    return this.createStudentWithExistingParents(dto, createdBy, ip, userAgent);
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

    return links.map(link => ({
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
        profile: true,
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

    const { id: userId, roleNames } = currentUser;
    const isAdminOrTeacher = roleNames.some(r =>
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
      dob: student.dob,
      gender: student.gender,
      class: student.class,
      section: student.section,
      profile: student.profile,
      additionalMetadata: student.additionalMetadata,
      parents: student.parents.map(link => ({
        id: link.parent?.id ?? null,
        fullName: link.parent?.fullName ?? link.contactName ?? 'Unknown',
        email: link.parent?.email ?? link.contactEmail ?? 'Unknown',
        phone: link.parent?.phone ?? link.contactPhone ?? 'Unknown',
        relationship: link.relationship,
        isPrimary: link.isPrimary,
      })),
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
      updates.additionalMetadata =
        dto.additionalMetadata ?? student.additionalMetadata;

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
    if (dto.additionalMetadata)
      updates.additionalMetadata = dto.additionalMetadata;
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await this.prisma.student.update({
        where: { id: student.id },
        data: updates,
      });
    }

    // ✅ Upsert profile fields too
    const hasProfileData =
      dto.bio ||
      dto.profilePhotoUrl ||
      dto.emergencyContact ||
      dto.interests ||
      dto.additionalData;
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
    if (!student || student.deletedAt)
      throw new NotFoundException('Student not found');

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
        relationship: dto.relationship,
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
    // ✅ Check if this would leave student with no parents
    const totalParents = await this.prisma.parentStudentLink.count({
      where: { studentId, deletedAt: null },
    });

    if (totalParents <= 1) {
      throw new BadRequestException(
        'Cannot unlink parent. Student must have at least one parent linked.',
      );
    }

    // ✅ If unlinking primary parent, promote another parent to primary
    const linkToRemove = await this.prisma.parentStudentLink.findFirst({
      where: { studentId, parentId },
    });

    if (linkToRemove?.isPrimary) {
      const otherParent = await this.prisma.parentStudentLink.findFirst({
        where: {
          studentId,
          parentId: { not: parentId },
          deletedAt: null,
        },
      });

      if (otherParent) {
        await this.prisma.parentStudentLink.update({
          where: { id: otherParent.id },
          data: { isPrimary: true },
        });
      }
    }

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

  // ✅ ONE API to rule them all: Set any parent as primary (handles all scenarios)
  async setPrimaryParent(
    studentId: string,
    parentLinkId: string,
    password?: string,
    actorId?: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Get the parent link to be promoted
    const targetParentLink = await this.prisma.parentStudentLink.findFirst({
      where: {
        id: parentLinkId,
        studentId,
        deletedAt: null,
      },
      include: { parent: true },
    });

    if (!targetParentLink) {
      throw new NotFoundException('Parent link not found');
    }

    // If already primary, do nothing
    if (targetParentLink.isPrimary) {
      return { message: 'Parent is already primary' };
    }

    // Get current primary parent
    const currentPrimaryParent = await this.prisma.parentStudentLink.findFirst({
      where: {
        studentId,
        isPrimary: true,
        deletedAt: null,
      },
      include: { parent: true },
    });

    try {
      const result = await this.prisma.$transaction(async tx => {
        let newPrimaryUser: any = null;
        let temporaryPassword: string | undefined = undefined;

        // SCENARIO 1: Contact → Primary User (create account)
        if (!targetParentLink.parentId) {
          if (!targetParentLink.contactEmail) {
            throw new BadRequestException(
              'Cannot set contact as primary without email',
            );
          }

          // Check if user with this email already exists
          const existingUser = await tx.user.findUnique({
            where: { email: targetParentLink.contactEmail },
          });

          if (existingUser) {
            throw new ConflictException(
              `User with email ${targetParentLink.contactEmail} already exists`,
            );
          }

          // Create user account for contact
          const parentPassword = password || generateRandomPassword();
          const passwordHash = await hashPassword(parentPassword);

          newPrimaryUser = await tx.user.create({
            data: {
              email: targetParentLink.contactEmail,
              phone: targetParentLink.contactPhone,
              fullName: targetParentLink.contactName || 'Unknown',
              passwordHash,
              isActive: true,
              needPasswordChange: password ? false : true, // ✅ Force change if auto-generated
              createdById: actorId,
              roles: {
                create: {
                  role: { connect: { name: 'PARENT' } },
                },
              },
            },
          });

          temporaryPassword = password ? undefined : parentPassword;

          // Update contact to user link
          await tx.parentStudentLink.update({
            where: { id: parentLinkId },
            data: {
              parentId: newPrimaryUser.id,
              contactName: null,
              contactEmail: null,
              contactPhone: null,
              isPrimary: true,
              updatedAt: new Date(),
              updatedById: actorId,
            },
          });
        }
        // SCENARIO 2: Existing User → Primary (just switch)
        else {
          // Enable target user account (in case it was disabled)
          await tx.user.update({
            where: { id: targetParentLink.parent!.id },
            data: {
              isActive: true,
              updatedAt: new Date(),
              updatedById: actorId,
            },
          });

          // Set as primary
          await tx.parentStudentLink.update({
            where: { id: parentLinkId },
            data: {
              isPrimary: true,
              updatedAt: new Date(),
              updatedById: actorId,
            },
          });

          newPrimaryUser = targetParentLink.parent!;
        }

        // ✅ ALWAYS disable previous primary user (if exists)
        if (currentPrimaryParent?.parent) {
          await tx.user.update({
            where: { id: currentPrimaryParent.parent.id },
            data: {
              isActive: false, // ✅ Disable login
              updatedAt: new Date(),
              updatedById: actorId,
            },
          });

          // Demote to non-primary
          await tx.parentStudentLink.update({
            where: { id: currentPrimaryParent.id },
            data: {
              isPrimary: false,
              updatedAt: new Date(),
              updatedById: actorId,
            },
          });
        }

        return {
          newPrimaryUser,
          temporaryPassword,
          wasContact: !targetParentLink.parentId,
          previousPrimaryDisabled: !!currentPrimaryParent?.parent,
        };
      });

      if (actorId) {
        await this.audit.record({
          userId: actorId,
          action: 'SET_PRIMARY_PARENT',
          module: 'student',
          status: 'SUCCESS',
          details: {
            studentId,
            parentLinkId,
            newPrimaryUserId: result.newPrimaryUser.id,
            wasContact: result.wasContact,
            previousPrimaryDisabled: result.previousPrimaryDisabled,
          },
          ipAddress: ip,
          userAgent,
        });
      }

      return {
        message: `${result.wasContact ? 'Contact promoted to' : 'Parent set as'} primary successfully`,
        primaryParent: {
          id: result.newPrimaryUser.id,
          fullName: result.newPrimaryUser.fullName,
          email: result.newPrimaryUser.email,
          phone: result.newPrimaryUser.phone,
        },
        ...(result.temporaryPassword && {
          temporaryPassword: result.temporaryPassword,
        }),
        ...(result.previousPrimaryDisabled && {
          previousPrimaryDisabled: true,
        }),
      };
    } catch (err) {
      throw new InternalServerErrorException('Failed to set primary parent');
    }
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

    return student.parents.map(link => ({
      id: link.parent?.id ?? null,
      fullName: link.parent?.fullName ?? link.contactName ?? 'Unknown',
      email: link.parent?.email ?? link.contactEmail ?? 'Unknown',
      phone: link.parent?.phone ?? link.contactPhone ?? 'Unknown',
      relationship: link.relationship,
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
      students: students.map(s => ({
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
        include: {
          parentLinks: {
            select: {
              studentId: true,
              student: {
                select: {
                  user: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
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
