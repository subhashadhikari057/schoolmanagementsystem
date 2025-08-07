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
  CreateStaffDtoType,
  UpdateStaffByAdminDtoType,
  UpdateStaffSelfDtoType,
  GetAllStaffDtoType,
} from '../dto/staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateStaffDtoType,
    createdBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const { user, profile } = dto;

    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if user with phone already exists (if phone provided)
    if (user.phone && user.phone !== '') {
      const existingUserPhone = await this.prisma.user.findUnique({
        where: { phone: user.phone },
      });
      if (existingUserPhone) {
        throw new ConflictException(
          'User with this phone number already exists',
        );
      }
    }

    const rawPassword = user.password || generateRandomPassword();
    const passwordHash = await hashPassword(rawPassword);

    const { staff, staffUser } = await this.prisma.$transaction(
      async prisma => {
        // Create user account
        const staffUser = await prisma.user.create({
          data: {
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            passwordHash,
            needPasswordChange: !user.password, // If auto-generated, require password change
            createdById: createdBy,
          },
        });

        // Assign Staff role
        await prisma.userRole.create({
          data: {
            userId: staffUser.id,
            roleId: await this.getStaffRoleId(prisma),
          },
        });

        // Create staff record
        const staff = await prisma.staff.create({
          data: {
            userId: staffUser.id,
            // designation: profile.designation, // This field exists in schema
            firstName: user.fullName?.split(' ')[0] || 'Unknown',
            middleName: null,
            lastName: user.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
            dob: new Date(),
            gender: 'Not Specified',
            phone: user.phone || '',
            emergencyContact:
              typeof profile.emergencyContact === 'string'
                ? profile.emergencyContact
                : profile.emergencyContact?.phone || '',
            basicSalary: profile.salary
              ? parseFloat(profile.salary.toString())
              : 0,
            allowances: 0,
            totalSalary: profile.salary
              ? parseFloat(profile.salary.toString())
              : 0,
            department: profile.department,
            employmentDate: profile.employmentDate
              ? new Date(profile.employmentDate)
              : undefined,
          },
        });

        // Create staff profile
        await this.prisma.staffProfile.create({
          data: {
            staffId: staff.id,
            bio: profile.bio,
            contactInfo: profile.emergencyContact || {},
            additionalData: profile.address || {},
          },
        });

        return { staff, staffUser };
      },
    );

    // Audit log
    await this.audit.record({
      userId: createdBy,
      action: 'CREATE_STAFF',
      module: 'staff',
      status: 'SUCCESS',
      details: { staffId: staff.id, staffUserId: staffUser.id },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      message: 'Staff member created successfully',
      data: {
        staff: {
          id: staff.id,
          userId: staffUser.id,
          designation: staff.designation,
          department: staff.department,
          employmentDate: staff.employmentDate,
        },
        user: {
          id: staffUser.id,
          email: staffUser.email,
          fullName: staffUser.fullName,
          needPasswordChange: staffUser.needPasswordChange,
        },
        credentials: user.password ? null : { temporaryPassword: rawPassword },
      },
    };
  }

  async findAll(query: GetAllStaffDtoType) {
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
      user: {
        deletedAt: null,
      },
    };

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { designation: { contains: search, mode: 'insensitive' } },
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
      orderBy.user = { fullName: sortOrder };
    } else if (sortBy === 'employmentDate') {
      orderBy.employmentDate = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              fullName: true,
              isActive: true,
              lastLoginAt: true,
            },
          },
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

    return {
      data: staff,
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
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            fullName: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        profile: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return { data: staff };
  }

  async updateByAdmin(
    id: string,
    dto: UpdateStaffByAdminDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existingStaff = await this.prisma.staff.findUnique({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff member not found');
    }

    // Check for email conflicts if email is being updated
    if (dto.user?.email && dto.user.email !== existingStaff.user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.user.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check for phone conflicts if phone is being updated
    if (dto.user?.phone && dto.user.phone !== existingStaff.user.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: dto.user.phone },
      });
      if (phoneExists) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const updatedStaff = await this.prisma.$transaction(async prisma => {
      // Update user if user data provided
      if (dto.user) {
        await prisma.user.update({
          where: { id: existingStaff.userId },
          data: {
            ...dto.user,
            updatedById: updatedBy,
            updatedAt: new Date(),
          },
        });
      }

      // Update staff record if profile data provided
      if (dto.profile) {
        const updateData: any = {
          updatedById: updatedBy,
          updatedAt: new Date(),
        };

        // Handle profile fields
        if (dto.profile.qualification !== undefined)
          updateData.qualification = dto.profile.qualification;
        if (dto.profile.designation !== undefined)
          updateData.designation = dto.profile.designation;
        if (dto.profile.department !== undefined)
          updateData.department = dto.profile.department;
        if (dto.profile.experienceYears !== undefined)
          updateData.experienceYears = dto.profile.experienceYears;
        if (dto.profile.employmentDate !== undefined) {
          updateData.employmentDate = dto.profile.employmentDate
            ? new Date(dto.profile.employmentDate)
            : null;
        }
        if (dto.profile.salary !== undefined) {
          updateData.salary = dto.profile.salary
            ? parseFloat(dto.profile.salary.toString())
            : null;
        }
        if (dto.profile.employmentStatus !== undefined)
          updateData.employmentStatus = dto.profile.employmentStatus;

        await prisma.staff.update({
          where: { id },
          data: updateData,
        });

        // Update staff profile if profile fields provided
        const profileUpdateData: any = {
          updatedById: updatedBy,
          updatedAt: new Date(),
        };

        if (dto.profile.bio !== undefined)
          profileUpdateData.bio = dto.profile.bio;
        if (dto.profile.emergencyContact !== undefined)
          profileUpdateData.emergencyContact = dto.profile.emergencyContact;
        if (dto.profile.address !== undefined)
          profileUpdateData.address = dto.profile.address;
        if (dto.profile.socialLinks !== undefined)
          profileUpdateData.socialLinks = dto.profile.socialLinks;

        await this.prisma.staffProfile.upsert({
          where: { staffId: id },
          update: profileUpdateData,
          create: {
            staffId: id,
            ...profileUpdateData,
            createdById: updatedBy,
          },
        });
      }

      return prisma.staff.findUnique({
        where: { id },
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
          profile: true,
        },
      });
    });

    // Audit log
    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_STAFF',
      module: 'staff',
      status: 'SUCCESS',
      details: { staffId: id, changes: dto },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      message: 'Staff member updated successfully',
      data: updatedStaff,
    };
  }

  async updateSelf(
    staffId: string,
    dto: UpdateStaffSelfDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    const existingStaff = await this.prisma.staff.findUnique({
      where: { id: staffId, deletedAt: null },
      include: { user: true },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff member not found');
    }

    // Check if the updating user is the staff member themselves
    if (existingStaff.userId !== updatedBy) {
      throw new ConflictException('You can only update your own profile');
    }

    const updatedStaff = await this.prisma.$transaction(async prisma => {
      // Update user if user data provided
      if (dto.user) {
        await prisma.user.update({
          where: { id: existingStaff.userId },
          data: {
            ...dto.user,
            updatedById: updatedBy,
            updatedAt: new Date(),
          },
        });
      }

      // Update staff profile if profile data provided
      if (dto.profile) {
        const profileUpdateData: any = {
          updatedById: updatedBy,
          updatedAt: new Date(),
        };

        if (dto.profile.bio !== undefined)
          profileUpdateData.bio = dto.profile.bio;
        if (dto.profile.emergencyContact !== undefined)
          profileUpdateData.emergencyContact = dto.profile.emergencyContact;
        if (dto.profile.address !== undefined)
          profileUpdateData.address = dto.profile.address;
        if (dto.profile.socialLinks !== undefined)
          profileUpdateData.socialLinks = dto.profile.socialLinks;

        await this.prisma.staffProfile.upsert({
          where: { staffId: staffId },
          update: profileUpdateData,
          create: {
            staffId: staffId,
            ...profileUpdateData,
            createdById: updatedBy,
          },
        });
      }

      return prisma.staff.findUnique({
        where: { id: staffId },
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
          profile: true,
        },
      });
    });

    // Audit log
    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_STAFF_SELF',
      module: 'staff',
      status: 'SUCCESS',
      details: { staffId, changes: dto },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      message: 'Profile updated successfully',
      data: updatedStaff,
    };
  }

  async remove(id: string, deletedBy: string, ip?: string, userAgent?: string) {
    const existingStaff = await this.prisma.staff.findUnique({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.prisma.$transaction(async prisma => {
      // Soft delete staff
      await prisma.staff.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          // deletedById: deletedBy, // Field doesn't exist in StaffProfile
        },
      });

      // Soft delete user
      await prisma.user.update({
        where: { id: existingStaff.userId },
        data: {
          deletedAt: new Date(),
          // deletedById: deletedBy, // Field doesn't exist in StaffProfile
          isActive: false,
        },
      });

      // Soft delete profile
      await this.prisma.staffProfile.updateMany({
        where: { staffId: id },
        data: {
          deletedAt: new Date(),
          // deletedById: deletedBy, // Field doesn't exist in StaffProfile
        },
      });
    });

    // Audit log
    await this.audit.record({
      userId: deletedBy,
      action: 'DELETE_STAFF',
      module: 'staff',
      status: 'SUCCESS',
      details: { staffId: id },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return { message: 'Staff member deleted successfully' };
  }

  private async getStaffRoleId(prisma: any): Promise<string> {
    const staffRole = await prisma.role.findUnique({
      where: { name: 'staff' },
    });

    if (!staffRole) {
      throw new NotFoundException('Staff role not found in the system');
    }

    return staffRole.id;
  }
}
