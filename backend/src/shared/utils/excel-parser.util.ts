import * as ExcelJS from 'exceljs';
import { z } from 'zod';

export interface ExcelParseResult<T> {
  data: T[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

/**
 * Parse Excel file and validate data against a Zod schema
 */
export async function parseExcel<T>(
  buffer: Buffer,
  schema: z.ZodSchema<T>,
): Promise<ExcelParseResult<T>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }

  const result: ExcelParseResult<T> = {
    data: [],
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
  };

  // Get headers from first row
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.text?.toString().trim() || '';
  });

  // Process data rows (skip header row)
  result.totalRows = worksheet.rowCount - 1;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rowData: Record<string, any> = {};

    // Extract data from each cell
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        let value = cell.value;

        // Convert Excel values to strings for validation
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object' && 'text' in value) {
          value = value.text;
        } else if (typeof value === 'number') {
          value = value.toString();
        } else if (typeof value === 'boolean') {
          value = value.toString();
        } else if (value instanceof Date) {
          value = value.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        } else {
          value = String(value).trim();
        }

        rowData[header] = value;
      }
    });

    // Validate row data
    try {
      const validatedData = schema.parse(rowData);
      result.data.push(validatedData);
      result.validRows++;
    } catch (error) {
      result.invalidRows++;

      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          result.errors.push({
            row: rowNumber,
            field: err.path.join('.'),
            message: err.message,
          });
        });
      } else {
        result.errors.push({
          row: rowNumber,
          field: 'unknown',
          message: error.message || 'Unknown validation error',
        });
      }
    }
  }

  return result;
}

/**
 * Generate Excel template with headers and sample data
 */
export async function generateExcelTemplate(
  headers: string[],
  sampleData?: Record<string, any>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Teacher Import Template');

  // Add headers
  worksheet.addRow(headers);

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }, // Light purple background
  };

  // Add sample data if provided
  if (sampleData && sampleData.length > 0) {
    sampleData.forEach(rowData => {
      const row = headers.map(header => rowData[header] || '');
      worksheet.addRow(row);
    });
  }

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = Math.max(column.width || 10, 15);
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
