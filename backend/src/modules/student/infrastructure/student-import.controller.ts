import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/guards/jwt-auth.guard';
import { StudentImportService } from '../application/student-import.service';
import { getStudentImportTemplateData } from '../../../shared/utils/csv-parser.util';
import { Public } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('Student Import/Export')
@Controller('api/v1/student-import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentImportController {
  private readonly logger = new Logger(StudentImportController.name);

  constructor(private readonly studentImportService: StudentImportService) {}

  /**
   * Test endpoint to verify CSRF token validation
   */
  @Post('import/test')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test CSRF token validation' })
  async testCsrfToken() {
    return { message: 'CSRF token validation successful' };
  }

  /**
   * Import students from CSV file
   */
  @Post('import')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import students from XLSX file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'XLSX file with student data',
        },
        skipDuplicates: {
          type: 'boolean',
          description: 'Skip duplicate students instead of failing',
          default: false,
        },
        updateExisting: {
          type: 'boolean',
          description: 'Update existing students instead of failing',
          default: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Students imported successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        totalProcessed: { type: 'number' },
        successfulImports: { type: 'number' },
        failedImports: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              row: { type: 'number' },
              student: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
        importedStudents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string' },
              email: { type: 'string' },
              rollNumber: { type: 'string' },
              className: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined, // Use memory storage to get buffer
      fileFilter: (req, file, cb) => {
        // Accept XLSX files
        if (
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.originalname.endsWith('.xlsx')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only XLSX files are supported'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async importStudents(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('skipDuplicates') skipDuplicates?: string,
    @Body('updateExisting') updateExisting?: string,
  ) {
    this.logger.log(`Import request received from user: ${user?.id}`);

    if (!file) {
      this.logger.warn('No file received in import request');
      throw new BadRequestException('XLSX file is required');
    }

    // Enhanced debug logging
    this.logger.log('File object received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer,
      bufferType: typeof file.buffer,
      bufferLength: file.buffer?.length,
      keys: Object.keys(file),
      fieldname: file.fieldname,
      encoding: file.encoding,
      destination: file.destination,
      filename: file.filename,
    });

    // Also log to console for immediate debugging
    this.logger.log('🔍 File object received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer,
      bufferType: typeof file.buffer,
      bufferLength: file.buffer?.length,
      keys: Object.keys(file),
      fieldname: file.fieldname,
      encoding: file.encoding,
      destination: file.destination,
      filename: file.filename,
    });

    if (!file.originalname.endsWith('.xlsx')) {
      this.logger.warn(`Invalid file type: ${file.originalname}`);
      throw new BadRequestException('Only XLSX files are supported');
    }

    // Check if file has buffer property
    if (!file.buffer) {
      this.logger.error('File upload failed - no file content received', {
        fileInfo: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          keys: Object.keys(file),
        },
      });
      throw new BadRequestException(
        'File upload failed - no file content received. Please try again or contact support.',
      );
    }

    this.logger.log(
      `Processing XLSX file: ${file.originalname}, size: ${file.size} bytes`,
    );

    const options = {
      skipDuplicates: skipDuplicates === 'true',
      updateExisting: updateExisting === 'true',
    };

    this.logger.log(`Import options: ${JSON.stringify(options)}`);

    const workbook = new (await import('exceljs')).Workbook();
    const bufferSource = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(file.buffer as ArrayBuffer);
    const arrayBuffer = Uint8Array.from(bufferSource).buffer;
    const xlsxLoader = workbook.xlsx as unknown as {
      load: (data: ArrayBuffer) => Promise<void>;
    };
    await xlsxLoader.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('No worksheet found in XLSX file');
    }

    const headerRow = worksheet.getRow(1);
    const headerValues = Array.isArray(headerRow.values)
      ? headerRow.values
      : [];
    const headers = headerValues
      .slice(1)
      .map(value => String(value || '').trim())
      .map(header =>
        header.replace(/\s*\*$/, '').replace(/\s*\(required\)$/i, ''),
      );
    if (!headers.length) {
      throw new BadRequestException('XLSX header row is empty');
    }

    const records: Record<string, string>[] = [];
    const normalizeCellValue = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
      }
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      if (typeof value === 'object') {
        const v = value as {
          text?: string;
          hyperlink?: string;
          richText?: Array<{ text?: string }>;
          result?: unknown;
        };
        if (typeof v.text === 'string') return v.text;
        if (Array.isArray(v.richText)) {
          const joined = v.richText.map(part => part.text || '').join('');
          if (joined) return joined;
        }
        if (typeof v.result === 'string' || typeof v.result === 'number') {
          return String(v.result);
        }
        if (typeof v.hyperlink === 'string') return v.hyperlink;
      }
      return String(value);
    };
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowValues = Array.isArray(row.values) ? row.values : [];
      const values = rowValues.slice(1);
      if (
        values.every(
          value => value === null || value === undefined || value === '',
        )
      ) {
        return;
      }
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        const cellValue = values[index];
        record[header] = normalizeCellValue(cellValue);
      });
      records.push(record);
    });

    return await this.studentImportService.importStudentsFromRecords(
      records,
      user?.id || 'system',
      options,
    );
  }

  /**
   * Get CSV template for student import
   */
  @Get('import/template')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get XLSX template for student import' })
  @ApiResponse({
    status: 200,
    description: 'XLSX template file',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async getImportTemplate(@Res() res: Response) {
    const { headers, exampleRow } = getStudentImportTemplateData();
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Import Template');
    worksheet.addRow(headers);
    worksheet.addRow(exampleRow);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.columns = headers.map((header, index) => ({
      header,
      key: header,
      width: Math.max(header.length + 4, exampleRow[index]?.length + 2, 16),
    }));
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.getRow(2).alignment = { vertical: 'middle' };
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="student_import_template.xlsx"',
    );
    res.send(Buffer.from(buffer));
  }

  /**
   * Export students to CSV
   */
  @Get('export')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export students to XLSX' })
  @ApiResponse({
    status: 200,
    description: 'XLSX file with student data',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async exportStudents(
    @Res() res: Response,
    @Query('classId') classId?: string,
    @Query('search') search?: string,
    @Query('academicStatus') academicStatus?: string,
  ) {
    const { headers, rows } =
      await this.studentImportService.exportStudentsToRows({
        classId,
        search,
        academicStatus,
      });
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students Export');
    worksheet.addRow(headers);
    rows.forEach(row => worksheet.addRow(row));
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.columns = headers.map((header, index) => ({
      header,
      key: header,
      width: Math.max(header.length + 4, 16),
    }));
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  }

  /**
   * Import students from JSON data (alternative to file upload)
   */
  @Post('import/json')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import students from JSON data' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        students: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fullName: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              rollNumber: { type: 'string' },
              classGrade: { type: 'number' },
              classSection: { type: 'string' },
              dateOfBirth: { type: 'string' },
              gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
              motherTongue: { type: 'string' },
              disabilityType: { type: 'string' },
              address: { type: 'string' },
              primaryParentName: { type: 'string' },
              primaryParentPhone: { type: 'string' },
              primaryParentEmail: { type: 'string' },
              primaryParentRelation: { type: 'string' },
              secondaryParentName: { type: 'string' },
              secondaryParentPhone: { type: 'string' },
              secondaryParentEmail: { type: 'string' },
              secondaryParentRelation: { type: 'string' },
            },
            required: [
              'fullName',
              'email',
              'phone',
              'rollNumber',
              'classGrade',
              'classSection',
              'dateOfBirth',
              'gender',
              'primaryParentName',
              'primaryParentPhone',
              'primaryParentEmail',
              'primaryParentRelation',
            ],
          },
        },
        skipDuplicates: { type: 'boolean', default: false },
        updateExisting: { type: 'boolean', default: false },
      },
      required: ['students'],
    },
  })
  async importStudentsFromJSON(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    importData: {
      students: Array<{
        fullName: string;
        email: string;
        phone: string;
        rollNumber: string;
        classGrade: number;
        classSection: string;
        dateOfBirth: string;
        gender: string;
        motherTongue?: string;
        disabilityType?: string;
        address?: string;
        primaryParentName: string;
        primaryParentPhone: string;
        primaryParentEmail: string;
        primaryParentRelation: string;
        secondaryParentName?: string;
        secondaryParentPhone?: string;
        secondaryParentEmail?: string;
        secondaryParentRelation?: string;
      }>;
      skipDuplicates?: boolean;
      updateExisting?: boolean;
    },
  ) {
    const options = {
      skipDuplicates: importData.skipDuplicates || false,
      updateExisting: importData.updateExisting || false,
    };

    const records = importData.students.map(student => ({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      rollNumber: student.rollNumber,
      classGrade: String(student.classGrade),
      classSection: student.classSection,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      motherTongue: student.motherTongue || '',
      disabilityType: student.disabilityType || '',
      address: student.address || '',
      primaryParentName: student.primaryParentName,
      primaryParentPhone: student.primaryParentPhone,
      primaryParentEmail: student.primaryParentEmail,
      primaryParentRelation: student.primaryParentRelation,
      secondaryParentName: student.secondaryParentName || '',
      secondaryParentPhone: student.secondaryParentPhone || '',
      secondaryParentEmail: student.secondaryParentEmail || '',
      secondaryParentRelation: student.secondaryParentRelation || '',
    }));

    return await this.studentImportService.importStudentsFromRecords(
      records,
      user?.id || 'system',
      options,
    );
  }
}
