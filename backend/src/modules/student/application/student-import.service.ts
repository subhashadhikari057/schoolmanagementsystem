import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { hashPassword } from '../../../shared/auth/hash.util';
import { generateRandomPassword } from '../../../shared/utils/password.util';
import {
  parseCSV,
  parseRecords,
  generateStudentImportTemplate,
  formatDisabilityTypeLabel,
  formatMotherTongueLabel,
} from '../../../shared/utils/csv-parser.util';
import {
  StudentImportRow,
  StudentImportResult,
  StudentImportRowSchema,
} from '../dto/student-import.dto';

@Injectable()
export class StudentImportService {
  private readonly logger = new Logger(StudentImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Import students from CSV content
   */
  async importStudentsFromCSV(
    csvContent: string,
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<StudentImportResult> {
    try {
      // Log the raw CSV content for debugging
      this.logger.log(`Raw CSV content length: ${csvContent.length}`);
      this.logger.log(
        `Raw CSV content preview: ${csvContent.substring(0, 200)}...`,
      );

      // Parse and validate CSV
      const parseResult = parseCSV<StudentImportRow>(
        csvContent,
        StudentImportRowSchema,
      );
      return this.importStudentsFromParseResult(
        parseResult,
        createdBy,
        options,
      );
    } catch (error) {
      this.logger.error('Failed to import students from CSV', error);
      throw new BadRequestException(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Import students from parsed records (e.g., XLSX)
   */
  async importStudentsFromRecords(
    records: Record<string, string>[],
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<StudentImportResult> {
    try {
      const parseResult = parseRecords<StudentImportRow>(
        records,
        StudentImportRowSchema,
      );
      return this.importStudentsFromParseResult(
        parseResult,
        createdBy,
        options,
      );
    } catch (error) {
      this.logger.error('Failed to import students from records', error);
      throw new BadRequestException(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async importStudentsFromParseResult(
    parseResult: {
      data: StudentImportRow[];
      errors: Array<{ row: number; line: string; error: string }>;
      totalRows: number;
      validRows: number;
      invalidRows: number;
    },
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<StudentImportResult> {
    try {
      // Log the parsed data for debugging
      this.logger.log(
        `CSV parsed successfully. Total rows: ${parseResult.data.length}`,
      );
      this.logger.log(`Parse result:`, {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        errors: parseResult.errors,
      });

      if (parseResult.data.length > 0) {
        const firstRow = parseResult.data[0];
        this.logger.log(`First row sample:`, {
          fullName: firstRow.fullName,
          dateOfBirth: firstRow.dateOfBirth,
          dateOfBirthType: typeof firstRow.dateOfBirth,
          parsedDate: new Date(firstRow.dateOfBirth),
          isValidDate: !isNaN(new Date(firstRow.dateOfBirth).getTime()),
          classGrade: firstRow.classGrade,
          classSection: firstRow.classSection,
          gender: firstRow.gender,
        });
      }

      if (parseResult.errors.length > 0) {
        this.logger.error(`CSV validation errors:`, parseResult.errors);
        return {
          success: false,
          message: `CSV validation failed. ${parseResult.errors.length} rows have errors.`,
          totalProcessed: parseResult.totalRows,
          successfulImports: 0,
          failedImports: parseResult.totalRows,
          errors: parseResult.errors.map(error => ({
            row: error.row,
            student: error.line.split(',')[0] || 'Unknown',
            error: error.error,
          })),
        };
      }

      // Process each student
      const results = await this.processStudentImports(
        parseResult.data,
        createdBy,
        options,
      );

      // Log final summary to console
      this.logger.log('\n🎉 IMPORT SUMMARY:');
      this.logger.log(`📊 Total Processed: ${parseResult.totalRows}`);
      this.logger.log(`✅ Successful: ${results.successfulImports}`);
      this.logger.log(`❌ Failed: ${results.failedImports}`);
      this.logger.log('=====================================');

      return {
        success: results.successfulImports > 0,
        message: `Import completed. ${results.successfulImports} students imported successfully, ${results.failedImports} failed.`,
        totalProcessed: parseResult.totalRows,
        successfulImports: results.successfulImports,
        failedImports: results.failedImports,
        errors: results.errors,
        importedStudents: results.importedStudents,
      };
    } catch (error) {
      this.logger.error('Failed to import students from records', error);
      throw new BadRequestException(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process student imports
   */
  private async processStudentImports(
    students: StudentImportRow[],
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean },
  ): Promise<{
    successfulImports: number;
    failedImports: number;
    errors: Array<{ row: number; student: string; error: string }>;
    importedStudents: Array<{
      id: string;
      fullName: string;
      email: string;
      rollNumber: string;
      className: string;
    }>;
  }> {
    const results = {
      successfulImports: 0,
      failedImports: 0,
      errors: [] as Array<{ row: number; student: string; error: string }>,
      importedStudents: [] as Array<{
        id: string;
        fullName: string;
        email: string;
        rollNumber: string;
        className: string;
      }>,
    };

    for (let i = 0; i < students.length; i++) {
      try {
        const studentData = students[i];
        this.logger.log(
          `Processing student ${i + 1}/${students.length}: ${studentData.fullName}`,
        );

        const result = await this.importSingleStudent(
          studentData,
          createdBy,
          options,
        );
        results.importedStudents.push(result);
        results.successfulImports++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to import student ${i + 1}: ${errorMessage}`);
        results.errors.push({
          row: i + 2, // +2 to account for header row and 0-based index
          student: students[i].fullName,
          error: errorMessage,
        });
        results.failedImports++;
      }
    }

    return results;
  }

  /**
   * Import a single student
   */
  private async importSingleStudent(
    studentData: StudentImportRow,
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean },
  ): Promise<{
    id: string;
    fullName: string;
    email: string;
    rollNumber: string;
    className: string;
  }> {
    return await this.prisma.$transaction(async tx => {
      // 1. Check if student already exists
      const existingStudent = await tx.student.findFirst({
        where: {
          OR: [
            { user: { email: studentData.email } },
            { rollNumber: studentData.rollNumber },
          ],
          deletedAt: null,
        },
        include: { user: true },
      });

      if (existingStudent) {
        if (options.updateExisting) {
          // Update existing student logic would go here
          throw new ConflictException(
            `Student with email ${studentData.email} or roll number ${studentData.rollNumber} already exists. Update functionality not implemented yet.`,
          );
        } else if (options.skipDuplicates) {
          this.logger.log(`Skipping duplicate student: ${studentData.email}`);
          return {
            id: existingStudent.id,
            fullName: existingStudent.user.fullName,
            email: existingStudent.user.email,
            rollNumber: existingStudent.rollNumber,
            className: `${studentData.classGrade}-${studentData.classSection}`,
          };
        } else {
          throw new ConflictException(
            `Student with email ${studentData.email} or roll number ${studentData.rollNumber} already exists.`,
          );
        }
      }

      // 2. Find or create class
      const existingClass = await tx.class.findFirst({
        where: {
          grade: studentData.classGrade,
          section: studentData.classSection,
          deletedAt: null,
        },
      });

      if (!existingClass) {
        throw new NotFoundException(
          `Class ${studentData.classGrade}-${studentData.classSection} not found. Please create the class first.`,
        );
      }

      // 3. Check if primary parent already exists
      let primaryParent = await tx.parent.findFirst({
        where: {
          user: { email: studentData.primaryParentEmail },
          deletedAt: null,
        },
      });

      if (!primaryParent) {
        // Check if a user with the same phone number already exists
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              { email: studentData.primaryParentEmail },
              { phone: studentData.primaryParentPhone },
            ],
            deletedAt: null,
          },
        });

        if (existingUser) {
          // Reuse existing user if they have the same phone or email
          this.logger.log(
            `Reusing existing user for parent: ${existingUser.email} (phone: ${existingUser.phone})`,
          );
          this.logger.log(
            `🔄 Reusing existing parent: ${existingUser.fullName} (${existingUser.email})`,
          );

          // Check if they already have a parent record
          const existingParentRecord = await tx.parent.findFirst({
            where: { userId: existingUser.id, deletedAt: null },
          });

          if (!existingParentRecord) {
            // Create parent record for existing user
            primaryParent = await tx.parent.create({
              data: {
                userId: existingUser.id,
                createdById: createdBy,
              },
            });
          } else {
            primaryParent = existingParentRecord;
          }
        } else {
          // Create new parent account (no user login)
          const parentPassword = generateRandomPassword();
          const parentUser = await tx.user.create({
            data: {
              email: studentData.primaryParentEmail,
              phone: studentData.primaryParentPhone,
              fullName: studentData.primaryParentName,
              passwordHash: await hashPassword(parentPassword),
              roles: { create: { role: { connect: { name: 'PARENT' } } } },
              needPasswordChange: false, // No login account needed
              createdById: createdBy,
            },
          });

          primaryParent = await tx.parent.create({
            data: {
              userId: parentUser.id,
              createdById: createdBy,
            },
          });

          // Log parent credentials to console
          this.logger.log('👨‍👩‍👧‍👦 PARENT CREDENTIALS:');
          this.logger.log(`👤 Parent: ${studentData.primaryParentName}`);
          this.logger.log(`📧 Email: ${studentData.primaryParentEmail}`);
          this.logger.log(`🔑 Password: ${parentPassword}`);
          this.logger.log('---');
        }
      }

      // 5. Handle secondary parent (no user account creation, just store info)
      let secondaryParentInfo: {
        name: string;
        email: string;
        phone: string;
        relation: string;
      } | null = null;
      if (studentData.secondaryParentEmail && studentData.secondaryParentName) {
        // For secondary parents, we don't create user accounts, just store the information
        // This will be used to populate the student's mother/father fields
        secondaryParentInfo = {
          name: studentData.secondaryParentName,
          email: studentData.secondaryParentEmail,
          phone: studentData.secondaryParentPhone || '',
          relation: studentData.secondaryParentRelation || 'Guardian',
        };
      }

      // 6. Create student account
      const studentPassword = generateRandomPassword();
      const studentUser = await tx.user.create({
        data: {
          email: studentData.email,
          phone: studentData.phone,
          fullName: studentData.fullName,
          passwordHash: await hashPassword(studentPassword),
          roles: { create: { role: { connect: { name: 'STUDENT' } } } },
          needPasswordChange: true, // Student must change password on first login
          createdById: createdBy,
        },
      });

      // Log student credentials to console (not returned in API)
      this.logger.log('🔐 STUDENT CREDENTIALS:');
      this.logger.log(`👨‍🎓 Student: ${studentData.fullName}`);
      this.logger.log(`📧 Email: ${studentData.email}`);
      this.logger.log(`🔑 Password: ${studentPassword}`);
      this.logger.log('---');

      // Log date information for debugging
      this.logger.log(`Creating student with date info:`, {
        originalDateOfBirth: studentData.dateOfBirth,
        dateType: typeof studentData.dateOfBirth,
        parsedDate: new Date(studentData.dateOfBirth),
        isValidDate: !isNaN(new Date(studentData.dateOfBirth).getTime()),
        timestamp: new Date(studentData.dateOfBirth).getTime(),
      });

      // Determine which parent is father and which is mother based on relation
      const isPrimaryParentFather = studentData.primaryParentRelation
        .toLowerCase()
        .includes('father');
      const isSecondaryParentMother =
        secondaryParentInfo &&
        secondaryParentInfo.relation.toLowerCase().includes('mother');

      // Split primary parent name into parts
      const primaryParentNameParts = studentData.primaryParentName.split(' ');
      const primaryParentFirstName = primaryParentNameParts[0] || '';
      const primaryParentMiddleName =
        primaryParentNameParts.length > 2
          ? primaryParentNameParts.slice(1, -1).join(' ')
          : '';
      const primaryParentLastName =
        primaryParentNameParts.length > 1
          ? primaryParentNameParts[primaryParentNameParts.length - 1]
          : '';

      // Split secondary parent name into parts if exists
      let secondaryParentFirstName = '';
      let secondaryParentMiddleName = '';
      let secondaryParentLastName = '';
      if (secondaryParentInfo) {
        const secondaryParentNameParts = secondaryParentInfo.name.split(' ');
        secondaryParentFirstName = secondaryParentNameParts[0] || '';
        secondaryParentMiddleName =
          secondaryParentNameParts.length > 2
            ? secondaryParentNameParts.slice(1, -1).join(' ')
            : '';
        secondaryParentLastName =
          secondaryParentNameParts.length > 1
            ? secondaryParentNameParts[secondaryParentNameParts.length - 1]
            : '';
      }

      // Ensure dateOfBirth is properly parsed
      let parsedDateOfBirth: Date;
      try {
        parsedDateOfBirth = new Date(studentData.dateOfBirth);
        if (isNaN(parsedDateOfBirth.getTime())) {
          throw new Error(`Invalid date format: ${studentData.dateOfBirth}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to parse date: ${studentData.dateOfBirth}`,
          error,
        );
        throw new BadRequestException(
          `Invalid date of birth format: ${studentData.dateOfBirth}. Please use YYYY-MM-DD format.`,
        );
      }

      // Log the student data being created
      this.logger.log(`Creating student with data:`, {
        fullName: studentData.fullName,
        email: studentData.email,
        rollNumber: studentData.rollNumber,
        classId: existingClass.id,
        gender: studentData.gender.toLowerCase(),
        dob: parsedDateOfBirth,
        phone: studentData.phone,
      });

      const newStudent = await tx.student.create({
        data: {
          userId: studentUser.id,
          classId: existingClass.id,
          rollNumber: studentData.rollNumber,
          admissionDate: new Date(),
          email: studentData.email,
          phone: studentData.phone, // Add student's phone number
          dob: parsedDateOfBirth,
          dateOfBirth: parsedDateOfBirth, // Also set dateOfBirth for frontend compatibility
          gender: studentData.gender.toLowerCase(),
          motherTongue: studentData.motherTongue,
          disabilityType: studentData.disabilityType,
          address: studentData.address || '',
          academicStatus: 'active',
          feeStatus: 'pending',
          createdById: createdBy,

          // Populate parent fields based on relation
          ...(isPrimaryParentFather
            ? {
                // Primary parent is father
                fatherFirstName: primaryParentFirstName,
                fatherMiddleName: primaryParentMiddleName,
                fatherLastName: primaryParentLastName,
                fatherPhone: studentData.primaryParentPhone,
                fatherEmail: studentData.primaryParentEmail,
                fatherOccupation: '', // Could be added to CSV if needed

                // Secondary parent is mother (if exists)
                ...(isSecondaryParentMother && secondaryParentInfo
                  ? {
                      motherFirstName: secondaryParentFirstName,
                      motherMiddleName: secondaryParentMiddleName,
                      motherLastName: secondaryParentLastName,
                      motherPhone: secondaryParentInfo.phone,
                      motherEmail: secondaryParentInfo.email,
                      motherOccupation: '', // Could be added to CSV if needed
                    }
                  : {}),
              }
            : {
                // Primary parent is mother
                motherFirstName: primaryParentFirstName,
                motherMiddleName: primaryParentMiddleName,
                motherLastName: primaryParentLastName,
                motherPhone: studentData.primaryParentPhone,
                motherEmail: studentData.primaryParentEmail,
                motherOccupation: '', // Could be added to CSV if needed

                // Secondary parent is father (if exists)
                ...(secondaryParentInfo && !isSecondaryParentMother
                  ? {
                      fatherFirstName: secondaryParentFirstName,
                      fatherMiddleName: secondaryParentMiddleName,
                      fatherLastName: secondaryParentLastName,
                      fatherPhone: secondaryParentInfo.phone,
                      fatherEmail: secondaryParentInfo.email,
                      fatherOccupation: '', // Could be added to CSV if needed
                    }
                  : {}),
              }),
        },
      });

      // 7. Link primary parent to student (secondary parent is not linked via ParentStudentLink)
      await tx.parentStudentLink.create({
        data: {
          parentId: primaryParent.id,
          studentId: newStudent.id,
          relationship: studentData.primaryParentRelation,
          isPrimary: true,
        },
      });

      // 8. Audit log
      await this.auditService.record({
        action: 'CREATE',
        module: 'STUDENT',
        userId: createdBy,
        details: `Imported student ${studentData.fullName} with roll number ${studentData.rollNumber}`,
        ipAddress: '127.0.0.1', // This should come from request context
        userAgent: 'Student Import Service', // This should come from request context
      });

      this.logger.log(
        `Successfully created student: ${studentData.fullName} with ID: ${newStudent.id}`,
      );

      // Log success summary to console
      this.logger.log(
        `✅ Successfully imported: ${studentData.fullName} (${studentData.email})`,
      );
      this.logger.log(
        `📚 Class: ${studentData.classGrade}-${studentData.classSection}`,
      );
      this.logger.log(`🔢 Roll Number: ${studentData.rollNumber}`);
      this.logger.log('=====================================');

      return {
        id: newStudent.id,
        fullName: studentData.fullName,
        email: studentData.email,
        rollNumber: studentData.rollNumber,
        className: `${studentData.classGrade}-${studentData.classSection}`,
      };
    });
  }

  /**
   * Get CSV template for student import
   */
  async getImportTemplate(): Promise<string> {
    return generateStudentImportTemplate();
  }

  /**
   * Export students to CSV
   */
  async exportStudentsToCSV(
    filters: {
      classId?: string;
      search?: string;
      academicStatus?: string;
    } = {},
  ): Promise<string> {
    const { headers, rows } = await this.exportStudentsToRows(filters);
    const csvRows = rows.map(row =>
      row.map(value => (value ?? '') as string).join(','),
    );
    return [headers.join(','), ...csvRows].join('\n');
  }

  async exportStudentsToRows(
    filters: {
      classId?: string;
      search?: string;
      academicStatus?: string;
    } = {},
  ): Promise<{ headers: string[]; rows: Array<Array<string | number>> }> {
    try {
      // Build where clause based on filters
      const whereClause: Record<string, unknown> = {
        deletedAt: null,
      };

      if (filters.classId) {
        whereClause.classId = filters.classId;
      }

      if (filters.search) {
        whereClause.OR = [
          {
            user: {
              fullName: { contains: filters.search, mode: 'insensitive' },
            },
          },
          {
            user: { email: { contains: filters.search, mode: 'insensitive' } },
          },
          { rollNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.academicStatus) {
        whereClause.academicStatus = filters.academicStatus;
      }

      // Fetch students with related data
      const students = await this.prisma.student.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
            },
          },
          class: {
            select: {
              grade: true,
              section: true,
            },
          },
        },
        orderBy: [
          { class: { grade: 'asc' } },
          { class: { section: 'asc' } },
          { rollNumber: 'asc' },
        ],
      });

      // Sort students to ensure proper numeric ordering of roll numbers
      const sortedStudents = students.sort((a, b) => {
        // First sort by class grade (numerically)
        if (a.class.grade !== b.class.grade) {
          return a.class.grade - b.class.grade;
        }

        // Then by class section (alphabetically)
        if (a.class.section !== b.class.section) {
          return a.class.section.localeCompare(b.class.section);
        }

        // Finally by roll number (numerically)
        const rollA = parseInt(a.rollNumber, 10) || 0;
        const rollB = parseInt(b.rollNumber, 10) || 0;
        if (rollA !== rollB) {
          return rollA - rollB;
        }

        // If roll numbers are equal, sort by name
        return a.user.fullName.localeCompare(b.user.fullName);
      });

      // Generate CSV content
      const headers = [
        'fullName',
        'email',
        'phone',
        'rollNumber',
        'classGrade',
        'classSection',
        'dateOfBirth',
        'gender',
        'motherTongue',
        'disabilityType',
        'address',
        'primaryParentName',
        'primaryParentPhone',
        'primaryParentEmail',
        'primaryParentRelation',
        'secondaryParentName',
        'secondaryParentPhone',
        'secondaryParentEmail',
        'secondaryParentRelation',
      ];

      const rows = sortedStudents.map(student => {
        // Get father information from student schema (Primary Parent)
        const fatherName =
          student.fatherFirstName && student.fatherLastName
            ? `${student.fatherFirstName} ${student.fatherMiddleName || ''} ${student.fatherLastName}`.trim()
            : '';

        const fatherPhone = student.fatherPhone || '';
        const fatherEmail = student.fatherEmail || '';
        const fatherRelation = 'Father';

        // Get mother information from student schema (Secondary Parent)
        const motherName =
          student.motherFirstName && student.motherLastName
            ? `${student.motherFirstName} ${student.motherMiddleName || ''} ${student.motherLastName}`.trim()
            : '';

        const motherPhone = student.motherPhone || '';
        const motherEmail = student.motherEmail || '';
        const motherRelation = 'Mother';

        return [
          student.user.fullName,
          student.user.email || '',
          student.user.phone || '',
          student.rollNumber,
          student.class.grade,
          student.class.section,
          student.dob ? student.dob.toISOString().split('T')[0] : '',
          student.gender || '',
          formatMotherTongueLabel(student.motherTongue || undefined),
          formatDisabilityTypeLabel(student.disabilityType || undefined),
          student.address || '',
          fatherName, // primaryParentName (Father)
          fatherPhone, // primaryParentPhone (Father)
          fatherEmail, // primaryParentEmail (Father)
          fatherRelation, // primaryParentRelation (Father)
          motherName, // secondaryParentName (Mother)
          motherPhone, // secondaryParentPhone (Mother)
          motherEmail, // secondaryParentEmail (Mother)
          motherRelation, // secondaryParentRelation (Mother)
        ];
      });

      return { headers, rows };
    } catch (error) {
      this.logger.error('Failed to export students to CSV', error);
      throw new BadRequestException(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
