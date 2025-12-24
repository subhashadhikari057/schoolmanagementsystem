import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { hashPassword } from '../../../shared/auth/hash.util';
import { AuditService } from '../../../shared/logger/audit.service';
import { generateRandomPassword } from '../../../shared/utils/password.util';
import { getFileUrl } from '../../../shared/utils/file-upload.util';
import {
  CreateStudentDtoType,
  UpdateStudentByAdminDtoType,
  UpdateStudentSelfDtoType,
  GetAllStudentsDtoType,
} from '../dto/student.dto';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateStudentDtoType,
    createdBy: string,
    profilePicture?: Express.Multer.File,
    ip?: string,
    userAgent?: string,
  ) {
    this.logger.log('🚀 === STUDENT CREATION STARTED ===');
    this.logger.log(
      '🛡️ Backend received - guardians:',
      dto.guardians?.length || 0,
    );
    this.logger.log('🔍 Full DTO keys:', Object.keys(dto));
    if (dto.guardians && dto.guardians.length > 0) {
      this.logger.log(
        '🛡️ Guardian data:',
        JSON.stringify(dto.guardians, null, 2),
      );
    }
    const {
      user,
      personal,
      academic,
      parentInfo,
      parents,
      existingParents,
      guardians,
      additional,
      profile,
    } = dto;

    // Check for existing email (exclude soft-deleted users)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: user.email,
        deletedAt: null,
      },
    });
    if (existingUser)
      throw new ConflictException('User with this email already exists');

    // Clean up any legacy soft-deleted users with the same email
    await this.prisma.user.updateMany({
      where: {
        email: user.email,
        deletedAt: { not: null },
      },
      data: {
        email: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}@deleted.local`,
      },
    });

    // Check for existing phone (exclude soft-deleted users)
    if (user.phone) {
      const existingUserPhone = await this.prisma.user.findFirst({
        where: {
          phone: user.phone,
          deletedAt: null,
        },
      });
      if (existingUserPhone)
        throw new ConflictException(
          'User with this phone number already exists',
        );

      await this.prisma.user.updateMany({
        where: {
          phone: user.phone,
          deletedAt: { not: null },
        },
        data: {
          phone: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        },
      });
    }

    // Check class capacity and generate roll number
    const classInfo = await this.prisma.class.findUnique({
      where: { id: academic.classId },
      include: {
        _count: {
          select: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!classInfo) {
      throw new BadRequestException('Selected class does not exist');
    }

    const currentStudentCount = classInfo._count.students;
    if (currentStudentCount >= classInfo.capacity) {
      throw new BadRequestException(
        `Class is full. Capacity: ${classInfo.capacity}, Current: ${currentStudentCount}`,
      );
    }

    // Auto-generate roll number if not provided
    if (!academic.rollNumber) {
      academic.rollNumber = (currentStudentCount + 1)
        .toString()
        .padStart(3, '0');
    } else {
      // Check for existing roll number in the same class if manually provided
      const existingRollNumber = await this.prisma.student.findFirst({
        where: {
          rollNumber: academic.rollNumber,
          classId: academic.classId,
          deletedAt: null,
        },
      });
      if (existingRollNumber)
        throw new ConflictException('Roll number already exists in this class');

      // Clean up any soft-deleted students with the same roll number in the same class
      await this.prisma.student.updateMany({
        where: {
          rollNumber: academic.rollNumber,
          classId: academic.classId,
          deletedAt: { not: null },
        },
        data: {
          rollNumber: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        },
      });
    }

    // Check for existing student ID if provided
    if (academic.studentId) {
      const existingStudentId = await this.prisma.student.findFirst({
        where: {
          studentId: academic.studentId,
          deletedAt: null,
        },
      });
      if (existingStudentId)
        throw new ConflictException('Student ID already exists');

      // Clean up any soft-deleted students with the same student ID
      await this.prisma.student.updateMany({
        where: {
          studentId: academic.studentId,
          deletedAt: { not: null },
        },
        data: {
          studentId: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        },
      });
    } else {
      // Generate a new student ID if not provided
      const currentYear = new Date().getFullYear();
      const studentCount = await this.prisma.student.count({
        where: { deletedAt: null },
      });
      academic.studentId = `S-${currentYear}-${(studentCount + 1).toString().padStart(4, '0')}`;
    }

    const rawPassword = user.password || generateRandomPassword();
    const passwordHash = await hashPassword(rawPassword);
    const fullName = user.middleName
      ? `${user.firstName} ${user.middleName} ${user.lastName}`
      : `${user.firstName} ${user.lastName}`;

    // Generate profile picture URL if file is uploaded
    const profilePhotoUrl = profilePicture
      ? getFileUrl(profilePicture.filename, 'students')
      : undefined;

    const result = await this.prisma.$transaction(async tx => {
      // Create user account for student
      const newUser = await tx.user.create({
        data: {
          email: user.email,
          phone: user.phone,
          fullName,
          passwordHash,
          createdById: createdBy,
          roles: {
            create: { role: { connect: { name: 'STUDENT' } } },
          },
          needPasswordChange: user.password ? false : true,
        },
      });

      // Create student profile
      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,

          // Academic Information
          classId: academic.classId,
          rollNumber: academic.rollNumber!,
          admissionDate: new Date(academic.admissionDate),
          studentId: academic.studentId,
          academicStatus: academic.academicStatus || 'active',
          transportMode: academic.transportMode,

          // Personal Information
          dob: personal?.dateOfBirth
            ? new Date(personal.dateOfBirth)
            : new Date(),
          dateOfBirth: personal?.dateOfBirth
            ? new Date(personal.dateOfBirth)
            : new Date(),
          gender: personal?.gender || 'Not Specified',
          bloodGroup: personal?.bloodGroup,
          ethnicity: personal?.ethnicity,
          motherTongue: personal?.motherTongue,
          disabilityType: personal?.disabilityType,
          address: personal?.address,
          street: personal?.street,
          city: personal?.city,
          state: personal?.state,
          pinCode: personal?.pinCode,

          // Contact Information (duplicated from user for quick access)
          email: user.email,
          phone: user.phone,

          // Parent Information (only when parentInfo is provided)
          fatherFirstName: parentInfo?.fatherFirstName || null,
          fatherMiddleName: parentInfo?.fatherMiddleName || null,
          fatherLastName: parentInfo?.fatherLastName || null,
          motherFirstName: parentInfo?.motherFirstName || null,
          motherMiddleName: parentInfo?.motherMiddleName || null,
          motherLastName: parentInfo?.motherLastName || null,
          fatherPhone: parentInfo?.fatherPhone || null,
          motherPhone: parentInfo?.motherPhone || null,
          fatherEmail: parentInfo?.fatherEmail || null,
          motherEmail: parentInfo?.motherEmail || null,
          fatherOccupation: parentInfo?.fatherOccupation || null,
          motherOccupation: parentInfo?.motherOccupation || null,

          // Medical Information
          medicalConditions: additional?.medicalConditions,
          allergies: additional?.allergies,

          // Additional Information
          interests: additional?.interests,
          specialNeeds: additional?.specialNeeds,

          // Profile Image
          imageUrl: profilePhotoUrl,
          profilePhotoUrl,

          createdById: createdBy,

          // Create student profile
          profile: {
            create: {
              emergencyContact:
                profile?.emergencyContact || additional?.emergencyContact || {},
              interests: profile?.interests || {},
              additionalData: {
                ...profile?.additionalData,
                medicalConditions: additional?.medicalConditions,
                allergies: additional?.allergies,
                specialNeeds: additional?.specialNeeds,
                bio: additional?.bio,
              },
              profilePhotoUrl,
            },
          },
        },
        include: { profile: true, user: true },
      });

      // Create parent accounts if specified
      const parentCredentials: Array<{
        id: string;
        fullName: string;
        email: string;
        relationship: string;
        temporaryPassword: string;
      }> = [];
      if (parents && parents.length > 0) {
        for (const parentData of parents) {
          if (parentData.createUserAccount) {
            // Check if parent user already exists
            const existingParentUser = await tx.user.findFirst({
              where: {
                email: parentData.email,
                deletedAt: null,
              },
            });

            let parentUser;
            let parentPassword = '';

            if (existingParentUser) {
              // Find existing parent profile
              const existingParent = await tx.parent.findFirst({
                where: {
                  userId: existingParentUser.id,
                  deletedAt: null,
                },
              });

              if (existingParent) {
                // Link existing parent to student
                await tx.parentStudentLink.create({
                  data: {
                    parentId: existingParent.id,
                    studentId: newStudent.id,
                    relationship: parentData.relationship,
                    isPrimary: parentData.isPrimary || false,
                  },
                });
                continue;
              }
              parentUser = existingParentUser;
            } else {
              // Create new parent user
              parentPassword = generateRandomPassword();
              const parentPasswordHash = await hashPassword(parentPassword);

              // Build full name from first, middle, last
              const parentFullName = parentData.middleName
                ? `${parentData.firstName} ${parentData.middleName} ${parentData.lastName}`
                : `${parentData.firstName} ${parentData.lastName}`;

              parentUser = await tx.user.create({
                data: {
                  email: parentData.email,
                  phone: parentData.phone,
                  fullName: parentFullName,
                  passwordHash: parentPasswordHash,
                  createdById: createdBy,
                  roles: {
                    create: { role: { connect: { name: 'PARENT' } } },
                  },
                  needPasswordChange: true,
                },
              });

              parentCredentials.push({
                id: parentUser.id,
                fullName: parentFullName,
                email: parentData.email,
                relationship: parentData.relationship,
                temporaryPassword: parentPassword,
              });
            }

            // Create parent profile
            const newParent = await tx.parent.create({
              data: {
                userId: parentUser.id,
                occupation: parentData.occupation,
                // Copy address from student for consistency
                street: personal?.street,
                city: personal?.city,
                state: personal?.state,
                pinCode: personal?.pinCode,
                createdById: createdBy,
                profile: {
                  create: {
                    additionalData: {
                      relationship: parentData.relationship,
                      isPrimary: parentData.isPrimary,
                    },
                  },
                },
              },
            });

            // Link parent to student
            await tx.parentStudentLink.create({
              data: {
                parentId: newParent.id,
                studentId: newStudent.id,
                relationship: parentData.relationship,
                isPrimary: parentData.isPrimary || false,
              },
            });
          }
        }
      }

      // Create guardian records and user accounts if specified
      if (guardians && guardians.length > 0) {
        for (const guardianData of guardians) {
          this.logger.log(
            '🛡️ Processing guardian:',
            guardianData.firstName,
            guardianData.lastName,
            'createUserAccount:',
            guardianData.createUserAccount,
          );

          // Build full name from first, middle, last
          const guardianFullName = guardianData.middleName
            ? `${guardianData.firstName} ${guardianData.middleName} ${guardianData.lastName}`
            : `${guardianData.firstName} ${guardianData.lastName}`;

          if (guardianData.createUserAccount) {
            // Guardian with user account - create as parent
            // Check if guardian user already exists
            const existingGuardianUser = await tx.user.findFirst({
              where: {
                email: guardianData.email,
                deletedAt: null,
              },
            });

            let guardianUser;
            let guardianPassword = '';

            if (existingGuardianUser) {
              // Find existing parent profile
              const existingGuardian = await tx.parent.findFirst({
                where: {
                  userId: existingGuardianUser.id,
                  deletedAt: null,
                },
              });

              if (existingGuardian) {
                // Link existing guardian to student
                await tx.parentStudentLink.create({
                  data: {
                    parentId: existingGuardian.id,
                    studentId: newStudent.id,
                    relationship: guardianData.relation,
                    isPrimary: false,
                  },
                });
                continue;
              }
              guardianUser = existingGuardianUser;
            } else {
              // Create new guardian user
              guardianPassword = generateRandomPassword();
              const guardianPasswordHash = await hashPassword(guardianPassword);

              guardianUser = await tx.user.create({
                data: {
                  email: guardianData.email,
                  phone: guardianData.phone,
                  fullName: guardianFullName,
                  passwordHash: guardianPasswordHash,
                  createdById: createdBy,
                  roles: {
                    create: { role: { connect: { name: 'PARENT' } } },
                  },
                  needPasswordChange: true,
                },
              });

              parentCredentials.push({
                id: guardianUser.id,
                fullName: guardianFullName,
                email: guardianData.email,
                relationship: guardianData.relation,
                temporaryPassword: guardianPassword,
              });
            }

            // Create guardian profile (as parent)
            const newGuardian = await tx.parent.create({
              data: {
                userId: guardianUser.id,
                occupation: guardianData.occupation,
                // Copy address from student for consistency
                street: personal?.street,
                city: personal?.city,
                state: personal?.state,
                pinCode: personal?.pinCode,
                createdById: createdBy,
                profile: {
                  create: {
                    additionalData: {
                      relationship: guardianData.relation,
                      isPrimary: false,
                      isGuardian: true, // Mark as guardian
                    },
                  },
                },
              },
            });

            // Link guardian to student
            await tx.parentStudentLink.create({
              data: {
                parentId: newGuardian.id,
                studentId: newStudent.id,
                relationship: guardianData.relation,
                isPrimary: false,
              },
            });
          } else {
            // Guardian without user account - create basic guardian record
            await tx.guardian.create({
              data: {
                studentId: newStudent.id,
                fullName: guardianFullName,
                phone: guardianData.phone,
                email: guardianData.email,
                relation: guardianData.relation,
              },
            });
          }
        }
      }

      // Link existing parents if specified

      if (existingParents && existingParents.length > 0) {
        for (const existingParentData of existingParents) {
          // Verify the parent exists and is active
          const parentExists = await tx.parent.findFirst({
            where: {
              id: existingParentData.parentId,
              deletedAt: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  deletedAt: true,
                },
              },
            },
          });

          if (!parentExists || parentExists.user.deletedAt !== null) {
            throw new BadRequestException(
              `Parent with ID ${existingParentData.parentId} not found or is inactive`,
            );
          }

          // Check if this parent is already linked to this student
          const existingLink = await tx.parentStudentLink.findFirst({
            where: {
              parentId: existingParentData.parentId,
              studentId: newStudent.id,
            },
          });

          if (existingLink) {
            // Update relationship if different
            if (existingLink.relationship !== existingParentData.relationship) {
              await tx.parentStudentLink.update({
                where: { id: existingLink.id },
                data: {
                  relationship: existingParentData.relationship,
                  isPrimary: existingParentData.isPrimary || false,
                },
              });
            }
          } else {
            // Create new link
            await tx.parentStudentLink.create({
              data: {
                parentId: existingParentData.parentId,
                studentId: newStudent.id,
                relationship: existingParentData.relationship,
                isPrimary: existingParentData.isPrimary || false,
              },
            });
          }
        }

        // Update student record with linked parent information
        const studentUpdateData: any = {};

        // Get all linked parents with their details
        const linkedParents = await tx.parentStudentLink.findMany({
          where: {
            studentId: newStudent.id,
          },
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        });

        // Populate student fields based on relationship
        for (const link of linkedParents) {
          const parent = link.parent;
          const relationship = link.relationship;

          // Extract first, middle, and last names from fullName
          const nameParts = parent.user.fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts[nameParts.length - 1] || '';
          const middleName =
            nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

          if (relationship === 'father') {
            studentUpdateData.fatherFirstName = firstName;
            studentUpdateData.fatherMiddleName = middleName;
            studentUpdateData.fatherLastName = lastName;
            studentUpdateData.fatherEmail = parent.user.email;
            studentUpdateData.fatherPhone = parent.user.phone;
            studentUpdateData.fatherOccupation = parent.occupation;
          } else if (relationship === 'mother') {
            studentUpdateData.motherFirstName = firstName;
            studentUpdateData.motherMiddleName = middleName;
            studentUpdateData.motherLastName = lastName;
            studentUpdateData.motherEmail = parent.user.email;
            studentUpdateData.motherPhone = parent.user.phone;
            studentUpdateData.motherOccupation = parent.occupation;
          }
        }

        // Update student record with parent information
        if (Object.keys(studentUpdateData).length > 0) {
          await tx.student.update({
            where: { id: newStudent.id },
            data: studentUpdateData,
          });
        }
      }

      // Update class enrollment count
      await tx.class.update({
        where: { id: academic.classId },
        data: {
          currentEnrollment: {
            increment: 1,
          },
        },
      });

      // Fetch the created student with profile relation
      const createdStudentWithProfile = await tx.student.findUnique({
        where: { id: newStudent.id },
        include: {
          profile: true,
          user: true,
        },
      });

      return {
        student: createdStudentWithProfile!,
        studentUser: newUser,
        parentCredentials,
      };
    });

    await this.auditService.record({
      userId: createdBy,
      action: 'CREATE_STUDENT',
      module: 'student',
      status: 'SUCCESS',
      details: {
        studentId: result.student.id,
        userId: result.studentUser.id,
        hasProfilePicture: !!profilePicture,
        parentsCreated: result.parentCredentials.length,
        guardiansCreated: guardians?.length || 0,
      },
      ipAddress: ip,
      userAgent,
    });

    return {
      student: {
        id: result.student.id,
        fullName: result.studentUser.fullName,
        email: result.studentUser.email,
        phone: result.studentUser.phone,
        rollNumber: result.student.rollNumber,
        studentId: result.student.studentId,
        profilePhotoUrl: result.student.profile?.profilePhotoUrl || null,
      },
      temporaryPassword: user.password ? undefined : rawPassword,
      parentCredentials: result.parentCredentials,
    };
  }

  async findAll(options: GetAllStudentsDtoType) {
    const {
      limit,
      page,
      search,
      classId,
      ethnicity,
      academicStatus,
      feeStatus,
      sortBy,
      sortOrder,
    } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (classId) {
      where.classId = classId;
    }

    if (ethnicity) {
      where.ethnicity = ethnicity;
    }

    if (academicStatus) {
      where.academicStatus = academicStatus;
    }

    if (feeStatus) {
      where.feeStatus = feeStatus;
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.user = { fullName: sortOrder };
        break;
      case 'rollNumber':
        orderBy.rollNumber = sortOrder;
        break;
      case 'admissionDate':
        orderBy.admissionDate = sortOrder;
        break;
      default:
        orderBy.createdAt = sortOrder;
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
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
          class: {
            select: {
              id: true,
              grade: true,
              section: true,
            },
          },
          profile: {
            select: {
              profilePhotoUrl: true,
              emergencyContact: true,
              interests: true,
              additionalData: true,
            },
          },
          parents: {
            include: {
              parent: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          guardians: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.student.count({ where }),
    ]);

    // Transform to match StudentListResponse interface
    return {
      data: students.map(student => ({
        id: student.id,
        fullName: student.user?.fullName || student.email,
        email: student.user?.email || student.email,
        phone: student.user?.phone || student.phone,
        rollNumber: student.rollNumber,
        studentId: student.studentId,
        className: `Grade ${student.class?.grade || 'Unknown'} ${student.class?.section || 'A'}`,
        admissionDate: student.admissionDate.toISOString(),
        academicStatus: student.academicStatus,
        feeStatus: student.feeStatus,
        profilePhotoUrl: student.profile?.profilePhotoUrl,
        isActive: student.user?.isActive || true,
        createdAt: student.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        class: true,
        profile: true,
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
                profile: true, // Include profile to access additionalData
              },
            },
          },
        },
        guardians: true,
      },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    // Extract additional data from profile
    const additionalData = (student.profile as any)?.additionalData || {};

    // Extract first, middle, and last name from fullName
    const nameParts = student.user.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName =
      nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middleName =
      nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    // Return student data with extracted fields
    return {
      ...student,
      // Map dob to dateOfBirth for frontend compatibility
      dateOfBirth: student.dob ? student.dob.toISOString() : undefined,

      // Include extracted name parts
      firstName,
      middleName,
      lastName,

      // Class information
      className: `Grade ${student.class.grade} ${student.class.section || 'A'}`,

      // Parent names (separate fields)
      fatherFirstName: student.fatherFirstName,
      fatherMiddleName: student.fatherMiddleName,
      fatherLastName: student.fatherLastName,
      motherFirstName: student.motherFirstName,
      motherMiddleName: student.motherMiddleName,
      motherLastName: student.motherLastName,

      // Parent information
      parents: student.parents.map(link => ({
        id: link.parent.id,
        fullName: link.parent.user.fullName,
        email: link.parent.user.email,
        phone: link.parent.user.phone,
        relationship: link.relationship,
        isPrimary: link.isPrimary,
      })),

      // Guardian information (includes both non-user guardians and guardian-parents)
      guardians: [
        // Non-user account guardians (from Guardian table)
        ...student.guardians.map(guardian => ({
          id: guardian.id,
          fullName: guardian.fullName,
          phone: guardian.phone,
          email: guardian.email,
          relation: guardian.relation,
          hasUserAccount: false,
        })),
        // Guardian-parents (parents with isGuardian flag - these have user accounts)
        ...student.parents
          .filter(link => {
            const additionalData =
              (link.parent.profile as any)?.additionalData || {};
            return additionalData.isGuardian === true;
          })
          .map(link => ({
            id: link.parent.id,
            fullName: link.parent.user.fullName,
            phone: link.parent.user.phone || '',
            email: link.parent.user.email,
            relation: link.relationship,
            hasUserAccount: true,
          })),
      ],

      // Additional data from profile
      bio: additionalData.bio,
      emergencyContact: student.profile?.emergencyContact,
      interests:
        typeof student.profile?.interests === 'object' &&
        student.profile?.interests
          ? (student.profile.interests as any)?.interests || ''
          : student.profile?.interests || '',
    };
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: true,
        class: true,
        profile: true,
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        guardians: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    return student;
  }

  async getStudentCount(): Promise<number> {
    return this.prisma.student.count({
      where: { deletedAt: null },
    });
  }

  async getStudentStats() {
    const [
      totalStudents,
      activeStudents,
      suspendedStudents,
      warningStudents,
      graduatedStudents,
      transferredStudents,
    ] = await Promise.all([
      this.prisma.student.count({
        where: { deletedAt: null },
      }),
      this.prisma.student.count({
        where: { deletedAt: null, academicStatus: 'active' },
      }),
      this.prisma.student.count({
        where: { deletedAt: null, academicStatus: 'suspended' },
      }),
      this.prisma.student.count({
        where: { deletedAt: null, academicStatus: 'warning' },
      }),
      this.prisma.student.count({
        where: { deletedAt: null, academicStatus: 'graduated' },
      }),
      this.prisma.student.count({
        where: { deletedAt: null, academicStatus: 'transferred' },
      }),
    ]);

    return {
      total: totalStudents,
      active: activeStudents,
      suspended: suspendedStudents,
      warning: warningStudents,
      graduated: graduatedStudents,
      transferred: transferredStudents,
    };
  }

  async updateByAdmin(
    id: string,
    dto: UpdateStudentByAdminDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student || student.deletedAt)
      throw new NotFoundException('Student not found');

    // Initialize student update data
    const studentUpdateData: any = {};

    // Update user information
    if (dto.user) {
      const userUpdateData: any = {};

      if (
        dto.user.firstName !== undefined ||
        dto.user.middleName !== undefined ||
        dto.user.lastName !== undefined
      ) {
        const firstName = dto.user.firstName || '';
        const middleName = dto.user.middleName || '';
        const lastName = dto.user.lastName || '';

        userUpdateData.fullName = middleName
          ? `${firstName} ${middleName} ${lastName}`.trim()
          : `${firstName} ${lastName}`.trim();
      }

      if (dto.user.email !== undefined) userUpdateData.email = dto.user.email;
      if (dto.user.phone !== undefined) userUpdateData.phone = dto.user.phone;

      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date();
        await this.prisma.user.update({
          where: { id: student.userId },
          data: userUpdateData,
        });
      }

      // Also update the phone in the student table for consistency
      if (dto.user.phone !== undefined) {
        studentUpdateData.phone = dto.user.phone;
      }
    }

    // Update student fields

    if (dto.personal) {
      if (dto.personal.dateOfBirth !== undefined)
        studentUpdateData.dateOfBirth = dto.personal.dateOfBirth
          ? new Date(dto.personal.dateOfBirth)
          : null;
      if (dto.personal.gender !== undefined)
        studentUpdateData.gender = dto.personal.gender;
      if (dto.personal.bloodGroup !== undefined)
        studentUpdateData.bloodGroup = dto.personal.bloodGroup;
      if (dto.personal.ethnicity !== undefined)
        studentUpdateData.ethnicity = dto.personal.ethnicity;
      if (dto.personal.motherTongue !== undefined)
        studentUpdateData.motherTongue = dto.personal.motherTongue;
      if (dto.personal.disabilityType !== undefined)
        studentUpdateData.disabilityType = dto.personal.disabilityType;
      if (dto.personal.address !== undefined)
        studentUpdateData.address = dto.personal.address;
      if (dto.personal.street !== undefined)
        studentUpdateData.street = dto.personal.street;
      if (dto.personal.city !== undefined)
        studentUpdateData.city = dto.personal.city;
      if (dto.personal.state !== undefined)
        studentUpdateData.state = dto.personal.state;
      if (dto.personal.pinCode !== undefined)
        studentUpdateData.pinCode = dto.personal.pinCode;
      if (dto.personal.maritalStatus !== undefined)
        studentUpdateData.maritalStatus = dto.personal.maritalStatus;
    }

    if (dto.academic) {
      if (dto.academic.classId !== undefined)
        studentUpdateData.classId = dto.academic.classId;
      if (dto.academic.rollNumber !== undefined)
        studentUpdateData.rollNumber = dto.academic.rollNumber;
      if (dto.academic.admissionDate !== undefined)
        studentUpdateData.admissionDate = dto.academic.admissionDate
          ? new Date(dto.academic.admissionDate)
          : null;
      if (dto.academic.studentId !== undefined)
        studentUpdateData.studentId = dto.academic.studentId;
      if (dto.academic.academicStatus !== undefined)
        studentUpdateData.academicStatus = dto.academic.academicStatus;
      if (dto.academic.feeStatus !== undefined)
        studentUpdateData.feeStatus = dto.academic.feeStatus;
      if (dto.academic.transportMode !== undefined)
        studentUpdateData.transportMode = dto.academic.transportMode;
    }

    if (dto.parentInfo) {
      // Update parent name fields directly
      if (dto.parentInfo.fatherFirstName !== undefined)
        studentUpdateData.fatherFirstName = dto.parentInfo.fatherFirstName;
      if (dto.parentInfo.fatherMiddleName !== undefined)
        studentUpdateData.fatherMiddleName = dto.parentInfo.fatherMiddleName;
      if (dto.parentInfo.fatherLastName !== undefined)
        studentUpdateData.fatherLastName = dto.parentInfo.fatherLastName;
      if (dto.parentInfo.motherFirstName !== undefined)
        studentUpdateData.motherFirstName = dto.parentInfo.motherFirstName;
      if (dto.parentInfo.motherMiddleName !== undefined)
        studentUpdateData.motherMiddleName = dto.parentInfo.motherMiddleName;
      if (dto.parentInfo.motherLastName !== undefined)
        studentUpdateData.motherLastName = dto.parentInfo.motherLastName;
      if (dto.parentInfo.fatherPhone !== undefined)
        studentUpdateData.fatherPhone = dto.parentInfo.fatherPhone;
      if (dto.parentInfo.motherPhone !== undefined)
        studentUpdateData.motherPhone = dto.parentInfo.motherPhone;
      if (dto.parentInfo.fatherEmail !== undefined)
        studentUpdateData.fatherEmail = dto.parentInfo.fatherEmail;
      if (dto.parentInfo.motherEmail !== undefined)
        studentUpdateData.motherEmail = dto.parentInfo.motherEmail;
      if (dto.parentInfo.fatherOccupation !== undefined)
        studentUpdateData.fatherOccupation = dto.parentInfo.fatherOccupation;
      if (dto.parentInfo.motherOccupation !== undefined)
        studentUpdateData.motherOccupation = dto.parentInfo.motherOccupation;
    }

    if (dto.additional) {
      if (dto.additional.medicalConditions !== undefined)
        studentUpdateData.medicalConditions = dto.additional.medicalConditions;
      if (dto.additional.allergies !== undefined)
        studentUpdateData.allergies = dto.additional.allergies;
      if (dto.additional.interests !== undefined)
        studentUpdateData.interests = dto.additional.interests;
      if (dto.additional.specialNeeds !== undefined)
        studentUpdateData.specialNeeds = dto.additional.specialNeeds;
    }

    if (Object.keys(studentUpdateData).length > 0) {
      studentUpdateData.updatedById = updatedBy;
      studentUpdateData.updatedAt = new Date();

      await this.prisma.student.update({
        where: { id },
        data: studentUpdateData,
      });
    }

    // Update student profile
    if (
      dto.additional &&
      (dto.additional.bio || dto.additional.emergencyContact)
    ) {
      await this.prisma.studentProfile.update({
        where: { studentId: student.id },
        data: {
          additionalData: {
            ...((
              (await this.prisma.studentProfile.findUnique({
                where: { studentId: id },
                select: { additionalData: true },
              })) as any
            )?.additionalData || {}),
            bio: dto.additional.bio,
          },
          emergencyContact: dto.additional.emergencyContact || {},
          updatedAt: new Date(),
        },
      });
    }

    await this.auditService.record({
      userId: updatedBy,
      action: 'UPDATE_STUDENT',
      module: 'student',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Student updated successfully', id };
  }

  async updateSelf(
    userId: string,
    dto: UpdateStudentSelfDtoType,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!student) throw new NotFoundException('Student not found');

    // Update user information
    if (dto.user) {
      const fullName =
        dto.user.firstName && dto.user.lastName
          ? dto.user.middleName
            ? `${dto.user.firstName} ${dto.user.middleName} ${dto.user.lastName}`
            : `${dto.user.firstName} ${dto.user.lastName}`
          : undefined;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName,
          phone: dto.user.phone,
          updatedAt: new Date(),
        },
      });

      // Also update phone in student table for consistency
      if (dto.user.phone !== undefined) {
        await this.prisma.student.update({
          where: { id: student.id },
          data: {
            phone: dto.user.phone,
            updatedAt: new Date(),
          },
        });
      }
    }

    // Update student address and personal info
    if (dto.personal) {
      await this.prisma.student.update({
        where: { id: student.id },
        data: {
          ethnicity: dto.personal.ethnicity,
          motherTongue: dto.personal.motherTongue,
          disabilityType: dto.personal.disabilityType,
          address: dto.personal.address,
          street: dto.personal.street,
          city: dto.personal.city,
          state: dto.personal.state,
          pinCode: dto.personal.pinCode,
          updatedAt: new Date(),
        },
      });
    }

    // Update student profile
    if (dto.additional && (dto.additional.bio || dto.additional.interests)) {
      await this.prisma.studentProfile.update({
        where: { studentId: student.id },
        data: {
          additionalData: {
            ...((
              (await this.prisma.studentProfile.findUnique({
                where: { studentId: student.id },
                select: { additionalData: true },
              })) as any
            )?.additionalData || {}),
            bio: dto.additional.bio,
          },
          interests: dto.additional.interests
            ? { interests: dto.additional.interests }
            : {},
          updatedAt: new Date(),
        },
      });
    }

    await this.auditService.record({
      userId,
      action: 'UPDATE_SELF_STUDENT',
      module: 'student',
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
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!student || student.deletedAt)
      throw new NotFoundException('Student not found or already deleted');

    await this.prisma.$transaction(async tx => {
      // Update student record
      await tx.student.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: deletedBy,
          // Nullify unique fields to avoid conflicts when creating new students
          rollNumber: `deleted_${id}_${Date.now()}`,
          studentId: student.studentId ? `deleted_${id}_${Date.now()}` : null,
        },
      });

      // Update user record
      await tx.user.update({
        where: { id: student.userId },
        data: {
          deletedAt: new Date(),
          deletedById: deletedBy,
          isActive: false,
          // Nullify unique fields to avoid conflicts when creating new users
          email: `deleted_${student.userId}_${Date.now()}@deleted.local`,
          phone: student.user.phone
            ? `deleted_${student.userId}_${Date.now()}`
            : null,
        },
      });

      // Update class enrollment count
      await tx.class.update({
        where: { id: student.classId },
        data: {
          currentEnrollment: {
            decrement: 1,
          },
        },
      });

      // Revoke user sessions
      await tx.userSession.updateMany({
        where: { userId: student.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await this.auditService.record({
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

  async getParents(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
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
    if (!student || student.deletedAt)
      throw new NotFoundException('Student not found');

    return student.parents.map(link => ({
      id: link.parent.id,
      fullName: link.parent.user.fullName,
      email: link.parent.user.email,
      phone: link.parent.user.phone,
      relationship: link.relationship,
      isPrimary: link.isPrimary,
    }));
  }

  async getGuardians(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        guardians: true,
      },
    });
    if (!student || student.deletedAt)
      throw new NotFoundException('Student not found');

    return student.guardians;
  }

  async addGuardiansToStudent(
    studentId: string,
    guardians: any[],
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    try {
      // Check if student exists
      const student = await this.prisma.student.findFirst({
        where: { id: studentId, deletedAt: null },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      const guardianCredentials: Record<string, unknown>[] = [];

      await this.prisma.$transaction(async tx => {
        for (const guardianData of guardians) {
          this.logger.log(
            '🛡️ Processing guardian for existing student:',
            guardianData.firstName,
            guardianData.lastName,
            'createUserAccount:',
            guardianData.createUserAccount,
          );

          // Build full name from first, middle, last
          const guardianFullName = guardianData.middleName
            ? `${guardianData.firstName} ${guardianData.middleName} ${guardianData.lastName}`
            : `${guardianData.firstName} ${guardianData.lastName}`;

          if (guardianData.createUserAccount) {
            // Guardian with user account - create as parent
            // Check if guardian user already exists
            const existingGuardianUser = await tx.user.findFirst({
              where: {
                email: guardianData.email,
                deletedAt: null,
              },
            });

            let guardianUser;
            let guardianPassword = '';

            if (existingGuardianUser) {
              // Find existing parent profile
              const existingGuardian = await tx.parent.findFirst({
                where: {
                  userId: existingGuardianUser.id,
                  deletedAt: null,
                },
              });

              if (existingGuardian) {
                // Link existing guardian to student
                await tx.parentStudentLink.create({
                  data: {
                    parentId: existingGuardian.id,
                    studentId: student.id,
                    relationship: guardianData.relation,
                    isPrimary: false,
                  },
                });
                continue;
              }
              guardianUser = existingGuardianUser;
            } else {
              // Create new guardian user
              guardianPassword = generateRandomPassword();
              const guardianPasswordHash = await hashPassword(guardianPassword);

              guardianUser = await tx.user.create({
                data: {
                  email: guardianData.email,
                  phone: guardianData.phone,
                  fullName: guardianFullName,
                  passwordHash: guardianPasswordHash,
                  createdById: createdBy,
                  roles: {
                    create: { role: { connect: { name: 'PARENT' } } },
                  },
                  needPasswordChange: true,
                },
              });

              guardianCredentials.push({
                id: guardianUser.id,
                fullName: guardianFullName,
                email: guardianData.email,
                relationship: guardianData.relation,
                temporaryPassword: guardianPassword,
              });
            }

            // Create guardian profile (as parent)
            const newGuardian = await tx.parent.create({
              data: {
                userId: guardianUser.id,
                occupation: guardianData.occupation,
                // Get student address for consistency
                street: student.street,
                city: student.city,
                state: student.state,
                pinCode: student.pinCode,
                createdById: createdBy,
                profile: {
                  create: {
                    additionalData: {
                      relationship: guardianData.relation,
                      isPrimary: false,
                      isGuardian: true, // Mark as guardian
                    },
                  },
                },
              },
            });

            // Link guardian to student
            await tx.parentStudentLink.create({
              data: {
                parentId: newGuardian.id,
                studentId: student.id,
                relationship: guardianData.relation,
                isPrimary: false,
              },
            });
          } else {
            // Guardian without user account - create basic guardian record
            await tx.guardian.create({
              data: {
                studentId: student.id,
                fullName: guardianFullName,
                phone: guardianData.phone,
                email: guardianData.email,
                relation: guardianData.relation,
              },
            });
          }
        }
      });

      // Log the action
      await this.auditService.record({
        userId: createdBy,
        action: 'ADD_GUARDIANS',
        module: 'student',
        status: 'SUCCESS',
        details: {
          studentId: studentId,
          guardiansAdded: guardians.length,
        },
        ipAddress: ip,
        userAgent,
      });

      return {
        success: true,
        data: {
          message: 'Guardians added successfully',
          guardianCredentials:
            guardianCredentials.length > 0 ? guardianCredentials : undefined,
        },
      };
    } catch (error) {
      this.logger.error('Failed to add guardians to student', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add guardians');
    }
  }

  async updateGuardian(
    studentId: string,
    guardianId: string,
    guardianData: any,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    try {
      // Check if student exists
      const student = await this.prisma.student.findFirst({
        where: { id: studentId, deletedAt: null },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      await this.prisma.$transaction(async tx => {
        // Check if it's a guardian from Guardian table (no user account)
        const basicGuardian = await tx.guardian.findFirst({
          where: { id: guardianId, studentId },
        });

        if (basicGuardian) {
          // Update basic guardian (no user account)
          await tx.guardian.update({
            where: { id: guardianId },
            data: {
              fullName: guardianData.fullName,
              phone: guardianData.phone,
              email: guardianData.email,
              relation: guardianData.relation,
            },
          });
        } else {
          // Check if it's a guardian-parent (has user account)
          const guardianParent = await tx.parent.findFirst({
            where: {
              id: guardianId,
              profile: {
                additionalData: {
                  path: ['isGuardian'],
                  equals: true,
                },
              },
            },
            include: { user: true },
          });

          if (guardianParent) {
            // Update guardian-parent user info
            await tx.user.update({
              where: { id: guardianParent.userId },
              data: {
                fullName: guardianData.fullName,
                phone: guardianData.phone,
                email: guardianData.email,
              },
            });

            // Update parent occupation
            await tx.parent.update({
              where: { id: guardianId },
              data: {
                occupation: guardianData.occupation,
              },
            });

            // Update parent-student link relationship
            await tx.parentStudentLink.updateMany({
              where: {
                parentId: guardianId,
                studentId: studentId,
              },
              data: {
                relationship: guardianData.relation,
              },
            });
          } else {
            throw new NotFoundException('Guardian not found');
          }
        }
      });

      // Log the action
      await this.auditService.record({
        userId: updatedBy,
        action: 'UPDATE_GUARDIAN',
        module: 'student',
        status: 'SUCCESS',
        details: {
          studentId: studentId,
          guardianId: guardianId,
        },
        ipAddress: ip,
        userAgent,
      });

      return {
        success: true,
        data: {
          message: 'Guardian updated successfully',
        },
      };
    } catch (error) {
      this.logger.error('Failed to update guardian', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update guardian');
    }
  }

  async cleanupDuplicateGuardians(studentId: string) {
    try {
      await this.prisma.$transaction(async tx => {
        // Get all guardians from Guardian table for this student
        const basicGuardians = await tx.guardian.findMany({
          where: { studentId },
        });

        // Get all guardian-parents for this student
        const guardianParents = await tx.parentStudentLink.findMany({
          where: {
            studentId,
            parent: {
              profile: {
                additionalData: {
                  path: ['isGuardian'],
                  equals: true,
                },
              },
            },
          },
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        });

        // Remove basic guardian records that have matching guardian-parent records
        for (const basicGuardian of basicGuardians) {
          const matchingGuardianParent = guardianParents.find(
            gp => gp.parent.user.email === basicGuardian.email,
          );

          if (matchingGuardianParent) {
            this.logger.log(
              '🧹 Removing duplicate guardian record for:',
              basicGuardian.email,
            );
            await tx.guardian.delete({
              where: { id: basicGuardian.id },
            });
          }
        }
      });

      return {
        success: true,
        data: {
          message: 'Duplicate guardians cleaned up successfully',
        },
      };
    } catch (error) {
      this.logger.error('Failed to cleanup duplicate guardians', error);
      throw new InternalServerErrorException(
        'Failed to cleanup duplicate guardians',
      );
    }
  }

  async getAvailableClasses() {
    const classes = await this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
        room: {
          select: {
            roomNo: true,
          },
        },
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });

    return classes.map(classItem => ({
      id: classItem.id,
      name: `Grade ${classItem.grade} ${classItem.section}`,
      grade: classItem.grade,
      section: classItem.section,
      capacity: classItem.capacity,
      currentStudents: classItem._count.students,
      availableSpots: classItem.capacity - classItem._count.students,
      isFull: classItem._count.students >= classItem.capacity,
      roomNo: classItem.room?.roomNo || 'Not Assigned',
    }));
  }
}
