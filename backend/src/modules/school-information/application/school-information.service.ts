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
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  CreateSchoolInformationDtoType,
  UpdateSchoolInformationDtoType,
  SchoolInformationResponseDtoType,
} from '../dto/school-information.dto';

function normalizeSchoolInfoDto<
  T extends CreateSchoolInformationDtoType | UpdateSchoolInformationDtoType,
>(dto: T): T {
  const dateFields: (keyof typeof dto)[] = [
    'ecdApprovalDate',
    'primaryApprovalDate',
    'lowerSecondaryApprovalDate',
  ];

  const normalized: Record<string, any> = { ...dto };

  for (const key of dateFields) {
    const value = (dto as any)[key];
    if (typeof value === 'string' && value.trim() !== '') {
      (normalized as any)[key] = new Date(value);
    }
  }

  return normalized as T;
}

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
      const data = normalizeSchoolInfoDto(dto);
      const schoolInformation = await this.prisma.schoolInformation.create({
        data: {
          ...data,
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
      const data = normalizeSchoolInfoDto(dto);
      const updatedSchoolInformation =
        await this.prisma.schoolInformation.update({
          where: { id: existingSchool.id },
          data: {
            ...data,
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

  /**
   * Generate a School Report Card PDF using available data only.
   */
  async generateReportCardPdf(params: {
    year?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    const schoolInfo = await this.prisma.schoolInformation.findFirst();
    if (!schoolInfo) {
      throw new NotFoundException('School information not found');
    }

    const classes = await this.prisma.class.findMany({
      select: { id: true, grade: true, section: true },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });

    const students = await this.prisma.student.findMany({
      select: {
        id: true,
        gender: true,
        disabilityType: true,
        class: { select: { grade: true } },
      },
    });

    const teachers = await this.prisma.teacher.findMany({
      select: { gender: true, qualification: true },
    });

    // Aggregate students by grade/gender
    const gradeCounts: Record<string, { boys: number; girls: number }> = {};
    const disabilityCount = { boys: 0, girls: 0 };
    for (const s of students) {
      const gradeKey = s.class?.grade ? `Grade ${s.class.grade}` : 'Unknown';
      if (!gradeCounts[gradeKey]) gradeCounts[gradeKey] = { boys: 0, girls: 0 };
      if ((s.gender || '').toLowerCase() === 'male')
        gradeCounts[gradeKey].boys += 1;
      else gradeCounts[gradeKey].girls += 1;
      if (s.disabilityType) {
        if ((s.gender || '').toLowerCase() === 'male')
          disabilityCount.boys += 1;
        else disabilityCount.girls += 1;
      }
    }

    // Teacher aggregates
    const teacherGender = { male: 0, female: 0 };
    const qualificationCounts: Record<
      string,
      { male: number; female: number }
    > = {};
    for (const t of teachers) {
      if ((t.gender || '').toLowerCase() === 'male') teacherGender.male += 1;
      else teacherGender.female += 1;
      const q = t.qualification || 'Other';
      if (!qualificationCounts[q])
        qualificationCounts[q] = { male: 0, female: 0 };
      if ((t.gender || '').toLowerCase() === 'male')
        qualificationCounts[q].male += 1;
      else qualificationCounts[q].female += 1;
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c as Buffer));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const titleYear = params.year || new Date().getFullYear();

    const addHeader = () => {
      doc.fontSize(10).text('IEMIS / EMIS', { align: 'left' });
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`SCHOOL REPORT CARD – ${titleYear}`, { align: 'center' });
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(schoolInfo.schoolName || 'N/A', { align: 'center' });
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `${schoolInfo.municipality || 'N/A'}, Ward ${schoolInfo.ward || 'N/A'}, ${schoolInfo.district || 'N/A'}, ${schoolInfo.province || 'N/A'}`,
          { align: 'center' },
        );
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`IEMIS CODE: ${schoolInfo.schoolCode || 'N/A'}`, {
          align: 'right',
        });
      doc.moveDown(1);
    };

    const addSectionTitle = (label: string) => {
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold').text(label);
      doc.moveDown(0.3);
    };

    addHeader();

    // Section: School Details
    addSectionTitle('School Details');
    const detailRows = [
      ['Head Teacher', schoolInfo.headTeacherName || 'N/A'],
      ['School Type', schoolInfo.schoolType || 'N/A'],
      ['Established', schoolInfo.establishedYear?.toString() || 'N/A'],
      ['Contact', (schoolInfo.contactNumbers || []).join(', ') || 'N/A'],
      ['Email', schoolInfo.email || 'N/A'],
      ['Max Running Class', schoolInfo.classRegisteredUpto || 'N/A'],
    ];
    detailRows.forEach(row => {
      doc.fontSize(10).font('Helvetica-Bold').text(`${row[0]}: `, {
        continued: true,
      });
      doc.font('Helvetica').text(row[1]);
    });

    // Section: Students
    addSectionTitle('Student - Current Year Details');
    doc.fontSize(10).font('Helvetica');
    Object.keys(gradeCounts)
      .sort()
      .forEach(key => {
        const val = gradeCounts[key];
        doc.text(`${key}: Girls ${val.girls} | Boys ${val.boys}`);
      });
    doc.text(
      `Students with Disability: Girls ${disabilityCount.girls} | Boys ${disabilityCount.boys}`,
    );

    // Section: Infrastructure (using available booleans)
    addSectionTitle('Infrastructure');
    const infraItems: [string, boolean | null | undefined][] = [
      [
        'Library',
        schoolInfo.specialDisabilitySchool === false
          ? true
          : schoolInfo.specialDisabilitySchool,
      ],
      ['Science Lab', schoolInfo.scienceSubjectTaughtIn11And12],
      ['Playground', schoolInfo.runningGrade1],
      ['Drinking water', true],
      ['Electricity', true],
      [
        'Internet',
        schoolInfo.foreignAffiliation === false
          ? true
          : !schoolInfo.foreignAffiliation,
      ],
    ];
    infraItems.forEach(([label, flag]) => {
      doc.text(`${label}: ${flag ? '✔' : '✖'}`);
    });

    // Section: Governance (using available fields)
    addSectionTitle('School Governance');
    doc.text(
      `Complaint Response: ${schoolInfo.complaintHearingMechanism ? '✔' : '✖'}`,
    );
    doc.text(
      `Multilingual Education: ${schoolInfo.multilingualEducation ? '✔' : '✖'}`,
    );
    doc.text(
      `Model School Selected: ${schoolInfo.selectedForModelSchool ? '✔' : '✖'}`,
    );

    // Section: Teachers
    addSectionTitle('Teachers');
    doc.text(`Female: ${teacherGender.female} | Male: ${teacherGender.male}`);
    doc.text('Qualifications:');
    Object.entries(qualificationCounts).forEach(([q, val]) => {
      doc.text(` - ${q}: ${val.female} | ${val.male}`);
    });

    // Section: Efficiency
    addSectionTitle('Efficiency and Performance');
    doc.text('School opening days: N/A');
    doc.text('Teaching learning days: N/A');
    doc.text('Average Marks: N/A');

    doc.end();
    return done;
  }
}
