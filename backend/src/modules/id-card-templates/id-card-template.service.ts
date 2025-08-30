import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilterDto,
} from './dto/template.dto';
import { IDCardTemplateType } from '@prisma/client';

@Injectable()
export class IDCardTemplateService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(dto: CreateTemplateDto, userId: string | null) {
    // Validate template name uniqueness
    const existingTemplate = await this.prisma.iDCardTemplate.findFirst({
      where: {
        name: dto.name,
      },
    });

    if (existingTemplate) {
      throw new ConflictException('Template with this name already exists');
    }

    // Validate template business logic
    this.validateTemplateData(dto);

    // Validate minimum required fields exist
    if (!dto.fields || dto.fields.length === 0) {
      throw new BadRequestException('Template must have at least one field');
    }

    // Create template and fields in transaction
    const template = await this.prisma.$transaction(async tx => {
      const newTemplate = await tx.iDCardTemplate.create({
        data: {
          name: dto.name,
          type: dto.type,
          description: dto.description,
          dimensions: dto.dimensions,
          customWidth: dto.customWidth,
          customHeight: dto.customHeight,
          orientation: dto.orientation || 'HORIZONTAL',
          backgroundColor: dto.backgroundColor || '#ffffff',
          backgroundImage: dto.backgroundImage,
          borderColor: dto.borderColor || '#000000',
          borderWidth: dto.borderWidth || 1,
          borderRadius: dto.borderRadius || 0,
          logoRequired: dto.logoRequired || true,
          photoRequired: dto.photoRequired || true,
          qrCodeRequired: dto.qrCodeRequired || true,
          barcodeRequired: dto.barcodeRequired || false,
          watermark: dto.watermark,
          printMargin: dto.printMargin || 5,
          bleedArea: dto.bleedArea || 3,
          safeArea: dto.safeArea || 5,
          features: dto.features || [],
          metadata: dto.metadata || {},
          createdById: userId,
        },
      });

      // Create fields if provided
      if (dto.fields && dto.fields.length > 0) {
        await tx.iDCardTemplateField.createMany({
          data: dto.fields.map(field => ({
            templateId: newTemplate.id,
            fieldType: field.fieldType,
            label: field.label,
            databaseField: field.databaseField,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            fontSize: field.fontSize,
            fontFamily: field.fontFamily || 'Inter',
            fontWeight: field.fontWeight,
            textAlign: field.textAlign || 'LEFT',
            color: field.color || '#000000',
            backgroundColor: field.backgroundColor,
            borderWidth: field.borderWidth || 0,
            borderColor: field.borderColor || '#cccccc',
            borderRadius: field.borderRadius || 0,
            required: field.required || false,
            placeholder: field.placeholder,
            rotation: field.rotation || 0,
            opacity: field.opacity || 100,
            zIndex: field.zIndex || 1,
            dataSource: field.dataSource,
            staticText: field.staticText,
            imageUrl: field.imageUrl,
            qrData: field.qrData,
            validationRules: {},
            styleOptions: {},
          })),
        });
      }

      return newTemplate;
    });

    return this.getTemplateById(template.id);
  }

  async updateTemplate(
    id: string,
    dto: UpdateTemplateDto,
    userId: string | null,
  ) {
    const existingTemplate = await this.prisma.iDCardTemplate.findFirst({
      where: { id },
    });

    if (!existingTemplate) {
      throw new NotFoundException('Template not found');
    }

    // Check name uniqueness if name is being updated
    if (dto.name && dto.name !== existingTemplate.name) {
      const nameExists = await this.prisma.iDCardTemplate.findFirst({
        where: {
          name: dto.name,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ConflictException('Template with this name already exists');
      }
    }

    // Update template and fields in transaction
    const template = await this.prisma.$transaction(async tx => {
      const updateData: any = { updatedById: userId };

      if (dto.name) updateData.name = dto.name;
      if (dto.type) updateData.type = dto.type;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.dimensions) updateData.dimensions = dto.dimensions;
      if (dto.customWidth !== undefined)
        updateData.customWidth = dto.customWidth;
      if (dto.customHeight !== undefined)
        updateData.customHeight = dto.customHeight;
      if (dto.orientation) updateData.orientation = dto.orientation;
      if (dto.backgroundColor) updateData.backgroundColor = dto.backgroundColor;
      if (dto.backgroundImage !== undefined)
        updateData.backgroundImage = dto.backgroundImage;
      if (dto.borderColor) updateData.borderColor = dto.borderColor;
      if (dto.borderWidth !== undefined)
        updateData.borderWidth = dto.borderWidth;
      if (dto.borderRadius !== undefined)
        updateData.borderRadius = dto.borderRadius;
      if (dto.logoRequired !== undefined)
        updateData.logoRequired = dto.logoRequired;
      if (dto.photoRequired !== undefined)
        updateData.photoRequired = dto.photoRequired;
      if (dto.qrCodeRequired !== undefined)
        updateData.qrCodeRequired = dto.qrCodeRequired;
      if (dto.barcodeRequired !== undefined)
        updateData.barcodeRequired = dto.barcodeRequired;
      if (dto.watermark !== undefined) updateData.watermark = dto.watermark;
      if (dto.printMargin !== undefined)
        updateData.printMargin = dto.printMargin;
      if (dto.bleedArea !== undefined) updateData.bleedArea = dto.bleedArea;
      if (dto.safeArea !== undefined) updateData.safeArea = dto.safeArea;
      if (dto.features) updateData.features = dto.features;
      if (dto.metadata) updateData.metadata = dto.metadata;

      const updatedTemplate = await tx.iDCardTemplate.update({
        where: { id },
        data: updateData,
      });

      // Update fields if provided
      if (dto.fields) {
        // Delete existing fields
        await tx.iDCardTemplateField.deleteMany({
          where: { templateId: id },
        });

        // Create new fields
        if (dto.fields.length > 0) {
          await tx.iDCardTemplateField.createMany({
            data: dto.fields.map(field => ({
              templateId: id,
              fieldType: field.fieldType,
              label: field.label,
              databaseField: field.databaseField,
              x: field.x,
              y: field.y,
              width: field.width,
              height: field.height,
              fontSize: field.fontSize,
              fontFamily: field.fontFamily || 'Inter',
              fontWeight: field.fontWeight,
              textAlign: field.textAlign || 'LEFT',
              color: field.color || '#000000',
              backgroundColor: field.backgroundColor,
              borderWidth: field.borderWidth || 0,
              borderColor: field.borderColor || '#cccccc',
              borderRadius: field.borderRadius || 0,
              required: field.required || false,
              placeholder: field.placeholder,
              rotation: field.rotation || 0,
              opacity: field.opacity || 100,
              zIndex: field.zIndex || 1,
              validationRules: {},
              styleOptions: {},
            })),
          });
        }
      }

      return updatedTemplate;
    });

    return this.getTemplateById(template.id);
  }

  async getTemplates(filters: TemplateFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.orientation) {
      where.orientation = filters.orientation;
    }

    if (filters.isDefault !== undefined) {
      where.isDefault = filters.isDefault;
    }

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [templates, total] = await Promise.all([
      this.prisma.iDCardTemplate.findMany({
        where,
        include: {
          fields: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.iDCardTemplate.count({ where }),
    ]);

    return {
      templates: templates.map(template => this.transformTemplate(template)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTemplateById(id: string) {
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id },
      include: {
        fields: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.transformTemplate(template);
  }

  private transformTemplate(template: any) {
    return {
      ...template,
      // Map status to isPublished for frontend compatibility
      isPublished: template.status === 'ACTIVE',
      // Remove status from the response since frontend uses isPublished
      status: undefined,
    };
  }

  async deleteTemplate(id: string, userId: string) {
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.isDefault) {
      throw new BadRequestException('Cannot delete default template');
    }

    await this.prisma.$transaction(async tx => {
      // Delete fields first
      await tx.iDCardTemplateField.deleteMany({
        where: { templateId: id },
      });

      // Delete template
      await tx.iDCardTemplate.delete({
        where: { id },
      });
    });

    return { message: 'Template deleted successfully' };
  }

  async duplicateTemplate(id: string, userId: string) {
    const originalTemplate = await this.getTemplateById(id);

    const newTemplate = await this.prisma.$transaction(async tx => {
      const template = await tx.iDCardTemplate.create({
        data: {
          name: `${originalTemplate.name} (Copy)`,
          type: originalTemplate.type,
          description: originalTemplate.description,
          dimensions: originalTemplate.dimensions,
          customWidth: originalTemplate.customWidth,
          customHeight: originalTemplate.customHeight,
          orientation: originalTemplate.orientation,
          backgroundColor: originalTemplate.backgroundColor,
          backgroundImage: originalTemplate.backgroundImage,
          borderColor: originalTemplate.borderColor,
          borderWidth: originalTemplate.borderWidth,
          borderRadius: originalTemplate.borderRadius,
          logoRequired: originalTemplate.logoRequired,
          photoRequired: originalTemplate.photoRequired,
          qrCodeRequired: originalTemplate.qrCodeRequired,
          barcodeRequired: originalTemplate.barcodeRequired,
          watermark: originalTemplate.watermark,
          printMargin: originalTemplate.printMargin,
          bleedArea: originalTemplate.bleedArea,
          safeArea: originalTemplate.safeArea,
          features: originalTemplate.features as any,
          metadata: originalTemplate.metadata as any,
          isDefault: false,
          createdById: userId,
        },
      });

      // Copy fields
      if (originalTemplate.fields.length > 0) {
        await tx.iDCardTemplateField.createMany({
          data: originalTemplate.fields.map(field => ({
            templateId: template.id,
            fieldType: field.fieldType,
            label: field.label,
            databaseField: field.databaseField,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            fontSize: field.fontSize,
            fontFamily: field.fontFamily,
            fontWeight: field.fontWeight,
            textAlign: field.textAlign,
            color: field.color,
            backgroundColor: field.backgroundColor,
            borderWidth: field.borderWidth,
            borderColor: field.borderColor,
            borderRadius: field.borderRadius,
            required: field.required,
            placeholder: field.placeholder,
            rotation: field.rotation,
            opacity: field.opacity,
            zIndex: field.zIndex,
            validationRules: field.validationRules || {},
            styleOptions: field.styleOptions || {},
          })),
        });
      }

      return template;
    });

    return this.getTemplateById(newTemplate.id);
  }

  async setDefaultTemplate(id: string, userId: string) {
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.prisma.$transaction(async tx => {
      // Remove default from all templates of the same type
      await tx.iDCardTemplate.updateMany({
        where: { isDefault: true, type: template.type },
        data: { isDefault: false },
      });

      // Set new default
      await tx.iDCardTemplate.update({
        where: { id },
        data: {
          isDefault: true,
          updatedById: userId,
        },
      });
    });

    return { message: 'Default template set successfully' };
  }

  async publishTemplate(id: string, userId: string) {
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const updatedTemplate = await this.prisma.iDCardTemplate.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        updatedById: userId,
      },
      include: {
        fields: true,
      },
    });

    return updatedTemplate;
  }

  async unpublishTemplate(id: string, userId: string) {
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.isDefault) {
      throw new BadRequestException('Cannot unpublish default template');
    }

    const updatedTemplate = await this.prisma.iDCardTemplate.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedById: userId,
      },
      include: {
        fields: true,
      },
    });

    return updatedTemplate;
  }

  async getAvailableFields() {
    // Return mock database fields for now
    const fields = [
      {
        name: 'student_name',
        label: 'Student Name',
        type: 'string',
        category: 'personal',
      },
      {
        name: 'student_id',
        label: 'Student ID',
        type: 'string',
        category: 'academic',
      },
      {
        name: 'class_name',
        label: 'Class',
        type: 'string',
        category: 'academic',
      },
      {
        name: 'section',
        label: 'Section',
        type: 'string',
        category: 'academic',
      },
      {
        name: 'roll_number',
        label: 'Roll Number',
        type: 'string',
        category: 'academic',
      },
      {
        name: 'date_of_birth',
        label: 'Date of Birth',
        type: 'date',
        category: 'personal',
      },
      {
        name: 'address',
        label: 'Address',
        type: 'string',
        category: 'contact',
      },
      {
        name: 'phone_number',
        label: 'Phone Number',
        type: 'string',
        category: 'contact',
      },
      { name: 'email', label: 'Email', type: 'string', category: 'contact' },
      {
        name: 'emergency_contact',
        label: 'Emergency Contact',
        type: 'string',
        category: 'contact',
      },
      {
        name: 'blood_group',
        label: 'Blood Group',
        type: 'string',
        category: 'personal',
      },
      {
        name: 'admission_date',
        label: 'Admission Date',
        type: 'date',
        category: 'academic',
      },
      {
        name: 'photo_url',
        label: 'Photo',
        type: 'image',
        category: 'personal',
      },
      {
        name: 'school_name',
        label: 'School Name',
        type: 'string',
        category: 'system',
      },
      {
        name: 'academic_year',
        label: 'Academic Year',
        type: 'string',
        category: 'system',
      },
    ];

    return { fields };
  }

  async getTemplateStats() {
    const [totalTemplates, activeTemplates, totalUsage] = await Promise.all([
      this.prisma.iDCardTemplate.count(),
      this.prisma.iDCardTemplate.count({ where: { status: 'ACTIVE' } }),
      this.prisma.iDCardTemplate.aggregate({
        _sum: { usageCount: true },
      }),
    ]);

    const mostUsedTemplate = await this.prisma.iDCardTemplate.findFirst({
      orderBy: { usageCount: 'desc' },
      select: { id: true, name: true, usageCount: true },
    });

    return {
      totalTemplates,
      activeTemplates,
      totalUsage: totalUsage._sum.usageCount || 0,
      mostUsedTemplate,
      recentUpdates: 0,
      averageFieldsPerTemplate: 0,
    };
  }

  /**
   * Validate template data for business logic
   */
  private validateTemplateData(dto: CreateTemplateDto) {
    // Only validate field configuration, not required fields (templates can be drafts)
    if (dto.fields && dto.fields.length > 0) {
      // Validate QR code fields have proper database mapping
      const qrFields = dto.fields.filter(f => f.fieldType === 'QR_CODE');
      for (const qrField of qrFields) {
        if (qrField.dataSource === 'database' && !qrField.databaseField) {
          throw new BadRequestException(
            'QR code fields with database source must specify a database field',
          );
        }
      }

      // Validate image fields have proper source
      const imageFields = dto.fields.filter(
        f =>
          f.fieldType === 'IMAGE' ||
          f.fieldType === 'PHOTO' ||
          f.fieldType === 'LOGO',
      );
      for (const imageField of imageFields) {
        if (imageField.dataSource === 'database' && !imageField.databaseField) {
          throw new BadRequestException(
            'Image fields with database source must specify a database field',
          );
        }
        if (imageField.dataSource === 'static' && !imageField.imageUrl) {
          throw new BadRequestException(
            'Image fields with static source must specify an image URL',
          );
        }
      }

      // Validate text fields have content
      const textFields = dto.fields.filter(f => f.fieldType === 'TEXT');
      for (const textField of textFields) {
        if (textField.dataSource === 'static' && !textField.staticText) {
          throw new BadRequestException(
            'Text fields with static source must specify static text',
          );
        }
      }

      // Validate field positions don't overlap critically
      this.validateFieldPositions(dto.fields);
    }

    // Validate dimensions
    if (dto.dimensions) {
      const [width, height] = dto.dimensions.split('x').map(d => parseFloat(d));
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        throw new BadRequestException(
          'Invalid dimensions format. Use "width×height" format with positive numbers',
        );
      }
    }
  }

  /**
   * Validate required fields based on template type
   */
  private validateRequiredFields(
    fields: any[],
    templateType: IDCardTemplateType,
  ) {
    // Check for required database field mappings instead of exact labels
    const requiredDatabaseFieldsByType = {
      [IDCardTemplateType.STUDENT]: [
        {
          field: 'studentId',
          alternatives: ['Student ID', 'Roll Number', 'Admission Number'],
        },
        { field: 'fullName', alternatives: ['Full Name', 'First Name'] },
        { field: 'class', alternatives: ['Class', 'Grade'] },
      ],
      [IDCardTemplateType.TEACHER]: [
        { field: 'employeeId', alternatives: ['Employee ID', 'Teacher ID'] },
        { field: 'fullName', alternatives: ['Full Name', 'First Name'] },
        { field: 'designation', alternatives: ['Designation', 'Position'] },
      ],
      [IDCardTemplateType.STAFF]: [
        { field: 'employeeId', alternatives: ['Employee ID', 'Staff ID'] },
        { field: 'fullName', alternatives: ['Full Name', 'First Name'] },
        { field: 'position', alternatives: ['Position', 'Designation'] },
      ],
      [IDCardTemplateType.STAFF_NO_LOGIN]: [
        { field: 'employeeId', alternatives: ['Employee ID', 'Staff ID'] },
        { field: 'fullName', alternatives: ['Full Name', 'First Name'] },
        { field: 'position', alternatives: ['Position', 'Designation'] },
      ],
    };

    const requiredMappings = requiredDatabaseFieldsByType[templateType] || [];
    const fieldLabels = fields.map(f => f.label);
    const databaseFields = fields.map(f => f.databaseField).filter(Boolean);

    const missing: string[] = [];

    for (const requirement of requiredMappings) {
      // Check if any of the alternative labels exist OR if the database field is mapped
      const hasLabel = requirement.alternatives.some(alt =>
        fieldLabels.includes(alt),
      );
      const hasMapping = databaseFields.includes(requirement.field);

      if (!hasLabel && !hasMapping) {
        missing.push(requirement.alternatives[0]); // Use the primary alternative as the missing field name
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate field positions to prevent critical overlaps
   */
  private validateFieldPositions(fields: any[]) {
    // Check for fields that are completely outside template bounds
    const maxX = 400; // Approximate max width
    const maxY = 250; // Approximate max height

    for (const field of fields) {
      if (field.x < 0 || field.y < 0) {
        throw new BadRequestException(
          `Field "${field.label}" has negative position`,
        );
      }
      if (field.x + field.width > maxX || field.y + field.height > maxY) {
        throw new BadRequestException(
          `Field "${field.label}" extends beyond template boundaries`,
        );
      }
    }
  }

  /**
   * Activate template for use (sets status to ACTIVE)
   */
  async activateTemplate(templateId: string, userId: string) {
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id: templateId },
      include: { fields: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Validate template is ready for activation
    if (!template.fields || template.fields.length === 0) {
      throw new BadRequestException(
        'Template must have at least one field before activation',
      );
    }

    // Check for required fields based on type
    const hasRequiredFields = this.validateRequiredFields(
      template.fields,
      template.type,
    );
    if (!hasRequiredFields.valid) {
      throw new BadRequestException(
        `Template missing required fields: ${hasRequiredFields.missing.join(', ')}`,
      );
    }

    return this.prisma.iDCardTemplate.update({
      where: { id: templateId },
      data: {
        status: 'ACTIVE',
        updatedById: userId,
      },
    });
  }

  /**
   * Check if template is ready for ID generation
   */
  async validateTemplateForGeneration(templateId: string): Promise<boolean> {
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id: templateId },
      include: { fields: true },
    });

    if (!template) {
      return false;
    }

    // Must be active
    if (template.status !== 'ACTIVE') {
      return false;
    }

    // Must have fields
    if (!template.fields || template.fields.length === 0) {
      return false;
    }

    // Must have required fields
    const hasRequiredFields = this.validateRequiredFields(
      template.fields,
      template.type,
    );
    return hasRequiredFields.valid;
  }
}
