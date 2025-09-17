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
  @ApiOperation({ summary: 'Import students from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with student data',
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
        // Accept Excel files
        if (
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls')
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only Excel files (.xlsx, .xls) are supported',
            ),
            false,
          );
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
      throw new BadRequestException('CSV file is required');
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

    if (
      !file.originalname.endsWith('.xlsx') &&
      !file.originalname.endsWith('.xls')
    ) {
      this.logger.warn(`Invalid file type: ${file.originalname}`);
      throw new BadRequestException(
        'Only Excel files (.xlsx, .xls) are supported',
      );
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
      `Processing Excel file: ${file.originalname}, size: ${file.size} bytes`,
    );

    const options = {
      skipDuplicates: skipDuplicates === 'true',
      updateExisting: updateExisting === 'true',
    };

    this.logger.log(`Import options: ${JSON.stringify(options)}`);

    return await this.studentImportService.importStudentsFromExcel(
      file.buffer,
      user?.id || 'system',
      options,
    );
  }

  /**
   * Get Excel template for student import
   */
  @Get('import/template')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Excel template for student import' })
  @ApiResponse({
    status: 200,
    description: 'Excel template for student import',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async getImportTemplate(@Res() res: Response) {
    const template = await this.studentImportService.getImportTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="student-import-template.xlsx"',
    );
    res.send(template);
  }

  /**
   * Export students to Excel
   */
  @Get('export')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export students to Excel' })
  @ApiResponse({
    status: 200,
    description: 'Excel file with student data',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportStudents(
    @Res() res: Response,
    @Query('classId') classId?: string,
    @Query('search') search?: string,
    @Query('academicStatus') academicStatus?: string,
  ) {
    const excelBuffer = await this.studentImportService.exportStudentsToExcel({
      classId,
      search,
      academicStatus,
    });

    const filename = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
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
    // Convert JSON data to CSV format for processing
    const headers = [
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
      'secondaryParentName',
      'secondaryParentPhone',
      'secondaryParentEmail',
      'secondaryParentRelation',
    ];

    const csvRows = importData.students.map(student => [
      student.fullName,
      student.email,
      student.phone,
      student.rollNumber,
      student.classGrade,
      student.classSection,
      student.dateOfBirth,
      student.gender,
      student.primaryParentName,
      student.primaryParentPhone,
      student.primaryParentEmail,
      student.primaryParentRelation,
      student.secondaryParentName || '',
      student.secondaryParentPhone || '',
      student.secondaryParentEmail || '',
      student.secondaryParentRelation || '',
    ]);

    const options = {
      skipDuplicates: importData.skipDuplicates || false,
      updateExisting: importData.updateExisting || false,
    };

    // Convert JSON data to the format expected by the service
    const students = importData.students.map(student => ({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      rollNumber: student.rollNumber,
      classGrade: student.classGrade, // Keep as number
      classSection: student.classSection,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender as 'Male' | 'Female' | 'Other',
      primaryParentName: student.primaryParentName,
      primaryParentPhone: student.primaryParentPhone,
      primaryParentEmail: student.primaryParentEmail,
      primaryParentRelation: student.primaryParentRelation,
      secondaryParentName: student.secondaryParentName || '',
      secondaryParentPhone: student.secondaryParentPhone || '',
      secondaryParentEmail: student.secondaryParentEmail || '',
      secondaryParentRelation: student.secondaryParentRelation || '',
    }));

    // Process the students directly
    return await this.studentImportService.processStudentImports(
      students,
      user?.id || 'system',
      options,
    );
  }
}
