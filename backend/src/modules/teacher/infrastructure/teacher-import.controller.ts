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
import { TeacherImportService } from '../application/teacher-import.service';

@ApiTags('Teacher Import/Export')
@Controller('api/v1/teacher-import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherImportController {
  private readonly logger = new Logger(TeacherImportController.name);

  constructor(private readonly teacherImportService: TeacherImportService) {}

  /**
   * Import teachers from CSV file
   */
  @Post('import')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import teachers from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with teacher data',
        },
        skipDuplicates: {
          type: 'boolean',
          description: 'Skip duplicate teachers instead of failing',
          default: false,
        },
        updateExisting: {
          type: 'boolean',
          description: 'Update existing teachers instead of failing',
          default: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Teachers imported successfully',
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
              teacher: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
        importedTeachers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string' },
              email: { type: 'string' },
              employeeId: { type: 'string' },
              designation: { type: 'string' },
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
        // Accept CSV files
        if (
          file.mimetype === 'text/csv' ||
          file.originalname.endsWith('.csv')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV files are supported'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async importTeachers(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('skipDuplicates') skipDuplicates?: string,
    @Body('updateExisting') updateExisting?: string,
  ) {
    this.logger.log(`Import request received from user: ${user?.id}`);

    if (!file) {
      this.logger.warn('No file received in import request');
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Processing file: ${file.originalname}`, {
      filename: file.filename,
    });

    if (!file.originalname.endsWith('.csv')) {
      this.logger.warn(`Invalid file type: ${file.originalname}`);
      throw new BadRequestException('Only CSV files are supported');
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
      `Processing CSV file: ${file.originalname}, size: ${file.size} bytes`,
    );

    const csvContent = file.buffer.toString('utf-8');
    this.logger.log(`CSV content length: ${csvContent.length} characters`);

    const options = {
      skipDuplicates: skipDuplicates === 'true',
      updateExisting: updateExisting === 'true',
    };

    this.logger.log(`Import options: ${JSON.stringify(options)}`);

    return await this.teacherImportService.importTeachersFromCSV(
      csvContent,
      user?.id || 'system',
      options,
    );
  }

  /**
   * Export teachers to CSV
   */
  @Get('export')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export teachers to CSV' })
  @ApiResponse({
    status: 200,
    description: 'CSV file with teacher data',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async exportTeachers(
    @Res() res: Response,
    @Query('department') department?: string,
    @Query('search') search?: string,
    @Query('designation') designation?: string,
  ) {
    const csvContent = await this.teacherImportService.exportTeachersToCSV({
      department,
      search,
      designation,
    });

    const filename = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  }

  /**
   * Get CSV template for teacher import
   */
  @Get('import/template')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get CSV template for teacher import' })
  @ApiResponse({
    status: 200,
    description: 'CSV template file',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async getImportTemplate(@Res() res: Response) {
    const csvContent = this.teacherImportService.generateImportTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="teacher_import_template.csv"',
    );
    res.send(csvContent);
  }
}
