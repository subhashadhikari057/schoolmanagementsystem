import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { StaffService } from './staff.service';
import { parseCSV } from '../../../shared/utils/csv-parser.util';
import { StaffImportRowSchema, StaffImportRow } from '../dto/staff-import.dto';

export interface StaffImportResult {
  success: boolean;
  message: string;
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  errors: Array<{
    row: number;
    staff: string;
    error: string;
  }>;
  importedStaff: Array<{
    id: string;
    fullName: string;
    email: string;
    employeeId: string;
    designation: string;
  }>;
}

export interface StaffExportParams {
  department?: string;
  search?: string;
  designation?: string;
  employmentStatus?: string;
}

@Injectable()
export class StaffImportService {
  private readonly logger = new Logger(StaffImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly staffService: StaffService,
  ) {}

  /**
   * Import staff from CSV content
   */
  async importStaffFromCSV(
    csvContent: string,
    createdBy: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<StaffImportResult> {
    try {
      this.logger.log(`Raw CSV content length: ${csvContent.length}`);
      this.logger.log(
        `Raw CSV content preview: ${csvContent.substring(0, 200)}...`,
      );

      // Parse and validate CSV
      const parseResult = parseCSV<StaffImportRow>(
        csvContent,
        StaffImportRowSchema,
      );

      this.logger.log(
        `CSV parsed successfully. Total rows: ${parseResult.data.length}`,
      );
      this.logger.log(`Parse result:`, {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        errors: parseResult.errors,
      });

      if (parseResult.errors.length > 0) {
        this.logger.warn(`CSV parsing errors:`, parseResult.errors);
      }

      const result: StaffImportResult = {
        success: true,
        message: 'Import completed successfully',
        totalProcessed: parseResult.data.length,
        successfulImports: 0,
        failedImports: 0,
        errors: [],
        importedStaff: [],
      };

      // Process each row
      for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i];
        const rowNumber = i + 1;

        try {
          this.logger.log(`Processing row ${rowNumber}: ${row.fullName}`);

          // Check if staff already exists (active only)
          const existingStaff = await this.prisma.staff.findFirst({
            where: {
              email: row.email,
              deletedAt: null,
            },
          });

          // Also check for deleted staff to handle re-import scenario
          const deletedStaff = await this.prisma.staff.findFirst({
            where: {
              email: row.email,
              deletedAt: { not: null },
            },
          });

          if (existingStaff) {
            if (options.updateExisting) {
              // Update existing staff
              await this.updateExistingStaff(existingStaff.id, row, createdBy);
              result.successfulImports++;
              result.importedStaff.push({
                id: existingStaff.id,
                fullName: row.fullName,
                email: row.email,
                employeeId: existingStaff.employeeId || '',
                designation: row.designation || 'Staff',
              });
            } else if (options.skipDuplicates) {
              this.logger.log(`Skipping duplicate staff: ${row.fullName}`);
              continue;
            } else {
              throw new Error(`Staff with email ${row.email} already exists`);
            }
          } else if (deletedStaff) {
            // Restore deleted staff instead of creating new one
            this.logger.log(`Restoring deleted staff: ${row.fullName}`);
            const restoredStaff = await this.restoreDeletedStaff(
              deletedStaff.id,
              row,
              createdBy,
            );
            result.successfulImports++;
            result.importedStaff.push({
              id: restoredStaff.id,
              fullName: row.fullName,
              email: row.email,
              employeeId: restoredStaff.employeeId || '',
              designation: row.designation || 'Staff',
            });
          } else {
            // Create new staff
            const newStaff = await this.createNewStaff(row, createdBy);
            result.successfulImports++;
            result.importedStaff.push({
              id: newStaff.id,
              fullName: row.fullName,
              email: row.email,
              employeeId: newStaff.employeeId || '',
              designation: row.designation || 'Staff',
            });
          }
        } catch (error) {
          this.logger.error(`Error processing row ${rowNumber}:`, error);
          result.failedImports++;
          result.errors.push({
            row: rowNumber,
            staff: row.fullName,
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
      this.logger.error('Failed to import staff from CSV', error);
      throw error;
    }
  }

  /**
   * Create a new staff from import data
   */
  private async createNewStaff(row: StaffImportRow, createdBy: string) {
    // Calculate total salary
    const basicSalary = parseFloat(row.basicSalary) || 0;
    const allowances = 0; // No allowances in simplified version
    const totalSalary = basicSalary + allowances;

    // Generate unique employee ID if not provided
    const employeeId = row.employeeId || (await this.generateEmployeeId());

    // Parse fullName into firstName and lastName for database compatibility
    const nameParts = row.fullName.trim().split(' ');
    const firstName = nameParts[0] || row.fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create staff record
    const newStaff = await this.prisma.staff.create({
      data: {
        email: row.email,
        fullName: row.fullName,
        firstName,
        middleName: null,
        lastName,
        employeeId,
        dob: new Date(row.dob),
        gender: row.gender,
        bloodGroup: null,
        phone: row.phone,
        emergencyContact: row.emergencyContact,
        maritalStatus: null,
        designation: row.designation || 'Staff',
        department: row.department || 'General',
        employmentDate: new Date(), // Set to today if not provided
        joiningDate: new Date(), // Set to today if not provided
        basicSalary,
        allowances,
        totalSalary,
        permissions: [], // Empty permissions array
        bankAccountNumber: null,
        bankBranch: null,
        bankName: null,
        citizenshipNumber: null,
        panNumber: null,
        employmentStatus: 'active',
        experienceYears: null,
        createdById: createdBy,
      },
    });

    // Log staff account details to console
    this.logger.log(`=== STAFF ACCOUNT CREATED ===`);
    this.logger.log(`Name: ${row.fullName}`);
    this.logger.log(`Email: ${row.email}`);
    this.logger.log(`Phone: ${row.phone}`);
    this.logger.log(`Employee ID: ${employeeId}`);
    this.logger.log(`================================`);

    return newStaff;
  }

  /**
   * Restore deleted staff and update with new data
   */
  private async restoreDeletedStaff(
    staffId: string,
    row: StaffImportRow,
    updatedBy: string,
  ) {
    // Calculate total salary
    const basicSalary = parseFloat(row.basicSalary) || 0;
    const allowances = 0;
    const totalSalary = basicSalary + allowances;

    // Parse fullName into firstName and lastName for database compatibility
    const nameParts = row.fullName.trim().split(' ');
    const firstName = nameParts[0] || row.fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Restore and update staff data
    const restoredStaff = await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        email: row.email,
        fullName: row.fullName,
        firstName,
        middleName: null,
        lastName,
        dob: new Date(row.dob),
        gender: row.gender,
        phone: row.phone,
        emergencyContact: row.emergencyContact,
        designation: row.designation || 'Staff',
        department: row.department || 'General',
        employmentDate: new Date(),
        joiningDate: new Date(),
        basicSalary,
        allowances,
        totalSalary,
        employmentStatus: 'active',
        // Clear deletion data to restore the record
        deletedAt: null,
        deletedById: null,
        updatedById: updatedBy,
        updatedAt: new Date(),
      },
    });

    // Also restore staff profile if it exists
    await this.prisma.staffProfile.updateMany({
      where: {
        staffId: staffId,
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
      },
    });

    this.logger.log(`=== STAFF ACCOUNT RESTORED ===`);
    this.logger.log(`Name: ${row.fullName}`);
    this.logger.log(`Email: ${row.email}`);
    this.logger.log(`Phone: ${row.phone}`);
    this.logger.log(`Employee ID: ${restoredStaff.employeeId}`);
    this.logger.log(`=================================`);

    return restoredStaff;
  }

  /**
   * Update existing staff from import data
   */
  private async updateExistingStaff(
    staffId: string,
    row: StaffImportRow,
    updatedBy: string,
  ) {
    // Calculate total salary
    const basicSalary = parseFloat(row.basicSalary) || 0;
    const allowances = 0;
    const totalSalary = basicSalary + allowances;

    // Parse fullName into firstName and lastName for database compatibility
    const nameParts = row.fullName.trim().split(' ');
    const firstName = nameParts[0] || row.fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Update staff data
    await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        fullName: row.fullName,
        firstName,
        lastName,
        dob: new Date(row.dob),
        gender: row.gender,
        phone: row.phone,
        emergencyContact: row.emergencyContact,
        designation: row.designation || 'Staff',
        department: row.department || 'General',
        basicSalary,
        allowances,
        totalSalary,
        updatedById: updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Generate unique employee ID
   */
  private async generateEmployeeId(): Promise<string> {
    const year = new Date().getFullYear();

    // Get the last employee ID for this year
    const lastStaff = await this.prisma.staff.findFirst({
      where: {
        employeeId: {
          startsWith: `ST-${year}-`,
        },
      },
      orderBy: {
        employeeId: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastStaff?.employeeId) {
      const match = lastStaff.employeeId.match(/ST-\d{4}-(\d{3})$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `ST-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Export staff to CSV
   */
  async exportStaffToCSV(params: StaffExportParams): Promise<string> {
    try {
      // Build where clause
      const where: any = { deletedAt: null };

      if (params.department) {
        where.department = params.department;
      }

      if (params.designation) {
        where.designation = params.designation;
      }

      if (params.employmentStatus) {
        where.employmentStatus = params.employmentStatus;
      }

      // Get staff with related data
      const staffList = await this.prisma.staff.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      // Filter by search if provided
      let filteredStaff = staffList;
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredStaff = staffList.filter(
          s =>
            s.fullName.toLowerCase().includes(searchLower) ||
            s.email.toLowerCase().includes(searchLower) ||
            s.employeeId?.toLowerCase().includes(searchLower),
        );
      }

      // Generate CSV content - SIMPLIFIED VERSION
      const csvRows = [
        // Header - Only mandatory + basic optional fields
        [
          'fullName',
          'email',
          'phone',
          'dob',
          'gender',
          'emergencyContact',
          'basicSalary',
          'employeeId',
          'designation',
          'department',
        ].join(','),
      ];

      // Data rows
      for (const staff of filteredStaff) {
        const row = [
          `"${staff.fullName}"`,
          `"${staff.email}"`,
          `"${staff.phone}"`,
          `"${staff.dob?.toISOString().split('T')[0] || ''}"`,
          `"${staff.gender || ''}"`,
          `"${staff.emergencyContact}"`,
          `"${staff.basicSalary || 0}"`,
          `"${staff.employeeId || ''}"`,
          `"${staff.designation || ''}"`,
          `"${staff.department || ''}"`,
        ].join(',');

        csvRows.push(row);
      }

      return csvRows.join('\n');
    } catch (error) {
      this.logger.error('Failed to export staff to CSV', error);
      throw error;
    }
  }

  /**
   * Generate CSV template for staff import - SIMPLIFIED VERSION
   */
  generateImportTemplate(): string {
    const headers = [
      'fullName',
      'email',
      'phone',
      'dob',
      'gender',
      'emergencyContact',
      'basicSalary',
      'employeeId',
      'designation',
      'department',
    ];

    const sampleData = [
      'John Doe',
      'john.doe@school.com',
      '9876543210',
      '1985-05-15',
      'Male',
      '9876543211',
      '25000',
      'ST-2025-001',
      'Office Manager',
      'Administration',
    ];

    const csvRows = [headers.join(','), sampleData.join(',')];

    return csvRows.join('\n');
  }
}
