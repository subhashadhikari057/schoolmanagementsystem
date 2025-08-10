import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
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

    // Staff are static records - no user accounts needed
    const staff = await this.prisma.$transaction(async prisma => {
      // Create staff record only (no user account)
      const staff = await prisma.staff.create({
        data: {
          email: user.email,
          fullName: user.fullName,
          designation: profile.designation,
          firstName: user.fullName?.split(' ')[0] || 'Unknown',
          middleName: null,
          lastName: user.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
          dob: new Date('1990-01-01'), // Default DOB, will be updated later
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
            : new Date(),
          createdById: createdBy,
        },
      });

      // Create staff profile
      await prisma.staffProfile.create({
        data: {
          staffId: staff.id,
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

      return staff;
    });

    // Audit log
    await this.audit.record({
      userId: createdBy,
      action: 'CREATE_STAFF',
      module: 'staff',
      status: 'SUCCESS',
      details: { staffId: staff.id },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      message: 'Staff member created successfully',
      data: {
        staff: {
          id: staff.id,
          email: staff.email,
          fullName: staff.fullName,
          designation: staff.designation,
          department: staff.department,
          employmentDate: staff.employmentDate,
        },
        message:
          'Staff member created as static record. No login credentials needed.',
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

    return {
      data: staff,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id, deletedAt: null },
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
      where: { id },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff member not found');
    }

    // Staff members don't need login access, so no duplicate checks needed
    const updatedStaff = await this.prisma.$transaction(async prisma => {
      // Update staff user fields if provided
      if (dto.user) {
        const userUpdateData: any = {
          updatedById: updatedBy,
          updatedAt: new Date(),
        };

        if (dto.user.email) userUpdateData.email = dto.user.email;
        if (dto.user.fullName) userUpdateData.fullName = dto.user.fullName;
        if (dto.user.phone) userUpdateData.phone = dto.user.phone;

        await prisma.staff.update({
          where: { id },
          data: userUpdateData,
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
          updateData.basicSalary = dto.profile.salary
            ? parseFloat(dto.profile.salary.toString())
            : null;
          updateData.totalSalary = dto.profile.salary
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
        const profileUpdateData: any = {};

        if (dto.profile.bio !== undefined)
          profileUpdateData.bio = dto.profile.bio;
        if (dto.profile.emergencyContact !== undefined)
          profileUpdateData.contactInfo = dto.profile.emergencyContact;
        if (dto.profile.address !== undefined)
          profileUpdateData.additionalData = {
            address: dto.profile.address,
            socialLinks: dto.profile.socialLinks || {},
          };

        if (Object.keys(profileUpdateData).length > 0) {
          await prisma.staffProfile.updateMany({
            where: { staffId: id },
            data: profileUpdateData,
          });
        }
      }

      return prisma.staff.findUnique({
        where: { id },
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
      });
    });

    // Audit log
    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_STAFF',
      module: 'staff',
      status: 'SUCCESS',
      details: { staffId: id },
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
    const existingStaff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff member not found');
    }

    // Staff members can update their own profiles (no login access restrictions)
    const updatedStaff = await this.prisma.$transaction(async prisma => {
      // Update staff user fields if provided
      if (dto.user) {
        const userUpdateData: any = {
          updatedById: updatedBy,
          updatedAt: new Date(),
        };

        if (dto.user.fullName) userUpdateData.fullName = dto.user.fullName;
        if (dto.user.phone) userUpdateData.phone = dto.user.phone;

        await prisma.staff.update({
          where: { id },
          data: userUpdateData,
        });
      }

      // Update staff profile if profile fields provided
      if (dto.profile) {
        const profileUpdateData: any = {};

        if (dto.profile.bio !== undefined)
          profileUpdateData.bio = dto.profile.bio;
        if (dto.profile.emergencyContact !== undefined)
          profileUpdateData.contactInfo = dto.profile.emergencyContact;
        if (dto.profile.address !== undefined)
          profileUpdateData.additionalData = {
            address: dto.profile.address,
            socialLinks: dto.profile.socialLinks || {},
          };

        if (Object.keys(profileUpdateData).length > 0) {
          await prisma.staffProfile.updateMany({
            where: { staffId: id },
            data: profileUpdateData,
          });
        }
      }

      return prisma.staff.findUnique({
        where: { id },
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
      });
    });

    // Audit log
    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_STAFF_SELF',
      module: 'staff',
      status: 'SUCCESS',
      details: { staffId: id },
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
      where: { id },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.prisma.$transaction(async prisma => {
      // Soft delete staff record
      await prisma.staff.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: deletedBy,
        },
      });

      // Staff records don't have separate user accounts to delete

      // Soft delete profile
      await prisma.staffProfile.updateMany({
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
}
