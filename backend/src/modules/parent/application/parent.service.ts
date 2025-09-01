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
   * Search parents for linking to students (simplified response)
   */
  async searchForLinking(searchTerm: string, limit: number = 20) {
    try {
      const parents = await this.prisma.parent.findMany({
        where: {
          deletedAt: null,
          user: {
            deletedAt: null,
            OR: [
              { fullName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { phone: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          occupation: true,
          children: {
            select: {
              student: {
                select: {
                  id: true,
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
              relationship: true,
            },
          },
        },
        take: limit,
        orderBy: [
          {
            user: {
              fullName: 'asc',
            },
          },
        ],
      });

      return {
        success: true,
        data: parents.map(parent => ({
          id: parent.id,
          fullName: parent.user.fullName,
          email: parent.user.email,
          phone: parent.user.phone,
          occupation: parent.occupation,
          existingChildren: parent.children.map(child => ({
            id: child.student.id,
            name: child.student.user.fullName,
            class: `Grade ${child.student.class.grade} ${child.student.class.section}`,
            relationship: child.relationship,
          })),
        })),
        message: 'Parents retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to search parents');
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
   * Get parent by user ID
   */
  async findByUserId(userId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { userId, deletedAt: null },
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
   * Get parent's children
   */
  async getParentChildren(parentId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId, deletedAt: null },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
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
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent.children.map(link => ({
      id: link.student.id,
      fullName: link.student.user.fullName,
      email: link.student.email,
      class: {
        grade: link.student.class.grade,
        section: link.student.class.section,
      },
      className: `${link.student.class.grade}-${link.student.class.section}`,
      rollNumber: link.student.rollNumber,
      relationship: link.relationship,
      isPrimary: link.isPrimary,
      profilePhotoUrl: link.student.profilePhotoUrl,
    }));
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

  /**
   * Get all assignments for parent's children with submission status
   * This is the essential method parents need to track their children's assignments
   */
  async getChildrenAssignmentsWithStatus(userId: string, childId?: string) {
    // First get the parent and their children
    const parent = await this.prisma.parent.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: {
          select: {
            fullName: true,
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
                    id: true,
                    grade: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    if (!parent.children || parent.children.length === 0) {
      return {
        children: [],
        assignments: [],
        message: 'No children found for this parent',
      };
    }

    // If childId is provided, filter to only that child
    const targetChildren = childId
      ? parent.children.filter(child => child.studentId === childId)
      : parent.children;

    if (childId && targetChildren.length === 0) {
      throw new NotFoundException('Child not found or access denied');
    }

    // Get all unique class IDs from target children
    const classIds = [
      ...new Set(targetChildren.map(child => child.student.class.id)),
    ];

    // Get all assignments for these classes
    const assignments = await this.prisma.assignment.findMany({
      where: {
        classId: { in: classIds },
        deletedAt: null,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            grade: true,
            section: true,
          },
        },
        teacher: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        submissions: {
          where: {
            studentId: { in: targetChildren.map(child => child.studentId) },
            deletedAt: null,
          },
          select: {
            id: true,
            studentId: true,
            submittedAt: true,
            isCompleted: true,
            feedback: true,
            studentNotes: true,
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            url: true,
            mimeType: true,
            size: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Map assignments with submission status for target children only
    const assignmentsWithStatus = assignments.map(assignment => {
      const childStatuses = targetChildren.map(child => {
        const submission = assignment.submissions.find(
          s => s.studentId === child.studentId,
        );

        return {
          childId: child.studentId,
          childName: child.student.user.fullName,
          className: `${child.student.class.grade}-${child.student.class.section}`,
          rollNumber: child.student.rollNumber,
          relationship: child.relationship,
          isPrimary: child.isPrimary,
          submissionStatus: submission ? 'submitted' : 'not_submitted',
          submission: submission
            ? {
                id: submission.id,
                submittedAt: submission.submittedAt,
                isCompleted: submission.isCompleted,
                feedback: submission.feedback,
                studentNotes: submission.studentNotes,
              }
            : null,
        };
      });

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        subject: assignment.subject,
        class: assignment.class,
        teacher: assignment.teacher,
        attachments: assignment.attachments,
        childStatuses, // Only target children's status
      };
    });

    return {
      parent: {
        id: parent.id,
        fullName: parent.user?.fullName,
      },
      children: targetChildren.map(child => ({
        id: child.studentId,
        fullName: child.student.user.fullName,
        className: `${child.student.class.grade}-${child.student.class.section}`,
        classId: child.student.class.id,
        rollNumber: child.student.rollNumber,
        relationship: child.relationship,
        isPrimary: child.isPrimary,
      })),
      assignments: assignmentsWithStatus,
      totalAssignments: assignmentsWithStatus.length,
      message: childId
        ? `Found ${assignmentsWithStatus.length} assignments for ${targetChildren[0].student.user.fullName}`
        : `Found ${assignmentsWithStatus.length} assignments across ${targetChildren.length} children`,
    };
  }

  /**
   * Get child's submission for a specific assignment
   * Parents can only view their own children's submissions
   */
  async getChildSubmission(
    userId: string,
    childId: string,
    assignmentId: string,
  ) {
    // First verify the parent has access to this child
    const parent = await this.prisma.parent.findFirst({
      where: { userId, deletedAt: null },
      include: {
        children: {
          where: { studentId: childId },
          include: {
            student: {
              include: {
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
    });

    if (!parent || parent.children.length === 0) {
      throw new NotFoundException('Child not found or access denied');
    }

    const child = parent.children[0];

    // Get the assignment to verify it exists
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId, deletedAt: null },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        class: {
          select: {
            grade: true,
            section: true,
          },
        },
        teacher: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Get the child's submission for this assignment
    const submission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: childId,
        },
        deletedAt: null,
      },
      include: {
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            url: true,
            mimeType: true,
            size: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found for this assignment');
    }

    return {
      child: {
        id: child.studentId,
        fullName: child.student.user.fullName,
      },
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        subject: assignment.subject.name,
        class: `${assignment.class.grade}-${assignment.class.section}`,
        teacher: assignment.teacher.user.fullName,
      },
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        isCompleted: submission.isCompleted,
        feedback: submission.feedback,
        studentNotes: submission.studentNotes,
        attachments: submission.attachments,
      },
      message: `Submission details for ${child.student.user.fullName}`,
    };
  }
}
