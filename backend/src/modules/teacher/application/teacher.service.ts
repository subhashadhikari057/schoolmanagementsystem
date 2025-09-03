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
import { TeacherSalaryService } from './teacher-salary.service';

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly salaryService: TeacherSalaryService,
  ) {}

  async create(
    dto: CreateTeacherDtoType,
    createdBy: string,
    profilePicture?: Express.Multer.File,
    ip?: string,
    userAgent?: string,
  ) {
    const {
      user,
      personal,
      professional,
      subjects,
      salary,
      additional,
      bankDetails,
    } = dto;

    // Check for existing email (exclude soft-deleted users)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: user.email,
        deletedAt: null, // Only check active (non-soft-deleted) users
      },
    });
    if (existingUser)
      throw new ConflictException('User with this email already exists');

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

    // Check for existing phone (exclude soft-deleted users)
    if (user.phone) {
      const existingUserPhone = await this.prisma.user.findFirst({
        where: {
          phone: user.phone,
          deletedAt: null, // Only check active (non-soft-deleted) users
        },
      });
      if (existingUserPhone)
        throw new ConflictException(
          'User with this phone number already exists',
        );

      // Clean up any legacy soft-deleted users with the same phone (defensive programming)
      await this.prisma.user.updateMany({
        where: {
          phone: user.phone,
          deletedAt: { not: null }, // Only soft-deleted users
        },
        data: {
          phone: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        },
      });
    }

    // Check for existing employee ID or generate a new one
    if (professional.employeeId) {
      const existingEmployee = await this.prisma.teacher.findFirst({
        where: {
          employeeId: professional.employeeId,
          deletedAt: null, // Only check active (non-soft-deleted) teachers
        },
      });
      if (existingEmployee)
        throw new ConflictException('Employee ID already exists');

      // Clean up any legacy soft-deleted teachers with the same employee ID (defensive programming)
      await this.prisma.teacher.updateMany({
        where: {
          employeeId: professional.employeeId,
          deletedAt: { not: null }, // Only soft-deleted teachers
        },
        data: {
          employeeId: `legacy_deleted_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        },
      });
    } else {
      // Generate a new employee ID if not provided
      const currentYear = new Date().getFullYear();
      const teacherCount = await this.prisma.teacher.count({
        where: { deletedAt: null }, // Only count active (non-soft-deleted) teachers
      });
      professional.employeeId = `T-${currentYear}-${(teacherCount + 1).toString().padStart(4, '0')}`;
    }

    const rawPassword = user.password || generateRandomPassword();
    const passwordHash = await hashPassword(rawPassword);
    // Include middle name in full name if provided
    const fullName = user.middleName
      ? `${user.firstName} ${user.middleName} ${user.lastName}`
      : `${user.firstName} ${user.lastName}`;

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
            employmentDate: professional.joiningDate
              ? new Date(professional.joiningDate)
              : new Date(),
            experienceYears: professional.experienceYears,

            // Personal Information
            dob: personal?.dateOfBirth
              ? new Date(personal.dateOfBirth)
              : new Date(),
            dateOfBirth: personal?.dateOfBirth
              ? new Date(personal.dateOfBirth)
              : new Date(),
            gender: personal?.gender || 'Not Specified',
            joiningDate: professional.joiningDate
              ? new Date(professional.joiningDate)
              : new Date(),
            bloodGroup: personal?.bloodGroup,
            address: personal?.address,
            maritalStatus: personal?.maritalStatus,

            // Salary Information
            basicSalary: salary?.basicSalary || 0,
            allowances: salary?.allowances || 0,
            totalSalary: (salary?.basicSalary || 0) + (salary?.allowances || 0),

            // Bank Details (direct fields)
            bankName: bankDetails?.bankName,
            bankAccountNumber: bankDetails?.bankAccountNumber,
            bankBranch: bankDetails?.bankBranch,
            panNumber: bankDetails?.panNumber,
            citizenshipNumber: bankDetails?.citizenshipNumber,

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
                additionalData: {
                  // Store structured address fields
                  street: personal?.street,
                  city: personal?.city,
                  state: personal?.state,
                  pinCode: personal?.pinCode,
                  // Store bank details
                  bankDetails: bankDetails
                    ? {
                        bankName: bankDetails.bankName,
                        bankAccountNumber: bankDetails.bankAccountNumber,
                        bankBranch: bankDetails.bankBranch,
                        panNumber: bankDetails.panNumber,
                        citizenshipNumber: bankDetails.citizenshipNumber,
                      }
                    : undefined,
                },
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

        // Create initial salary history record
        const joiningDate = professional.joiningDate
          ? new Date(professional.joiningDate)
          : new Date();
        const effectiveMonth = new Date(
          joiningDate.getFullYear(),
          joiningDate.getMonth(),
          1,
        );

        await tx.teacherSalaryHistory.create({
          data: {
            teacherId: newTeacher.id,
            effectiveMonth,
            basicSalary: salary?.basicSalary || 0,
            allowances: salary?.allowances || 0,
            totalSalary: (salary?.basicSalary || 0) + (salary?.allowances || 0),
            changeType: 'INITIAL',
            createdById: createdBy,
          },
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match TeacherListResponse interface
    return teachers.map(teacher => {
      // Extract structured address and bank details from additionalData
      // Use type assertion to access additionalData since it's defined in the schema but not in the TS type
      const additionalData = (teacher.profile as any)?.additionalData || {};
      const bankDetails = additionalData.bankDetails || {};

      return {
        id: teacher.id,
        userId: teacher.user.id, // Add the user ID for assignment purposes
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
        maritalStatus: teacher.maritalStatus,
        address: teacher.address,

        // Structured address fields
        street: additionalData.street,
        city: additionalData.city,
        state: additionalData.state,
        pinCode: additionalData.pinCode,

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

        // Bank and Legal Information
        bankName: bankDetails.bankName,
        bankAccountNumber: bankDetails.accountNumber,
        bankBranch: bankDetails.branch,
        panNumber: bankDetails.panNumber,
        citizenshipNumber: bankDetails.citizenshipNumber,

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
          className: `Grade ${ca.class.grade} Section ${ca.class.section}`,
          section: ca.class.section,
        })),
      };
    });
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

    // Extract additionalData from profile
    const additionalData = (teacher.profile as any)?.additionalData || {};
    const bankDetails = additionalData.bankDetails || {};

    // Extract first, middle, and last name from fullName
    const nameParts = teacher.user.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName =
      nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middleName =
      nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    // Return teacher data with extracted fields
    return {
      ...teacher,
      // Include extracted name parts
      firstName,
      middleName,
      lastName,

      // Extract structured address fields from additionalData
      street: additionalData.street,
      city: additionalData.city,
      state: additionalData.state,
      province: additionalData.province || additionalData.state,
      pinCode: additionalData.pinCode,

      // Extract bank details
      bankName: bankDetails.bankName,
      bankAccountNumber: bankDetails.bankAccountNumber,
      bankBranch: bankDetails.bankBranch,
      panNumber: bankDetails.panNumber,
      citizenshipNumber: bankDetails.citizenshipNumber,

      assignedClasses: teacher.classAssignments,
    };
  }

  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: true,
        profile: true,
        subjectAssignments: {
          include: {
            subject: true,
          },
        },
        classAssignments: {
          where: { deletedAt: null },
          include: {
            class: true,
          },
        },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Get classes where this teacher is the class teacher
    const classTeacherClasses = await this.prisma.class.findMany({
      where: {
        classTeacherId: teacher.id,
        deletedAt: null,
      },
    });

    // Merge class teacher classes with explicit assignments
    const assignedClassIds = teacher.classAssignments.map(
      assignment => assignment.classId,
    );

    // Add class teacher classes that aren't already explicitly assigned
    const additionalClassAssignments = classTeacherClasses
      .filter(cls => !assignedClassIds.includes(cls.id))
      .map(cls => ({
        id: `class-teacher-${cls.id}`, // Unique ID for class teacher relationship
        teacherId: teacher.id,
        classId: cls.id,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
        deletedAt: null,
        createdById: cls.createdById,
        updatedById: cls.updatedById,
        deletedById: cls.deletedById,
        class: cls,
      }));

    // Merge both types of class assignments
    const allClassAssignments = [
      ...teacher.classAssignments,
      ...additionalClassAssignments,
    ];

    return {
      ...teacher,
      classAssignments: allClassAssignments,
    };
  }

  async getTeacherCount(): Promise<number> {
    return this.prisma.teacher.count({
      where: { deletedAt: null },
    });
  }

  // Helper method to get teacher profile additionalData
  private async getTeacherProfileAdditionalData(
    teacherId: string,
  ): Promise<any> {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { teacherId },
      select: { additionalData: true },
    });
    return (profile as any)?.additionalData || {};
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
      // Include middle name in full name if provided
      const fullName =
        dto.user.firstName && dto.user.lastName
          ? dto.user.middleName
            ? `${dto.user.firstName} ${dto.user.middleName} ${dto.user.lastName}`
            : `${dto.user.firstName} ${dto.user.lastName}`
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

    if (dto.professional) {
      // Handle both qualification field names
      const qualification =
        dto.professional.highestQualification || dto.professional.qualification;

      if (qualification) teacherUpdateData.qualification = qualification;
      if (dto.professional.designation)
        teacherUpdateData.designation = dto.professional.designation;
      if (dto.professional.department)
        teacherUpdateData.department = dto.professional.department;
      if (dto.professional.specialization)
        teacherUpdateData.specialization = dto.professional.specialization;
      if (dto.professional.experienceYears !== undefined)
        teacherUpdateData.experienceYears = dto.professional.experienceYears;
      if (dto.professional.employeeId)
        teacherUpdateData.employeeId = dto.professional.employeeId;
      if (dto.professional.joiningDate) {
        teacherUpdateData.employmentDate = new Date(
          dto.professional.joiningDate,
        );
        teacherUpdateData.joiningDate = new Date(dto.professional.joiningDate);
      }
    }

    if (dto.personal) {
      if (dto.personal.dateOfBirth)
        teacherUpdateData.dateOfBirth = new Date(dto.personal.dateOfBirth);
      if (dto.personal.gender) teacherUpdateData.gender = dto.personal.gender;
      if (dto.personal.bloodGroup)
        teacherUpdateData.bloodGroup = dto.personal.bloodGroup;
      if (dto.personal.address)
        teacherUpdateData.address = dto.personal.address;
      if (dto.personal.maritalStatus)
        teacherUpdateData.maritalStatus = dto.personal.maritalStatus;

      // Update structured address fields in profile.additionalData
      const profileUpdate: any = {};
      let hasProfileUpdate = false;

      if (
        dto.personal.street ||
        dto.personal.city ||
        dto.personal.state ||
        dto.personal.pinCode
      ) {
        hasProfileUpdate = true;
        profileUpdate.additionalData = {
          ...(await this.getTeacherProfileAdditionalData(id)),
        };

        if (dto.personal.street) {
          profileUpdate.additionalData.street = dto.personal.street;
        }
        if (dto.personal.city) {
          profileUpdate.additionalData.city = dto.personal.city;
        }
        if (dto.personal.state) {
          profileUpdate.additionalData.state = dto.personal.state;
        }
        if (dto.personal.pinCode) {
          profileUpdate.additionalData.pinCode = dto.personal.pinCode;
        }
      }

      if (hasProfileUpdate) {
        await this.prisma.teacherProfile.update({
          where: { teacherId: id },
          data: profileUpdate,
        });
      }
    }

    if (dto.salary) {
      if (dto.salary.basicSalary !== undefined)
        teacherUpdateData.basicSalary = dto.salary.basicSalary;
      if (dto.salary.allowances !== undefined)
        teacherUpdateData.allowances = dto.salary.allowances;
      // Auto-calculate total salary when basic or allowances are updated
      if (
        dto.salary.basicSalary !== undefined ||
        dto.salary.allowances !== undefined
      ) {
        const currentTeacher = await this.prisma.teacher.findUnique({
          where: { id },
          select: { basicSalary: true, allowances: true },
        });
        const basicSalary =
          dto.salary.basicSalary !== undefined
            ? dto.salary.basicSalary
            : currentTeacher?.basicSalary
              ? parseFloat(currentTeacher.basicSalary.toString())
              : 0;
        const allowances =
          dto.salary.allowances !== undefined
            ? dto.salary.allowances
            : currentTeacher?.allowances
              ? parseFloat(currentTeacher.allowances.toString())
              : 0;
        teacherUpdateData.totalSalary = basicSalary + allowances;
      }
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

    // Handle bank details update
    if (dto.bankDetails) {
      const profileUpdate: any = {};
      profileUpdate.additionalData = {
        ...(await this.getTeacherProfileAdditionalData(id)),
      };

      // Initialize bankDetails if it doesn't exist
      if (!profileUpdate.additionalData.bankDetails) {
        profileUpdate.additionalData.bankDetails = {};
      }

      // Update bank details
      if (dto.bankDetails.bankName) {
        profileUpdate.additionalData.bankDetails.bankName =
          dto.bankDetails.bankName;
      }
      if (dto.bankDetails.bankAccountNumber) {
        profileUpdate.additionalData.bankDetails.bankAccountNumber =
          dto.bankDetails.bankAccountNumber;
      }
      if (dto.bankDetails.bankBranch) {
        profileUpdate.additionalData.bankDetails.bankBranch =
          dto.bankDetails.bankBranch;
      }
      if (dto.bankDetails.panNumber) {
        profileUpdate.additionalData.bankDetails.panNumber =
          dto.bankDetails.panNumber;
      }
      if (dto.bankDetails.citizenshipNumber) {
        profileUpdate.additionalData.bankDetails.citizenshipNumber =
          dto.bankDetails.citizenshipNumber;
      }

      await this.prisma.teacherProfile.update({
        where: { teacherId: id },
        data: profileUpdate,
      });
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

    // Return the updated teacher data
    const updatedTeacher = await this.prisma.teacher.findUnique({
      where: { id },
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
                name: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!updatedTeacher) {
      throw new NotFoundException('Updated teacher not found');
    }

    // Extract additionalData from profile for detailed response
    const additionalData =
      (updatedTeacher.profile as any)?.additionalData || {};
    const bankDetails = additionalData.bankDetails || {};

    // Extract name parts from fullName for frontend compatibility
    const user = updatedTeacher.user;
    const nameParts = user.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName =
      nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middleName =
      nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    return {
      message: 'Teacher updated successfully',
      id,
      data: {
        id: updatedTeacher.id,
        userId: user.id,
        fullName: user.fullName,
        firstName,
        middleName,
        lastName,
        email: user.email,
        phone: user.phone,
        employeeId: updatedTeacher.employeeId,
        designation: updatedTeacher.designation,
        department: updatedTeacher.department,
        qualification: updatedTeacher.qualification,
        experienceYears: updatedTeacher.experienceYears,
        employmentDate: updatedTeacher.employmentDate,
        employmentStatus: updatedTeacher.employmentStatus,
        specialization: updatedTeacher.specialization,
        basicSalary: updatedTeacher.basicSalary,
        allowances: updatedTeacher.allowances,
        totalSalary: updatedTeacher.totalSalary,
        // Personal details from additionalData
        dateOfBirth: additionalData.dateOfBirth,
        gender: additionalData.gender,
        bloodGroup: additionalData.bloodGroup,
        maritalStatus: additionalData.maritalStatus,
        street: additionalData.street,
        city: additionalData.city,
        state: additionalData.state,
        pinCode: additionalData.pinCode,
        // Bank details
        bankName: bankDetails.bankName,
        bankAccountNumber: bankDetails.bankAccountNumber,
        bankBranch: bankDetails.bankBranch,
        panNumber: bankDetails.panNumber,
        citizenshipNumber: bankDetails.citizenshipNumber,
        // Related data
        subjects:
          updatedTeacher.subjectAssignments?.map(ts => ({
            id: ts.subject.id,
            name: ts.subject.name,
            code: ts.subject.code,
          })) || [],
        classAssignments:
          updatedTeacher.classAssignments?.map(tc => ({
            className: tc.class.name,
            section: tc.class.section,
          })) || [],
        status:
          updatedTeacher.employmentStatus === 'active'
            ? 'Active'
            : updatedTeacher.employmentStatus === 'on_leave'
              ? 'On Leave'
              : 'Inactive',
        joinedDate: updatedTeacher.employmentDate
          ? updatedTeacher.employmentDate.toISOString().split('T')[0]
          : undefined,
      },
    };
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
      // Include middle name in full name if provided
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
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found or already deleted');

    await this.prisma.teacher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: deletedBy,
        // Nullify unique fields to avoid conflicts when creating new teachers
        employeeId: `deleted_${id}_${Date.now()}`,
      },
    });

    await this.prisma.user.update({
      where: { id: teacher.userId },
      data: {
        deletedAt: new Date(),
        deletedById: deletedBy,
        isActive: false,
        // Nullify unique fields to avoid conflicts when creating new users
        email: `deleted_${teacher.userId}_${Date.now()}@deleted.local`,
        phone: teacher.user.phone
          ? `deleted_${teacher.userId}_${Date.now()}`
          : null,
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
      include: {
        subjectAssignments: {
          include: {
            subject: true,
          },
        },
      },
    });
    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found');
    return teacher.subjectAssignments;
  }

  async getSubjectsForClass(teacherId: string, classId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found');

    // Get subjects that the teacher is assigned to teach for this specific class
    const classSubjects = await this.prisma.classSubject.findMany({
      where: {
        classId: classId,
        teacherId: teacherId,
        deletedAt: null,
      },
      include: {
        subject: true,
      },
    });

    return classSubjects;
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
    assignments: { classId: string }[],
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
      createdById: string;
    }[] = [];

    for (const { classId } of assignments) {
      const classRecord = await this.prisma.class.findUnique({
        where: { id: classId },
      });
      if (!classRecord || classRecord.deletedAt) {
        throw new NotFoundException(`Class not found: ${classId}`);
      }

      validatedAssignments.push({
        teacherId,
        classId,
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
          },
        },
      },
    });

    if (!teacher || teacher.deletedAt)
      throw new NotFoundException('Teacher not found');

    // Get classes where this teacher is the class teacher
    const classTeacherClasses = await this.prisma.class.findMany({
      where: {
        classTeacherId: teacherId,
        deletedAt: null,
      },
    });

    // Start with explicitly assigned classes
    const assignedClasses = teacher.classAssignments.map(assignment => ({
      class: assignment.class,
    }));

    // Add class teacher classes (if not already in assigned classes)
    const assignedClassIds = assignedClasses.map(ac => ac.class.id);

    classTeacherClasses.forEach(cls => {
      if (!assignedClassIds.includes(cls.id)) {
        assignedClasses.push({
          class: cls,
        });
      }
    });

    return assignedClasses;
  }

  async removeClass(
    teacherId: string,
    classId: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ) {
    await this.prisma.teacherClass.deleteMany({
      where: {
        teacherId,
        classId,
      },
    });

    await this.audit.record({
      userId: actorId,
      action: 'REMOVE_CLASS',
      module: 'teacher',
      status: 'SUCCESS',
      details: { teacherId, classId },
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
  ) {
    const where: any = { teacherId };

    if (classId) where.classId = classId;

    await this.prisma.teacherClass.deleteMany({ where });

    await this.audit.record({
      userId: actorId,
      action: 'REMOVE_ALL_CLASSES',
      module: 'teacher',
      status: 'SUCCESS',
      details: { teacherId, classId },
      ipAddress: ip,
      userAgent,
    });

    return {
      message: 'Classes unassigned successfully',
      filters: { classId },
    };
  }

  /**
   * Get students for a teacher where they are the class teacher
   * This is used for complaint creation to restrict which students' parents a teacher can complain to
   */
  async getStudentsForClassTeacher(teacherId: string) {
    // Get classes where this teacher is the class teacher
    const classTeacherClasses = await this.prisma.class.findMany({
      where: {
        classTeacherId: teacherId,
        deletedAt: null,
      },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            parents: {
              where: { deletedAt: null },
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
        },
      },
    });

    // Flatten the students from all classes
    const allStudents = classTeacherClasses.flatMap(cls =>
      cls.students.map(student => ({
        ...student,
        className: `${cls.grade}${cls.section}`,
        classId: cls.id,
      })),
    );

    return allStudents;
  }

  /**
   * Check if the logged-in teacher is a class teacher and get attendance status
   */
  async getClassTeacherStatus(userId: string) {
    try {
      // Find the teacher by user ID
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
        include: {
          classesAsTeacher: {
            where: { deletedAt: null },
            include: {
              students: {
                where: { deletedAt: null },
                select: { id: true },
              },
            },
          },
        },
      });

      if (!teacher) {
        return {
          isClassTeacher: false,
          classDetails: null,
          attendanceTakenToday: false,
          message: 'Teacher not found',
        };
      }

      // Check if teacher is assigned as class teacher to any class
      const classTeacherClass = teacher.classesAsTeacher[0]; // A teacher should only be class teacher for one class

      if (!classTeacherClass) {
        return {
          isClassTeacher: false,
          classDetails: null,
          attendanceTakenToday: false,
          message: 'Not assigned as class teacher',
        };
      }

      // Check if attendance is already taken today
      const today = new Date();
      const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const todayDate = new Date(todayDateString); // Convert back to Date for proper comparison

      const todayAttendance = await this.prisma.attendanceSession.findUnique({
        where: {
          classId_date_sessionType: {
            classId: classTeacherClass.id,
            date: todayDate,
            sessionType: 'daily',
          },
        },
        include: {
          records: true,
        },
      });

      return {
        isClassTeacher: true,
        classDetails: {
          id: classTeacherClass.id,
          grade: classTeacherClass.grade,
          section: classTeacherClass.section,
          currentEnrollment: classTeacherClass.students.length,
        },
        attendanceTakenToday: !!todayAttendance,
        message: todayAttendance
          ? 'Attendance already taken for today'
          : 'Attendance pending for today',
      };
    } catch (error) {
      return {
        isClassTeacher: false,
        classDetails: null,
        attendanceTakenToday: false,
        message: 'Error checking status',
      };
    }
  }
}
