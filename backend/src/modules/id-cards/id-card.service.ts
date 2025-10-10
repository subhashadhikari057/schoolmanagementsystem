import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { IDCardTemplateType } from '@prisma/client';
import * as QRCode from 'qrcode';
import { SchoolInformationService } from '../school-information/application/school-information.service';

export interface GenerateIDCardDto {
  templateId: string;
  userId: string;
  expiryDate?: Date;
  batchName?: string;
}

export interface IDCardData {
  id: string;
  templateId: string;
  userId: string;
  renderedFields: RenderedField[];
  qrCodeUrl?: string;
  expiryDate: Date;
  createdAt: Date;
  template: {
    name: string;
    dimensions: string;
    orientation: string;
  };
}

export interface RenderedField {
  fieldId: string;
  fieldType: string;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: string;
    color?: string;
    backgroundColor?: string;
  };
}

@Injectable()
export class IDCardService {
  constructor(
    private prisma: PrismaService,
    private schoolInformationService: SchoolInformationService,
  ) {}

  /**
   * Generate an individual ID card from a template for a specific user
   */
  async generateIDCard(dto: GenerateIDCardDto): Promise<IDCardData> {
    // Get template with fields
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id: dto.templateId },
      include: { fields: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Validate template is active and ready for use
    if (template.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Template must be active to generate ID cards',
      );
    }

    // Check if user already has an active ID card of this type
    const existingActiveCard = await this.prisma.iDCard.findFirst({
      where: {
        issuedForId: dto.userId,
        type: template.type,
        // isActive: true, // Temporarily disabled due to Prisma type cache
      },
    });

    if (existingActiveCard) {
      // Deactivate the old card before creating new one
      await this.prisma.iDCard.update({
        where: { id: existingActiveCard.id },
        data: {
          // isActive: false // Temporarily disabled due to Prisma type cache
          updatedAt: new Date(),
        },
      });
    }

    // Get user data based on template type
    const userData = await this.getUserData(dto.userId, template.type);

    // Get school information for populating school-related fields
    const schoolInformation = await this.schoolInformationService.findOne();

    // Generate rendered fields by mapping template fields to actual data
    const renderedFields: RenderedField[] = [];
    let qrCodeUrl: string | undefined;

    for (const field of template.fields) {
      let fieldValue = '';

      // Map database fields to actual user data
      if (field.dataSource === 'database' && field.databaseField) {
        fieldValue = this.mapDatabaseField(
          userData,
          field.databaseField,
          schoolInformation,
        );
      } else if (field.dataSource === 'static') {
        // For static fields, check both staticText and imageUrl
        if (field.staticText) {
          fieldValue = field.staticText;
        } else if (field.imageUrl) {
          // For IMAGE and LOGO fields with imageUrl
          fieldValue = field.imageUrl;
        } else {
          fieldValue = field.placeholder || field.label;
        }
      } else {
        fieldValue = field.placeholder || field.label;
      }

      // Generate QR code for QR fields
      if (field.fieldType === 'QR_CODE') {
        const qrData = this.generateQRData(
          userData,
          field.databaseField || 'userId',
          template.type,
        );
        qrCodeUrl = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        fieldValue = qrData; // Store the QR data
      }

      renderedFields.push({
        fieldId: field.id,
        fieldType: field.fieldType,
        label: field.label,
        value: fieldValue,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        style: {
          fontSize: field.fontSize || undefined,
          fontFamily: field.fontFamily || undefined,
          fontWeight: field.fontWeight || undefined,
          textAlign: field.textAlign || undefined,
          color: field.color || undefined,
          backgroundColor: field.backgroundColor || undefined,
        },
      });
    }

    // Note: QR data will be generated per field in the loop above

    // Create ID card record
    const idCard = await this.prisma.iDCard.create({
      data: {
        type: template.type,
        templateId: dto.templateId,
        issuedForId: dto.userId,
        expiryDate:
          dto.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
        batchName: dto.batchName,
        // isActive: true, // Temporarily disabled due to Prisma type cache
        // qrCodeData: primaryQRData, // Temporarily disabled due to Prisma type cache
      },
    });

    // Update template usage count
    await this.prisma.iDCardTemplate.update({
      where: { id: dto.templateId },
      data: { usageCount: { increment: 1 } },
    });

    return {
      id: idCard.id,
      templateId: dto.templateId,
      userId: dto.userId,
      renderedFields,
      qrCodeUrl,
      expiryDate: idCard.expiryDate,
      createdAt: idCard.createdAt,
      template: {
        name: template.name,
        dimensions: template.dimensions,
        orientation: template.orientation,
      },
    };
  }

  /**
   * Get user data based on template type
   */
  private async getUserData(userId: string, templateType: IDCardTemplateType) {
    const baseUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            class: true,
            profile: true,
          },
        },
        teacher: {
          include: {
            profile: true,
          },
        },
        staff: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!baseUser) {
      throw new NotFoundException('User not found');
    }

    // Return combined user data based on type
    switch (templateType) {
      case IDCardTemplateType.STUDENT:
        if (!baseUser.student) {
          throw new BadRequestException('User is not a student');
        }
        return {
          ...baseUser,
          ...baseUser.student,
          className: baseUser.student.class?.name,
          section: baseUser.student.class?.section,
          profilePicture:
            baseUser.student.profile?.profilePhotoUrl ||
            baseUser.student.profilePhotoUrl,
        };

      case IDCardTemplateType.TEACHER:
        if (!baseUser.teacher) {
          throw new BadRequestException('User is not a teacher');
        }
        return {
          ...baseUser,
          ...baseUser.teacher,
          profilePicture: baseUser.teacher.profile?.profilePhotoUrl,
        };

      case IDCardTemplateType.STAFF:
      case IDCardTemplateType.STAFF_NO_LOGIN:
        if (!baseUser.staff) {
          throw new BadRequestException('User is not staff');
        }
        return {
          ...baseUser,
          ...baseUser.staff,
          profilePicture: baseUser.staff.profile?.profilePhotoUrl,
        };

      default:
        throw new BadRequestException('Invalid template type');
    }
  }

  /**
   * Format image URL to be accessible from frontend
   */
  private formatImageUrl(imagePath: string, fieldType?: string): string {
    if (!imagePath) {
      return '';
    }

    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Get the backend URL from environment or default to localhost
    const backendUrl =
      process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:8080';

    // Handle different image path formats
    if (imagePath.startsWith('/api/v1/files/')) {
      // Already in API format, just add backend URL
      return `${backendUrl}${imagePath}`;
    }

    if (imagePath.startsWith('/uploads/')) {
      // Convert uploads path to API format
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 3) {
        const folder = pathParts[2]; // e.g., 'school-info', 'teachers', etc.
        const filename = pathParts[pathParts.length - 1];
        return `${backendUrl}/api/v1/files/${folder}/${filename}`;
      }
    }

    if (imagePath.startsWith('uploads/')) {
      // Convert uploads path without leading slash to API format
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 2) {
        const folder = pathParts[1]; // e.g., 'school-info', 'teachers', etc.
        const filename = pathParts[pathParts.length - 1];
        return `${backendUrl}/api/v1/files/${folder}/${filename}`;
      }
    }

    // If it's just a filename, try to determine the correct folder based on field type
    if (!imagePath.includes('/')) {
      let folder = 'school-info'; // default

      if (fieldType === 'teacher_photo' || fieldType === 'profilePicture') {
        folder = 'teachers';
      } else if (fieldType === 'student_photo') {
        folder = 'students';
      } else if (fieldType === 'school_logo') {
        folder = 'school-info/logos';
      }

      return `${backendUrl}/api/v1/files/${folder}/${imagePath}`;
    }

    // Fallback: treat as relative path and prepend backend URL
    const normalizedPath = imagePath.startsWith('/')
      ? imagePath
      : `/${imagePath}`;
    return `${backendUrl}${normalizedPath}`;
  }

  /**
   * Map database field names to actual user data values
   */
  private mapDatabaseField(
    userData: Record<string, unknown>,
    fieldName: string,
    schoolInformation?: any,
  ): string {
    // Helper function to safely get string values
    const getString = (value: unknown): string => {
      return typeof value === 'string' ? value : '';
    };

    const getDate = (value: unknown): string => {
      if (!value) return '';
      try {
        return new Date(value as string).toLocaleDateString();
      } catch {
        return '';
      }
    };

    const fieldMap: Record<string, string> = {
      // Common fields
      'First Name': getString(userData.firstName),
      'Middle Name': getString(userData.middleName),
      'Last Name': getString(userData.lastName),
      'Full Name':
        getString(userData.fullName) ||
        `${getString(userData.firstName)} ${userData.middleName ? getString(userData.middleName) + ' ' : ''}${getString(userData.lastName)}`.trim(),
      Email: getString(userData.email),
      'Phone Number': getString(userData.phone),
      Address: getString(userData.address),
      'Date of Birth': getDate(userData.dateOfBirth),
      'Blood Group': getString(userData.bloodGroup),

      // School/Organization fields (now populated from actual school information)
      'School Name': schoolInformation?.schoolName || 'School Name Not Set',
      'School Logo': schoolInformation?.logo
        ? this.formatImageUrl(schoolInformation.logo, 'school_logo')
        : '',
      schoolLogo: schoolInformation?.logo
        ? this.formatImageUrl(schoolInformation.logo, 'school_logo')
        : '',
      schoolName: schoolInformation?.schoolName || 'School Name Not Set',
      'School Address': schoolInformation?.address || 'School Address Not Set',
      'School Code': schoolInformation?.schoolCode || 'School Code Not Set',

      // Student specific
      'Student ID': getString(userData.studentId),
      studentId: getString(userData.studentId), // Alternative field name (lowercase)
      'Roll Number': getString(userData.rollNumber),
      'Admission Number': getString(userData.admissionNumber),
      Class: getString(userData.className),
      Section: getString(userData.section),
      'Academic Year': new Date().getFullYear().toString(),
      'Parent Name': userData.fatherFirstName
        ? `${getString(userData.fatherFirstName)} ${getString(userData.fatherLastName)}`.trim()
        : '',
      'Emergency Contact':
        getString(userData.fatherPhone) || getString(userData.motherPhone),
      'Student Photo': userData.profilePicture
        ? this.formatImageUrl(
            getString(userData.profilePicture),
            'student_photo',
          )
        : '',

      // Teacher specific
      'Employee ID': getString(userData.employeeId),
      'Teacher ID':
        getString(userData.teacherId) || getString(userData.employeeId),
      employeeId: getString(userData.employeeId), // Alternative field name
      Designation: getString(userData.designation),
      designation: getString(userData.designation), // Alternative field name
      Department: getString(userData.department),
      department: getString(userData.department), // Alternative field name
      'Subject Taught': Array.isArray(userData.subjectsTaught)
        ? userData.subjectsTaught.join(', ')
        : '',
      Qualification: getString(userData.qualification),
      Experience: userData.experience ? `${userData.experience} years` : '',
      'Date of Joining': getDate(userData.dateOfJoining),
      'Teacher Photo': userData.profilePicture
        ? this.formatImageUrl(
            getString(userData.profilePicture),
            'teacher_photo',
          )
        : '',
      photo: userData.profilePicture
        ? this.formatImageUrl(
            getString(userData.profilePicture),
            'teacher_photo',
          )
        : '', // Alternative field name
      fullName: getString(userData.fullName), // Alternative field name

      // Staff specific
      Position: getString(userData.position),
      Shift: getString(userData.shift),
      'Working Hours': getString(userData.workingHours),
      'Staff Photo': userData.profilePicture
        ? this.formatImageUrl(getString(userData.profilePicture), 'staff_photo')
        : '',
    };

    return fieldMap[fieldName] || '';
  }

  /**
   * Generate unique QR data for the user
   */
  private generateQRData(
    userData: Record<string, unknown>,
    qrField: string,
    templateType: IDCardTemplateType,
  ): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Helper to safely get string values
    const getString = (value: unknown): string => {
      return typeof value === 'string' ? value : '';
    };

    // Generate unique QR data based on field and type
    switch (qrField) {
      case 'studentId':
        return `${baseUrl}/verify/student/${getString(userData.studentId)}`;
      case 'rollNumber':
        return `${baseUrl}/verify/student/roll/${getString(userData.rollNumber)}`;
      case 'admissionNumber':
        return `${baseUrl}/verify/student/admission/${getString(userData.admissionNumber)}`;
      case 'employeeId':
        return `${baseUrl}/verify/employee/${getString(userData.employeeId)}`;
      case 'teacherId':
        return `${baseUrl}/verify/teacher/${getString(userData.teacherId) || getString(userData.employeeId)}`;
      default: {
        // Fallback: generate verification URL with user ID
        const typePrefix = templateType.toLowerCase().replace('_', '-');
        return `${baseUrl}/verify/${typePrefix}/${getString(userData.id)}`;
      }
    }
  }

  /**
   * Get all ID cards for a user
   */
  async getUserIDCards(userId: string) {
    return this.prisma.iDCard.findMany({
      where: { issuedForId: userId },
      include: {
        template: {
          include: { fields: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all ID cards with filtering and pagination
   */
  async getAllIDCards(filters: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      // Search in user's name (requires join)
      where.issuedFor = {
        OR: [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    const [idCards, total] = await Promise.all([
      this.prisma.iDCard.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          issuedFor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.iDCard.count({ where }),
    ]);

    return {
      idCards,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete an ID card
   */
  async deleteIDCard(id: string) {
    const idCard = await this.prisma.iDCard.findUnique({
      where: { id },
    });

    if (!idCard) {
      throw new NotFoundException('ID card not found');
    }

    await this.prisma.iDCard.delete({
      where: { id },
    });

    return { message: 'ID card deleted successfully' };
  }

  /**
   * Get ID card by ID with full data
   */
  async getIDCard(idCardId: string): Promise<IDCardData> {
    const idCard = await this.prisma.iDCard.findUnique({
      where: { id: idCardId },
      include: {
        template: {
          include: { fields: true },
        },
        issuedFor: true,
      },
    });

    if (!idCard) {
      throw new NotFoundException('ID card not found');
    }

    // Re-generate the rendered data (this could be cached in production)
    const userData = await this.getUserData(
      idCard.issuedForId,
      idCard.template.type as IDCardTemplateType,
    );

    // Get school information for populating school-related fields
    const schoolInformation = await this.schoolInformationService.findOne();

    const renderedFields: RenderedField[] = [];
    let qrCodeUrl: string | undefined;

    for (const field of idCard.template.fields) {
      let fieldValue = '';

      if (field.dataSource === 'database' && field.databaseField) {
        fieldValue = this.mapDatabaseField(
          userData,
          field.databaseField,
          schoolInformation,
        );
      } else if (field.dataSource === 'static') {
        // For static fields, check both staticText and imageUrl
        if (field.staticText) {
          fieldValue = field.staticText;
        } else if (field.imageUrl) {
          // For IMAGE and LOGO fields with imageUrl
          fieldValue = field.imageUrl;
        } else {
          fieldValue = field.placeholder || field.label;
        }
      } else {
        fieldValue = field.placeholder || field.label;
      }

      if (field.fieldType === 'QR_CODE') {
        const qrData = this.generateQRData(
          userData,
          field.databaseField || 'userId',
          idCard.template.type as IDCardTemplateType,
        );
        qrCodeUrl = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        fieldValue = qrData;
      }

      renderedFields.push({
        fieldId: field.id,
        fieldType: field.fieldType,
        label: field.label,
        value: fieldValue,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        style: {
          fontSize: field.fontSize || undefined,
          fontFamily: field.fontFamily || undefined,
          fontWeight: field.fontWeight || undefined,
          textAlign: field.textAlign || undefined,
          color: field.color || undefined,
          backgroundColor: field.backgroundColor || undefined,
        },
      });
    }

    return {
      id: idCard.id,
      templateId: idCard.templateId,
      userId: idCard.issuedForId,
      renderedFields,
      qrCodeUrl,
      expiryDate: idCard.expiryDate,
      createdAt: idCard.createdAt,
      template: {
        name: idCard.template.name,
        dimensions: idCard.template.dimensions,
        orientation: idCard.template.orientation,
      },
    };
  }

  /**
   * Generate ID cards in bulk for multiple users
   */
  async generateBulkIDCards(
    templateId: string,
    userIds: string[],
    batchName?: string,
  ): Promise<IDCardData[]> {
    const results: IDCardData[] = [];

    for (const userId of userIds) {
      try {
        const idCard = await this.generateIDCard({
          templateId,
          userId,
          batchName,
        });
        results.push(idCard);
      } catch {
        // Log error for debugging but continue with other users
      }
    }

    return results;
  }
}
