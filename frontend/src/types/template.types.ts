// ============================================================================
// ID Card Template Types & Enums
// ============================================================================

// ============================================================================
// Enums (matching backend)
// ============================================================================

export enum IDCardTemplateType {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  STAFF = 'STAFF',
  STAFF_NO_LOGIN = 'STAFF_NO_LOGIN',
}

export enum TemplateOrientation {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
}

export enum TemplateFieldType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  QR_CODE = 'QR_CODE',
  BARCODE = 'BARCODE',
  LOGO = 'LOGO',
  PHOTO = 'PHOTO',
  DATE = 'DATE',
  TIME = 'TIME',
  SIGNATURE = 'SIGNATURE',
}

export enum TextAlignment {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT',
  JUSTIFY = 'JUSTIFY',
}

// ============================================================================
// Card Dimension Options
// ============================================================================

export interface CardDimension {
  value: string;
  label: string;
  ratio: number;
  width?: number;
  height?: number;
}

export const CARD_DIMENSIONS: CardDimension[] = [
  {
    value: '85.6x53.98',
    label: 'Standard Credit Card (85.6 × 53.98 mm)',
    ratio: 1.6,
    width: 85.6,
    height: 53.98,
  },
  {
    value: '86x54',
    label: 'ISO/IEC 7810 ID-1 (86 × 54 mm)',
    ratio: 1.59,
    width: 86,
    height: 54,
  },
  {
    value: '105x74',
    label: 'Custom Large (105 × 74 mm)',
    ratio: 1.42,
    width: 105,
    height: 74,
  },
  {
    value: '70x100',
    label: 'Badge Style (70 × 100 mm)',
    ratio: 0.7,
    width: 70,
    height: 100,
  },
  {
    value: 'custom',
    label: 'Custom Dimensions',
    ratio: 1.6,
  },
];

// ============================================================================
// Template User Type Options
// ============================================================================

export interface TemplateTypeOption {
  value: IDCardTemplateType;
  label: string;
  description: string;
}

export const TEMPLATE_TYPE_OPTIONS: TemplateTypeOption[] = [
  {
    value: IDCardTemplateType.STUDENT,
    label: 'Student',
    description: 'ID cards for enrolled students',
  },
  {
    value: IDCardTemplateType.TEACHER,
    label: 'Teacher',
    description: 'ID cards for teaching staff with login access',
  },
  {
    value: IDCardTemplateType.STAFF,
    label: 'Staff (with login)',
    description: 'ID cards for administrative staff with system access',
  },
  {
    value: IDCardTemplateType.STAFF_NO_LOGIN,
    label: 'Staff (without login)',
    description: 'ID cards for support staff without system access',
  },
];

// ============================================================================
// Main Template Interface
// ============================================================================

export interface IDCardTemplate {
  id: string;
  name: string;
  type: IDCardTemplateType;
  description?: string;
  dimensions: string;
  customWidth?: number;
  customHeight?: number;
  orientation: TemplateOrientation;
  backgroundColor?: string;
  backgroundImage?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  logoRequired?: boolean;
  photoRequired?: boolean;
  qrCodeRequired?: boolean;
  barcodeRequired?: boolean;
  watermark?: string;
  printMargin?: number;
  bleedArea?: number;
  safeArea?: number;
  features?: string[];
  metadata?: Record<string, unknown>;
  isDefault: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'; // Template status
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  fields: TemplateField[];
}

// ============================================================================
// Template Field Interface
// f

export interface TemplateField {
  id?: string;
  templateId?: string;
  fieldType: TemplateFieldType;
  label: string;
  databaseField?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: TextAlignment;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  required?: boolean;
  placeholder?: string;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  // New fields for enhanced template functionality
  dataSource?: string;
  staticText?: string;
  imageUrl?: string;
  qrData?: string;
}

// ============================================================================
// DTO Interfaces (matching backend)
// ============================================================================

export interface CreateTemplateDto {
  name: string;
  type: IDCardTemplateType;
  description?: string;
  dimensions: string;
  customWidth?: number;
  customHeight?: number;
  orientation?: TemplateOrientation;
  backgroundColor?: string;
  backgroundImage?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  logoRequired?: boolean;
  photoRequired?: boolean;
  qrCodeRequired?: boolean;
  barcodeRequired?: boolean;
  watermark?: string;
  printMargin?: number;
  bleedArea?: number;
  safeArea?: number;
  features?: string[];
  metadata?: Record<string, unknown>;
  fields?: TemplateField[];
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {}

// ============================================================================
// Frontend Component Types
// ============================================================================

export interface TemplateSettings {
  name: string;
  type: IDCardTemplateType;
  description: string;
  dimensions: string;
  customWidth?: number;
  customHeight?: number;
  orientation: TemplateOrientation;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  logoRequired: boolean;
  photoRequired: boolean;
  qrCodeRequired: boolean;
  barcodeRequired: boolean;
  printMargin: number;
  bleedArea: number;
  safeArea: number;
}

export interface ComponentTemplateField {
  id: string;
  type: TemplateFieldType;
  label: string;
  databaseField?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: TextAlignment;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface TemplateResponse {
  templates: IDCardTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Database Field Types
// ============================================================================

export interface DatabaseField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'image';
  description?: string;
  category: 'personal' | 'academic' | 'contact' | 'system' | 'custom';
  isRequired?: boolean;
  defaultValue?: string | number | boolean | null;
  format?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface TemplateFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: IDCardTemplateType;
  orientation?: TemplateOrientation;
  // Removed isActive filter - all templates are usable
  isDefault?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Stats Types
// ============================================================================

export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  publishedTemplates: number;
  totalUsage: number;
  typeDistribution: {
    [key in IDCardTemplateType]: number;
  };
  orientationDistribution: {
    [key in TemplateOrientation]: number;
  };
  dimensionDistribution: {
    [key: string]: number;
  };
}

// ============================================================================
// Legacy types for backward compatibility
// ============================================================================

export interface CreateTemplateRequest extends CreateTemplateDto {}
export interface UpdateTemplateRequest extends UpdateTemplateDto {}

// Note: ApiResponse and ApiError are imported from '@/api/types/common'

// Modal Props Types
export interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTemplate?: IDCardTemplate;
  mode?: 'create' | 'edit';
}

// Template Builder Types
export interface TemplateBuilderState {
  template: CreateTemplateRequest;
  selectedField?: TemplateField;
  isDirty: boolean;
  errors: Record<string, string>;
}

export interface FieldPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSettings {
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

// Export Types
export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  quality?: number;
  dpi?: number;
  includeBleed?: boolean;
  includeMarks?: boolean;
}

// Import Types
export interface ImportTemplateData {
  template: CreateTemplateRequest;
  warnings?: string[];
  errors?: string[];
}

// Template Validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Template Preview Types
export interface PreviewOptions {
  showFieldBounds: boolean;
  showSafeArea: boolean;
  showBleedArea: boolean;
  scale: number;
}

export interface TemplatePreview {
  imageUrl: string;
  width: number;
  height: number;
  fields: RenderedField[];
}

export interface RenderedField {
  id: string;
  content: string;
  position: FieldPosition;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: string;
  };
}
