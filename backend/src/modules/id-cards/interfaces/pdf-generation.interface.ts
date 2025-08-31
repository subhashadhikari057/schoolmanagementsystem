export interface PDFGenerationOptions {
  template: TemplateData;
  personData: PersonData;
  qrCodeData: string;
  outputPath: string;
}

export interface TemplateData {
  id: string;
  name: string;
  dimensions: string;
  printMargin?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  borderWidth?: number;
  borderColor?: string;
  fields: TemplateFieldData[];
}

export interface TemplateFieldData {
  id: string;
  fieldType: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  textAlign?: string;
  dataSource?: string;
  staticText?: string;
  databaseField?: string;
  imageUrl?: string;
  qrData?: string;
  zIndex?: number;
}

export interface PersonData {
  id: string;
  user?: {
    fullName?: string;
    email?: string;
  };
  class?: {
    name?: string;
    grade?: number;
    section?: string;
  };
  profile?: {
    profilePhotoUrl?: string;
  };
  rollNumber?: string;
  employeeId?: string;
  fullName?: string;
  department?: string;
  designation?: string;
  [key: string]: unknown;
}
