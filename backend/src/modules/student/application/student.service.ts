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
    const { user, parents, profile, address, guardians, ...studentData } = dto;

    // 1. Check if student email already exists (exclude soft-deleted users)
    const existingStudentUser = await this.prisma.user.findFirst({
      where: {
        email: user.email,
        deletedAt: null, // Only check active (non-soft-deleted) users
      },
    });
    if (existingStudentUser)
      throw new ConflictException('Student email already exists');

    // Clean up any legacy soft-deleted users with the same email (defensive programming)
    await this.prisma.user.updateMany({
      where: {
        email: user.email,
        deletedAt: { not: null }, // Only soft-deleted users
      },
      data: {
        email: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}@deleted.local`,
      },
    });

    // 2. Check if any parent email already exists (exclude soft-deleted users)
    for (const parent of parents) {
      const existingParent = await this.prisma.user.findFirst({
        where: {
          email: parent.email,
          deletedAt: null, // Only check active (non-soft-deleted) users
        },
      });
      if (existingParent) {
        throw new ConflictException(
          `Parent with email ${parent.email} already exists. Use the existing parents API instead.`,
        );
      }

      // Clean up any legacy soft-deleted users with the same parent email (defensive programming)
      await this.prisma.user.updateMany({
        where: {
          email: parent.email,
          deletedAt: { not: null }, // Only soft-deleted users
        },
        data: {
          email: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}@deleted.local`,
        },
      });
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
            needPasswordChange: user.password ? false : true, // Force change if auto-generated
            roles: {
              create: {
                role: { connect: { name: 'STUDENT' } },
              },
            },
          },
        });

        // 5. Create address if provided
        let addressId: string | undefined;
        if (address) {
          const createdAddress = await tx.address.create({
            data: {
              street: address.street,
              city: address.city,
              state: address.state,
              pinCode: address.pinCode,
            },
          });
          addressId = createdAddress.id;
        }

        // 6. Create student record
        const newStudent = await tx.student.create({
          data: {
            userId: newStudentUser.id,
            classId: studentData.classId,
            rollNumber: studentData.rollNumber,
            admissionDate: new Date(studentData.admissionDate),
            email: studentData.email,
            dob: new Date(studentData.dob),
            gender: studentData.gender,
            bloodGroup: studentData.bloodGroup,
            imageUrl: studentData.imageUrl,
            addressId: addressId,
            fatherName: studentData.fatherName,
            motherName: studentData.motherName,
            fatherPhone: studentData.fatherPhone,
            motherPhone: studentData.motherPhone,
            fatherEmail: studentData.fatherEmail,
            motherEmail: studentData.motherEmail,
            fatherOccupation: studentData.fatherOccupation,
            motherOccupation: studentData.motherOccupation,
          },
        });

        // 7. Create student profile if provided
        if (profile) {
          await tx.studentProfile.create({
            data: {
              studentId: newStudent.id,
              emergencyContact: profile.emergencyContact || {},
              interests: profile.interests || {},
              additionalData: profile.additionalData || {},
              profilePhotoUrl: profile.profilePhotoUrl,
            },
          });
        }

        // 8. Create guardians if provided
        if (guardians && guardians.length > 0) {
          await tx.guardian.createMany({
            data: guardians.map(guardian => ({
              studentId: newStudent.id,
              fullName: guardian.fullName,
              phone: guardian.phone,
              email: guardian.email,
              relation: guardian.relation,
            })),
          });
        }

        // 9. Create parent users and links
        for (const parent of parents) {
          if (parent.createUserAccount) {
            // Create parent user account
            const parentPassword = parent.password || generateRandomPassword();
            const parentPasswordHash = await hashPassword(parentPassword);

            const newParentUser = await tx.user.create({
              data: {
                email: parent.email,
                phone: parent.phone,
                fullName: parent.fullName,
                passwordHash: parentPasswordHash,
                isActive: true,
                needPasswordChange: parent.password ? false : true,
                roles: {
                  create: {
                    role: { connect: { name: 'PARENT' } },
                  },
                },
              },
            });

            // Create parent profile
            const newParent = await tx.parent.create({
              data: {
                userId: newParentUser.id,
              },
            });

            // Create parent-student link
            await tx.parentStudentLink.create({
              data: {
                parentId: newParent.id,
                studentId: newStudent.id,
                relationship: parent.relationship,
                isPrimary: parent.isPrimary,
              },
            });
          } else {
            // For parents without user accounts, we need to find existing parent or skip
            // This case should be handled by the createStudentWithExistingParents method
            throw new BadRequestException(
              'Cannot create parent link without user account. Use existing parents API.',
            );
          }
        }

        return { student: newStudent, user: newStudentUser };
      });

      // Log audit
      await this.audit.log({
        userId: createdBy,
        action: 'CREATE_STUDENT_WITH_NEW_PARENTS',
        module: 'STUDENT',
        details: {
          studentId: result.student.id,
          userId: result.user.id,
          rollNumber: result.student.rollNumber,
        },
        ipAddress: ip,
        userAgent: userAgent,
      });

      return result;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException(
        `Failed to create student: ${error.message}`,
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
    const { user, parents, profile, address, guardians, ...studentData } = dto;

    // 1. Check if student email already exists (exclude soft-deleted users)
    const existingStudentUser = await this.prisma.user.findFirst({
      where: {
        email: user.email,
        deletedAt: null, // Only check active (non-soft-deleted) users
      },
    });
    if (existingStudentUser)
      throw new ConflictException('Student email already exists');

    // Clean up any legacy soft-deleted users with the same email (defensive programming)
    await this.prisma.user.updateMany({
      where: {
        email: user.email,
        deletedAt: { not: null }, // Only soft-deleted users
      },
      data: {
        email: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}@deleted.local`,
      },
    });

    // 2. Verify primary parent exists (exclude soft-deleted users)
    const primaryParent = parents.find(p => p.isPrimary);
    if (!primaryParent) {
      throw new BadRequestException('Primary parent must be specified');
    }

    const existingPrimaryParent = await this.prisma.user.findFirst({
      where: {
        email: primaryParent.email,
        deletedAt: null, // Only check active (non-soft-deleted) users
      },
    });
    if (!existingPrimaryParent) {
      throw new NotFoundException('Primary parent not found');
    }

    try {
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
            needPasswordChange: user.password ? false : true,
            roles: {
              create: {
                role: { connect: { name: 'STUDENT' } },
              },
            },
          },
        });

        // 5. Create address if provided
        let addressId: string | undefined;
        if (address) {
          const createdAddress = await tx.address.create({
            data: {
              street: address.street,
              city: address.city,
              state: address.state,
              pinCode: address.pinCode,
            },
          });
          addressId = createdAddress.id;
        }

        // 6. Create student record
        const newStudent = await tx.student.create({
          data: {
            userId: newStudentUser.id,
            classId: studentData.classId,
            rollNumber: studentData.rollNumber,
            admissionDate: new Date(studentData.admissionDate),
            email: studentData.email,
            dob: new Date(studentData.dob),
            gender: studentData.gender,
            bloodGroup: studentData.bloodGroup,
            imageUrl: studentData.imageUrl,
            addressId: addressId,
            fatherName: studentData.fatherName,
            motherName: studentData.motherName,
            fatherPhone: studentData.fatherPhone,
            motherPhone: studentData.motherPhone,
            fatherEmail: studentData.fatherEmail,
            motherEmail: studentData.motherEmail,
            fatherOccupation: studentData.fatherOccupation,
            motherOccupation: studentData.motherOccupation,
          },
        });

        // 7. Create student profile if provided
        if (profile) {
          await tx.studentProfile.create({
            data: {
              studentId: newStudent.id,
              emergencyContact: profile.emergencyContact || {},
              interests: profile.interests || {},
              additionalData: profile.additionalData || {},
              profilePhotoUrl: profile.profilePhotoUrl,
            },
          });
        }

        // 8. Create guardians if provided
        if (guardians && guardians.length > 0) {
          await tx.guardian.createMany({
            data: guardians.map(guardian => ({
              studentId: newStudent.id,
              fullName: guardian.fullName,
              phone: guardian.phone,
              email: guardian.email,
              relation: guardian.relation,
            })),
          });
        }

        // 9. Create parent-student links
        for (const parent of parents) {
          const existingParentUser = await tx.user.findFirst({
            where: {
              email: parent.email,
              deletedAt: null, // Only check active (non-soft-deleted) users
            },
            include: {
              parent: true,
            },
          });

          if (existingParentUser && existingParentUser.parent) {
            // Link existing parent
            await tx.parentStudentLink.create({
              data: {
                parentId: existingParentUser.parent.id,
                studentId: newStudent.id,
                relationship: parent.relationship,
                isPrimary: parent.isPrimary,
              },
            });
          } else {
            throw new NotFoundException(
              `Parent with email ${parent.email} not found. Please create the parent account first.`,
            );
          }
        }

        return { student: newStudent, user: newStudentUser };
      });

      // Log audit
      await this.audit.log({
        userId: createdBy,
        action: 'CREATE_STUDENT_WITH_EXISTING_PARENTS',
        module: 'STUDENT',
        details: {
          studentId: result.student.id,
          userId: result.user.id,
          rollNumber: result.student.rollNumber,
        },
        ipAddress: ip,
        userAgent: userAgent,
      });

      return result;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create student: ${error.message}`,
      );
    }
  }

  // ✅ Get student by ID
  async findById(
    id: string,
    userContext?: { id: string; roleNames: string[] },
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        class: {
          select: {
            id: true,
            grade: true,
            section: true,
          },
        },
        address: true,
        profile: true,
        guardians: true,
        parents: {
          include: {
            parent: {
              include: {
                user: {
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
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  // ✅ Update student
  async update(
    id: string,
    dto: UpdateStudentDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existingStudent = await this.findById(id);
    const { address, ...studentData } = dto;

    try {
      const result = await this.prisma.$transaction(async tx => {
        // Update user if needed
        if (dto.fullName || dto.email || dto.phone) {
          await tx.user.update({
            where: { id: existingStudent.userId },
            data: {
              fullName: dto.fullName,
              email: dto.email,
              phone: dto.phone,
            },
          });
        }

        // Update address if provided
        let addressId = existingStudent.addressId;
        if (address) {
          if (addressId) {
            // Update existing address
            await tx.address.update({
              where: { id: addressId },
              data: address,
            });
          } else {
            // Create new address
            const newAddress = await tx.address.create({
              data: address,
            });
            addressId = newAddress.id;
          }
        }

        // Update student record
        const updatedStudent = await tx.student.update({
          where: { id },
          data: {
            ...studentData,
            addressId,
            admissionDate: dto.admissionDate
              ? new Date(dto.admissionDate)
              : undefined,
            dob: dto.dob ? new Date(dto.dob) : undefined,
          },
        });

        return updatedStudent;
      });

      // Log audit
      await this.audit.log({
        userId: updatedBy,
        action: 'UPDATE_STUDENT',
        module: 'STUDENT',
        details: {
          studentId: id,
          changes: dto,
        },
        ipAddress: ip,
        userAgent: userAgent,
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update student: ${error.message}`,
      );
    }
  }

  // ✅ Delete student (soft delete)
  async delete(id: string, deletedBy: string, ip?: string, userAgent?: string) {
    const existingStudent = await this.findById(id);

    try {
      const result = await this.prisma.$transaction(async tx => {
        // Soft delete user
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: {
            deletedAt: new Date(),
            isActive: false,
          },
        });

        // Soft delete student
        const deletedStudent = await tx.student.update({
          where: { id },
          data: {
            deletedAt: new Date(),
          },
        });

        return deletedStudent;
      });

      // Log audit
      await this.audit.log({
        userId: deletedBy,
        action: 'DELETE_STUDENT',
        module: 'STUDENT',
        details: {
          studentId: id,
          rollNumber: existingStudent.rollNumber,
        },
        ipAddress: ip,
        userAgent: userAgent,
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete student: ${error.message}`,
      );
    }
  }

  // ✅ Generic create method (defaults to new parents)
  async create(
    dto: CreateStudentDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    return this.createStudentWithNewParents(dto, createdBy, ip, userAgent);
  }

  // ✅ Find all students with pagination and filtering
  async findAll(options: {
    limit: number;
    page: number;
    search?: string;
    classId?: string;
    sectionId?: string;
  }) {
    const { limit, page, search, classId } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (classId) {
      where.classId = classId;
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          user: true,
          class: true,
          address: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ✅ Get all parents
  async getAllParents(limit: number, page: number) {
    const skip = (page - 1) * limit;

    const [parents, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: 'PARENT',
              },
            },
          },
          deletedAt: null,
        },
        include: {
          parent: {
            include: {
              user: {
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          roles: {
            some: {
              role: {
                name: 'PARENT',
              },
            },
          },
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: parents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ✅ Find children of parent
  async findChildrenOfParent(parentUserId: string) {
    // First find the parent record
    const parent = await this.prisma.parent.findUnique({
      where: { userId: parentUserId },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const parentLinks = await this.prisma.parentStudentLink.findMany({
      where: {
        parentId: parent.id,
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
            address: true,
          },
        },
      },
    });

    return parentLinks.map(link => link.student);
  }

  // ✅ Update self (for student role)
  async updateSelf(
    studentUserId: string,
    dto: Partial<{
      phone: string;
      imageUrl: string;
      fatherPhone: string;
      motherPhone: string;
    }>,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findFirst({
      where: {
        userId: studentUserId,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id: student.id },
      data: {
        fatherPhone: dto.fatherPhone,
        motherPhone: dto.motherPhone,
        imageUrl: dto.imageUrl,
        user: {
          update: {
            phone: dto.phone,
          },
        },
      },
      include: {
        user: true,
        class: true,
      },
    });

    await this.audit.log({
      userId: studentUserId,
      action: 'UPDATE_SELF',
      module: 'STUDENT',
      ipAddress: ip,
      userAgent,
      details: { studentId: student.id, changes: dto },
    });

    return { student: updatedStudent, user: updatedStudent.user };
  }

  // ✅ Update by admin
  async updateByAdmin(
    id: string,
    dto: any,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        rollNumber: dto.rollNumber,
        classId: dto.classId,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        imageUrl: dto.imageUrl,
        fatherName: dto.fatherName,
        motherName: dto.motherName,
        fatherPhone: dto.fatherPhone,
        motherPhone: dto.motherPhone,
        fatherEmail: dto.fatherEmail,
        motherEmail: dto.motherEmail,
        fatherOccupation: dto.fatherOccupation,
        motherOccupation: dto.motherOccupation,
        user: {
          update: {
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone,
          },
        },
      },
      include: {
        user: true,
        class: true,
      },
    });

    await this.audit.log({
      userId: updatedBy,
      action: 'UPDATE_STUDENT',
      module: 'STUDENT',
      ipAddress: ip,
      userAgent,
      details: { studentId: id, changes: dto },
    });

    return { student: updatedStudent, user: updatedStudent.user };
  }

  // ✅ Upsert profile
  async upsertProfile(
    studentId: string,
    dto: any,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    const profile = await this.prisma.studentProfile.upsert({
      where: { studentId },
      create: {
        studentId,
        emergencyContact: dto.emergencyContact || {},
        interests: dto.interests || {},
        additionalData: dto.additionalData || {},
        profilePhotoUrl: dto.profilePhotoUrl,
      },
      update: {
        emergencyContact: dto.emergencyContact,
        interests: dto.interests,
        additionalData: dto.additionalData,
        profilePhotoUrl: dto.profilePhotoUrl,
      },
    });

    await this.audit.log({
      userId: updatedBy,
      action: 'UPSERT_STUDENT_PROFILE',
      module: 'STUDENT',
      ipAddress: ip,
      userAgent,
      details: { studentId, profileId: profile.id },
    });

    return profile;
  }

  // ✅ Soft delete
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
      throw new NotFoundException('Student not found');
    }

    await this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        user: {
          update: {
            deletedAt: new Date(),
            isActive: false,
            // Nullify unique fields to avoid conflicts when creating new users
            email: `deleted_${student.userId}_${Date.now()}@deleted.local`,
            phone: student.user.phone
              ? `deleted_${student.userId}_${Date.now()}`
              : null,
          },
        },
      },
    });

    await this.audit.log({
      userId: deletedBy,
      action: 'DELETE_STUDENT',
      module: 'STUDENT',
      ipAddress: ip,
      userAgent,
      details: { studentId: id },
    });

    return { message: 'Student deleted successfully' };
  }

  // ✅ Get student parents
  async getStudentParents(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student.parents;
  }

  // ✅ Set primary parent
  async setPrimaryParent(
    studentId: string,
    parentId: string,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // First, set all parents to non-primary
    await this.prisma.parentStudentLink.updateMany({
      where: { studentId },
      data: { isPrimary: false },
    });

    // Then set the specified parent as primary
    const updatedLink = await this.prisma.parentStudentLink.updateMany({
      where: {
        studentId,
        parentId,
      },
      data: { isPrimary: true },
    });

    if (updatedLink.count === 0) {
      throw new NotFoundException('Parent-student link not found');
    }

    await this.audit.log({
      userId: updatedBy,
      action: 'SET_PRIMARY_PARENT',
      module: 'STUDENT',
      ipAddress: ip,
      userAgent,
      details: { studentId, parentId },
    });

    return { message: 'Primary parent updated successfully' };
  }
}
