import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { hashPassword } from '../../../shared/auth/hash.util';
import { DEFAULT_STAFF_PASSWORD } from '../../../shared/utils/password.util';
import {
  getFileUrl,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';
import {
  CreateStaffDtoType,
  UpdateStaffByAdminDtoType,
  UpdateStaffSelfDtoType,
  GetAllStaffDtoType,
} from '../dto/staff.dto';
import { StaffSalaryService } from './staff-salary.service';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly salaryService: StaffSalaryService,
  ) {}

  /**
   * Get total count of staff members (for employee ID generation)
   */
  async getStaffCount(): Promise<number> {
    return this.prisma.staff.count({
      where: { deletedAt: null },
    });
  }

  async create(
    dto: CreateStaffDtoType,
    createdBy: string,
    profilePicture?: Express.Multer.File,
    ip?: string,
    userAgent?: string,
  ) {
    const { user, profile, salary, bankDetails, permissions } = dto;

    // Check for duplicate email
    const existingEmailStaff = await this.prisma.staff.findFirst({
      where: {
        email: user.email,
        deletedAt: null,
      },
    });
    if (existingEmailStaff) {
      throw new ConflictException(
        `Staff member with email ${user.email} already exists`,
      );
    }

    // Check for duplicate phone if provided
    if (user.phone) {
      const existingPhoneStaff = await this.prisma.staff.findFirst({
        where: {
          phone: user.phone,
          deletedAt: null,
        },
      });
      if (existingPhoneStaff) {
        throw new ConflictException(
          `Staff member with phone ${user.phone} already exists`,
        );
      }
    }

    // Process profile picture if provided
    let profilePhotoUrl: string | null = null;
    if (profilePicture) {
      profilePhotoUrl = getFileUrl(
        profilePicture.filename,
        UPLOAD_PATHS.STAFF_PROFILES,
      );
    }

    // Construct full name
    const fullName = `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;

    // Prepare salary values with defaults
    const basicSalaryValue = salary?.basicSalary || 0;
    const allowancesValue = salary?.allowances || 0;
    const totalSalaryValue =
      salary?.totalSalary || basicSalaryValue + allowancesValue;

    // Generate temporary password for user account if needed
    let temporaryPassword: string | undefined;
    if (user.createLoginAccount) {
      temporaryPassword = user.password || DEFAULT_STAFF_PASSWORD;
    }

    // Generate employeeId if not provided
    let employeeId = profile.employeeId;
    if (!employeeId) {
      const currentYear = new Date().getFullYear();
      const staffCount = await this.getStaffCount();
      employeeId = `S-${currentYear}-${(staffCount + 1).toString().padStart(4, '0')}`;
    }

    // Create staff record and optional user account in a transaction
    const result = await this.prisma.$transaction(async tx => {
      // Create user account if requested
      let newUser: any = undefined;
      if (user.createLoginAccount) {
        // Hash the password
        const passwordHash = await hashPassword(temporaryPassword!);

        // Create user
        newUser = await tx.user.create({
          data: {
            email: user.email,
            phone: user.phone,
            fullName,
            passwordHash,
            createdById: createdBy,
            roles: {
              create: { role: { connect: { name: 'STAFF' } } },
            },
            needPasswordChange: user.password ? false : true,
          },
        });
      }

      // Create staff record
      const newStaff = await tx.staff.create({
        data: {
          // User account link (if created)
          ...(newUser ? { userId: newUser.id } : {}),
          // Basic user info
          email: user.email,
          fullName,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          phone: user.phone || '',
          // Employee ID
          employeeId,

          // Professional info
          designation: profile.designation || '',
          department: profile.department || '',
          employmentDate: profile.employmentDate
            ? new Date(profile.employmentDate)
            : new Date(),
          employmentStatus: 'active', // Default to active
          experienceYears: profile.experienceYears || 0,

          // Personal info
          dob: profile.dateOfBirth
            ? new Date(profile.dateOfBirth)
            : new Date('1990-01-01'),
          gender: profile.gender || 'Not Specified',
          bloodGroup: profile.bloodGroup,
          maritalStatus: profile.maritalStatus,
          emergencyContact:
            typeof profile.emergencyContact === 'string'
              ? profile.emergencyContact
              : profile.emergencyContact?.phone || '',
          // Salary info
          basicSalary: basicSalaryValue,
          allowances: allowancesValue,
          totalSalary: totalSalaryValue,
          // Bank details
          bankName: bankDetails?.bankName || null,
          bankAccountNumber: bankDetails?.bankAccountNumber || null,
          bankBranch: bankDetails?.bankBranch || null,
          panNumber: bankDetails?.panNumber || null,
          citizenshipNumber: bankDetails?.citizenshipNumber || null,
          // Permissions
          permissions: permissions || [],
          // Audit fields
          createdById: createdBy,
        },
      });

      // Create staff profile
      await tx.staffProfile.create({
        data: {
          staffId: newStaff.id,
          profilePhotoUrl,
          bio: profile.bio || '',
          contactInfo: profile.emergencyContact || {},
          additionalData: {
            qualification: profile.qualification,
            experienceYears: profile.experienceYears || 0,
            address: profile.address || {},
            socialLinks: profile.socialLinks || {},
          },
        },
      });

      // Create initial salary history record using the salary service after transaction
      // We'll handle this after the transaction completes

      return { staff: newStaff, staffUser: newUser };
    });

    // Create initial salary history record
    if (result.staff) {
      try {
        await this.salaryService.createInitialSalaryRecord(
          result.staff.id,
          basicSalaryValue,
          allowancesValue,
          createdBy,
        );
      } catch (error) {
        console.error('Failed to create initial salary record:', error);
        // Log detailed error for debugging
        if (error.code && error.meta) {
          console.error(
            `Error code: ${error.code}, Message: ${error.meta.message}`,
          );
        }
      }
    }

    // Audit log
    await this.audit.record({
      userId: createdBy,
      action: 'CREATE_STAFF',
      module: 'staff',
      status: 'SUCCESS',
      details: {
        staffId: result.staff.id,
        hasLoginAccount: !!result.staffUser,
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    const response = {
      message: 'Staff member created successfully',
      data: {
        staff: {
          id: result.staff.id,
          email: result.staff.email,
          fullName: result.staff.fullName,
          employeeId: result.staff.employeeId,
          designation: result.staff.designation,
          department: result.staff.department,
          employmentDate: result.staff.employmentDate,
          basicSalary: result.staff.basicSalary,
          allowances: result.staff.allowances,
          totalSalary: result.staff.totalSalary,
          hasLoginAccount: !!result.staffUser,
        },
      },
    };

    // Add temporary password to response if a user account was created
    if (temporaryPassword && result.staffUser) {
      (response.data as any).temporaryPassword = temporaryPassword;
      (response.data as any).loginEmail = user.email;
    }

    return response;
  }

  async findAll(query: GetAllStaffDtoType) {
    console.log('🔍 STAFF SERVICE - findAll called with params:', query);
    const {
      page,
      limit,
      search,
      department,
      employmentStatus,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (employmentStatus) {
      where.employmentStatus = employmentStatus;
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'fullName') {
      orderBy.fullName = sortOrder;
    } else if (sortBy === 'employmentDate') {
      orderBy.employmentDate = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        include: {
          profile: {
            select: {
              bio: true,
              profilePhotoUrl: true,
              contactInfo: true,
              additionalData: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.staff.count({ where }),
    ]);

    console.log('📊 DATABASE QUERY RESULTS:', {
      totalStaffFound: total,
      staffArrayLength: staff.length,
      whereClause: where,
      firstStaffRecord: staff[0]
        ? {
            id: staff[0].id,
            fullName: staff[0].fullName,
            firstName: staff[0].firstName,
            lastName: staff[0].lastName,
            email: staff[0].email,
            phone: staff[0].phone,
            employeeId: staff[0].employeeId,
            designation: staff[0].designation,
            department: staff[0].department,
            basicSalary: staff[0].basicSalary,
            totalSalary: staff[0].totalSalary,
            employmentStatus: staff[0].employmentStatus,
            gender: staff[0].gender,
            bloodGroup: staff[0].bloodGroup,
            emergencyContact: staff[0].emergencyContact,
            dob: staff[0].dob,
            joiningDate: staff[0].joiningDate,
            bankName: staff[0].bankName,
            bankAccountNumber: staff[0].bankAccountNumber,
            citizenshipNumber: staff[0].citizenshipNumber,
            panNumber: staff[0].panNumber,
            permissions: staff[0].permissions,
            profile: staff[0].profile,
            allFields: Object.keys(staff[0]),
          }
        : 'No staff records found',
    });

    const mappedData = staff.map(s => ({
      id: s.id,
      fullName: s.fullName,
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      employeeId: s.employeeId,

      // Personal Information
      dob: s.dob,
      gender: s.gender,
      bloodGroup: s.bloodGroup,
      emergencyContact: s.emergencyContact,
      maritalStatus: s.maritalStatus,

      // Employment Information
      designation: s.designation,
      department: s.department,
      employmentDate: s.employmentDate,
      joiningDate: s.joiningDate,
      employmentStatus: s.employmentStatus,
      experienceYears: s.experienceYears,
      qualification: s.qualification,

      // Financial Information
      basicSalary: s.basicSalary,
      allowances: s.allowances,
      totalSalary: s.totalSalary,

      // Bank Details
      bankAccountNumber: s.bankAccountNumber,
      bankBranch: s.bankBranch,
      bankName: s.bankName,

      // Government IDs
      citizenshipNumber: s.citizenshipNumber,
      panNumber: s.panNumber,

      // System Information
      permissions: s.permissions,

      // Profile Information
      profilePhotoUrl: s.profile?.profilePhotoUrl,
      bio: s.profile?.bio,
      contactInfo: s.profile?.contactInfo,
      additionalData: s.profile?.additionalData,

      // System fields
      hasUserAccount: !!(s as any).userId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      deletedAt: s.deletedAt,
    }));

    console.log('✅ MAPPED STAFF DATA FOR API:', {
      mappedDataLength: mappedData.length,
      firstMappedRecord: mappedData[0]
        ? {
            id: mappedData[0].id,
            fullName: mappedData[0].fullName,
            email: mappedData[0].email,
            designation: mappedData[0].designation,
            totalSalary: mappedData[0].totalSalary,
            hasPersonalInfo: !!(
              mappedData[0].gender || mappedData[0].bloodGroup
            ),
            hasFinancialInfo: !!(
              mappedData[0].basicSalary || mappedData[0].totalSalary
            ),
            hasBankDetails: !!(
              mappedData[0].bankName || mappedData[0].bankAccountNumber
            ),
            hasGovernmentIds: !!(
              mappedData[0].citizenshipNumber || mappedData[0].panNumber
            ),
            qualification: mappedData[0].qualification,
            mappedFields: Object.keys(mappedData[0]).filter(
              key =>
                mappedData[0][key as keyof (typeof mappedData)[0]] !== null &&
                mappedData[0][key as keyof (typeof mappedData)[0]] !==
                  undefined,
            ),
          }
        : 'No mapped data',
    });

    return {
      data: mappedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id, deletedAt: null },
      include: {
        profile: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Get user account if linked
    let userAccount: any = undefined;
    const userId = (staff as any).userId as string | undefined;

    if (userId) {
      userAccount = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    const result: any = {
      ...staff,
      userAccount: undefined as any,
    };

    // Extract profile data if available
    if (staff.profile) {
      const profileData = staff.profile as any;
      const additionalData = profileData.additionalData;
      if (additionalData && typeof additionalData === 'object') {
        // Get qualification from additionalData
        if (additionalData.qualification) {
          result.qualification = additionalData.qualification || '';
        }
        // Get address data from additionalData
        if (
          additionalData.address &&
          typeof additionalData.address === 'object'
        ) {
          result.address = additionalData.address;
          result.street = additionalData.address.street || '';
          result.city = additionalData.address.city || '';
          result.state = additionalData.address.state || '';
          result.pinCode = additionalData.address.zipCode || '';
        }
      }
      // Get bio and profile photo
      if (profileData.bio) {
        result.bio = profileData.bio;
      }
      if (profileData.profilePhotoUrl) {
        result.profilePhotoUrl = profileData.profilePhotoUrl;
      }
    }

    if (userAccount) {
      result.userAccount = {
        ...userAccount,
        roles: userAccount.roles.map(r => r.role.name),
      };
    } else {
      result.userAccount = null;
    }

    return result;
  }

  async updateByAdmin(
    id: string,
    dto: UpdateStaffByAdminDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const { user, profile, bankDetails } = dto;
    const salary = dto.salary;

    // Check if staff exists
    const existingStaff = await this.prisma.staff.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingStaff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    // Check for email uniqueness if changing email
    if (user?.email && user.email !== existingStaff.email) {
      const existingEmailStaff = await this.prisma.staff.findFirst({
        where: {
          email: user.email,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingEmailStaff) {
        throw new ConflictException(
          `Staff member with email ${user.email} already exists`,
        );
      }
    }

    // Check for phone uniqueness if changing phone
    if (user?.phone && user.phone !== existingStaff.phone) {
      const existingPhoneStaff = await this.prisma.staff.findFirst({
        where: {
          phone: user.phone,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingPhoneStaff) {
        throw new ConflictException(
          `Staff member with phone ${user.phone} already exists`,
        );
      }
    }

    // Update staff record
    const updatedStaff = await this.prisma.$transaction(async tx => {
      // Update staff record
      const staff = await tx.staff.update({
        where: { id },
        data: {
          // Update user fields if provided
          ...(user?.firstName && { firstName: user.firstName }),
          ...(user?.middleName !== undefined && {
            middleName: user.middleName,
          }),
          ...(user?.lastName && { lastName: user.lastName }),
          ...(user?.email && { email: user.email }),
          ...(user?.phone !== undefined && { phone: user.phone }),
          ...(user?.firstName || user?.lastName
            ? {
                fullName: `${user?.firstName || existingStaff.firstName} ${
                  user?.middleName || existingStaff.middleName || ''
                } ${user?.lastName || existingStaff.lastName}`.trim(),
              }
            : {}),

          // Update profile fields if provided
          ...(profile?.designation !== undefined && {
            designation: profile.designation,
          }),
          ...(profile?.department !== undefined && {
            department: profile.department,
          }),
          ...(profile?.employmentDate && {
            employmentDate: new Date(profile.employmentDate),
          }),
          ...(profile?.employmentStatus && {
            employmentStatus: profile.employmentStatus,
          }),
          ...(profile?.experienceYears !== undefined && {
            experienceYears: profile.experienceYears,
          }),
          ...(profile?.dateOfBirth && {
            dob: new Date(profile.dateOfBirth),
          }),
          ...(profile?.gender !== undefined && { gender: profile.gender }),
          ...(profile?.bloodGroup !== undefined && {
            bloodGroup: profile.bloodGroup,
          }),
          ...(profile?.maritalStatus !== undefined && {
            maritalStatus: profile.maritalStatus,
          }),
          ...(profile?.qualification !== undefined && {
            qualification: profile.qualification,
          }),

          // Update salary fields if provided
          ...(salary?.basicSalary !== undefined && {
            basicSalary: salary.basicSalary,
          }),
          ...(salary?.allowances !== undefined && {
            allowances: salary.allowances,
          }),
          ...(salary?.totalSalary !== undefined && {
            totalSalary: salary.totalSalary,
          }),

          // Update bank details if provided
          ...(bankDetails?.bankName !== undefined && {
            bankName: bankDetails.bankName,
          }),
          ...(bankDetails?.bankAccountNumber !== undefined && {
            bankAccountNumber: bankDetails.bankAccountNumber,
          }),
          ...(bankDetails?.bankBranch !== undefined && {
            bankBranch: bankDetails.bankBranch,
          }),
          ...(bankDetails?.panNumber !== undefined && {
            panNumber: bankDetails.panNumber,
          }),
          ...(bankDetails?.citizenshipNumber !== undefined && {
            citizenshipNumber: bankDetails.citizenshipNumber,
          }),

          // Audit fields
          updatedById: updatedBy,
          updatedAt: new Date(),
        },
        include: {
          profile: true,
        },
      });

      // Update staff profile if it exists
      if (staff.profile) {
        await tx.staffProfile.update({
          where: { staffId: id },
          data: {
            ...(profile?.bio !== undefined && { bio: profile.bio }),
            ...(profile?.emergencyContact !== undefined && {
              contactInfo: profile.emergencyContact,
            }),
            additionalData: {
              ...(staff.profile.additionalData as any),
              // Store address information in additionalData if provided
              ...(profile?.address && {
                address: {
                  street: profile.address.street,
                  city: profile.address.city,
                  state: profile.address.state,
                  zipCode: profile.address.zipCode || profile.address.pinCode,
                  pinCode: profile.address.pinCode || profile.address.zipCode,
                  country: profile.address.country,
                },
              }),
            },
          },
        });
      }

      // Update user account if linked and user data provided
      if ((staff as any).userId && user) {
        await tx.user.update({
          where: { id: (staff as any).userId },
          data: {
            ...(user.firstName || user.lastName
              ? {
                  fullName: `${user.firstName || existingStaff.firstName} ${
                    user.middleName || existingStaff.middleName || ''
                  } ${user.lastName || existingStaff.lastName}`.trim(),
                }
              : {}),
            ...(user.email && { email: user.email }),
            ...(user.phone !== undefined && { phone: user.phone }),
            updatedById: updatedBy,
            updatedAt: new Date(),
          },
        });
      }

      return staff;
    });

    // Audit log
    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_STAFF',
      module: 'staff',
      status: 'SUCCESS',
      details: {
        staffId: id,
        updatedFields: {
          ...(user && { user: true }),
          ...(profile && { profile: true }),
          ...(salary && { salary: true }),
          ...(bankDetails && { bankDetails: true }),
        },
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      message: 'Staff member updated successfully',
      data: updatedStaff,
    };
  }

  async updateSelf(
    id: string,
    dto: UpdateStaffSelfDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const { user, profile, bankDetails } = dto;

    // Check if staff exists and belongs to the current user
    const existingStaff = await this.prisma.staff.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    // Check if this staff record has a user ID that matches the current user
    const staffUserId = existingStaff ? (existingStaff as any).userId : null;
    if (!existingStaff || staffUserId !== updatedBy) {
      throw new NotFoundException(
        `Staff member with ID ${id} not found or you don't have permission to update it`,
      );
    }

    // Update staff record
    const updatedStaff = await this.prisma.$transaction(async tx => {
      // Update staff record with limited fields
      const staff = await tx.staff.update({
        where: { id },
        data: {
          // Update personal fields if provided
          ...(user?.phone !== undefined && { phone: user.phone }),

          // Update profile fields if provided (via profile object)
          ...(profile?.bloodGroup !== undefined && {
            bloodGroup: profile.bloodGroup,
          }),
          ...(profile?.maritalStatus !== undefined && {
            maritalStatus: profile.maritalStatus,
          }),

          // Update bank details if provided
          ...(bankDetails?.bankName !== undefined && {
            bankName: bankDetails.bankName,
          }),
          ...(bankDetails?.bankAccountNumber !== undefined && {
            bankAccountNumber: bankDetails.bankAccountNumber,
          }),
          ...(bankDetails?.bankBranch !== undefined && {
            bankBranch: bankDetails.bankBranch,
          }),
          ...(bankDetails?.panNumber !== undefined && {
            panNumber: bankDetails.panNumber,
          }),
          ...(bankDetails?.citizenshipNumber !== undefined && {
            citizenshipNumber: bankDetails.citizenshipNumber,
          }),

          // Audit fields
          updatedById: updatedBy,
          updatedAt: new Date(),
        },
        include: {
          profile: true,
        },
      });

      // Update staff profile if it exists
      if (staff.profile && profile) {
        await tx.staffProfile.update({
          where: { staffId: id },
          data: {
            ...(profile.bio !== undefined && { bio: profile.bio }),
            ...(profile.emergencyContact !== undefined && {
              contactInfo: profile.emergencyContact,
            }),
            additionalData: {
              ...(staff.profile.additionalData as any),
              ...(profile.address !== undefined && {
                address: profile.address,
              }),
            },
          },
        });
      }

      // Update user account if linked and user data provided
      const staffUserId = (staff as any).userId;
      if (staffUserId && user?.phone !== undefined) {
        await tx.user.update({
          where: { id: staffUserId },
          data: {
            phone: user.phone,
            updatedById: updatedBy,
            updatedAt: new Date(),
          },
        });
      }

      return staff;
    });

    // Audit log
    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_STAFF_SELF',
      module: 'staff',
      status: 'SUCCESS',
      details: {
        staffId: id,
        updatedFields: {
          ...(user && { user: true }),
          ...(profile && { profile: true }),
          ...(bankDetails && { bankDetails: true }),
        },
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      message: 'Your profile updated successfully',
      data: updatedStaff,
    };
  }

  async remove(id: string, deletedBy: string, ip?: string, userAgent?: string) {
    // Check if staff exists
    const existingStaff = await this.prisma.staff.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingStaff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    // Check if staff has a user account
    const hasUserId = await this.prisma.$queryRaw`
      SELECT "userId" FROM "Staff" WHERE "id" = ${id} AND "userId" IS NOT NULL
    `;

    // Perform soft delete
    await this.prisma.$transaction(async tx => {
      // Soft delete staff record
      await tx.staff.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: deletedBy,
        },
      });

      // Soft delete staff profile
      await tx.staffProfile.updateMany({
        where: { staffId: id },
        data: {
          deletedAt: new Date(),
        },
      });

      // Soft delete staff salary history using raw SQL query
      await tx.$executeRaw`
        UPDATE "StaffSalaryHistory"
        SET "deletedAt" = NOW()
        WHERE "staffId" = ${id} AND "deletedAt" IS NULL
      `;

      // If staff has a user account, soft delete it too
      if (hasUserId && Array.isArray(hasUserId) && hasUserId.length > 0) {
        // Get the userId
        const userIdResult = await tx.$queryRaw`
          SELECT "userId" as id FROM "Staff" WHERE "id" = ${id}
        `;

        if (
          userIdResult &&
          Array.isArray(userIdResult) &&
          userIdResult.length > 0
        ) {
          const userId = userIdResult[0].id;

          // Soft delete user account
          await tx.user.update({
            where: { id: userId },
            data: {
              deletedAt: new Date(),
              deletedById: deletedBy,
            },
          });
        }
      }
    });

    // Audit log
    await this.audit.record({
      userId: deletedBy,
      action: 'DELETE_STAFF',
      module: 'staff',
      status: 'SUCCESS',
      details: {
        staffId: id,
        hasUserAccount: Array.isArray(hasUserId) && hasUserId.length > 0,
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return { message: 'Staff member deleted successfully' };
  }
}
