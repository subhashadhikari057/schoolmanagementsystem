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

const MOTHER_TONGUE_LABELS: Array<{ code: string; label: string }> = [
  { code: 'NEPALI', label: 'Nepali' },
  { code: 'MAITHILI', label: 'Maithili' },
  { code: 'BHOJPURI', label: 'Bhojpuri' },
  { code: 'THARU', label: 'Tharu' },
  { code: 'TAMANG', label: 'Tamang' },
  { code: 'BAJJIKA', label: 'Bajjika' },
  { code: 'AVADHI', label: 'Avadhi' },
  { code: 'NEPALBHASHA_NEWARI', label: 'Nepalbhasha (Newari)' },
  { code: 'MAGAR_DHUT', label: 'Magar Dhut' },
  { code: 'DOTELI', label: 'Doteli' },
  { code: 'URDU', label: 'Urdu' },
  { code: 'YAKTHUNG_LIMBU', label: 'Yakthung/ Limbu' },
  { code: 'GURUNG', label: 'Gurung' },
  { code: 'MAGAHI', label: 'Magahi' },
  { code: 'BAITADELI', label: 'Baitadeli' },
  { code: 'RAI', label: 'Rai' },
  { code: 'ACHHAMI', label: 'Achhami' },
  { code: 'BANTAWA', label: 'Bantawa' },
  { code: 'RAJBANSHI', label: 'Rajbanshi' },
  { code: 'SHERPA', label: 'Sherpa' },
  { code: 'KHASH', label: 'Khash' },
  { code: 'BAJHANGI', label: 'Bajhangi' },
  { code: 'HINDI', label: 'Hindi' },
  { code: 'MAGAR_KHAM', label: 'Magar Kham' },
  { code: 'CHAMLING', label: 'Chamling' },
  { code: 'RANATHARU', label: 'Ranatharu' },
  { code: 'CHEPANG', label: 'Chepang' },
  { code: 'BAJURELI', label: 'Bajureli' },
  { code: 'SANTHALI', label: 'Santhali' },
  { code: 'DANUWAR', label: 'Danuwar' },
  { code: 'DARCHULELI', label: 'Darchuleli' },
  { code: 'URANW_URAU', label: 'Uranw/Urau' },
  { code: 'KULUNG', label: 'Kulung' },
  { code: 'ANGIKA', label: 'Angika' },
  { code: 'MAJHI', label: 'Majhi' },
  { code: 'SUNUWAR', label: 'Sunuwar' },
  { code: 'THAMI', label: 'Thami' },
  { code: 'GANAGAI', label: 'Ganagai' },
  { code: 'THULUNG', label: 'Thulung' },
  { code: 'BANGLA', label: 'Bangla' },
  { code: 'GHALE', label: 'Ghale' },
  { code: 'SAMPANG', label: 'Sampang' },
  { code: 'MARWADI', label: 'Marwadi' },
  { code: 'DADELDHURI', label: 'Dadeldhuri' },
  { code: 'DHIMAL', label: 'Dhimal' },
  { code: 'TAJPURIYA', label: 'Tajpuriya' },
  { code: 'KUMAL', label: 'Kumal' },
  { code: 'KHALING', label: 'Khaling' },
  { code: 'MUSALMAN', label: 'Musalman' },
  { code: 'WAMBULE', label: 'Wambule' },
  { code: 'BAHING_BAYUNG', label: 'Bahing/ Bayung' },
  { code: 'YAKKHA', label: 'Yakkha' },
  { code: 'SANSKRIT', label: 'Sanskrit' },
  { code: 'BHUJEL', label: 'Bhujel' },
  { code: 'BHOTE', label: 'Bhote' },
  { code: 'DARAI', label: 'Darai' },
  { code: 'YAMPHU_YAMPHE', label: 'Yamphu/Yamphe' },
  { code: 'NACHHIRING', label: 'Nachhiring' },
  { code: 'HYOLMO_YHOLMO', label: 'Hyolmo/Yholmo' },
  { code: 'DUMI', label: 'Dumi' },
  { code: 'JUMLI', label: 'Jumli' },
  { code: 'BOTE', label: 'Bote' },
  { code: 'MEWAHANG', label: 'Mewahang' },
  { code: 'PUMA', label: 'Puma' },
  { code: 'PAHARI', label: 'Pahari' },
  { code: 'ATHPAHARIYA', label: 'Athpahariya' },
  { code: 'DUNGMALI', label: 'Dungmali' },
  { code: 'JIREL', label: 'Jirel' },
  { code: 'TIBETAN', label: 'Tibetan' },
  { code: 'DAILEKHI', label: 'Dailekhi' },
  { code: 'CHUM_NUBRI', label: 'Chum/ Nubri' },
  { code: 'CHHANTYAL', label: 'Chhantyal' },
  { code: 'RAJI', label: 'Raji' },
  { code: 'THAKALI', label: 'Thakali' },
  { code: 'MECHE', label: 'Meche' },
  { code: 'KOYEE', label: 'Koyee' },
  { code: 'LOHORUNG', label: 'Lohorung' },
  { code: 'KEWARAT', label: 'Kewarat' },
  { code: 'DOLPALI', label: 'Dolpali' },
  { code: 'DONE', label: 'Done' },
  { code: 'MUGALI', label: 'Mugali' },
  { code: 'JERO_JERUNG', label: 'Jero/ Jerung' },
  { code: 'KARMARONG', label: 'Karmarong' },
  { code: 'CHHINTANG', label: 'Chhintang' },
  { code: 'LHOPA', label: 'Lhopa' },
  { code: 'LAPCHA', label: 'Lapcha' },
  { code: 'MUNDA_MUDIYARI', label: 'Munda/Mudiyari' },
  { code: 'MANANGE', label: 'Manange' },
  { code: 'CHHILING', label: 'Chhiling' },
  { code: 'DURA', label: 'Dura' },
  { code: 'TILUNG', label: 'Tilung' },
  { code: 'SIGN_LANGUAGE', label: 'Sign Language' },
  { code: 'BYANSI', label: 'Byansi' },
  { code: 'BALKURA_BARAM', label: 'Balkura/ Baram' },
  { code: 'BARAGUNWA', label: 'Baragunwa' },
  { code: 'SADRI', label: 'Sadri' },
  { code: 'ENGLISH', label: 'English' },
  { code: 'MAGAR_KAIKE', label: 'Magar Kaike' },
  { code: 'SONAHA', label: 'Sonaha' },
  { code: 'HAYU_VAYU', label: 'Hayu/ Vayu' },
  { code: 'KISAN', label: 'Kisan' },
  { code: 'PUNJABI', label: 'Punjabi' },
  { code: 'DHULELI', label: 'Dhuleli' },
  { code: 'KHAMCHI_RAUTE', label: 'Khamchi (Raute)' },
  { code: 'LUNGKHIM', label: 'Lungkhim' },
  { code: 'LOWA', label: 'Lowa' },
  { code: 'KAGATE', label: 'Kagate' },
  { code: 'WALING_WALUNG', label: 'Waling/ Walung' },
  { code: 'NAR_PHU', label: 'Nar-Phu' },
  { code: 'LHOMI', label: 'Lhomi' },
  { code: 'TICHHURONG_POIKE', label: 'Tichhurong Poike' },
  { code: 'KURMALI', label: 'Kurmali' },
  { code: 'KOCHE', label: 'Koche' },
  { code: 'SINDHI', label: 'Sindhi' },
  { code: 'PHANGDUWALI', label: 'Phangduwali' },
  { code: 'BELHARE', label: 'Belhare' },
  { code: 'SUREL', label: 'Surel' },
  { code: 'MALPANDE', label: 'Malpande' },
  { code: 'KHARIYA', label: 'Khariya' },
  { code: 'SADHANI', label: 'Sadhani' },
  { code: 'HARIYANWI', label: 'Hariyanwi' },
  { code: 'SAM', label: 'Sam' },
  { code: 'BANKARIYA', label: 'Bankariya' },
  { code: 'KUSUNDA', label: 'Kusunda' },
];

const DISABILITY_TYPE_LABELS: Array<{ code: string; label: string }> = [
  { code: 'NO_DISABILITY', label: 'No Disability' },
  { code: 'PHYSICAL', label: 'Physical' },
  { code: 'INTELLECTUAL_DISABILITY', label: 'Intellectual Disability' },
  { code: 'DEAF', label: 'Deaf' },
  { code: 'HARD_OF_HEARING', label: 'Hard of Hearing' },
  { code: 'TOTALLY_BLIND', label: 'Totally Blind' },
  { code: 'VISUALLY_IMPAIRED', label: 'Visually Impaired' },
  { code: 'LOW_VISION', label: 'Low Vision' },
  { code: 'DEAFBLINDNESS', label: 'Deafblindness' },
  { code: 'BLIND', label: 'Blind' },
  { code: 'VOCAL_AND_SPEECH_RELATED', label: 'Vocal and Speech related' },
  { code: 'AUTISM', label: 'Autism' },
  { code: 'MENTAL_PSYCHOSOCIAL', label: 'Mental / Psychosocial' },
  { code: 'HEMOPHILIA', label: 'Hemophilia' },
  { code: 'MULTIPLE_DISABILITY', label: 'Multiple Disability' },
  { code: 'DEAF_AND_BLIND', label: 'Deaf and Blind' },
  { code: 'NA', label: 'N/A' },
];

const normalizeEnumValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]/g, '')
    .trim();

const buildEnumLabelMap = (items: Array<{ code: string; label: string }>) => {
  const map = new Map<string, string>();
  items.forEach(item => {
    map.set(normalizeEnumValue(item.label), item.code);
    map.set(normalizeEnumValue(item.code), item.code);
  });
  return map;
};

const MOTHER_TONGUE_MAP = buildEnumLabelMap(MOTHER_TONGUE_LABELS);
const DISABILITY_TYPE_MAP = buildEnumLabelMap(DISABILITY_TYPE_LABELS);

export const formatMotherTongueLabel = (value?: string): string =>
  MOTHER_TONGUE_LABELS.find(item => item.code === value)?.label || value || '';

export const formatDisabilityTypeLabel = (value?: string): string =>
  DISABILITY_TYPE_LABELS.find(item => item.code === value)?.label ||
  value ||
  '';

export function parseRecords<T>(
  records: Record<string, string>[],
  schema: any,
): CSVParseResult<T> {
  const data: T[] = [];
  const errors: Array<{
    row: number;
    line: string;
    error: string;
  }> = [];

  records.forEach((record: Record<string, string>, index: number) => {
    try {
      const processedRecord = processRecord(record);
      const validatedRecord = (schema as { parse: (data: unknown) => T }).parse(
        processedRecord,
      );
      data.push(validatedRecord);
    } catch (error) {
      errors.push({
        row: index + 2,
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

    return parseRecords(records, schema);
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
      if (trimmedValue === '') {
        processed[key] = undefined;
        continue;
      }

      // Convert classGrade to number
      if (key === 'classGrade') {
        processed[key] = parseInt(trimmedValue, 10);
        if (isNaN(processed[key])) {
          throw new Error(`Invalid class grade: ${trimmedValue}`);
        }
      }
      // Normalize classSection to uppercase (e.g., "a" -> "A")
      else if (key === 'classSection') {
        processed[key] = trimmedValue.toUpperCase();
      }
      // Validate date format but keep as string for validation
      else if (key === 'dateOfBirth') {
        const date = new Date(trimmedValue);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${trimmedValue}`);
        }
        processed[key] = trimmedValue; // Keep as string for validation, will be converted to Date later
      }
      // Normalize gender case to match enum
      else if (key === 'gender') {
        const g = trimmedValue.toLowerCase();
        if (g === 'male') processed[key] = 'Male';
        else if (g === 'female') processed[key] = 'Female';
        else if (g === 'other') processed[key] = 'Other';
        else processed[key] = trimmedValue;
      }
      // Normalize enum labels for import
      else if (key === 'motherTongue') {
        if (!trimmedValue) {
          processed[key] = undefined;
        } else {
          const normalized = normalizeEnumValue(trimmedValue);
          processed[key] = MOTHER_TONGUE_MAP.get(normalized) || trimmedValue;
        }
      } else if (key === 'disabilityType') {
        if (!trimmedValue) {
          processed[key] = undefined;
        } else {
          const normalized = normalizeEnumValue(trimmedValue);
          processed[key] = DISABILITY_TYPE_MAP.get(normalized) || trimmedValue;
        }
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
export function getStudentImportTemplateData(): {
  headers: string[];
  exampleRow: string[];
} {
  const headers = [
    'studentIemisCode*',
    'fullName*',
    'email*',
    'phone*',
    'rollNumber*',
    'classGrade*',
    'classSection*',
    'dateOfBirth*',
    'gender*',
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

  const exampleRow = [
    'IEMIS-001',
    'Emma Wilson',
    'emma.wilson@example.com',
    '9819677711',
    'STU002',
    '1',
    'A',
    '2008-04-15', // Date format: YYYY-MM-DD
    'Female',
    'Nepali',
    'No Disability',
    'Kathmandu',
    'David Wilson',
    '9819677712',
    'david.wilson@example.com',
    'Father',
    'Lisa Wilson',
    '9819677713',
    'lisa.wilson@example.com',
    'Mother',
  ];

  return { headers, exampleRow };
}

/**
 * Generate CSV template for student import
 */
export function generateStudentImportTemplate(): string {
  const { headers, exampleRow } = getStudentImportTemplateData();
  return [headers.join(','), exampleRow.join(',')].join('\n');
}
