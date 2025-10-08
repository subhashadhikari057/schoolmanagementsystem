import React, { useState, useRef, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { Rnd } from 'react-rnd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { templateApiService } from '@/services/template.service';
import {
  schoolInformationService,
  SchoolInformation,
} from '@/api/services/school-information.service';
import {
  CreateTemplateDto,
  TemplateField,
  IDCardTemplate,
  IDCardTemplateType,
  TemplateOrientation,
  TemplateFieldType,
  TextAlignment,
  TEMPLATE_TYPE_OPTIONS,
  CARD_DIMENSIONS,
} from '@/types/template.types';
import {
  FileText,
  Image as ImageIcon,
  Layout,
  Palette,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Type,
  QrCode,
  CreditCard,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  Copy,
  Grid,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Component-specific field interface (extends the API type)
interface ComponentTemplateField extends TemplateField {
  id: string;
  fieldType: TemplateFieldType;
  visible?: boolean;
  locked?: boolean;
  dataSource?: 'static' | 'database'; // New: static text or database field
  staticText?: string; // For static text fields
  databaseField?: string; // For database field mapping
  imageUrl?: string; // For uploaded images
  qrData?: string; // For QR code data
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTemplate?: IDCardTemplate | null; // For edit mode
}

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onSuccess,
  editTemplate,
}: CreateTemplateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('quickstart');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const [zoomLevel, setZoomLevel] = useState(90);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInformation | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSnapGuides, setShowSnapGuides] = useState(false);
  const [snapGuides, setSnapGuides] = useState<{
    vertical: number[];
    horizontal: number[];
  }>({ vertical: [], horizontal: [] });

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Smooth dragging with momentum
  const dragVelocity = useRef({ x: 0, y: 0 });
  const lastDragPosition = useRef({ x: 0, y: 0, time: 0 });
  const momentumAnimation = useRef<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<CreateTemplateDto>({
    name: '',
    type: IDCardTemplateType.STUDENT,
    description: '',
    dimensions: '85.6x53.98',
    orientation: TemplateOrientation.HORIZONTAL,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 4,
    logoRequired: false,
    photoRequired: false,
    qrCodeRequired: false,
    barcodeRequired: false,
    printMargin: 5,
    bleedArea: 3,
    safeArea: 5,
    fields: [],
  });

  const [templateFields, setTemplateFields] = useState<
    ComponentTemplateField[]
  >([]);

  // Load school information for logo display
  React.useEffect(() => {
    const loadSchoolInfo = async () => {
      if (isOpen) {
        try {
          const response =
            await schoolInformationService.getSchoolInformation();
          if (response.success && response.data) {
            setSchoolInfo(response.data);
            // Force a re-render of template fields when school info loads
            setTemplateFields(prev => [...prev]);
          }
        } catch (error) {
          console.warn('Failed to load school information:', error);
        }
      }
    };

    loadSchoolInfo();
  }, [isOpen]);

  // Initialize form with edit data
  React.useEffect(() => {
    if (editTemplate && isOpen) {
      // Switch to Basic tab when editing
      setActiveTab('basic');

      // Populate settings
      setSettings({
        name: editTemplate.name,
        type: editTemplate.type,
        description: editTemplate.description || '',
        dimensions: editTemplate.dimensions,
        customWidth: editTemplate.customWidth,
        customHeight: editTemplate.customHeight,
        orientation: editTemplate.orientation || TemplateOrientation.HORIZONTAL,
        backgroundColor: editTemplate.backgroundColor || '#ffffff',
        borderColor: editTemplate.borderColor || '#e5e7eb',
        borderWidth: editTemplate.borderWidth || 1,
        borderRadius: editTemplate.borderRadius || 4,
        logoRequired: editTemplate.logoRequired || false,
        photoRequired: editTemplate.photoRequired || false,
        qrCodeRequired: editTemplate.qrCodeRequired || false,
        barcodeRequired: editTemplate.barcodeRequired || false,
        printMargin: editTemplate.printMargin || 5,
        bleedArea: editTemplate.bleedArea || 3,
        safeArea: editTemplate.safeArea || 5,
        fields: [],
      });

      // Populate template fields
      if (editTemplate.fields) {
        const componentFields: ComponentTemplateField[] =
          editTemplate.fields.map((field, index) => ({
            ...field,
            id: field.id || `field_${Date.now()}_${index}`,
            visible: true,
            locked: false,
            dataSource: field.dataSource as 'static' | 'database' | undefined,
            staticText: field.staticText,
            imageUrl: field.imageUrl,
            qrData: field.qrData,
          }));
        setTemplateFields(componentFields);
      }
    } else if (!editTemplate && isOpen) {
      // Switch to Quick Start tab for new templates
      setActiveTab('quickstart');

      // Reset form for create mode
      setSettings({
        name: '',
        type: IDCardTemplateType.STUDENT,
        description: '',
        dimensions: '85.6x53.98',
        orientation: TemplateOrientation.HORIZONTAL,
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 4,
        logoRequired: false,
        photoRequired: false,
        qrCodeRequired: false,
        barcodeRequired: false,
        printMargin: 5,
        bleedArea: 3,
        safeArea: 5,
        fields: [],
      });
      setTemplateFields([]);
    }
  }, [editTemplate, isOpen]);

  // Validation function - no validation rules required
  const validateTemplate = useCallback(() => {
    // No validation warnings - templates can be created with any configuration
    return [];
  }, []);

  const templateTypes = [
    {
      value: IDCardTemplateType.STUDENT,
      label: 'Student ID Card',
      fields: [
        'School Name',
        'School Code',
        'School Address',
        'First Name',
        'Middle Name',
        'Last Name',
        'Full Name',
        'Student ID',
        'Roll Number',
        'Admission Number',
        'Class',
        'Section',
        'Academic Year',
        'Date of Birth',
        'Blood Group',
        'Phone Number',
        'Address',
        'Parent Name',
        'Emergency Contact',
        'Student Photo',
        'QR Code',
        'Barcode',
      ],
      defaultColor: '#2563eb',
    },
    {
      value: IDCardTemplateType.TEACHER,
      label: 'Teacher ID Card',
      fields: [
        'School Name',
        'School Code',
        'School Address',
        'First Name',
        'Middle Name',
        'Last Name',
        'Full Name',
        'Employee ID',
        'Designation',
        'Department',
        'Subject Taught',
        'Qualification',
        'Experience',
        'Phone Number',
        'Email',
        'Address',
        'Date of Joining',
        'Emergency Contact',
        'Teacher Photo',
        'QR Code',
        'Barcode',
      ],
      defaultColor: '#16a34a',
    },
    {
      value: IDCardTemplateType.STAFF,
      label: 'Staff ID Card',
      fields: [
        'School Name',
        'School Code',
        'School Address',
        'First Name',
        'Middle Name',
        'Last Name',
        'Full Name',
        'Employee ID',
        'Designation',
        'Department',
        'Position',
        'Shift',
        'Working Hours',
        'Phone Number',
        'Email',
        'Address',
        'Date of Joining',
        'Emergency Contact',
        'Staff Photo',
        'QR Code',
        'Barcode',
      ],
      defaultColor: '#7c3aed',
    },
  ];

  // Sample pre-designed templates
  const sampleTemplates = [
    {
      id: 'student-basic',
      name: 'Student ID - Basic Layout',
      type: IDCardTemplateType.STUDENT,
      description:
        'Clean student ID card with photo, name, and essential details',
      thumbnail: '👤',
      fields: [
        {
          id: 'schoolLogo',
          fieldType: TemplateFieldType.LOGO,
          label: 'School Logo',
          dataSource: 'database' as const,
          databaseField: 'schoolLogo',
          x: 32,
          y: 1,
          width: 10,
          height: 10,
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'photo',
          fieldType: TemplateFieldType.IMAGE,
          label: 'Student Photo',
          dataSource: 'database' as const,
          databaseField: 'Student Photo',
          x: 5,
          y: 5,
          width: 23,
          height: 30,
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'schoolName',
          fieldType: TemplateFieldType.TEXT,
          label: 'School Name',
          dataSource: 'database' as const,
          databaseField: 'schoolName',
          placeholder: 'ABC High School',
          x: 32,
          y: 5,
          width: 48,
          height: 8,
          fontSize: 11,
          fontWeight: 'bold',
          textAlign: TextAlignment.CENTER,
          color: '#1e40af',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'schoolAddress',
          fieldType: TemplateFieldType.TEXT,
          label: 'School Address',
          dataSource: 'database' as const,
          databaseField: 'School Address',
          placeholder: 'School Address',
          x: 32,
          y: 13,
          width: 48,
          height: 4,
          fontSize: 7,
          textAlign: TextAlignment.CENTER,
          color: '#6b7280',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'fullName',
          fieldType: TemplateFieldType.TEXT,
          label: 'Full Name',
          dataSource: 'database' as const,
          databaseField: 'Full Name',
          placeholder: 'John Doe',
          x: 32,
          y: 18,
          width: 48,
          height: 7,
          fontSize: 10,
          fontWeight: 'semibold',
          textAlign: TextAlignment.CENTER,
          color: '#000000',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'studentId',
          fieldType: TemplateFieldType.TEXT,
          label: 'Student ID',
          dataSource: 'database' as const,
          databaseField: 'Student ID',
          placeholder: 'STU-2025-001',
          x: 32,
          y: 24,
          width: 48,
          height: 6,
          fontSize: 8,
          textAlign: TextAlignment.CENTER,
          color: '#6b7280',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'class',
          fieldType: TemplateFieldType.TEXT,
          label: 'Class',
          dataSource: 'database' as const,
          databaseField: 'Class',
          placeholder: 'Class: 10-A',
          x: 32,
          y: 32,
          width: 23,
          height: 5,
          fontSize: 8,
          textAlign: TextAlignment.LEFT,
          color: '#374151',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'section',
          fieldType: TemplateFieldType.TEXT,
          label: 'Section',
          dataSource: 'database' as const,
          databaseField: 'Section',
          placeholder: 'Sec: A',
          x: 57,
          y: 32,
          width: 23,
          height: 5,
          fontSize: 8,
          textAlign: TextAlignment.LEFT,
          color: '#374151',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'qrCode',
          fieldType: TemplateFieldType.QR_CODE,
          label: 'QR Code',
          dataSource: 'database' as const,
          databaseField: 'studentId',
          x: 5,
          y: 37,
          width: 18,
          height: 18,
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
      ],
    },
    {
      id: 'teacher-professional',
      name: 'Teacher ID - Professional',
      type: IDCardTemplateType.TEACHER,
      description:
        'Professional teacher ID with photo, designation, and department',
      thumbnail: '👨‍🏫',
      fields: [
        {
          id: 'schoolLogo',
          fieldType: TemplateFieldType.LOGO,
          label: 'School Logo',
          dataSource: 'database' as const,
          databaseField: 'schoolLogo',
          x: 5,
          y: 3,
          width: 12,
          height: 12,
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'schoolName',
          fieldType: TemplateFieldType.TEXT,
          label: 'School Name',
          dataSource: 'database' as const,
          databaseField: 'schoolName',
          placeholder: 'ABC School',
          x: 20,
          y: 5,
          width: 60,
          height: 8,
          fontSize: 10,
          fontWeight: 'bold',
          textAlign: TextAlignment.LEFT,
          color: '#16a34a',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'schoolAddress',
          fieldType: TemplateFieldType.TEXT,
          label: 'School Address',
          dataSource: 'database' as const,
          databaseField: 'School Address',
          placeholder: 'School Address',
          x: 20,
          y: 13,
          width: 60,
          height: 4,
          fontSize: 7,
          textAlign: TextAlignment.LEFT,
          color: '#6b7280',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'photo',
          fieldType: TemplateFieldType.IMAGE,
          label: 'Teacher Photo',
          dataSource: 'database' as const,
          databaseField: 'Teacher Photo',
          x: 5,
          y: 18,
          width: 22,
          height: 28,
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'fullName',
          fieldType: TemplateFieldType.TEXT,
          label: 'Full Name',
          dataSource: 'database' as const,
          databaseField: 'Full Name',
          placeholder: 'Prof. Jane Smith',
          x: 30,
          y: 18,
          width: 50,
          height: 7,
          fontSize: 11,
          fontWeight: 'bold',
          textAlign: TextAlignment.LEFT,
          color: '#000000',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'designation',
          fieldType: TemplateFieldType.TEXT,
          label: 'Designation',
          dataSource: 'database' as const,
          databaseField: 'Designation',
          placeholder: 'Senior Teacher',
          x: 30,
          y: 27,
          width: 50,
          height: 6,
          fontSize: 9,
          textAlign: TextAlignment.LEFT,
          color: '#16a34a',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'department',
          fieldType: TemplateFieldType.TEXT,
          label: 'Department',
          dataSource: 'database' as const,
          databaseField: 'Department',
          placeholder: 'Mathematics Dept.',
          x: 30,
          y: 35,
          width: 50,
          height: 5,
          fontSize: 8,
          textAlign: TextAlignment.LEFT,
          color: '#6b7280',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'employeeId',
          fieldType: TemplateFieldType.TEXT,
          label: 'Employee ID',
          dataSource: 'database' as const,
          databaseField: 'Employee ID',
          placeholder: 'EMP-T-042',
          x: 30,
          y: 42,
          width: 30,
          height: 5,
          fontSize: 8,
          fontWeight: 'semibold',
          textAlign: TextAlignment.LEFT,
          color: '#374151',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'qrCode',
          fieldType: TemplateFieldType.QR_CODE,
          label: 'QR Code',
          dataSource: 'database' as const,
          databaseField: 'employeeId',
          x: 63,
          y: 35,
          width: 15,
          height: 15,
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
      ],
    },
    {
      id: 'staff-compact',
      name: 'Staff ID - Compact',
      type: IDCardTemplateType.STAFF,
      description: 'Compact staff ID card with photo and key information',
      thumbnail: '👷',
      fields: [
        {
          id: 'schoolLogo',
          fieldType: TemplateFieldType.LOGO,
          label: 'School Logo',
          dataSource: 'database' as const,
          databaseField: 'schoolLogo',
          x: 5,
          y: 1,
          width: 12,
          height: 12,
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'schoolName',
          fieldType: TemplateFieldType.TEXT,
          label: 'School Name',
          dataSource: 'database' as const,
          databaseField: 'schoolName',
          placeholder: 'ABC School System',
          x: 20,
          y: 3,
          width: 60,
          height: 8,
          fontSize: 11,
          fontWeight: 'bold',
          textAlign: TextAlignment.LEFT,
          color: '#7c3aed',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'schoolAddress',
          fieldType: TemplateFieldType.TEXT,
          label: 'School Address',
          dataSource: 'database' as const,
          databaseField: 'School Address',
          placeholder: 'School Address',
          x: 20,
          y: 11,
          width: 60,
          height: 4,
          fontSize: 7,
          textAlign: TextAlignment.LEFT,
          color: '#6b7280',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'photo',
          fieldType: TemplateFieldType.IMAGE,
          label: 'Staff Photo',
          dataSource: 'database' as const,
          databaseField: 'Staff Photo',
          x: 29,
          y: 16,
          width: 27,
          height: 25,
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'fullName',
          fieldType: TemplateFieldType.TEXT,
          label: 'Full Name',
          dataSource: 'database' as const,
          databaseField: 'Full Name',
          placeholder: 'Robert Johnson',
          x: 5,
          y: 40,
          width: 75,
          height: 6,
          fontSize: 10,
          fontWeight: 'bold',
          textAlign: TextAlignment.CENTER,
          color: '#000000',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
        {
          id: 'designation',
          fieldType: TemplateFieldType.TEXT,
          label: 'Designation',
          dataSource: 'database' as const,
          databaseField: 'Position',
          placeholder: 'Admin Officer',
          x: 5,
          y: 48,
          width: 75,
          height: 5,
          fontSize: 8,
          textAlign: TextAlignment.CENTER,
          color: '#7c3aed',
          zIndex: 1,
          opacity: 100,
          locked: false,
        },
      ],
    },
  ];

  const predefinedDimensions = CARD_DIMENSIONS;

  const fontFamilies = [
    'Inter',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
  ];

  const canvasDimensions = useMemo(() => {
    const [width, height] = settings.dimensions.includes('x')
      ? settings.dimensions.split('x').map(Number)
      : settings.dimensions === 'custom'
        ? [settings.customWidth || 85.6, settings.customHeight || 53.98]
        : [85.6, 53.98];

    const baseWidth =
      settings.orientation === TemplateOrientation.HORIZONTAL ? width : height;
    const baseHeight =
      settings.orientation === TemplateOrientation.HORIZONTAL ? height : width;
    const scale = zoomLevel / 100;

    return {
      width: baseWidth * 4 * scale,
      height: baseHeight * 4 * scale,
      realWidth: baseWidth,
      realHeight: baseHeight,
    };
  }, [
    settings.dimensions,
    settings.customWidth,
    settings.customHeight,
    settings.orientation,
    zoomLevel,
  ]);

  const loadSampleTemplate = useCallback((sampleId: string) => {
    const sample = sampleTemplates.find(s => s.id === sampleId);
    if (!sample) return;

    // Update settings
    setSettings(prev => ({
      ...prev,
      name: sample.name,
      type: sample.type,
    }));

    // Load sample fields
    const newFields: ComponentTemplateField[] = sample.fields.map(f => ({
      ...f,
      fontFamily: 'Inter',
      required: false,
      visible: true,
    }));

    setTemplateFields(newFields);
    setSelectedField(null);
  }, []);

  const addField = useCallback(
    (fieldType: TemplateFieldType) => {
      const newField: ComponentTemplateField = {
        id: `field_${Date.now()}`,
        fieldType,
        label: `New ${fieldType.toLowerCase()} field`,
        x: 50 + templateFields.length * 10, // Offset new fields for better UX
        y: 50 + templateFields.length * 10,
        width:
          fieldType === TemplateFieldType.TEXT
            ? 100
            : fieldType === TemplateFieldType.QR_CODE
              ? 40
              : 60,
        height:
          fieldType === TemplateFieldType.TEXT
            ? 20
            : fieldType === TemplateFieldType.QR_CODE
              ? 40
              : 60,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: TextAlignment.LEFT,
        fontFamily: 'Inter',
        color: '#000000',
        placeholder: `Sample ${fieldType.toLowerCase()}`,
        required: false,
        visible: true,
        locked: false,
        opacity: 100,
        zIndex: templateFields.length + 1,
        dataSource: fieldType === TemplateFieldType.TEXT ? 'static' : undefined,
        staticText:
          fieldType === TemplateFieldType.TEXT ? 'Sample Text' : undefined,
      };
      setTemplateFields(prev => [...prev, newField]);
      setSelectedField(newField.id);
    },
    [templateFields.length],
  );

  const updateField = useCallback(
    (id: string, updates: Partial<ComponentTemplateField>) => {
      setTemplateFields(prev =>
        prev.map(field => (field.id === id ? { ...field, ...updates } : field)),
      );
    },
    [],
  );

  const removeField = useCallback(
    (id: string) => {
      setTemplateFields(prev => prev.filter(field => field.id !== id));
      if (selectedField === id) {
        setSelectedField(null);
      }
    },
    [selectedField],
  );

  const duplicateField = (id: string) => {
    const field = templateFields.find(f => f.id === id);
    if (field) {
      const newField = {
        ...field,
        id: `field_${Date.now()}`,
        label: `${field.label} Copy`,
        x: field.x + 10,
        y: field.y + 10,
        zIndex: templateFields.length + 1,
      };
      setTemplateFields([...templateFields, newField]);
      setSelectedField(newField.id);
    }
  };

  // Drag and Drop Handlers
  const handleFieldMouseDown = useCallback(
    (e: React.MouseEvent, fieldId: string) => {
      // Only drag if not clicking on the field for selection
      if (e.button !== 0) return; // Only left click

      const field = templateFields.find(f => f.id === fieldId);
      if (!field || field.locked) return;

      setIsDragging(true);
      setDraggedField(fieldId);
      setSelectedField(fieldId);

      // Calculate offset from mouse to field's top-left corner
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const canvasDims = canvasDimensions;

        const fieldXPercent = (field.x / canvasDims.realWidth) * 100;
        const fieldYPercent = (field.y / canvasDims.realHeight) * 100;

        const fieldLeft = (fieldXPercent / 100) * rect.width;
        const fieldTop = (fieldYPercent / 100) * rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setDragOffset({
          x: mouseX - fieldLeft,
          y: mouseY - fieldTop,
        });

        // Initialize drag position for momentum tracking
        lastDragPosition.current = { x: field.x, y: field.y, time: Date.now() };
        dragVelocity.current = { x: 0, y: 0 };

        // Cancel any ongoing momentum animation
        if (momentumAnimation.current) {
          cancelAnimationFrame(momentumAnimation.current);
          momentumAnimation.current = null;
        }
      }

      e.stopPropagation();
      e.preventDefault();
    },
    [templateFields, canvasDimensions],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Handle resizing
      if (isResizing && draggedField && resizeHandle) {
        const rect = canvas.getBoundingClientRect();
        const canvasDims = canvasDimensions;

        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        // Convert pixel delta to mm
        const deltaXmm = (deltaX / rect.width) * canvasDims.realWidth;
        const deltaYmm = (deltaY / rect.height) * canvasDims.realHeight;

        const field = templateFields.find(f => f.id === draggedField);
        if (!field) return;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = field.x;
        let newY = field.y;

        // Minimum size constraints
        const minWidth = 10;
        const minHeight = 5;

        // Handle different resize directions
        switch (resizeHandle) {
          case 'se': // bottom-right
            newWidth = Math.max(minWidth, resizeStart.width + deltaXmm);
            newHeight = Math.max(minHeight, resizeStart.height + deltaYmm);
            break;
          case 'sw': // bottom-left
            newWidth = Math.max(minWidth, resizeStart.width - deltaXmm);
            newHeight = Math.max(minHeight, resizeStart.height + deltaYmm);
            newX = field.x + (resizeStart.width - newWidth);
            break;
          case 'ne': // top-right
            newWidth = Math.max(minWidth, resizeStart.width + deltaXmm);
            newHeight = Math.max(minHeight, resizeStart.height - deltaYmm);
            newY = field.y + (resizeStart.height - newHeight);
            break;
          case 'nw': // top-left
            newWidth = Math.max(minWidth, resizeStart.width - deltaXmm);
            newHeight = Math.max(minHeight, resizeStart.height - deltaYmm);
            newX = field.x + (resizeStart.width - newWidth);
            newY = field.y + (resizeStart.height - newHeight);
            break;
          case 'e': // right
            newWidth = Math.max(minWidth, resizeStart.width + deltaXmm);
            break;
          case 'w': // left
            newWidth = Math.max(minWidth, resizeStart.width - deltaXmm);
            newX = field.x + (resizeStart.width - newWidth);
            break;
          case 's': // bottom
            newHeight = Math.max(minHeight, resizeStart.height + deltaYmm);
            break;
          case 'n': // top
            newHeight = Math.max(minHeight, resizeStart.height - deltaYmm);
            newY = field.y + (resizeStart.height - newHeight);
            break;
        }

        // Snap to grid if enabled
        const snapSize = 5;
        if (showGrid) {
          newWidth = Math.round(newWidth / snapSize) * snapSize;
          newHeight = Math.round(newHeight / snapSize) * snapSize;
          newX = Math.round(newX / snapSize) * snapSize;
          newY = Math.round(newY / snapSize) * snapSize;
        }

        // Constrain to canvas boundaries
        newX = Math.max(0, Math.min(newX, canvasDims.realWidth - newWidth));
        newY = Math.max(0, Math.min(newY, canvasDims.realHeight - newHeight));
        newWidth = Math.min(newWidth, canvasDims.realWidth - newX);
        newHeight = Math.min(newHeight, canvasDims.realHeight - newY);

        // Update field
        updateField(draggedField, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
        return;
      }

      // Handle dragging
      if (!isDragging || !draggedField) return;

      const rect = canvas.getBoundingClientRect();
      const canvasDims = canvasDimensions;

      // Calculate mouse position relative to canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate new field position accounting for drag offset
      const fieldLeft = mouseX - dragOffset.x;
      const fieldTop = mouseY - dragOffset.y;

      // Convert pixel position to actual dimensions
      let newX = (fieldLeft / rect.width) * canvasDims.realWidth;
      let newY = (fieldTop / rect.height) * canvasDims.realHeight;

      // Track velocity for momentum
      const currentTime = Date.now();
      const deltaTime = currentTime - lastDragPosition.current.time;
      if (deltaTime > 0) {
        dragVelocity.current = {
          x: (newX - lastDragPosition.current.x) / deltaTime,
          y: (newY - lastDragPosition.current.y) / deltaTime,
        };
      }
      lastDragPosition.current = { x: newX, y: newY, time: currentTime };

      // Snap to grid if enabled (5mm grid)
      const snapSize = 5;
      if (showGrid) {
        newX = Math.round(newX / snapSize) * snapSize;
        newY = Math.round(newY / snapSize) * snapSize;
      }

      // Constrain to canvas boundaries
      const field = templateFields.find(f => f.id === draggedField);
      if (field) {
        newX = Math.max(0, Math.min(newX, canvasDims.realWidth - field.width));
        newY = Math.max(
          0,
          Math.min(newY, canvasDims.realHeight - field.height),
        );

        // Check for alignment with other fields (snap guides)
        const threshold = 3; // mm
        const guides = { vertical: [] as number[], horizontal: [] as number[] };

        templateFields.forEach(otherField => {
          if (otherField.id !== draggedField) {
            // Check vertical alignment (X positions)
            if (Math.abs(newX - otherField.x) < threshold) {
              newX = otherField.x;
              guides.vertical.push(otherField.x);
            }
            if (
              Math.abs(newX + field.width - (otherField.x + otherField.width)) <
              threshold
            ) {
              newX = otherField.x + otherField.width - field.width;
              guides.vertical.push(otherField.x + otherField.width);
            }

            // Check horizontal alignment (Y positions)
            if (Math.abs(newY - otherField.y) < threshold) {
              newY = otherField.y;
              guides.horizontal.push(otherField.y);
            }
            if (
              Math.abs(
                newY + field.height - (otherField.y + otherField.height),
              ) < threshold
            ) {
              newY = otherField.y + otherField.height - field.height;
              guides.horizontal.push(otherField.y + otherField.height);
            }
          }
        });

        setSnapGuides(guides);
        setShowSnapGuides(
          guides.vertical.length > 0 || guides.horizontal.length > 0,
        );
      }

      // Update field position
      updateField(draggedField, { x: newX, y: newY });
    },
    [
      isDragging,
      isResizing,
      draggedField,
      resizeHandle,
      resizeStart,
      dragOffset,
      showGrid,
      templateFields,
      updateField,
      canvasDimensions,
    ],
  );

  const handleCanvasMouseUp = useCallback(() => {
    // Apply momentum if velocity is significant
    if (
      draggedField &&
      (Math.abs(dragVelocity.current.x) > 0.05 ||
        Math.abs(dragVelocity.current.y) > 0.05)
    ) {
      const field = templateFields.find(f => f.id === draggedField);
      const canvasDims = canvasDimensions;

      if (field) {
        let velocityX = dragVelocity.current.x;
        let velocityY = dragVelocity.current.y;
        let currentX = field.x;
        let currentY = field.y;

        const animateMomentum = () => {
          // Apply friction (deceleration)
          const friction = 0.92;
          velocityX *= friction;
          velocityY *= friction;

          // Update position
          currentX += velocityX * 16; // Approximate 60fps (16ms per frame)
          currentY += velocityY * 16;

          // Constrain to boundaries
          currentX = Math.max(
            0,
            Math.min(currentX, canvasDims.realWidth - field.width),
          );
          currentY = Math.max(
            0,
            Math.min(currentY, canvasDims.realHeight - field.height),
          );

          // Stop if velocity is very small or hit boundary
          if (Math.abs(velocityX) < 0.01 && Math.abs(velocityY) < 0.01) {
            // Snap to grid if enabled
            if (showGrid) {
              const snapSize = 5;
              currentX = Math.round(currentX / snapSize) * snapSize;
              currentY = Math.round(currentY / snapSize) * snapSize;
            }
            updateField(draggedField, { x: currentX, y: currentY });
            if (momentumAnimation.current) {
              cancelAnimationFrame(momentumAnimation.current);
              momentumAnimation.current = null;
            }
            return;
          }

          updateField(draggedField, { x: currentX, y: currentY });
          momentumAnimation.current = requestAnimationFrame(animateMomentum);
        };

        momentumAnimation.current = requestAnimationFrame(animateMomentum);
      }
    }

    setIsDragging(false);
    setDraggedField(null);
    setShowSnapGuides(false);
    setSnapGuides({ vertical: [], horizontal: [] });
    dragVelocity.current = { x: 0, y: 0 };
    lastDragPosition.current = { x: 0, y: 0, time: 0 };
  }, [draggedField, showGrid, templateFields, updateField]);

  // Add global mouse up listener when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setDraggedField(null);
        setShowSnapGuides(false);
        setSnapGuides({ vertical: [], horizontal: [] });
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  // Resize Handlers
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, fieldId: string, handle: string) => {
      e.stopPropagation();
      e.preventDefault();

      const field = templateFields.find(f => f.id === fieldId);
      if (!field || field.locked) return;

      setIsResizing(true);
      setResizeHandle(handle);
      setDraggedField(fieldId);
      setSelectedField(fieldId);

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: field.width,
          height: field.height,
        });
      }
    },
    [templateFields],
  );

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add global mouse up listener when resizing
  React.useEffect(() => {
    if (isResizing) {
      const handleGlobalMouseUp = () => {
        setIsResizing(false);
        setResizeHandle(null);
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isResizing]);

  const getSelectedTemplateType = () => {
    return templateTypes.find(t => t.value === settings.type);
  };

  // Generate QR codes for QR fields
  React.useEffect(() => {
    const generateQRCodes = async () => {
      const qrFields = templateFields.filter(
        f => f.fieldType === TemplateFieldType.QR_CODE,
      );
      const newQrUrls: Record<string, string> = {};

      for (const field of qrFields) {
        try {
          const qrData = field.databaseField
            ? `{${field.databaseField}}`
            : `sample-${settings.type.toLowerCase()}-id-${Math.random().toString(36).substr(2, 9)}`;
          const dataUrl = await QRCode.toDataURL(qrData, {
            width: 128,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' },
          });
          newQrUrls[field.id] = dataUrl;
        } catch (error) {
          console.error('QR generation error:', error);
        }
      }

      setQrDataUrls(prev => ({ ...prev, ...newQrUrls }));
    };

    generateQRCodes();
  }, [templateFields, settings.type]);

  const renderField = useCallback(
    (field: ComponentTemplateField) => {
      const canvas = canvasDimensions;
      const isSelected = selectedField === field.id;

      const content = () => {
        switch (field.fieldType) {
          case TemplateFieldType.TEXT: {
            let displayText = '';

            if (field.dataSource === 'static') {
              displayText =
                field.staticText || field.placeholder || field.label;
            } else if (field.databaseField) {
              // Handle school information fields with multiple possible field names
              const fieldName = field.databaseField.toLowerCase();

              if (fieldName.includes('school') && fieldName.includes('name')) {
                displayText =
                  schoolInfo?.schoolName || field.placeholder || 'School Name';
              } else if (
                fieldName.includes('school') &&
                fieldName.includes('code')
              ) {
                displayText =
                  schoolInfo?.schoolCode || field.placeholder || 'SCH001';
              } else if (
                fieldName.includes('school') &&
                fieldName.includes('address')
              ) {
                displayText =
                  schoolInfo?.address || field.placeholder || 'School Address';
              } else if (fieldName === 'schoolname') {
                displayText =
                  schoolInfo?.schoolName || field.placeholder || 'School Name';
              } else if (fieldName === 'schoolcode') {
                displayText =
                  schoolInfo?.schoolCode || field.placeholder || 'SCH001';
              } else if (
                fieldName === 'address' ||
                fieldName === 'schooladdress'
              ) {
                displayText =
                  schoolInfo?.address || field.placeholder || 'School Address';
              } else {
                // Use placeholder for other database fields
                displayText = field.placeholder || `{${field.databaseField}}`;
              }
            } else {
              displayText = field.label;
            }
            return (
              <div
                className='w-full h-full flex items-center'
                style={{
                  justifyContent:
                    field.textAlign === TextAlignment.CENTER
                      ? 'center'
                      : field.textAlign === TextAlignment.RIGHT
                        ? 'flex-end'
                        : 'flex-start',
                  overflow: 'hidden',
                  fontSize: field.fontSize
                    ? `${field.fontSize * (zoomLevel / 100)}px`
                    : undefined,
                  fontFamily: field.fontFamily,
                  fontWeight: field.fontWeight,
                  color: field.color,
                }}
              >
                <span className='truncate'>{displayText}</span>
              </div>
            );
          }
          case TemplateFieldType.IMAGE:
          case TemplateFieldType.LOGO: {
            const getImageDisplay = () => {
              if (field.imageUrl) {
                return (
                  <img
                    src={field.imageUrl}
                    alt={field.label}
                    className='w-full h-full object-cover rounded'
                  />
                );
              }

              if (field.databaseField) {
                // Show actual school logo if it's a school logo field and we have the data
                if (field.databaseField === 'schoolLogo' && schoolInfo?.logo) {
                  return (
                    <img
                      src={schoolInfo.logo}
                      alt='School Logo'
                      className='w-full h-full object-cover rounded'
                    />
                  );
                }

                return (
                  <div className='w-full h-full flex items-center justify-center bg-blue-50 border border-blue-200 rounded'>
                    <div className='text-center'>
                      <ImageIcon className='w-6 h-6 text-blue-400 mx-auto mb-1' />
                      <div className='text-xs text-blue-600'>
                        {field.databaseField === 'schoolLogo'
                          ? 'School Logo'
                          : field.databaseField}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className='w-full h-full flex items-center justify-center border-dashed border-2 border-blue-300 rounded bg-blue-50/30'>
                  <div className='text-center'>
                    <ImageIcon className='w-6 h-6 text-blue-400 mx-auto mb-1' />
                    <div className='text-xs text-blue-600'>
                      {field.fieldType === TemplateFieldType.LOGO
                        ? 'School Logo'
                        : 'Image'}
                    </div>
                  </div>
                </div>
              );
            };

            return getImageDisplay();
          }
          case TemplateFieldType.QR_CODE: {
            const qrDataUrl = qrDataUrls[field.id];

            return (
              <div className='w-full h-full flex items-center justify-center bg-white border border-blue-200 rounded'>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt='QR Code Preview'
                    className='w-full h-full object-contain p-1'
                  />
                ) : (
                  <div className='text-center'>
                    <QrCode className='w-6 h-6 text-blue-400 mx-auto mb-1' />
                    <div className='text-xs text-blue-600'>Generating...</div>
                  </div>
                )}
              </div>
            );
          }
          case TemplateFieldType.BARCODE:
            return (
              <div className='w-full h-full flex items-center justify-center bg-white border border-gray-300 rounded'>
                <div className='text-center'>
                  <div className='text-sm font-mono mb-1'>|||||||||||</div>
                  <div className='text-xs text-gray-500'>Barcode</div>
                </div>
              </div>
            );
          default:
            return field.label;
        }
      };

      // Convert mm to pixels based on canvas size
      const canvasElement = canvasRef.current;
      if (!canvasElement) return null;

      const canvasRect = canvasElement.getBoundingClientRect();
      const xPixels = (field.x / canvas.realWidth) * canvasRect.width;
      const yPixels = (field.y / canvas.realHeight) * canvasRect.height;
      const widthPixels = (field.width / canvas.realWidth) * canvasRect.width;
      const heightPixels =
        (field.height / canvas.realHeight) * canvasRect.height;

      return (
        <Rnd
          key={field.id}
          position={{
            x: xPixels,
            y: yPixels,
          }}
          size={{
            width: widthPixels,
            height: heightPixels,
          }}
          onDragStop={(e, d) => {
            // Convert pixels back to mm
            const newX = (d.x / canvasRect.width) * canvas.realWidth;
            const newY = (d.y / canvasRect.height) * canvas.realHeight;

            // Snap to grid if enabled
            const snapSize = 5;
            const finalX = showGrid
              ? Math.round(newX / snapSize) * snapSize
              : newX;
            const finalY = showGrid
              ? Math.round(newY / snapSize) * snapSize
              : newY;

            updateField(field.id, { x: finalX, y: finalY });
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            // Get new dimensions from the resized element
            const rect = ref.getBoundingClientRect();
            const canvasRect = canvasRef.current?.getBoundingClientRect();

            if (canvasRect) {
              const newWidth =
                (rect.width / canvasRect.width) * canvas.realWidth;
              const newHeight =
                (rect.height / canvasRect.height) * canvas.realHeight;
              const newX = (position.x / canvasRect.width) * canvas.realWidth;
              const newY = (position.y / canvasRect.height) * canvas.realHeight;

              // Snap to grid if enabled
              const snapSize = 5;
              const finalWidth = showGrid
                ? Math.round(newWidth / snapSize) * snapSize
                : newWidth;
              const finalHeight = showGrid
                ? Math.round(newHeight / snapSize) * snapSize
                : newHeight;
              const finalX = showGrid
                ? Math.round(newX / snapSize) * snapSize
                : newX;
              const finalY = showGrid
                ? Math.round(newY / snapSize) * snapSize
                : newY;

              updateField(field.id, {
                x: finalX,
                y: finalY,
                width: Math.max(10, finalWidth), // Min 10mm
                height: Math.max(5, finalHeight), // Min 5mm
              });
            }
          }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedField(field.id);
          }}
          bounds='parent'
          enableResizing={isSelected && !field.locked}
          disableDragging={field.locked}
          dragGrid={showGrid ? [5, 5] : [1, 1]}
          resizeGrid={showGrid ? [5, 5] : [1, 1]}
          style={{
            border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: '3px',
            backgroundColor:
              field.fieldType === TemplateFieldType.TEXT
                ? 'transparent'
                : '#f8fafc',
            opacity: (field.opacity || 100) / 100,
            zIndex: isSelected ? 999 : field.zIndex || 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              field.textAlign === 'CENTER'
                ? 'center'
                : field.textAlign === 'RIGHT'
                  ? 'flex-end'
                  : 'flex-start',
            padding:
              field.fieldType === TemplateFieldType.TEXT ? '2px 4px' : '4px',
            boxShadow: isSelected
              ? '0 0 0 3px rgba(59, 130, 246, 0.1)'
              : 'none',
            userSelect: 'none',
            cursor: field.locked ? 'not-allowed' : 'move',
          }}
          className={`select-none ${field.locked ? 'pointer-events-none' : ''}`}
        >
          {content()}
          {isSelected && !field.locked && (
            <div className='absolute -top-7 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded shadow-md whitespace-nowrap z-[1001] pointer-events-none'>
              {field.label} ({Math.round(field.width)}×
              {Math.round(field.height)}mm)
            </div>
          )}
        </Rnd>
      );
    },
    [
      canvasDimensions,
      selectedField,
      zoomLevel,
      qrDataUrls,
      showGrid,
      updateField,
    ],
  );

  const handleSubmit = async () => {
    setIsLoading(true);

    const warnings = validateTemplate();
    setValidationWarnings(warnings);
    if (warnings.length > 0) {
      setShowValidation(true);
    }

    try {
      // Convert component fields to API format
      const apiFields: TemplateField[] = templateFields.map(field => ({
        fieldType: field.fieldType,
        label: field.label,
        databaseField: field.databaseField,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        fontSize: field.fontSize,
        fontFamily: field.fontFamily,
        fontWeight: field.fontWeight,
        color: field.color,
        textAlign: field.textAlign,
        placeholder: field.placeholder,
        required: field.required,
        opacity: field.opacity,
        zIndex: field.zIndex,
        // Include the new fields that backend expects
        dataSource: field.dataSource,
        staticText: field.staticText,
        imageUrl: field.imageUrl,
        qrData: field.qrData,
      }));

      // Create template using real API
      const templateData: CreateTemplateDto = {
        ...settings,
        fields: apiFields,
      };

      if (editTemplate && editTemplate.id) {
        // Update existing template
        await templateApiService.updateTemplate(editTemplate.id, templateData);
      } else {
        // Create new template (including copies)
        await templateApiService.createTemplate(templateData);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error creating template:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        fullError: JSON.stringify(error, null, 2),
      });

      // Show user-friendly error message
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create template. Please try again.';

      // You could replace this with a toast notification
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-[95vw] h-[95vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg'>
        <DialogHeader className='flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 -m-6 mb-0 rounded-t-lg shadow-lg'>
          <DialogTitle className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-white/20 rounded-lg backdrop-blur-sm'>
                <CreditCard className='w-6 h-6' />
              </div>
              <div>
                <span className='text-xl font-semibold'>
                  {editTemplate && editTemplate.id
                    ? 'Edit ID Card Template'
                    : editTemplate
                      ? 'Copy ID Card Template'
                      : 'Create ID Card Template'}
                </span>
                <p className='text-blue-100 text-sm mt-1'>
                  Design professional ID cards with live preview
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={onClose}
                className='text-white hover:bg-white/10'
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className='bg-white text-blue-600 hover:bg-blue-50 font-medium shadow-md'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className='w-4 h-4 mr-2' />
                    {editTemplate && editTemplate.id
                      ? 'Update Template'
                      : editTemplate
                        ? 'Copy Template'
                        : 'Create Template'}
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className='text-blue-100 mt-2'>
            Design and configure your ID card template with live preview
          </DialogDescription>
        </DialogHeader>

        {showSuccess && (
          <Alert className='bg-green-50 border-green-200 flex-shrink-0 mx-4'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-green-800'>
              Template created successfully!
            </AlertDescription>
          </Alert>
        )}

        {showValidation && validationWarnings.length > 0 && (
          <Alert className='bg-amber-50 border-amber-200 flex-shrink-0 mx-4'>
            <AlertDescription className='text-amber-800'>
              <div className='space-y-1'>
                {validationWarnings.map((warning, index) => (
                  <div key={index} className='text-sm'>
                    ⚠️ {warning}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className='flex-1 overflow-hidden flex mt-6'>
          {/* Left Side - Editing Controls (40%) */}
          <div className='flex-[4] bg-white flex flex-col border-r border-blue-200 overflow-hidden shadow-lg rounded-l-lg'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='flex-1 flex flex-col'
            >
              <TabsList className='grid w-full grid-cols-5 m-3 bg-blue-100 flex-shrink-0 rounded-lg'>
                <TabsTrigger value='quickstart' className='text-xs'>
                  <CreditCard className='w-3 h-3 mr-1' />
                  Quick Start
                </TabsTrigger>
                <TabsTrigger value='basic' className='text-xs'>
                  <FileText className='w-3 h-3 mr-1' />
                  Basic
                </TabsTrigger>
                <TabsTrigger value='layout' className='text-xs'>
                  <Layout className='w-3 h-3 mr-1' />
                  Layout
                </TabsTrigger>
                <TabsTrigger value='design' className='text-xs'>
                  <Palette className='w-3 h-3 mr-1' />
                  Design
                </TabsTrigger>
                <TabsTrigger value='preview' className='text-xs'>
                  <Eye className='w-3 h-3 mr-1' />
                  Preview
                </TabsTrigger>
              </TabsList>

              <div className='flex-1 flex flex-col'>
                <div className='flex-1 overflow-y-auto p-4'>
                  {/* Quick Start Tab */}
                  <TabsContent
                    value='quickstart'
                    className='space-y-4 mt-0 h-full overflow-y-auto max-h-[calc(100vh-300px)]'
                  >
                    <div className='space-y-4'>
                      <div className='text-center space-y-2'>
                        <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-2'>
                          <CreditCard className='w-6 h-6 text-white' />
                        </div>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          Start with a Template
                        </h3>
                        <p className='text-sm text-gray-600 max-w-md mx-auto'>
                          Choose from our professionally designed templates and
                          customize them to match your needs
                        </p>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4'>
                        {sampleTemplates.map(sample => (
                          <div
                            key={sample.id}
                            onClick={() => loadSampleTemplate(sample.id)}
                            className='group cursor-pointer bg-white border-2 border-blue-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:scale-105'
                          >
                            <div className='text-center space-y-3'>
                              <div className='text-5xl mb-2 transform group-hover:scale-110 transition-transform'>
                                {sample.thumbnail}
                              </div>
                              <div>
                                <h4 className='font-semibold text-gray-900 mb-1'>
                                  {sample.name}
                                </h4>
                                <p className='text-xs text-gray-600 line-clamp-2'>
                                  {sample.description}
                                </p>
                              </div>
                              <div className='flex items-center justify-center space-x-2 pt-2'>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    sample.type === IDCardTemplateType.STUDENT
                                      ? 'bg-blue-100 text-blue-700'
                                      : sample.type ===
                                          IDCardTemplateType.TEACHER
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-purple-100 text-purple-700'
                                  }`}
                                >
                                  {sample.type.toLowerCase()}
                                </span>
                                <span className='px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700'>
                                  {sample.fields.length} fields
                                </span>
                              </div>
                              <div className='pt-2 border-t border-gray-200'>
                                <div className='text-xs text-blue-600 font-medium group-hover:text-blue-700'>
                                  Click to use this template →
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                        <div className='flex items-start space-x-3'>
                          <div className='flex-shrink-0'>
                            <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
                              <span className='text-blue-600 text-lg'>💡</span>
                            </div>
                          </div>
                          <div className='flex-1'>
                            <h5 className='text-sm font-semibold text-blue-900 mb-1'>
                              Pro Tip
                            </h5>
                            <p className='text-xs text-blue-700'>
                              After selecting a template, you can customize it
                              completely using the Layout and Design tabs. All
                              fields are draggable and resizable!
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='text-center pt-2'>
                        <p className='text-xs text-gray-500'>
                          Or start from scratch using the{' '}
                          <span className='font-semibold'>Basic</span> tab
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value='basic'
                    className='space-y-4 mt-0 h-full overflow-y-auto max-h-[calc(100vh-300px)]'
                  >
                    <div className='space-y-3'>
                      <div className='space-y-2'>
                        <Label className='text-sm font-medium'>
                          Template Name
                        </Label>
                        <Input
                          value={settings.name}
                          onChange={e =>
                            setSettings({ ...settings, name: e.target.value })
                          }
                          placeholder='Enter template name'
                          className='h-9'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label className='text-sm font-medium'>
                          Template Type
                        </Label>
                        <Select
                          value={settings.type}
                          onValueChange={(value: string) =>
                            setSettings({
                              ...settings,
                              type: value as IDCardTemplateType,
                            })
                          }
                        >
                          <SelectTrigger className='h-9'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_TYPE_OPTIONS.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className='flex items-center space-x-2'>
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='space-y-2'>
                        <Label className='text-sm font-medium'>
                          Description
                        </Label>
                        <Textarea
                          value={settings.description}
                          onChange={e =>
                            setSettings({
                              ...settings,
                              description: e.target.value,
                            })
                          }
                          placeholder='Template description'
                          rows={3}
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label className='text-sm font-medium'>
                          Dimensions
                        </Label>
                        <Select
                          value={settings.dimensions}
                          onValueChange={(value: string) =>
                            setSettings({ ...settings, dimensions: value })
                          }
                        >
                          <SelectTrigger className='h-9'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {predefinedDimensions.map(dim => (
                              <SelectItem key={dim.value} value={dim.value}>
                                {dim.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {settings.dimensions === 'custom' && (
                        <div className='grid grid-cols-2 gap-2'>
                          <div className='space-y-2'>
                            <Label className='text-xs'>Width (mm)</Label>
                            <Input
                              type='number'
                              value={settings.customWidth || ''}
                              onChange={e =>
                                setSettings({
                                  ...settings,
                                  customWidth: Number(e.target.value),
                                })
                              }
                              className='h-8'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-xs'>Height (mm)</Label>
                            <Input
                              type='number'
                              value={settings.customHeight || ''}
                              onChange={e =>
                                setSettings({
                                  ...settings,
                                  customHeight: Number(e.target.value),
                                })
                              }
                              className='h-8'
                            />
                          </div>
                        </div>
                      )}

                      <div className='space-y-2'>
                        <Label className='text-sm font-medium'>
                          Orientation
                        </Label>
                        <Select
                          value={settings.orientation}
                          onValueChange={(value: string) =>
                            setSettings({
                              ...settings,
                              orientation: value as TemplateOrientation,
                            })
                          }
                        >
                          <SelectTrigger className='h-9'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TemplateOrientation.HORIZONTAL}>
                              Horizontal (Landscape)
                            </SelectItem>
                            <SelectItem value={TemplateOrientation.VERTICAL}>
                              Vertical (Portrait)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {getSelectedTemplateType() && (
                        <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                          <h5 className='font-medium text-blue-800 mb-3 text-sm'>
                            Available Database Fields
                          </h5>
                          <div className='grid grid-cols-2 gap-1 max-h-32 overflow-y-auto'>
                            {getSelectedTemplateType()?.fields.map(field => (
                              <Badge
                                key={field}
                                variant='outline'
                                className='text-xs bg-white justify-start'
                              >
                                {field}
                              </Badge>
                            ))}
                          </div>
                          <p className='text-xs text-blue-600 mt-2'>
                            These fields will be available when adding text
                            elements
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value='layout'
                    className='space-y-4 mt-0 h-full max-h-[calc(100vh-300px)] overflow-y-auto'
                  >
                    <div className='space-y-4 pr-2'>
                      {/* Add Elements Section */}
                      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200'>
                        <Label className='text-sm font-semibold text-blue-900 mb-3 block'>
                          Add Elements
                        </Label>
                        <div className='grid grid-cols-2 gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => addField(TemplateFieldType.TEXT)}
                            className='justify-start h-10 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                          >
                            <Type className='w-4 h-4 mr-2 text-blue-600' />
                            <span className='text-blue-700'>Text Field</span>
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => addField(TemplateFieldType.IMAGE)}
                            className='justify-start h-10 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                          >
                            <ImageIcon className='w-4 h-4 mr-2 text-blue-600' />
                            <span className='text-blue-700'>Image</span>
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => addField(TemplateFieldType.QR_CODE)}
                            className='justify-start h-10 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                          >
                            <QrCode className='w-4 h-4 mr-2 text-blue-600' />
                            <span className='text-blue-700'>QR Code</span>
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => addField(TemplateFieldType.LOGO)}
                            className='justify-start h-10 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                          >
                            <ImageIcon className='w-4 h-4 mr-2 text-blue-600' />
                            <span className='text-blue-700'>Logo</span>
                          </Button>
                        </div>
                      </div>

                      {/* Enhanced Field Management List */}
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 p-4 rounded-xl border border-slate-200 shadow-sm'>
                          <div className='flex items-center space-x-3'>
                            <div className='h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md'>
                              <svg
                                className='w-5 h-5 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                                />
                              </svg>
                            </div>
                            <div>
                              <Label className='text-base font-bold text-slate-900 block'>
                                Field Management
                              </Label>
                              <p className='text-sm text-slate-600'>
                                {templateFields.length} element
                                {templateFields.length !== 1 ? 's' : ''} • Click
                                to select and edit
                              </p>
                            </div>
                          </div>
                          {selectedField && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setSelectedField(null)}
                              className='h-9 px-4 text-sm text-slate-600 hover:text-slate-800 border-slate-300 hover:border-slate-400 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200'
                            >
                              <X className='w-4 h-4 mr-2' />
                              Clear Selection
                            </Button>
                          )}
                        </div>

                        <div className='bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden'>
                          <div className='max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100'>
                            {templateFields.length === 0 ? (
                              <div className='p-8 text-center'>
                                <div className='w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm'>
                                  <Layout className='w-8 h-8 text-blue-500' />
                                </div>
                                <h4 className='text-base font-semibold text-slate-800 mb-2'>
                                  No fields added yet
                                </h4>
                                <p className='text-sm text-slate-600 max-w-xs mx-auto leading-relaxed'>
                                  Start building your ID card by adding elements
                                  using the buttons above
                                </p>
                              </div>
                            ) : (
                              <div className='divide-y divide-slate-100'>
                                {templateFields.map((field, index) => {
                                  const isSelected = selectedField === field.id;
                                  const getFieldIcon = () => {
                                    switch (field.fieldType) {
                                      case TemplateFieldType.TEXT:
                                        return <Type className='w-4 h-4' />;
                                      case TemplateFieldType.IMAGE:
                                        return (
                                          <ImageIcon className='w-4 h-4' />
                                        );
                                      case TemplateFieldType.QR_CODE:
                                        return <QrCode className='w-4 h-4' />;
                                      case TemplateFieldType.LOGO:
                                        return (
                                          <ImageIcon className='w-4 h-4' />
                                        );
                                      default:
                                        return <Type className='w-4 h-4' />;
                                    }
                                  };

                                  const getFieldColor = () => {
                                    switch (field.fieldType) {
                                      case TemplateFieldType.TEXT:
                                        return 'blue';
                                      case TemplateFieldType.IMAGE:
                                        return 'emerald';
                                      case TemplateFieldType.QR_CODE:
                                        return 'purple';
                                      case TemplateFieldType.LOGO:
                                        return 'orange';
                                      default:
                                        return 'blue';
                                    }
                                  };

                                  const color = getFieldColor();

                                  return (
                                    <div
                                      key={field.id}
                                      className={`group p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                                        isSelected
                                          ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-l-4 border-l-blue-500'
                                          : 'bg-white hover:shadow-sm'
                                      }`}
                                      onClick={() => setSelectedField(field.id)}
                                    >
                                      <div className='flex items-center justify-between'>
                                        <div className='flex items-center space-x-4 flex-1 min-w-0'>
                                          {/* Field Number and Icon */}
                                          <div className='flex items-center space-x-3'>
                                            <div
                                              className={`relative w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-200 ${
                                                isSelected
                                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white scale-110 shadow-md'
                                                  : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 group-hover:from-slate-200 group-hover:to-slate-300'
                                              }`}
                                            >
                                              {index + 1}
                                              {isSelected && (
                                                <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
                                              )}
                                            </div>
                                            <div
                                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                                color === 'blue'
                                                  ? 'bg-blue-100 text-blue-600'
                                                  : color === 'emerald'
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : color === 'purple'
                                                      ? 'bg-purple-100 text-purple-600'
                                                      : 'bg-orange-100 text-orange-600'
                                              } ${isSelected ? 'scale-105 shadow-md' : 'group-hover:scale-105'}`}
                                            >
                                              {getFieldIcon()}
                                            </div>
                                          </div>

                                          {/* Field Information */}
                                          <div className='flex-1 min-w-0'>
                                            <div className='flex items-center space-x-3 mb-2'>
                                              <h4 className='text-sm font-semibold text-slate-800 truncate'>
                                                {field.label}
                                              </h4>
                                              <Badge
                                                variant='outline'
                                                className={`text-xs px-2 py-1 font-medium border transition-all duration-200 ${
                                                  color === 'blue'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : color === 'emerald'
                                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                      : color === 'purple'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                } ${isSelected ? 'shadow-sm' : ''}`}
                                              >
                                                {field.fieldType.replace(
                                                  '_',
                                                  ' ',
                                                )}
                                              </Badge>
                                            </div>
                                            <div className='flex items-center space-x-4 text-xs text-slate-500'>
                                              <div className='flex items-center space-x-1'>
                                                <svg
                                                  className='w-3 h-3'
                                                  fill='none'
                                                  stroke='currentColor'
                                                  viewBox='0 0 24 24'
                                                >
                                                  <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth='2'
                                                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                                  />
                                                  <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth='2'
                                                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                                  />
                                                </svg>
                                                <span className='font-medium'>
                                                  {field.x}, {field.y}
                                                </span>
                                              </div>
                                              <div className='flex items-center space-x-1'>
                                                <svg
                                                  className='w-3 h-3'
                                                  fill='none'
                                                  stroke='currentColor'
                                                  viewBox='0 0 24 24'
                                                >
                                                  <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth='2'
                                                    d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'
                                                  />
                                                </svg>
                                                <span className='font-medium'>
                                                  {field.width}×{field.height}
                                                </span>
                                              </div>
                                              {field.fieldType ===
                                                TemplateFieldType.TEXT &&
                                                field.dataSource && (
                                                  <Badge
                                                    variant='outline'
                                                    className={`text-xs px-2 py-0.5 font-medium ${
                                                      field.dataSource ===
                                                      'static'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-purple-50 text-purple-700 border-purple-200'
                                                    }`}
                                                  >
                                                    {field.dataSource ===
                                                    'static'
                                                      ? 'Static'
                                                      : 'Dynamic'}
                                                  </Badge>
                                                )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className='flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                                          <Button
                                            variant='outline'
                                            size='sm'
                                            className='h-8 w-8 p-0 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 shadow-sm hover:shadow-md'
                                            onClick={e => {
                                              e.stopPropagation();
                                              duplicateField(field.id);
                                            }}
                                            title='Duplicate field'
                                          >
                                            <Copy className='w-3.5 h-3.5 text-emerald-600' />
                                          </Button>
                                          <Button
                                            variant='outline'
                                            size='sm'
                                            className='h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md'
                                            onClick={e => {
                                              e.stopPropagation();
                                              removeField(field.id);
                                            }}
                                            title='Delete field'
                                          >
                                            <Minus className='w-3.5 h-3.5 text-red-600' />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Separate Edit Panel - Only shows when a field is selected */}
                      {selectedField &&
                        (() => {
                          const field = templateFields.find(
                            f => f.id === selectedField,
                          );
                          if (!field) return null;

                          return (
                            <div className='bg-white border-2 border-blue-300 rounded-lg shadow-lg max-h-[60vh] flex flex-col'>
                              <div className='flex items-center justify-between p-4 border-b border-blue-200 flex-shrink-0'>
                                <h5 className='font-semibold text-blue-900 flex items-center'>
                                  <Type className='w-4 h-4 mr-2' />
                                  Edit Field: {field.label}
                                </h5>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => setSelectedField(null)}
                                  className='h-8 w-8 p-0'
                                >
                                  <X className='w-4 h-4' />
                                </Button>
                              </div>

                              <div className='overflow-y-auto flex-1 p-4 min-h-0'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  {/* Left Column - Basic Properties */}
                                  <div className='space-y-3'>
                                    <div className='space-y-2'>
                                      <Label className='text-xs font-medium text-gray-700'>
                                        Field Label
                                      </Label>
                                      <Input
                                        value={field.label}
                                        onChange={e =>
                                          updateField(field.id, {
                                            label: e.target.value,
                                          })
                                        }
                                        className='h-8 text-sm border-blue-200 focus:border-blue-400'
                                      />
                                    </div>

                                    {field.fieldType ===
                                      TemplateFieldType.TEXT && (
                                      <div className='space-y-2'>
                                        <Label className='text-xs font-medium text-gray-700'>
                                          Data Source
                                        </Label>
                                        <Select
                                          value={field.dataSource || 'static'}
                                          onValueChange={(value: string) =>
                                            updateField(field.id, {
                                              dataSource: value as
                                                | 'static'
                                                | 'database',
                                            })
                                          }
                                        >
                                          <SelectTrigger className='h-8 border-blue-200'>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value='static'>
                                              Static Text
                                            </SelectItem>
                                            <SelectItem value='database'>
                                              Database Field
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}

                                    {field.fieldType ===
                                      TemplateFieldType.TEXT &&
                                      field.dataSource === 'static' && (
                                        <div className='space-y-2'>
                                          <Label className='text-xs font-medium text-gray-700'>
                                            Static Text
                                          </Label>
                                          <Input
                                            value={field.staticText || ''}
                                            onChange={e =>
                                              updateField(field.id, {
                                                staticText: e.target.value,
                                                placeholder: e.target.value,
                                              })
                                            }
                                            placeholder='Enter static text...'
                                            className='h-8 text-sm border-blue-200 focus:border-blue-400'
                                          />
                                        </div>
                                      )}

                                    {field.fieldType ===
                                      TemplateFieldType.TEXT &&
                                      field.dataSource === 'database' && (
                                        <div className='space-y-2'>
                                          <Label className='text-xs font-medium text-gray-700'>
                                            Database Field
                                          </Label>
                                          <Select
                                            value={field.databaseField || ''}
                                            onValueChange={value =>
                                              updateField(field.id, {
                                                databaseField: value,
                                                placeholder: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger className='h-8 border-blue-200'>
                                              <SelectValue placeholder='Select database field...' />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {getSelectedTemplateType()?.fields.map(
                                                dbField => (
                                                  <SelectItem
                                                    key={dbField}
                                                    value={dbField}
                                                  >
                                                    {dbField}
                                                  </SelectItem>
                                                ),
                                              )}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}

                                    {field.fieldType ===
                                      TemplateFieldType.TEXT && (
                                      <div className='grid grid-cols-2 gap-2'>
                                        <div className='space-y-1'>
                                          <Label className='text-xs font-medium text-gray-700'>
                                            Font Size
                                          </Label>
                                          <Input
                                            type='number'
                                            value={field.fontSize || 12}
                                            onChange={e =>
                                              updateField(field.id, {
                                                fontSize: Number(
                                                  e.target.value,
                                                ),
                                              })
                                            }
                                            className='h-8 text-sm border-blue-200'
                                          />
                                        </div>
                                        <div className='space-y-1'>
                                          <Label className='text-xs font-medium text-gray-700'>
                                            Text Color
                                          </Label>
                                          <Input
                                            type='color'
                                            value={field.color || '#000000'}
                                            onChange={e =>
                                              updateField(field.id, {
                                                color: e.target.value,
                                              })
                                            }
                                            className='h-8 w-full border-blue-200'
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right Column - Position & Advanced */}
                                  <div className='space-y-3'>
                                    <div className='grid grid-cols-2 gap-2'>
                                      <div className='space-y-1'>
                                        <Label className='text-xs font-medium text-gray-700'>
                                          X Position
                                        </Label>
                                        <Input
                                          type='number'
                                          value={field.x}
                                          onChange={e =>
                                            updateField(field.id, {
                                              x: Number(e.target.value),
                                            })
                                          }
                                          className='h-8 text-sm border-blue-200'
                                        />
                                      </div>
                                      <div className='space-y-1'>
                                        <Label className='text-xs font-medium text-gray-700'>
                                          Y Position
                                        </Label>
                                        <Input
                                          type='number'
                                          value={field.y}
                                          onChange={e =>
                                            updateField(field.id, {
                                              y: Number(e.target.value),
                                            })
                                          }
                                          className='h-8 text-sm border-blue-200'
                                        />
                                      </div>
                                    </div>

                                    <div className='grid grid-cols-2 gap-2'>
                                      <div className='space-y-1'>
                                        <Label className='text-xs font-medium text-gray-700'>
                                          Width
                                        </Label>
                                        <Input
                                          type='number'
                                          value={field.width}
                                          onChange={e =>
                                            updateField(field.id, {
                                              width: Number(e.target.value),
                                            })
                                          }
                                          className='h-8 text-sm border-blue-200'
                                        />
                                      </div>
                                      <div className='space-y-1'>
                                        <Label className='text-xs font-medium text-gray-700'>
                                          Height
                                        </Label>
                                        <Input
                                          type='number'
                                          value={field.height}
                                          onChange={e =>
                                            updateField(field.id, {
                                              height: Number(e.target.value),
                                            })
                                          }
                                          className='h-8 text-sm border-blue-200'
                                        />
                                      </div>
                                    </div>

                                    {field.fieldType ===
                                      TemplateFieldType.TEXT && (
                                      <div className='grid grid-cols-2 gap-2'>
                                        <div className='space-y-1'>
                                          <Label className='text-xs font-medium text-gray-700'>
                                            Font Family
                                          </Label>
                                          <Select
                                            value={field.fontFamily || 'Inter'}
                                            onValueChange={value =>
                                              updateField(field.id, {
                                                fontFamily: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger className='h-8 border-blue-200'>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {fontFamilies.map(font => (
                                                <SelectItem
                                                  key={font}
                                                  value={font}
                                                >
                                                  {font}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className='space-y-1'>
                                          <Label className='text-xs font-medium text-gray-700'>
                                            Font Weight
                                          </Label>
                                          <Select
                                            value={field.fontWeight || 'normal'}
                                            onValueChange={value =>
                                              updateField(field.id, {
                                                fontWeight: value as
                                                  | 'normal'
                                                  | 'bold',
                                              })
                                            }
                                          >
                                            <SelectTrigger className='h-8 border-blue-200'>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value='normal'>
                                                Normal
                                              </SelectItem>
                                              <SelectItem value='bold'>
                                                Bold
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}

                                    {field.fieldType ===
                                      TemplateFieldType.TEXT && (
                                      <div className='space-y-2'>
                                        <Label className='text-xs font-medium text-gray-700'>
                                          Text Alignment
                                        </Label>
                                        <div className='flex space-x-1'>
                                          {[
                                            {
                                              value: TextAlignment.LEFT,
                                              icon: AlignLeft,
                                            },
                                            {
                                              value: TextAlignment.CENTER,
                                              icon: AlignCenter,
                                            },
                                            {
                                              value: TextAlignment.RIGHT,
                                              icon: AlignRight,
                                            },
                                          ].map(({ value, icon: Icon }) => (
                                            <Button
                                              key={value}
                                              variant={
                                                field.textAlign === value
                                                  ? 'default'
                                                  : 'outline'
                                              }
                                              size='sm'
                                              className='h-8 flex-1 border-blue-200'
                                              onClick={() =>
                                                updateField(field.id, {
                                                  textAlign: value,
                                                })
                                              }
                                            >
                                              <Icon className='w-3 h-3' />
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Image & QR Code fields */}
                                    {(field.fieldType ===
                                      TemplateFieldType.IMAGE ||
                                      field.fieldType ===
                                        TemplateFieldType.LOGO ||
                                      field.fieldType ===
                                        TemplateFieldType.QR_CODE) && (
                                      <div className='space-y-2'>
                                        <Label className='text-xs font-medium text-gray-700'>
                                          {field.fieldType ===
                                          TemplateFieldType.QR_CODE
                                            ? 'QR Data Source'
                                            : 'Image Source'}
                                        </Label>
                                        <Select
                                          value={
                                            field.databaseField ||
                                            (field.fieldType ===
                                            TemplateFieldType.QR_CODE
                                              ? 'studentId'
                                              : 'upload')
                                          }
                                          onValueChange={value =>
                                            updateField(field.id, {
                                              databaseField:
                                                value === 'upload'
                                                  ? undefined
                                                  : value,
                                            })
                                          }
                                        >
                                          <SelectTrigger className='h-8 border-blue-200'>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {field.fieldType ===
                                            TemplateFieldType.QR_CODE ? (
                                              <>
                                                <SelectItem value='studentId'>
                                                  Student ID
                                                </SelectItem>
                                                <SelectItem value='admissionNumber'>
                                                  Admission Number
                                                </SelectItem>
                                                <SelectItem value='employeeId'>
                                                  Employee ID
                                                </SelectItem>
                                                <SelectItem value='rollNumber'>
                                                  Roll Number
                                                </SelectItem>
                                              </>
                                            ) : (
                                              <>
                                                <SelectItem value='upload'>
                                                  Manual Upload
                                                </SelectItem>
                                                {field.fieldType ===
                                                  TemplateFieldType.IMAGE && (
                                                  <>
                                                    <SelectItem value='profilePicture'>
                                                      Student Photo
                                                    </SelectItem>
                                                    <SelectItem value='teacherPhoto'>
                                                      Teacher Photo
                                                    </SelectItem>
                                                    <SelectItem value='staffPhoto'>
                                                      Staff Photo
                                                    </SelectItem>
                                                  </>
                                                )}
                                                {field.fieldType ===
                                                  TemplateFieldType.LOGO && (
                                                  <SelectItem value='schoolLogo'>
                                                    School Logo
                                                  </SelectItem>
                                                )}
                                              </>
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value='design'
                    className='space-y-4 mt-0 overflow-y-auto max-h-96'
                  >
                    <div className='space-y-4 p-1'>
                      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 -m-1 mb-3'>
                        <Label className='text-sm font-semibold text-blue-900'>
                          Card Appearance
                        </Label>
                        <p className='text-xs text-blue-700 mt-1'>
                          Customize the overall look and feel of your ID card
                        </p>
                      </div>

                      <div className='space-y-3'>
                        <div className='space-y-2'>
                          <Label className='text-xs'>Background Color</Label>
                          <div className='flex items-center space-x-2'>
                            <Input
                              type='color'
                              value={settings.backgroundColor}
                              onChange={e =>
                                setSettings({
                                  ...settings,
                                  backgroundColor: e.target.value,
                                })
                              }
                              className='w-8 h-8 p-1 border rounded'
                            />
                            <Input
                              value={settings.backgroundColor}
                              onChange={e =>
                                setSettings({
                                  ...settings,
                                  backgroundColor: e.target.value,
                                })
                              }
                              className='flex-1 h-8 text-sm'
                            />
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-xs'>Border Settings</Label>
                          <div className='space-y-2'>
                            <div className='grid grid-cols-2 gap-2'>
                              <div className='space-y-1'>
                                <Label className='text-xs text-gray-500'>
                                  Width (px)
                                </Label>
                                <Input
                                  type='number'
                                  value={settings.borderWidth}
                                  onChange={e =>
                                    setSettings({
                                      ...settings,
                                      borderWidth: Number(e.target.value),
                                    })
                                  }
                                  min='0'
                                  max='10'
                                  className='h-8 text-sm'
                                />
                              </div>
                              <div className='space-y-1'>
                                <Label className='text-xs text-gray-500'>
                                  Radius (px)
                                </Label>
                                <Input
                                  type='number'
                                  value={settings.borderRadius}
                                  onChange={e =>
                                    setSettings({
                                      ...settings,
                                      borderRadius: Number(e.target.value),
                                    })
                                  }
                                  min='0'
                                  max='20'
                                  className='h-8 text-sm'
                                />
                              </div>
                            </div>
                            <div className='space-y-1'>
                              <Label className='text-xs text-gray-500'>
                                Border Color
                              </Label>
                              <div className='flex items-center space-x-2'>
                                <Input
                                  type='color'
                                  value={settings.borderColor}
                                  onChange={e =>
                                    setSettings({
                                      ...settings,
                                      borderColor: e.target.value,
                                    })
                                  }
                                  className='w-8 h-8 p-1'
                                />
                                <Input
                                  value={settings.borderColor}
                                  onChange={e =>
                                    setSettings({
                                      ...settings,
                                      borderColor: e.target.value,
                                    })
                                  }
                                  className='flex-1 h-8 text-sm'
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-xs'>Print Settings (mm)</Label>
                          <div className='grid grid-cols-3 gap-2'>
                            <div className='space-y-1'>
                              <Label className='text-xs text-gray-500'>
                                Margin
                              </Label>
                              <Input
                                type='number'
                                value={settings.printMargin}
                                onChange={e =>
                                  setSettings({
                                    ...settings,
                                    printMargin: Number(e.target.value),
                                  })
                                }
                                min='0'
                                max='20'
                                className='h-8 text-sm'
                              />
                            </div>
                            <div className='space-y-1'>
                              <Label className='text-xs text-gray-500'>
                                Bleed
                              </Label>
                              <Input
                                type='number'
                                value={settings.bleedArea}
                                onChange={e =>
                                  setSettings({
                                    ...settings,
                                    bleedArea: Number(e.target.value),
                                  })
                                }
                                min='0'
                                max='10'
                                className='h-8 text-sm'
                              />
                            </div>
                            <div className='space-y-1'>
                              <Label className='text-xs text-gray-500'>
                                Safe Area
                              </Label>
                              <Input
                                type='number'
                                value={settings.safeArea}
                                onChange={e =>
                                  setSettings({
                                    ...settings,
                                    safeArea: Number(e.target.value),
                                  })
                                }
                                min='0'
                                max='15'
                                className='h-8 text-sm'
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value='preview' className='space-y-4 mt-0'>
                    <div className='space-y-3'>
                      <Label className='text-sm font-medium'>
                        Template Summary
                      </Label>

                      <div className='space-y-2 p-3 bg-gray-50 rounded-lg border'>
                        <div className='text-sm space-y-2'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Name:</span>
                            <span className='font-medium'>
                              {settings.name || 'Untitled'}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Type:</span>
                            <span className='font-medium'>
                              {getSelectedTemplateType()?.label}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Size:</span>
                            <span className='font-medium'>
                              {settings.dimensions === 'custom'
                                ? `${settings.customWidth}×${settings.customHeight}`
                                : settings.dimensions}{' '}
                              mm
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Fields:</span>
                            <span className='font-medium'>
                              {templateFields.length} elements
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Orientation:</span>
                            <span className='font-medium'>
                              {(
                                settings.orientation ||
                                TemplateOrientation.HORIZONTAL
                              ).toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label className='text-sm font-medium'>
                          Template Validation
                        </Label>
                        <div className='space-y-1'>
                          {(() => {
                            const isNameProvided =
                              settings.name.trim().length > 0;
                            const dimensionsValid =
                              settings.dimensions !== '' &&
                              (settings.dimensions !== 'custom' ||
                                (settings.customWidth &&
                                  settings.customHeight));
                            return (
                              <>
                                <div className='flex items-center space-x-2 text-sm'>
                                  {isNameProvided ? (
                                    <CheckCircle className='w-4 h-4 text-green-500' />
                                  ) : (
                                    <AlertTriangle className='w-4 h-4 text-yellow-500' />
                                  )}
                                  <span className='text-gray-600'>
                                    Template name{' '}
                                    {isNameProvided ? 'provided' : 'missing'}
                                  </span>
                                </div>
                                <div className='flex items-center space-x-2 text-sm'>
                                  {dimensionsValid ? (
                                    <CheckCircle className='w-4 h-4 text-green-500' />
                                  ) : (
                                    <AlertTriangle className='w-4 h-4 text-yellow-500' />
                                  )}
                                  <span className='text-gray-600'>
                                    {dimensionsValid
                                      ? 'Valid dimensions set'
                                      : 'Dimensions incomplete'}
                                  </span>
                                </div>
                                <div className='flex items-center space-x-2 text-sm'>
                                  {templateFields.length > 0 ? (
                                    <CheckCircle className='w-4 h-4 text-green-500' />
                                  ) : (
                                    <AlertTriangle className='w-4 h-4 text-yellow-500' />
                                  )}
                                  <span className='text-gray-600'>
                                    {templateFields.length} fields configured
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Export & Actions removed as per request */}
                    </div>
                  </TabsContent>
                </div>

                {/* Navigation Buttons */}
                <div className='p-4 border-t bg-gray-50 flex justify-between'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const tabs = ['basic', 'layout', 'design', 'preview'];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0)
                        setActiveTab(tabs[currentIndex - 1]);
                    }}
                    disabled={activeTab === 'basic'}
                    className='flex items-center space-x-2'
                  >
                    <ChevronLeft className='w-4 h-4' />
                    <span>Previous</span>
                  </Button>

                  <div className='flex items-center space-x-1'>
                    {['basic', 'layout', 'design', 'preview'].map(tab => (
                      <div
                        key={tab}
                        className={`w-2 h-2 rounded-full ${
                          activeTab === tab ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {activeTab !== 'preview' && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const tabs = ['basic', 'layout', 'design', 'preview'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1)
                          setActiveTab(tabs[currentIndex + 1]);
                      }}
                      className='flex items-center space-x-2'
                    >
                      <span>Next</span>
                      <ChevronRight className='w-4 h-4' />
                    </Button>
                  )}
                </div>
              </div>
            </Tabs>
          </div>

          {/* Right Side - Single Live Preview (60%) */}
          <div className='flex-[6] flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg rounded-r-lg'>
            <div className='bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm'>
              <div className='flex items-center space-x-4'>
                <h3 className='font-semibold text-gray-800'>Live Preview</h3>
                <Badge
                  variant='outline'
                  className='bg-blue-50 text-blue-700 border-blue-200'
                >
                  {templateFields.length} fields
                </Badge>
                <Badge variant='outline' className='bg-gray-50'>
                  {settings.dimensions === 'custom'
                    ? `${settings.customWidth}×${settings.customHeight}`
                    : settings.dimensions}{' '}
                  mm
                </Badge>
                {templateFields.length > 0 && (
                  <Badge
                    variant='outline'
                    className='bg-green-50 text-green-700 border-green-200 text-xs'
                  >
                    ✋ Drag to reposition
                  </Badge>
                )}
              </div>
              <div className='flex items-center space-x-2'>
                <Badge
                  variant='outline'
                  className='bg-indigo-50 text-indigo-700 border-indigo-200'
                >
                  {zoomLevel}% zoom
                </Badge>
                <Button
                  variant={showGrid ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setShowGrid(!showGrid)}
                  className='h-8'
                >
                  <Grid className='w-4 h-4' />
                </Button>

                <Select
                  value={zoomLevel.toString()}
                  onValueChange={(value: string) => setZoomLevel(Number(value))}
                >
                  <SelectTrigger className='w-20 h-8'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='50'>50%</SelectItem>
                    <SelectItem value='75'>75%</SelectItem>
                    <SelectItem value='90'>90%</SelectItem>
                    <SelectItem value='100'>100%</SelectItem>
                    <SelectItem value='125'>125%</SelectItem>
                    <SelectItem value='150'>150%</SelectItem>
                    <SelectItem value='200'>200%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex-1 p-6 overflow-auto flex items-center justify-center'>
              <div className='relative'>
                {/* Margin guides (outside template like Photoshop/Figma) */}
                <div className='absolute inset-0 pointer-events-none'>
                  <div
                    className='absolute border-2 border-dashed border-blue-300 opacity-50'
                    style={{
                      top: `${(settings.printMargin || 5) * 4}px`,
                      left: `${(settings.printMargin || 5) * 4}px`,
                      right: `${(settings.printMargin || 5) * 4}px`,
                      bottom: `${(settings.printMargin || 5) * 4}px`,
                    }}
                  />
                  <div
                    className='absolute border border-dashed border-orange-300 opacity-50'
                    style={{
                      top: `${(settings.bleedArea || 3) * 4}px`,
                      left: `${(settings.bleedArea || 3) * 4}px`,
                      right: `${(settings.bleedArea || 3) * 4}px`,
                      bottom: `${(settings.bleedArea || 3) * 4}px`,
                    }}
                  />
                </div>

                <div
                  ref={canvasRef}
                  className='relative shadow-xl bg-white transition-all duration-300 border-2 border-blue-200'
                  style={{
                    width: `${canvasDimensions.width}px`,
                    height: `${canvasDimensions.height}px`,
                    backgroundColor: settings.backgroundColor,
                    borderRadius: `${settings.borderRadius}px`,
                    backgroundImage: showGrid
                      ? `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`
                      : 'none',
                    backgroundSize: showGrid ? '20px 20px' : 'auto',
                    cursor: isDragging ? 'grabbing' : 'default',
                  }}
                  onClick={() => setSelectedField(null)}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                >
                  {/* Snap guides */}
                  {showSnapGuides && (
                    <>
                      {snapGuides.vertical.map((x, i) => (
                        <div
                          key={`v-${i}`}
                          className='absolute top-0 bottom-0 w-px bg-blue-400 pointer-events-none z-[1000]'
                          style={{
                            left: `${(x / canvasDimensions.realWidth) * 100}%`,
                          }}
                        />
                      ))}
                      {snapGuides.horizontal.map((y, i) => (
                        <div
                          key={`h-${i}`}
                          className='absolute left-0 right-0 h-px bg-blue-400 pointer-events-none z-[1000]'
                          style={{
                            top: `${(y / canvasDimensions.realHeight) * 100}%`,
                          }}
                        />
                      ))}
                    </>
                  )}

                  <div className='relative w-full h-full'>
                    {templateFields.length === 0 ? (
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='text-center text-gray-400'>
                          <Layout className='w-12 h-12 mx-auto mb-2 opacity-50' />
                          <p className='text-sm'>No fields added yet</p>
                          <p className='text-xs'>
                            Use the Layout tab to add elements
                          </p>
                        </div>
                      </div>
                    ) : (
                      templateFields.map(renderField)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
