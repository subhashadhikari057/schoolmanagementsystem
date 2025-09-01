import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PersonSearchService } from './person-search.service';
import { PDFGenerationService } from './pdf-generation.service';
import {
  GenerateIndividualIDCardDto,
  GenerateBulkIDCardsDto,
  IDCardGenerationResult,
  BulkIDCardGenerationResult,
} from './dto/generate-id-card.dto';
import { PersonType } from './dto/person-search.dto';
import { IDCardTemplateType } from '@prisma/client';
import * as QRCode from 'qrcode';

@Injectable()
export class IDCardGenerationService {
  constructor(
    private prisma: PrismaService,
    private personSearchService: PersonSearchService,
    private pdfGenerationService: PDFGenerationService,
  ) {}

  /**
   * Generate an individual ID card
   */
  async generateIndividualIDCard(
    dto: GenerateIndividualIDCardDto,
  ): Promise<IDCardGenerationResult> {
    const { personId, personType, templateId, expiryDate } = dto;

    // Validate template exists and is active
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id: templateId },
      include: { fields: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.status !== 'ACTIVE') {
      throw new BadRequestException('Template is not active');
    }

    // Validate template type matches person type
    const expectedTemplateType = this.getTemplateTypeFromPersonType(personType);
    if (template.type !== expectedTemplateType) {
      throw new BadRequestException(
        `Template type ${template.type} does not match person type ${personType}`,
      );
    }

    // Get person details
    const person = await this.personSearchService.getPersonById(
      personId,
      personType as PersonType,
    );

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    // Get user ID for database operations
    const userId = await this.getUserIdFromPerson(personId, personType);

    // Check if person already has an active ID card of this type
    const existingCard = await this.prisma.iDCard.findFirst({
      where: {
        issuedForId: userId,
        templateId: templateId,
        expiryDate: {
          gte: new Date(),
        },
      },
    });

    if (existingCard) {
      throw new BadRequestException(
        'Person already has an active ID card with this template',
      );
    }

    // Generate QR code data
    const qrData = this.generateQRCodeData(person, userId);
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Create ID card record
    const idCard = await this.prisma.iDCard.create({
      data: {
        templateId,
        issuedForId: userId,
        type: template.type,
        qrCodeData: qrData,
        expiryDate: new Date(expiryDate),
      },
      include: {
        template: true,
      },
    });

    // Generate PDF (placeholder for now)
    const pdfUrl = await this.generateIDCardPDF(idCard, person, template);

    // Update template usage count
    await this.prisma.iDCardTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return {
      id: idCard.id,
      personId: person.id,
      personName: person.name,
      templateName: template.name,
      pdfUrl,
      qrCode: qrCodeUrl,
      expiryDate: idCard.expiryDate.toISOString(),
      generatedAt: idCard.createdAt.toISOString(),
    };
  }

  /**
   * Generate ID cards in bulk
   */
  async generateBulkIDCards(
    dto: GenerateBulkIDCardsDto,
  ): Promise<BulkIDCardGenerationResult> {
    const { type, classId, templateId, expiryDate } = dto;

    // Validate template
    const template = await this.prisma.iDCardTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.status !== 'ACTIVE') {
      throw new BadRequestException('Template is not active');
    }

    let persons: any[] = [];

    // Get persons based on bulk type
    switch (type) {
      case 'class':
        if (!classId) {
          throw new BadRequestException(
            'Class ID is required for class bulk generation',
          );
        }
        persons = await this.getStudentsInClass(classId);
        break;
      case 'all-teachers':
        persons = await this.getAllActiveTeachers();
        break;
      case 'all-staff':
        persons = await this.getAllActiveStaff();
        break;
      default:
        throw new BadRequestException('Invalid bulk generation type');
    }

    const results: BulkIDCardGenerationResult = {
      successful: [],
      failed: [],
      totalProcessed: persons.length,
      successCount: 0,
      failureCount: 0,
    };

    // Process each person
    for (const person of persons) {
      try {
        const personType = this.getPersonTypeFromBulkType(type);
        const individualDto: GenerateIndividualIDCardDto = {
          personId: person.id,
          personType,
          templateId,
          expiryDate,
          notes: dto.notes,
        };

        const result = await this.generateIndividualIDCard(individualDto);
        results.successful.push(result);
        results.successCount++;
      } catch (error) {
        results.failed.push({
          personId: person.id,
          personName: person.name,
          error: error.message || 'Unknown error',
        });
        results.failureCount++;
      }
    }

    return results;
  }

  /**
   * Helper methods
   */
  private getTemplateTypeFromPersonType(
    personType: string,
  ): IDCardTemplateType {
    switch (personType) {
      case 'student':
        return IDCardTemplateType.STUDENT;
      case 'teacher':
        return IDCardTemplateType.TEACHER;
      case 'staff':
        return IDCardTemplateType.STAFF;
      default:
        throw new BadRequestException('Invalid person type');
    }
  }

  private getPersonTypeFromBulkType(
    bulkType: string,
  ): 'student' | 'teacher' | 'staff' {
    switch (bulkType) {
      case 'class':
        return 'student';
      case 'all-teachers':
        return 'teacher';
      case 'all-staff':
        return 'staff';
      default:
        throw new BadRequestException('Invalid bulk type');
    }
  }

  private async getUserIdFromPerson(
    personId: string,
    personType: string,
  ): Promise<string> {
    if (personType === 'student') {
      const student = await this.prisma.student.findUnique({
        where: { id: personId },
        select: { userId: true },
      });
      return student?.userId || '';
    } else if (personType === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: personId },
        select: { userId: true },
      });
      return teacher?.userId || '';
    } else if (personType === 'staff') {
      const staff = await this.prisma.staff.findUnique({
        where: { id: personId },
        select: { userId: true },
      });
      return staff?.userId || '';
    } else {
      throw new BadRequestException('Invalid person type');
    }
  }

  private generateQRCodeData(person: any, userId: string): string {
    // Generate QR code data with person information
    const qrData = {
      id: userId,
      name: person.name,
      type: person.type,
      rollNumber: person.rollNumber,
      employeeId: person.employeeId,
      generatedAt: new Date().toISOString(),
      // Add verification URL
      verifyUrl: `${process.env.FRONTEND_URL}/verify/${userId}`,
    };

    return JSON.stringify(qrData);
  }

  private async generateIDCardPDF(
    idCard: any,
    person: any,
    template: any,
  ): Promise<string> {
    try {
      // Get full person data from database
      const fullPersonData = await this.getFullPersonData(
        person.id,
        person.type,
      );

      // Generate filename
      const filename = `id_card_${idCard.id}_${Date.now()}.pdf`;

      // Generate PDF using the PDF generation service
      await this.pdfGenerationService.generateIDCardPDF({
        template,
        personData: fullPersonData,
        qrCodeData: idCard.qrCodeData,
        outputPath: filename,
      });

      // Return the URL for accessing the PDF
      return this.pdfGenerationService.getPDFUrl(filename);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating PDF:', error);
      }
      // Return a placeholder URL if PDF generation fails
      return `/api/id-cards/${idCard.id}/pdf`;
    }
  }

  /**
   * Get full person data for PDF generation
   */
  private async getFullPersonData(
    personId: string,
    personType: string,
  ): Promise<any> {
    if (personType === 'student') {
      const student = await this.prisma.student.findUnique({
        where: { id: personId },
        include: {
          user: true,
          class: true,
          profile: true,
        },
      });
      return student;
    } else if (personType === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: personId },
        include: {
          user: true,
          profile: true,
        },
      });
      return teacher;
    } else if (personType === 'staff') {
      const staff = await this.prisma.staff.findUnique({
        where: { id: personId },
        include: {
          user: true,
          profile: true,
        },
      });
      return staff;
    } else {
      throw new BadRequestException('Invalid person type');
    }
  }

  private async getStudentsInClass(classId: string) {
    const students = await this.prisma.student.findMany({
      where: {
        classId,
        deletedAt: null,
        academicStatus: 'active',
      },
      include: {
        user: true,
        class: true,
      },
    });

    return students.map(student => ({
      id: student.id,
      name: student.user?.fullName || 'Unknown Student',
      type: 'student',
    }));
  }

  private async getAllActiveTeachers() {
    const teachers = await this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        employmentStatus: 'active',
      },
      include: {
        user: true,
      },
    });

    return teachers.map(teacher => ({
      id: teacher.id,
      name: teacher.user?.fullName || 'Unknown Teacher',
      type: 'teacher',
    }));
  }

  private async getAllActiveStaff() {
    const staff = await this.prisma.staff.findMany({
      where: {
        deletedAt: null,
        employmentStatus: 'active',
      },
    });

    return staff.map(staffMember => ({
      id: staffMember.id,
      name: staffMember.fullName,
      type: 'staff',
    }));
  }
}
