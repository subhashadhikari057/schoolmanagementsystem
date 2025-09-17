import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { TeacherService } from './teacher.service';
import { SubjectService } from '../../subject/application/subject.service';
import { ClassService } from '../../class/application/class.service';
import {
  parseExcel,
  generateExcelTemplate,
} from '../../../shared/utils/excel-parser.util';
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
   * Import teachers from Excel content
   */
  async importTeachersFromExcel(
    excelBuffer: Buffer,
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<TeacherImportResult> {
    try {
      this.logger.log(`Excel file size: ${excelBuffer.length} bytes`);

      // Parse and validate Excel
      const parseResult = await parseExcel<TeacherImportRow>(
        excelBuffer,
        TeacherImportRowSchema,
      );

      this.logger.log(
        `Excel parsed successfully. Total rows: ${parseResult.data.length}`,
      );
      this.logger.log(`Parse result:`, {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        errors: parseResult.errors,
      });

      if (parseResult.errors.length > 0) {
        this.logger.warn(`Excel parsing errors:`, parseResult.errors);
      }

      const result: TeacherImportResult = {
        success: true,
        message: 'Import completed successfully',
        totalProcessed: parseResult.data.length,
        successfulImports: 0,
        failedImports: 0,
        errors: [],
        importedTeachers: [],
      };

      // Process each row
      for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i];
        const rowNumber = i + 1;

        try {
          this.logger.log(`Processing row ${rowNumber}: ${row.fullName}`);

          // Check if teacher already exists
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
              // Update existing teacher
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
              this.logger.log(`Skipping duplicate teacher: ${row.fullName}`);
              continue;
            } else {
              throw new Error(`Teacher with email ${row.email} already exists`);
            }
          } else {
            // Create new teacher
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
          this.logger.error(`Error processing row ${rowNumber}:`, error);
          result.failedImports++;
          result.errors.push({
            row: rowNumber,
            teacher: row.fullName,
            error: error.message,
          });
        }
      }

      // Update result message
      if (result.failedImports > 0) {
        result.message = `Import completed with ${result.failedImports} errors`;
        result.success = false;
      }

      this.logger.log(`Import completed:`, result);
      return result;
    } catch (error) {
      this.logger.error('Failed to import teachers from Excel', error);
      throw error;
    }
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
        address: row.address || '',
        bloodGroup: row.bloodGroup as
          | 'A+'
          | 'A-'
          | 'B+'
          | 'B-'
          | 'AB+'
          | 'AB-'
          | 'O+'
          | 'O-'
          | undefined,
        maritalStatus: row.maritalStatus || '',
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
        totalSalary: parseFloat(row.totalSalary || '0') || 0,
      },
      bankDetails: {
        bankName: row.bankName || '',
        bankAccountNumber: row.bankAccountNumber || '',
        bankBranch: row.bankBranch || '',
        panNumber: row.panNumber || '',
        citizenshipNumber: row.citizenshipNumber || '',
      },
    };

    // Create teacher using existing service
    const result = await this.teacherService.create(
      teacherData,
      createdBy,
      undefined, // No profile picture for import
      '127.0.0.1', // Default IP for import
      'Excel Import', // Default user agent for import
    );

    // Log teacher account details to console
    if (result.temporaryPassword) {
      this.logger.log(`=== TEACHER ACCOUNT CREATED ===`);
      this.logger.log(`Name: ${row.fullName}`);
      this.logger.log(`Email: ${row.email}`);
      this.logger.log(`Phone: ${row.phone}`);
      this.logger.log(`Password: ${result.temporaryPassword}`);
      this.logger.log(`================================`);
    }

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
        totalSalary: parseFloat(row.totalSalary || '0') || 0,
      },
      bankDetails: {
        bankName: row.bankName || '',
        bankAccountNumber: row.bankAccountNumber || '',
        bankBranch: row.bankBranch || '',
        panNumber: row.panNumber || '',
        citizenshipNumber: row.citizenshipNumber || '',
      },
      personal: {
        address: row.address || '',
        bloodGroup: row.bloodGroup as
          | 'A+'
          | 'A-'
          | 'B+'
          | 'B-'
          | 'AB+'
          | 'AB-'
          | 'O+'
          | 'O-'
          | undefined,
        maritalStatus: row.maritalStatus || '',
      },
    };

    await this.teacherService.updateByAdmin(teacherId, updateData, updatedBy);

    // Update subject and class assignments
    if (row.subjects) {
      const subjectCodes = row.subjects.split(',').map(s => s.trim());
      await this.assignSubjectsToTeacher(teacherId, subjectCodes, updatedBy);
    }

    if (row.classes) {
      const classSections = row.classes.split(',').map(c => c.trim());
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
          const match = cs.match(/^(\d+)-([A-Z])$/);
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

  /**
   * Export teachers to Excel
   */
  async exportTeachersToExcel(params: TeacherExportParams): Promise<Buffer> {
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

      // Generate Excel content
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
        'department',
        'basicSalary',
        'allowances',
        'totalSalary',
        'bankName',
        'bankAccountNumber',
        'bankBranch',
        'citizenshipNumber',
        'panNumber',
        'bloodGroup',
        'maritalStatus',
        'address',
      ];

      const sampleData = filteredTeachers.map(teacher => {
        return {
          fullName: teacher.user.fullName,
          email: teacher.user.email,
          phone: teacher.user.phone || '',
          employeeId: teacher.employeeId || '',
          dateOfBirth: teacher.dateOfBirth?.toISOString().split('T')[0] || '',
          gender: teacher.gender || '',
          joiningDate: teacher.joiningDate?.toISOString().split('T')[0] || '',
          experienceYears: teacher.experienceYears || 0,
          highestQualification: teacher.qualification || '',
          specialization: teacher.specialization || '',
          department: teacher.department || '',
          basicSalary: teacher.basicSalary || 0,
          allowances: teacher.allowances || 0,
          totalSalary: teacher.totalSalary || 0,
          bankName: teacher.bankName || '',
          bankAccountNumber: teacher.bankAccountNumber || '',
          bankBranch: teacher.bankBranch || '',
          citizenshipNumber: teacher.citizenshipNumber || '',
          panNumber: teacher.panNumber || '',
          bloodGroup: teacher.bloodGroup || '',
          maritalStatus: teacher.maritalStatus || '',
          address: teacher.address || '',
        };
      });

      return await generateExcelTemplate(headers, sampleData);
    } catch (error) {
      this.logger.error('Failed to export teachers to Excel', error);
      throw error;
    }
  }

  /**
   * Generate Excel template for teacher import
   */
  async generateImportTemplate(): Promise<Buffer> {
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
      'department',
      'basicSalary',
      'allowances',
      'totalSalary',
      'bankName',
      'bankAccountNumber',
      'bankBranch',
      'citizenshipNumber',
      'panNumber',
      'bloodGroup',
      'maritalStatus',
      'address',
    ];

    const sampleData = [
      {
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@school.com',
        phone: '9876543211',
        employeeId: 'T001',
        dateOfBirth: '1985-03-15',
        gender: 'Female',
        joiningDate: '2023-01-15',
        experienceYears: '5',
        highestQualification: 'M.Ed',
        specialization: 'Mathematics',
        department: 'Mathematics',
        basicSalary: '50000',
        allowances: '5000',
        totalSalary: '55000',
        bankName: 'State Bank of India',
        bankAccountNumber: '1234567890',
        bankBranch: 'Main Branch',
        citizenshipNumber: '1234567890',
        panNumber: 'ABCDE1234F',
        bloodGroup: 'O+',
        maritalStatus: 'Married',
        address: '123 Main Street, City',
      },
    ];

    return await generateExcelTemplate(headers, sampleData);
  }
}
