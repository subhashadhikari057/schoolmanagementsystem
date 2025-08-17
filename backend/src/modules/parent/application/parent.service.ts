import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { generateRandomPassword } from '../../../shared/utils/password.util';
import { hashPassword } from '../../../shared/auth/hash.util';
import {
  CreateParentDtoType,
  UpdateParentByAdminDtoType,
  UpdateParentSelfDtoType,
  LinkChildDtoType,
  UnlinkChildDtoType,
  SetPrimaryParentDtoType,
  GetAllParentsDtoType,
} from '../dto/parent.dto';

@Injectable()
export class ParentService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new parent with user account
   */
  async create(
    data: CreateParentDtoType,
    createdById: string,
    ip: string,
    userAgent: string,
    profilePicture?: Express.Multer.File,
  ) {
    try {
      // Check if user with email already exists (exclude soft-deleted users)
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: data.user.email,
          deletedAt: null, // Only check active (non-soft-deleted) users
        },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Clean up any legacy soft-deleted users with the same email (defensive programming)
      await this.prisma.user.updateMany({
        where: {
          email: data.user.email,
          deletedAt: { not: null }, // Only soft-deleted users
        },
        data: {
          email: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}@deleted.local`,
        },
      });

      // Check if phone number already exists (if provided, exclude soft-deleted users)
      if (data.user.phone) {
        const existingPhone = await this.prisma.user.findFirst({
          where: {
            phone: data.user.phone,
            deletedAt: null, // Only check active (non-soft-deleted) users
          },
        });

        if (existingPhone) {
          throw new ConflictException(
            'User with this phone number already exists',
          );
        }

        // Clean up any legacy soft-deleted users with the same phone (defensive programming)
        await this.prisma.user.updateMany({
          where: {
            phone: data.user.phone,
            deletedAt: { not: null }, // Only soft-deleted users
          },
          data: {
            phone: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          },
        });
      }

      // Generate password if not provided
      const password = data.user.password || generateRandomPassword();
      const passwordHash = await hashPassword(password);

      const result = await this.prisma.$transaction(async tx => {
        // Create user account
        const user = await tx.user.create({
          data: {
            email: data.user.email,
            phone: data.user.phone,
            fullName: data.user.fullName,
            passwordHash,
            needPasswordChange: !data.user.password, // If auto-generated, require change
            createdById,
          },
        });

        // Assign PARENT role
        const parentRole = await tx.role.findUnique({
          where: { name: 'PARENT' },
        });

        if (parentRole) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: parentRole.id,
            },
          });
        }

        // Create parent profile
        const parent = await tx.parent.create({
          data: {
            userId: user.id,
            dateOfBirth: data.profile?.dateOfBirth
              ? new Date(data.profile.dateOfBirth)
              : undefined,
            gender: data.profile?.gender,
            occupation: data.profile?.occupation,
            workPlace: data.profile?.workPlace,
            workPhone: data.profile?.workPhone,
            emergencyContactName: data.profile?.emergencyContactName,
            emergencyContactPhone: data.profile?.emergencyContactPhone,
            emergencyContactRelationship:
              data.profile?.emergencyContactRelationship,
            street: data.profile?.street,
            city: data.profile?.city,
            state: data.profile?.state,
            pinCode: data.profile?.pinCode,
            country: data.profile?.country,
            notes: data.profile?.notes,
            specialInstructions: data.profile?.specialInstructions,
            createdById,
          },
        });

        // Create parent profile for additional data
        await tx.parentProfile.create({
          data: {
            parentId: parent.id,
            profilePhotoUrl: profilePicture
              ? `/uploads/parents/profiles/${profilePicture.filename}`
              : undefined,
          },
        });

        // Link children if provided
        if (data.children && data.children.length > 0) {
          for (const child of data.children) {
            // Verify student exists
            const student = await tx.student.findUnique({
              where: { id: child.studentId },
            });

            if (!student) {
              throw new NotFoundException(
                `Student with ID ${child.studentId} not found`,
              );
            }

            // Create parent-student link
            await tx.parentStudentLink.create({
              data: {
                parentId: parent.id,
                studentId: child.studentId,
                relationship: child.relationship,
                isPrimary: child.isPrimary,
              },
            });
          }
        }

        return {
          user,
          parent,
          temporaryPassword: !data.user.password ? password : undefined,
        };
      });

      // Log audit
      await this.auditService.record({
        action: 'CREATE_PARENT',
        status: 'SUCCESS',
        module: 'PARENT',
        userId: createdById,
        ipAddress: ip,
        userAgent,
        details: {
          parentId: result.parent.id,
          email: data.user.email,
          childrenLinked: data.children?.length || 0,
        },
      });

      return result;
    } catch (error) {
      // Log audit failure
      await this.auditService.record({
        action: 'CREATE_PARENT',
        status: 'FAIL',
        module: 'PARENT',
        userId: createdById,
        ipAddress: ip,
        userAgent,
        details: {
          error: error.message,
          email: data.user.email,
        },
      });

      throw error;
    }
  }

  /**
   * Get all parents with pagination and filtering
   */
  async findAll(query: GetAllParentsDtoType) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      user: {
        deletedAt: null,
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      },
    };

    const [parents, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              fullName: true,
              isActive: true,
            },
          },
          children: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                    },
                  },
                  class: {
                    select: {
                      grade: true,
                      section: true,
                    },
                  },
                },
              },
            },
          },
          profile: true,
        },
        orderBy:
          sortBy === 'fullName'
            ? { user: { fullName: sortOrder } }
            : { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.parent.count({ where }),
    ]);

    return {
      parents: parents.map(parent => ({
        id: parent.id,
        userId: parent.userId,
        fullName: parent.user.fullName,
        email: parent.user.email,
        phone: parent.user.phone,
        isActive: parent.user.isActive,
        dateOfBirth: parent.dateOfBirth?.toISOString().split('T')[0],
        gender: parent.gender,
        occupation: parent.occupation,
        workPlace: parent.workPlace,
        workPhone: parent.workPhone,
        emergencyContactName: parent.emergencyContactName,
        emergencyContactPhone: parent.emergencyContactPhone,
        emergencyContactRelationship: parent.emergencyContactRelationship,
        street: parent.street,
        city: parent.city,
        state: parent.state,
        pinCode: parent.pinCode,
        country: parent.country,
        notes: parent.notes,
        specialInstructions: parent.specialInstructions,
        children: parent.children.map(link => ({
          id: link.id,
          studentId: link.studentId,
          fullName: link.student.user.fullName,
          className: `${link.student.class.grade}-${link.student.class.section}`,
          rollNumber: link.student.rollNumber,
          relationship: link.relationship,
          isPrimary: link.isPrimary,
        })),
        profilePhotoUrl: parent.profile?.profilePhotoUrl,
        createdAt: parent.createdAt.toISOString(),
        updatedAt: parent.updatedAt?.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get parent by ID
   */
  async findById(id: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            fullName: true,
            isActive: true,
          },
        },
        children: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
                class: {
                  select: {
                    grade: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
        profile: true,
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return {
      id: parent.id,
      userId: parent.userId,
      fullName: parent.user.fullName,
      email: parent.user.email,
      phone: parent.user.phone,
      isActive: parent.user.isActive,
      dateOfBirth: parent.dateOfBirth?.toISOString().split('T')[0],
      gender: parent.gender,
      occupation: parent.occupation,
      workPlace: parent.workPlace,
      workPhone: parent.workPhone,
      emergencyContactName: parent.emergencyContactName,
      emergencyContactPhone: parent.emergencyContactPhone,
      emergencyContactRelationship: parent.emergencyContactRelationship,
      street: parent.street,
      city: parent.city,
      state: parent.state,
      pinCode: parent.pinCode,
      country: parent.country,
      notes: parent.notes,
      specialInstructions: parent.specialInstructions,
      children: parent.children.map(link => ({
        id: link.id,
        studentId: link.studentId,
        fullName: link.student.user.fullName,
        className: `${link.student.class.grade}-${link.student.class.section}`,
        rollNumber: link.student.rollNumber,
        relationship: link.relationship,
        isPrimary: link.isPrimary,
      })),
      profilePhotoUrl: parent.profile?.profilePhotoUrl,
      createdAt: parent.createdAt.toISOString(),
      updatedAt: parent.updatedAt?.toISOString(),
    };
  }

  /**
   * Update parent by admin
   */
  async updateByAdmin(
    id: string,
    data: UpdateParentByAdminDtoType,
    updatedById: string,
    ip: string,
    userAgent: string,
  ) {
    const parent = await this.prisma.parent.findUnique({
      where: { id, deletedAt: null },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    try {
      const result = await this.prisma.$transaction(async tx => {
        // Update user data if provided
        if (data.user) {
          await tx.user.update({
            where: { id: parent.userId },
            data: {
              ...data.user,
              updatedById,
            },
          });
        }

        // Update parent profile if provided
        if (data.profile) {
          await tx.parent.update({
            where: { id },
            data: {
              ...data.profile,
              dateOfBirth: data.profile.dateOfBirth
                ? new Date(data.profile.dateOfBirth)
                : undefined,
              updatedById,
            },
          });
        }

        return await this.findById(id);
      });

      // Log audit
      await this.auditService.record({
        action: 'UPDATE_PARENT',
        status: 'SUCCESS',
        module: 'PARENT',
        userId: updatedById,
        ipAddress: ip,
        userAgent,
        details: {
          parentId: id,
          updatedFields: Object.keys(data),
        },
      });

      return result;
    } catch (error) {
      // Log audit failure
      await this.auditService.record({
        action: 'UPDATE_PARENT',
        status: 'FAIL',
        module: 'PARENT',
        userId: updatedById,
        ipAddress: ip,
        userAgent,
        details: {
          error: error.message,
          parentId: id,
        },
      });

      throw error;
    }
  }

  /**
   * Link child to parent
   */
  async linkChild(
    parentId: string,
    data: LinkChildDtoType,
    updatedById: string,
    ip: string,
    userAgent: string,
  ) {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId, deletedAt: null },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if link already exists
    const existingLink = await this.prisma.parentStudentLink.findFirst({
      where: {
        parentId,
        studentId: data.studentId,
      },
    });

    if (existingLink) {
      throw new ConflictException('Parent is already linked to this student');
    }

    try {
      const link = await this.prisma.parentStudentLink.create({
        data: {
          parentId,
          studentId: data.studentId,
          relationship: data.relationship,
          isPrimary: data.isPrimary,
        },
      });

      // Log audit
      await this.auditService.record({
        action: 'LINK_CHILD',
        status: 'SUCCESS',
        module: 'PARENT',
        userId: updatedById,
        ipAddress: ip,
        userAgent,
        details: {
          parentId,
          studentId: data.studentId,
          relationship: data.relationship,
          isPrimary: data.isPrimary,
        },
      });

      return link;
    } catch (error) {
      // Log audit failure
      await this.auditService.record({
        action: 'LINK_CHILD',
        status: 'FAIL',
        module: 'PARENT',
        userId: updatedById,
        ipAddress: ip,
        userAgent,
        details: {
          error: error.message,
          parentId,
          studentId: data.studentId,
        },
      });

      throw error;
    }
  }

  /**
   * Unlink child from parent
   */
  async unlinkChild(
    parentId: string,
    data: UnlinkChildDtoType,
    updatedById: string,
    ip: string,
    userAgent: string,
  ) {
    const link = await this.prisma.parentStudentLink.findFirst({
      where: {
        parentId,
        studentId: data.studentId,
      },
    });

    if (!link) {
      throw new NotFoundException('Parent-student link not found');
    }

    try {
      await this.prisma.parentStudentLink.delete({
        where: {
          id: link.id,
        },
      });

      // Log audit
      await this.auditService.record({
        action: 'UNLINK_CHILD',
        status: 'SUCCESS',
        module: 'PARENT',
        userId: updatedById,
        ipAddress: ip,
        userAgent,
        details: {
          parentId,
          studentId: data.studentId,
        },
      });

      return { message: 'Child unlinked successfully' };
    } catch (error) {
      // Log audit failure
      await this.auditService.record({
        action: 'UNLINK_CHILD',
        status: 'FAIL',
        module: 'PARENT',
        userId: updatedById,
        ipAddress: ip,
        userAgent,
        details: {
          error: error.message,
          parentId,
          studentId: data.studentId,
        },
      });

      throw error;
    }
  }

  /**
   * Set primary parent for student
   */
  async setPrimaryParent(
    data: SetPrimaryParentDtoType,
    updatedById: string,
    ip: string,
    userAgent: string,
  ) {
    const { parentId, studentId } = data;

    const link = await this.prisma.parentStudentLink.findFirst({
      where: {
        parentId,
        studentId,
      },
    });

    if (!link) {
      throw new NotFoundException('Parent-student link not found');
    }

    try {
      await this.prisma.$transaction(async tx => {
        // Remove primary status from all parents of this student
        await tx.parentStudentLink.updateMany({
          where: { studentId },
          data: { isPrimary: false },
        });

        // Set this parent as primary
        await tx.parentStudentLink.update({
          where: {
            id: link.id,
          },
          data: { isPrimary: true },
        });
      });

      // Log audit
      await this.auditService.record({
        action: 'SET_PRIMARY_PARENT',
        status: 'SUCCESS',
        module: 'PARENT',
        userId: updatedById,
        ipAddress: ip,
        userAgent,
        details: {
          parentId,
          studentId,
        },
      });

      return { message: 'Primary parent set successfully' };
    } catch (error) {
      // Log audit failure
      await this.auditService.record({
        action: 'SET_PRIMARY_PARENT',
        status: 'FAIL',
        module: 'PARENT',
        userId: updatedById,
        ipAddress: ip,
        userAgent,
        details: {
          error: error.message,
          parentId,
          studentId,
        },
      });

      throw error;
    }
  }

  /**
   * Get all available students for parent linking
   */
  async getAvailableStudents() {
    const students = await this.prisma.student.findMany({
      where: {
        user: {
          deletedAt: null,
        },
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        class: {
          select: {
            grade: true,
            section: true,
          },
        },
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    return students.map(student => ({
      id: student.id,
      fullName: student.user.fullName,
      className: `${student.class.grade}-${student.class.section}`,
      rollNumber: student.rollNumber,
      email: student.email,
    }));
  }

  /**
   * Soft delete parent
   */
  async softDelete(
    id: string,
    deletedById: string,
    ip: string,
    userAgent: string,
  ) {
    const parent = await this.prisma.parent.findUnique({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    try {
      await this.prisma.$transaction(async tx => {
        // Soft delete parent
        await tx.parent.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedById,
          },
        });

        // Soft delete user
        await tx.user.update({
          where: { id: parent.userId },
          data: {
            deletedAt: new Date(),
            deletedById,
            isActive: false,
            // Nullify unique fields to avoid conflicts when creating new users
            email: `deleted_${parent.userId}_${Date.now()}@deleted.local`,
            phone: parent.user?.phone
              ? `deleted_${parent.userId}_${Date.now()}`
              : null,
          },
        });

        // Remove parent-student links
        await tx.parentStudentLink.deleteMany({
          where: { parentId: id },
        });
      });

      // Log audit
      await this.auditService.record({
        action: 'DELETE_PARENT',
        status: 'SUCCESS',
        module: 'PARENT',
        userId: deletedById,
        ipAddress: ip,
        userAgent,
        details: {
          parentId: id,
        },
      });

      return { message: 'Parent deleted successfully' };
    } catch (error) {
      // Log audit failure
      await this.auditService.record({
        action: 'DELETE_PARENT',
        status: 'FAIL',
        module: 'PARENT',
        userId: deletedById,
        ipAddress: ip,
        userAgent,
        details: {
          error: error.message,
          parentId: id,
        },
      });

      throw error;
    }
  }
}
