import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { TeacherService } from './teacher.service';
import { SubjectService } from '../../subject/application/subject.service';
import { ClassService } from '../../class/application/class.service';
import { parseCSV, parseRecords } from '../../../shared/utils/csv-parser.util';
import {
  TeacherImportRowSchema,
  TeacherImportRow,
} from '../dto/teacher-import.dto';

export interface TeacherImportResult {
  success: boolean;
  message: string;
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  errors: Array<{
    row: number;
    teacher: string;
    error: string;
  }>;
  importedTeachers: Array<{
    id: string;
    fullName: string;
    email: string;
    employeeId: string;
    designation: string;
  }>;
}

export interface TeacherExportParams {
  department?: string;
  search?: string;
  designation?: string;
}

@Injectable()
export class TeacherImportService {
  private readonly logger = new Logger(TeacherImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly teacherService: TeacherService,
    private readonly subjectService: SubjectService,
    private readonly classService: ClassService,
  ) {}

  /**
   * Import teachers from CSV content
   */
  async importTeachersFromCSV(
    csvContent: string,
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<TeacherImportResult> {
    try {
      // Parse and validate CSV
      const parseResult = parseCSV<TeacherImportRow>(
        csvContent,
        TeacherImportRowSchema,
      );
      return this.processImport(parseResult, createdBy, options);
    } catch (error) {
      this.logger.error('Failed to import teachers from CSV', error);
      throw error;
    }
  }

  /**
   * Import teachers from parsed records (e.g., XLSX)
   */
  async importTeachersFromRecords(
    records: Record<string, string>[],
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<TeacherImportResult> {
    try {
      const parseResult = parseRecords<TeacherImportRow>(
        records,
        TeacherImportRowSchema,
      );
      return this.processImport(parseResult, createdBy, options);
    } catch (error) {
      this.logger.error('Failed to import teachers from records', error);
      throw error;
    }
  }

  private async processImport(
    parseResult: {
      data: TeacherImportRow[];
      errors: Array<{ row: number; line: string; error: string }>;
      totalRows: number;
      validRows: number;
      invalidRows: number;
    },
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<TeacherImportResult> {
    this.logger.log(
      `CSV parsed. Total rows: ${parseResult.totalRows}, valid: ${parseResult.validRows}, invalid: ${parseResult.invalidRows}`,
    );

    const result: TeacherImportResult = {
      success: true,
      message: 'Import completed successfully',
      totalProcessed: parseResult.data.length,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      importedTeachers: [],
    };

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNumber = i + 1;

      try {
        const existingTeacher = await this.prisma.teacher.findFirst({
          where: {
            user: {
              email: row.email,
            },
            deletedAt: null,
          },
          include: {
            user: true,
          },
        });

        if (existingTeacher) {
          if (options.updateExisting) {
            await this.updateExistingTeacher(
              existingTeacher.id,
              row,
              createdBy,
            );
            result.successfulImports++;
            result.importedTeachers.push({
              id: existingTeacher.id,
              fullName: row.fullName,
              email: row.email,
              employeeId: existingTeacher.employeeId || '',
              designation: row.designation || 'Teacher',
            });
          } else if (options.skipDuplicates) {
            continue;
          } else {
            throw new Error(`Teacher with email ${row.email} already exists`);
          }
        } else {
          const newTeacher = await this.createNewTeacher(row, createdBy);
          result.successfulImports++;
          result.importedTeachers.push({
            id: newTeacher.id,
            fullName: row.fullName,
            email: row.email,
            employeeId: newTeacher.employeeId || '',
            designation: row.designation || 'Teacher',
          });
        }
      } catch (error) {
        this.logger.error(`Error processing row ${rowNumber}`);
        result.failedImports++;
        result.errors.push({
          row: rowNumber,
          teacher: row.fullName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (result.failedImports > 0) {
      result.message = `Import completed with ${result.failedImports} errors`;
      result.success = false;
    }

    this.logger.log(
      `Import completed. Processed: ${result.totalProcessed}, successful: ${result.successfulImports}, failed: ${result.failedImports}`,
    );
    return result;
  }

  /**
   * Create a new teacher from import data
   */
  private async createNewTeacher(row: TeacherImportRow, createdBy: string) {
    // Parse subjects and classes
    const subjectCodes = row.subjects
      ? row.subjects.split(',').map(s => s.trim())
      : [];
    const classSections = row.classes
      ? row.classes.split(',').map(c => c.trim())
      : [];

    // Create teacher data
    const teacherData = {
      user: {
        firstName: row.fullName.split(' ')[0] || row.fullName,
        lastName: row.fullName.split(' ').slice(1).join(' ') || '',
        email: row.email,
        phone: row.phone,
      },
      personal: {
        dateOfBirth: row.dateOfBirth,
        gender: row.gender as 'Male' | 'Female' | 'Other',
      },
      professional: {
        employeeId: row.employeeId,
        joiningDate: row.joiningDate,
        experienceYears: parseInt(row.experienceYears || '0') || 0,
        highestQualification: row.highestQualification,
        specialization: row.specialization || '',
        designation: row.designation || 'Teacher',
        department: row.department || '',
      },
      salary: {
        basicSalary: parseFloat(row.basicSalary || '0') || 0,
        allowances: parseFloat(row.allowances || '0') || 0,
      },
      bankDetails: {
        bankName: row.bankName || '',
        bankAccountNumber: row.bankAccountNumber || '',
        bankBranch: row.bankBranch || '',
        panNumber: row.panNumber || '',
        citizenshipNumber: row.citizenshipNumber || '',
        ssfNumber: row.ssfNumber || '',
        citNumber: row.citNumber || '',
      },
    };

    // Create teacher using existing service
    const result = await this.teacherService.create(
      teacherData,
      createdBy,
      undefined, // No profile picture for import
      '127.0.0.1', // Default IP for import
      'CSV Import', // Default user agent for import
    );

    // Intentionally do not log credentials

    // Assign subjects if provided
    if (subjectCodes.length > 0) {
      await this.assignSubjectsToTeacher(
        result.teacher.id,
        subjectCodes,
        createdBy,
      );
    }

    // Assign classes if provided
    if (classSections.length > 0) {
      await this.assignClassesToTeacher(
        result.teacher.id,
        classSections,
        createdBy,
      );
    }

    return result.teacher;
  }

  /**
   * Update existing teacher from import data
   */
  private async updateExistingTeacher(
    teacherId: string,
    row: TeacherImportRow,
    updatedBy: string,
  ) {
    // Update teacher data
    const updateData = {
      professional: {
        employeeId: row.employeeId,
        joiningDate: row.joiningDate,
        experienceYears: parseInt(row.experienceYears || '0') || 0,
        highestQualification: row.highestQualification,
        specialization: row.specialization || '',
        designation: row.designation || 'Teacher',
        department: row.department || '',
      },
      salary: {
        basicSalary: parseFloat(row.basicSalary || '0') || 0,
        allowances: parseFloat(row.allowances || '0') || 0,
      },
      bankDetails: {
        bankName: row.bankName || '',
        bankAccountNumber: row.bankAccountNumber || '',
        bankBranch: row.bankBranch || '',
      },
    };

    await this.teacherService.updateByAdmin(teacherId, updateData, updatedBy);

    // Update subject and class assignments
    if (row.subjects) {
      const subjectCodes = row.subjects
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
      await this.assignSubjectsToTeacher(teacherId, subjectCodes, updatedBy);
    }

    if (row.classes) {
      const classSections = row.classes
        .split(',')
        .map(c => c.trim().toUpperCase())
        .filter(Boolean);
      await this.assignClassesToTeacher(teacherId, classSections, updatedBy);
    }
  }

  /**
   * Assign subjects to teacher
   */
  private async assignSubjectsToTeacher(
    teacherId: string,
    subjectCodes: string[],
    createdBy: string,
  ) {
    try {
      // Get subject IDs from codes
      const subjects = await this.prisma.subject.findMany({
        where: {
          code: { in: subjectCodes },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (subjects.length > 0) {
        const subjectIds = subjects.map(s => s.id);
        await this.teacherService.assignSubjects(
          teacherId,
          subjectIds,
          createdBy,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to assign subjects to teacher ${teacherId}:`,
        error,
      );
    }
  }

  /**
   * Assign classes to teacher
   */
  private async assignClassesToTeacher(
    teacherId: string,
    classSections: string[],
    createdBy: string,
  ) {
    try {
      // Parse class sections (e.g., "10-A" -> grade: 10, section: "A")
      const classData = classSections
        .map(cs => {
          const normalized = cs.trim().toUpperCase();
          const match = normalized.match(/^(\d+)-([A-Z])$/);
          if (match) {
            return {
              grade: parseInt(match[1]),
              section: match[2],
            };
          }
          return null;
        })
        .filter((cd): cd is { grade: number; section: string } => cd !== null);

      // Get class IDs
      const classes = await this.prisma.class.findMany({
        where: {
          AND: classData.map(cd => ({
            grade: cd.grade,
            section: cd.section,
            deletedAt: null,
          })),
        },
        select: { id: true },
      });

      if (classes.length > 0) {
        const classIds = classes.map(c => ({ classId: c.id }));
        await this.teacherService.assignClasses(teacherId, classIds, createdBy);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to assign classes to teacher ${teacherId}:`,
        error,
      );
    }
  }

  async exportTeachersToRows(
    params: TeacherExportParams,
  ): Promise<{ headers: string[]; rows: Array<Array<string | number>> }> {
    try {
      // Build where clause
      const where: any = { deletedAt: null };

      if (params.department) {
        where.department = params.department;
      }

      if (params.designation) {
        where.designation = params.designation;
      }

      // Get teachers with related data
      const teachers = await this.prisma.teacher.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
            },
          },
          subjectAssignments: {
            include: {
              subject: {
                select: {
                  code: true,
                },
              },
            },
          },
          classAssignments: {
            include: {
              class: {
                select: {
                  grade: true,
                  section: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filter by search if provided
      let filteredTeachers = teachers;
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredTeachers = teachers.filter(
          t =>
            t.user.fullName.toLowerCase().includes(searchLower) ||
            t.user.email.toLowerCase().includes(searchLower) ||
            t.employeeId?.toLowerCase().includes(searchLower),
        );
      }

      const headers = [
        'fullName',
        'email',
        'phone',
        'employeeId',
        'dateOfBirth',
        'gender',
        'joiningDate',
        'experienceYears',
        'highestQualification',
        'specialization',
        'designation',
        'department',
        'basicSalary',
        'allowances',
        'bankName',
        'bankAccountNumber',
        'bankBranch',
      ];

      const rows = filteredTeachers.map(teacher => {
        const basicSalary =
          teacher.basicSalary !== null && teacher.basicSalary !== undefined
            ? Number(teacher.basicSalary)
            : 0;
        const allowances =
          teacher.allowances !== null && teacher.allowances !== undefined
            ? Number(teacher.allowances)
            : 0;

        return [
          teacher.user.fullName,
          teacher.user.email,
          teacher.user.phone || '',
          teacher.employeeId || '',
          teacher.dateOfBirth?.toISOString().split('T')[0] || '',
          teacher.gender || '',
          teacher.joiningDate?.toISOString().split('T')[0] || '',
          teacher.experienceYears || 0,
          teacher.qualification || '',
          teacher.specialization || '',
          teacher.designation || '',
          teacher.department || '',
          basicSalary,
          allowances,
          teacher.bankName || '',
          teacher.bankAccountNumber || '',
          teacher.bankBranch || '',
        ];
      });

      return { headers, rows };
    } catch (error) {
      this.logger.error('Failed to export teachers', error);
      throw error;
    }
  }

  /**
   * Generate template data for teacher import
   */
  getImportTemplateData(): { headers: string[]; sampleRow: string[] } {
    const headers = [
      'fullName*',
      'email*',
      'phone*',
      'employeeId',
      'dateOfBirth',
      'gender',
      'joiningDate',
      'experienceYears',
      'highestQualification',
      'specialization',
      'designation',
      'department',
      'basicSalary',
      'allowances',
      'bankName',
      'bankAccountNumber',
      'bankBranch',
      'panNumber',
      'citizenshipNumber',
      'ssfNumber',
      'citNumber',
      'subjects',
      'classes',
    ];

    const sampleData = [
      'Sarah Johnson',
      'sarah.johnson@school.com',
      '9876543211',
      'EMP-0001',
      '1988-04-12',
      'Female',
      '2023-01-15',
      '5',
      'M.Ed',
      'Mathematics',
      'Senior Teacher',
      'Mathematics',
      '45000',
      '5000',
      'Nabil Bank',
      '1234567890',
      'Kathmandu',
      'PAN-123456',
      'CITIZEN-987654',
      'SSF-001',
      'CIT-001',
      'MATH101,PHY101',
      '10-A,11-B',
    ];

    return { headers, sampleRow: sampleData };
  }
}
