/**
 * =============================================================================
 * School Information Service
 * =============================================================================
 * Service for managing school information settings.
 * Handles CRUD operations with proper validation and audit logging.
 * =============================================================================
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  CreateSchoolInformationDtoType,
  UpdateSchoolInformationDtoType,
  SchoolInformationResponseDtoType,
} from '../dto/school-information.dto';

@Injectable()
export class SchoolInformationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create school information (only if none exists)
   */
  async create(
    dto: CreateSchoolInformationDtoType,
    createdById: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{
    message: string;
    schoolInformation: SchoolInformationResponseDtoType;
  }> {
    // Check if school information already exists
    const existingSchool = await this.prisma.schoolInformation.findFirst();
    if (existingSchool) {
      throw new ConflictException(
        'School information already exists. Use update instead.',
      );
    }

    // Check if school code is unique
    const existingCode = await this.prisma.schoolInformation.findUnique({
      where: { schoolCode: dto.schoolCode },
    });
    if (existingCode) {
      throw new ConflictException('School code already exists');
    }

    try {
      const schoolInformation = await this.prisma.schoolInformation.create({
        data: {
          ...dto,
          createdById,
        },
      });

      // Log audit
      await this.audit.log({
        userId: createdById,
        action: 'CREATE',
        module: 'SchoolInformation',
        status: 'SUCCESS',
        ipAddress: ip,
        userAgent: userAgent,
        details: { created: schoolInformation },
      });

      return {
        message: 'School information created successfully',
        schoolInformation,
      };
    } catch {
      throw new BadRequestException('Failed to create school information');
    }
  }

  /**
   * Get school information (returns the single record or null)
   */
  async findOne(): Promise<SchoolInformationResponseDtoType | null> {
    const schoolInformation = await this.prisma.schoolInformation.findFirst();

    if (!schoolInformation) {
      return null;
    }

    return schoolInformation;
  }

  /**
   * Update school information
   */
  async update(
    dto: UpdateSchoolInformationDtoType,
    updatedById: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{
    message: string;
    schoolInformation: SchoolInformationResponseDtoType;
  }> {
    // Find the school information record
    const existingSchool = await this.prisma.schoolInformation.findFirst();
    if (!existingSchool) {
      throw new NotFoundException(
        'School information not found. Create it first.',
      );
    }

    // If updating school code, check uniqueness
    if (dto.schoolCode && dto.schoolCode !== existingSchool.schoolCode) {
      const existingCode = await this.prisma.schoolInformation.findUnique({
        where: { schoolCode: dto.schoolCode },
      });
      if (existingCode) {
        throw new ConflictException('School code already exists');
      }
    }

    try {
      const updatedSchoolInformation =
        await this.prisma.schoolInformation.update({
          where: { id: existingSchool.id },
          data: {
            ...dto,
            updatedById,
          },
        });

      // Log audit
      await this.audit.log({
        userId: updatedById,
        action: 'UPDATE',
        module: 'SchoolInformation',
        status: 'SUCCESS',
        ipAddress: ip,
        userAgent: userAgent,
        details: {
          previous: existingSchool,
          updated: updatedSchoolInformation,
        },
      });

      return {
        message: 'School information updated successfully',
        schoolInformation: updatedSchoolInformation,
      };
    } catch {
      throw new BadRequestException('Failed to update school information');
    }
  }

  /**
   * Create or update school information (upsert operation)
   */
  async createOrUpdate(
    dto: CreateSchoolInformationDtoType,
    userId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{
    message: string;
    schoolInformation: SchoolInformationResponseDtoType;
  }> {
    const existingSchool = await this.prisma.schoolInformation.findFirst();

    if (existingSchool) {
      // Update existing
      return this.update(dto, userId, ip, userAgent);
    } else {
      // Create new
      return this.create(dto, userId, ip, userAgent);
    }
  }

  /**
   * Check if school information exists
   */
  async exists(): Promise<boolean> {
    const count = await this.prisma.schoolInformation.count();
    return count > 0;
  }
}
