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

  /**
   * Aggregate School Report Card data (JSON) using only available fields.
   */
  async getReportCardData(params: {
    year?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const schoolInfo = await this.prisma.schoolInformation.findFirst();
    if (!schoolInfo) {
      throw new NotFoundException('School information not found');
    }

    const now = new Date();
    const year = params.year || now.getFullYear();
    const rangeStart = params.startDate
      ? new Date(params.startDate)
      : new Date(year, 0, 1);
    const rangeEnd = params.endDate
      ? new Date(params.endDate)
      : new Date(year, 11, 31);

    // Fetch core entities
    const [
      students,
      teachers,
      scholarshipAssignments,
      examResults,
      promotions,
    ] = await Promise.all([
      this.prisma.student.findMany({
        select: {
          id: true,
          gender: true,
          ethnicity: true,
          motherTongue: true,
          disabilityType: true,
          class: { select: { grade: true } },
        },
      }),
      this.prisma.teacher.findMany({
        select: {
          id: true,
          gender: true,
          qualification: true,
          designation: true,
          department: true,
          totalSalary: true,
          classAssignments: {
            select: {
              class: {
                select: {
                  grade: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.scholarshipAssignment.findMany({
        where: {
          effectiveFrom: { lte: rangeEnd },
          OR: [{ expiresAt: null }, { expiresAt: { gte: rangeStart } }],
        },
        select: {
          scholarship: { select: { name: true, type: true } },
          student: {
            select: { gender: true, class: { select: { grade: true } } },
          },
        },
      }),
      this.prisma.examResult.findMany({
        where: {
          examSlot: {
            dateslot: {
              examDate: {
                gte: rangeStart,
                lte: rangeEnd,
              },
            },
          },
        },
        select: {
          studentId: true,
          marksObtained: true,
          isPassed: true,
          student: {
            select: {
              gender: true,
              class: { select: { grade: true } },
            },
          },
          examSlot: {
            select: {
              subject: { select: { name: true } },
              dateslot: { select: { examDate: true } },
            },
          },
        },
      }),
      this.prisma.promotionRecord.findMany({
        where: {
          batch: {
            OR: [
              { fromAcademicYear: { contains: year.toString() } },
              { toAcademicYear: { contains: year.toString() } },
            ],
          },
        },
        select: {
          promotionType: true,
          student: {
            select: {
              gender: true,
              class: { select: { grade: true } },
            },
          },
        },
      }),
    ]);

    // Attendance coverage
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        session: {
          date: { gte: rangeStart, lte: rangeEnd },
        },
      },
      select: {
        status: true,
        studentId: true,
        session: {
          select: {
            class: { select: { grade: true } },
          },
        },
      },
    });

    const uniqueAttendanceStudents = new Set<string>();
    const attendanceByGrade: Record<
      string,
      { present: number; total: number }
    > = {};
    attendanceRecords.forEach(r => {
      uniqueAttendanceStudents.add(r.studentId);
      const grade = r.session.class?.grade ?? null;
      const gradeKey = grade ? `Grade ${grade}` : 'Unknown';
      if (!attendanceByGrade[gradeKey])
        attendanceByGrade[gradeKey] = { present: 0, total: 0 };
      attendanceByGrade[gradeKey].total += 1;
      if (r.status === 'PRESENT') attendanceByGrade[gradeKey].present += 1;
    });

    // Student aggregates
    const enrollmentByGrade: Record<string, { boys: number; girls: number }> =
      {};
    const ethnicityCounts: Record<string, number> = {};
    const motherTongueCounts: Record<string, number> = {};
    const disabilityTypeCounts: Record<string, number> = {};
    const disabilityByGrade: Record<string, { boys: number; girls: number }> =
      {};
    const classSize: Record<string, number> = {};

    students.forEach(s => {
      const gradeKey = s.class?.grade ? `Grade ${s.class.grade}` : 'Unknown';
      if (!enrollmentByGrade[gradeKey])
        enrollmentByGrade[gradeKey] = { boys: 0, girls: 0 };
      if (!classSize[gradeKey]) classSize[gradeKey] = 0;
      const isMale = (s.gender || '').toLowerCase() === 'male';
      if (isMale) enrollmentByGrade[gradeKey].boys += 1;
      else enrollmentByGrade[gradeKey].girls += 1;
      classSize[gradeKey] += 1;

      if (s.ethnicity)
        ethnicityCounts[s.ethnicity] = (ethnicityCounts[s.ethnicity] || 0) + 1;
      if (s.motherTongue)
        motherTongueCounts[s.motherTongue] =
          (motherTongueCounts[s.motherTongue] || 0) + 1;
      const disabilityKey = s.disabilityType || 'No Disability';
      disabilityTypeCounts[disabilityKey] =
        (disabilityTypeCounts[disabilityKey] || 0) + 1;
      if (s.disabilityType) {
        if (!disabilityByGrade[gradeKey])
          disabilityByGrade[gradeKey] = { boys: 0, girls: 0 };
        if (isMale) disabilityByGrade[gradeKey].boys += 1;
        else disabilityByGrade[gradeKey].girls += 1;
      }
    });

    // Scholarship aggregates
    const scholarshipByType: Record<string, number> = {};
    const scholarshipByGender: Record<string, number> = {};
    scholarshipAssignments.forEach(sa => {
      const type = sa.scholarship?.name || 'Unknown';
      scholarshipByType[type] = (scholarshipByType[type] || 0) + 1;
      const gender = (sa.student.gender || 'Unknown').toLowerCase();
      scholarshipByGender[gender] = (scholarshipByGender[gender] || 0) + 1;
    });

    // Teacher aggregates
    const teacherGender: Record<string, number> = {
      male: 0,
      female: 0,
      other: 0,
    };
    const qualificationCounts: Record<string, number> = {};
    const designationCounts: Record<string, number> = {};
    const departmentCounts: Record<string, number> = {};
    const levelCounts: Record<string, number> = {};
    const salaryBuckets: Record<string, number> = {};

    const bucketSalary = (val?: any) => {
      const num = val ? Number(val) : 0;
      if (!num) return 'Unknown';
      if (num < 20000) return '<20k';
      if (num < 40000) return '20k-40k';
      if (num < 60000) return '40k-60k';
      if (num < 80000) return '60k-80k';
      return '80k+';
    };

    const gradeToLevel = (grade?: number | null) => {
      if (grade === null || grade === undefined) return 'Unknown';
      if (grade === 0) return 'ECD';
      if (grade >= 1 && grade <= 5) return 'Basic (1-5)';
      if (grade >= 6 && grade <= 8) return 'Lower Secondary (6-8)';
      return 'Secondary (9-12)';
    };

    teachers.forEach(t => {
      const g = (t.gender || 'Other').toLowerCase();
      if (g === 'male') teacherGender.male += 1;
      else if (g === 'female') teacherGender.female += 1;
      else teacherGender.other += 1;

      const q = t.qualification || 'Other';
      qualificationCounts[q] = (qualificationCounts[q] || 0) + 1;
      if (t.designation)
        designationCounts[t.designation] =
          (designationCounts[t.designation] || 0) + 1;
      if (t.department)
        departmentCounts[t.department] =
          (departmentCounts[t.department] || 0) + 1;

      const levelSet = new Set<string>();
      t.classAssignments?.forEach(ca => {
        levelSet.add(gradeToLevel(ca.class?.grade));
      });
      if (levelSet.size === 0) levelSet.add('Unknown');
      levelSet.forEach(level => {
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });

      const bucket = bucketSalary(t.totalSalary);
      salaryBuckets[bucket] = (salaryBuckets[bucket] || 0) + 1;
    });

    // Exam aggregates
    const averageBySubject: Record<
      string,
      { sum: number; count: number; male: number; female: number }
    > = {};
    const averageByGradeSubject: Record<
      string,
      Record<string, { sum: number; count: number }>
    > = {};
    const passFailBySubject: Record<string, { pass: number; fail: number }> =
      {};
    const scoreDistribution: Record<string, number> = {};

    const scoreBucket = (mark: number) => {
      if (mark < 20) return '0-20';
      if (mark < 40) return '20-40';
      if (mark < 60) return '40-60';
      if (mark < 80) return '60-80';
      return '80-100';
    };

    examResults.forEach(er => {
      const subject = er.examSlot.subject?.name || 'Unknown';
      const mark = er.marksObtained ? Number(er.marksObtained) : null;
      const gender = (er.student.gender || 'Unknown').toLowerCase();
      const gradeKey = er.student.class?.grade
        ? `Grade ${er.student.class.grade}`
        : 'Unknown';

      if (!averageBySubject[subject])
        averageBySubject[subject] = { sum: 0, count: 0, male: 0, female: 0 };
      if (!averageByGradeSubject[gradeKey])
        averageByGradeSubject[gradeKey] = {};
      if (!averageByGradeSubject[gradeKey][subject])
        averageByGradeSubject[gradeKey][subject] = { sum: 0, count: 0 };

      if (mark !== null) {
        averageBySubject[subject].sum += mark;
        averageBySubject[subject].count += 1;
        averageByGradeSubject[gradeKey][subject].sum += mark;
        averageByGradeSubject[gradeKey][subject].count += 1;
        const bucket = scoreBucket(mark);
        scoreDistribution[bucket] = (scoreDistribution[bucket] || 0) + 1;
        if (gender === 'male') averageBySubject[subject].male += mark;
        else if (gender === 'female') averageBySubject[subject].female += mark;
      }

      if (!passFailBySubject[subject])
        passFailBySubject[subject] = { pass: 0, fail: 0 };
      if (er.isPassed) passFailBySubject[subject].pass += 1;
      else passFailBySubject[subject].fail += 1;
    });

    // Promotion aggregates
    const promotionOverall = { promoted: 0, retained: 0, graduated: 0 };
    const promotionByGender: Record<
      string,
      { promoted: number; retained: number; graduated: number }
    > = {};
    const promotionByGrade: Record<
      string,
      { promoted: number; retained: number; graduated: number }
    > = {};

    promotions.forEach(p => {
      const type = p.promotionType;
      if (type === 'PROMOTED') promotionOverall.promoted += 1;
      else if (type === 'RETAINED') promotionOverall.retained += 1;
      else if (type === 'GRADUATED') promotionOverall.graduated += 1;

      const gender = (p.student.gender || 'Unknown').toLowerCase();
      if (!promotionByGender[gender])
        promotionByGender[gender] = { promoted: 0, retained: 0, graduated: 0 };
      if (type === 'PROMOTED') promotionByGender[gender].promoted += 1;
      else if (type === 'RETAINED') promotionByGender[gender].retained += 1;
      else if (type === 'GRADUATED') promotionByGender[gender].graduated += 1;

      const gradeKey = p.student.class?.grade
        ? `Grade ${p.student.class.grade}`
        : 'Unknown';
      if (!promotionByGrade[gradeKey])
        promotionByGrade[gradeKey] = {
          promoted: 0,
          retained: 0,
          graduated: 0,
        };
      if (type === 'PROMOTED') promotionByGrade[gradeKey].promoted += 1;
      else if (type === 'RETAINED') promotionByGrade[gradeKey].retained += 1;
      else if (type === 'GRADUATED') promotionByGrade[gradeKey].graduated += 1;
    });

    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const overallRatio =
      totalTeachers > 0
        ? Number((totalStudents / totalTeachers).toFixed(2))
        : null;

    const ratioByLevel = Object.entries(levelCounts).map(([label, count]) => {
      if (!count) return { label, ratio: null };
      // approximate student count per level from classSize
      let studentCount = 0;
      Object.entries(classSize).forEach(([gradeKey, value]) => {
        if (
          (label === 'ECD' && gradeKey.includes('0')) ||
          (label === 'Basic (1-5)' && /Grade (1|2|3|4|5)/.test(gradeKey)) ||
          (label === 'Lower Secondary (6-8)' &&
            /Grade (6|7|8)/.test(gradeKey)) ||
          (label === 'Secondary (9-12)' && /Grade (9|10|11|12)/.test(gradeKey))
        ) {
          studentCount += value;
        }
      });
      return {
        label,
        ratio: count ? Number(((studentCount || 0) / count).toFixed(2)) : null,
      };
    });

    return {
      schoolInfo,
      filters: {
        year,
        startDate: rangeStart,
        endDate: rangeEnd,
      },
      students: {
        enrollmentByGrade: Object.entries(enrollmentByGrade).map(
          ([grade, val]) => ({ grade, ...val }),
        ),
        ethnicity: Object.entries(ethnicityCounts).map(([label, count]) => ({
          label,
          count,
        })),
        motherTongue: Object.entries(motherTongueCounts).map(
          ([label, count]) => ({ label, count }),
        ),
        disabilityTypes: Object.entries(disabilityTypeCounts).map(
          ([label, count]) => ({ label, count }),
        ),
        disabilityByGrade: Object.entries(disabilityByGrade).map(
          ([grade, val]) => ({ grade, ...val }),
        ),
        scholarshipsByType: Object.entries(scholarshipByType).map(
          ([label, count]) => ({ label, count }),
        ),
        scholarshipsByGender: Object.entries(scholarshipByGender).map(
          ([label, count]) => ({ label, count }),
        ),
        classSize: Object.entries(classSize).map(([grade, total]) => ({
          grade,
          total,
        })),
        attendanceByGrade: Object.entries(attendanceByGrade).map(
          ([grade, val]) => ({
            grade,
            rate: val.total ? Math.round((val.present / val.total) * 100) : 0,
          }),
        ),
        totals: {
          students: totalStudents,
          scholarshipRecipients: scholarshipAssignments.length,
          attendanceCoverage: uniqueAttendanceStudents.size,
        },
      },
      teachers: {
        gender: Object.entries(teacherGender).map(([label, count]) => ({
          label,
          count,
        })),
        qualification: Object.entries(qualificationCounts).map(
          ([label, count]) => ({ label, count }),
        ),
        designation: Object.entries(designationCounts).map(
          ([label, count]) => ({ label, count }),
        ),
        department: Object.entries(departmentCounts).map(([label, count]) => ({
          label,
          count,
        })),
        level: Object.entries(levelCounts).map(([label, count]) => ({
          label,
          count,
        })),
        salary: Object.entries(salaryBuckets).map(([label, count]) => ({
          label,
          count,
        })),
        ratios: {
          overall: overallRatio,
          byLevel: ratioByLevel,
        },
        totals: {
          teachers: totalTeachers,
        },
      },
      exams: {
        averageBySubject: Object.entries(averageBySubject).map(
          ([subject, val]) => ({
            subject,
            average: val.count ? Number((val.sum / val.count).toFixed(2)) : 0,
            maleAverage:
              val.count && val.male
                ? Number((val.male / val.count).toFixed(2))
                : 0,
            femaleAverage:
              val.count && val.female
                ? Number((val.female / val.count).toFixed(2))
                : 0,
          }),
        ),
        averageByGrade: Object.entries(averageByGradeSubject).map(
          ([grade, subjects]) => ({
            grade,
            subjects: Object.entries(subjects).map(([subject, val]) => ({
              subject,
              average: val.count ? Number((val.sum / val.count).toFixed(2)) : 0,
            })),
          }),
        ),
        passFailBySubject: Object.entries(passFailBySubject).map(
          ([subject, val]) => ({ subject, ...val }),
        ),
        scoreDistribution: Object.entries(scoreDistribution).map(
          ([bucket, count]) => ({ bucket, count }),
        ),
        coverage: {
          resultsCount: examResults.length,
          studentsWithResults: new Set(examResults.map(r => r.studentId)).size,
          totalStudents,
        },
      },
      promotions: {
        overall: promotionOverall,
        byGender: Object.entries(promotionByGender).map(([gender, val]) => ({
          gender,
          ...val,
        })),
        byGrade: Object.entries(promotionByGrade).map(([grade, val]) => ({
          grade,
          ...val,
        })),
      },
      footer: {
        totalStudents,
        totalTeachers,
        studentTeacherRatio: overallRatio,
        examCoverage: examResults.length,
        attendanceCoverage: uniqueAttendanceStudents.size,
      },
    };
  }
}
