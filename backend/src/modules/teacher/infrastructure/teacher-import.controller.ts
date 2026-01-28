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
  @ApiOperation({ summary: 'Import teachers from XLSX file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'XLSX file with teacher data',
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
      .map(value => String(value || '').trim());
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

    return await this.teacherImportService.importTeachersFromRecords(
      records,
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
  @ApiOperation({ summary: 'Export teachers to XLSX' })
  @ApiResponse({
    status: 200,
    description: 'XLSX file with teacher data',
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
    const { headers, rows } =
      await this.teacherImportService.exportTeachersToRows({
        department,
        search,
        designation,
      });
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Teachers Export');
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
    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: Math.max(header.length + 4, 16),
    }));
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `teachers_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  }

  /**
   * Get CSV template for teacher import
   */
  @Get('import/template')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get XLSX template for teacher import' })
  @ApiResponse({
    status: 200,
    description: 'XLSX template file',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async getImportTemplate(@Res() res: Response) {
    const { headers, sampleRow } =
      this.teacherImportService.getImportTemplateData();
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Teacher Import Template');
    worksheet.addRow(headers);
    worksheet.addRow(sampleRow);
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
      width: Math.max(header.length + 4, sampleRow[index]?.length + 2, 16),
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
      'attachment; filename="teacher_import_template.xlsx"',
    );
    res.send(Buffer.from(buffer));
  }
}
