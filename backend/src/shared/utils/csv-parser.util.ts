import { parse } from 'csv-parse/sync';
import { BadRequestException } from '@nestjs/common';

export interface CSVParseOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trim?: boolean;
  columns?: boolean;
}

export interface CSVParseResult<T> {
  data: T[];
  errors: Array<{
    row: number;
    line: string;
    error: string;
  }>;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

/**
 * Parse CSV content and validate each row against a schema
 */
export function parseCSV<T>(
  csvContent: string,
  schema: any,
  options: CSVParseOptions = {},
): CSVParseResult<T> {
  const {
    delimiter = ',',
    skipEmptyLines = true,
    trim = true,
    columns = true,
  } = options;

  try {
    // Parse CSV content
    const records = parse(csvContent, {
      delimiter,
      skip_empty_lines: skipEmptyLines,
      trim,
      columns,
    }) as unknown as Record<string, string>[];

    const data: T[] = [];
    const errors: Array<{
      row: number;
      line: string;
      error: string;
    }> = [];

    // Validate each row
    records.forEach((record: Record<string, string>, index: number) => {
      try {
        // Convert string values to appropriate types
        const processedRecord = processRecord(record);

        // Validate against schema
        const validatedRecord = (
          schema as { parse: (data: unknown) => T }
        ).parse(processedRecord);
        data.push(validatedRecord);
      } catch (error) {
        errors.push({
          row: index + 2, // +2 because index starts at 0 and we want to account for header row
          line: Object.values(record).join(','),
          error:
            error instanceof Error ? error.message : 'Unknown validation error',
        });
      }
    });

    return {
      data,
      errors,
      totalRows: records.length,
      validRows: data.length,
      invalidRows: errors.length,
    };
  } catch (error) {
    throw new BadRequestException(
      `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Process record values to convert strings to appropriate types
 */
function processRecord(record: any): any {
  const processed: any = {};

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      // Convert classGrade to number
      if (key === 'classGrade') {
        processed[key] = parseInt(trimmedValue, 10);
        if (isNaN(processed[key])) {
          throw new Error(`Invalid class grade: ${trimmedValue}`);
        }
      }
      // Validate date format but keep as string for validation
      else if (key === 'dateOfBirth') {
        const date = new Date(trimmedValue);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${trimmedValue}`);
        }
        processed[key] = trimmedValue; // Keep as string for validation, will be converted to Date later
      }
      // Keep other string values as is
      else {
        processed[key] = trimmedValue;
      }
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

/**
 * Generate CSV template for student import
 */
export function generateStudentImportTemplate(): string {
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

  const exampleRow = [
    'John Doe',
    'john@example.com',
    '1234567890',
    '001',
    '10',
    'A',
    '2008-05-15', // Date format: YYYY-MM-DD
    'Male',
    'John Doe Sr.',
    '9876543210',
    'parent@example.com',
    'Father',
    'Jane Doe',
    '1122334455',
    'parent2@example.com',
    'Mother',
  ];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}
