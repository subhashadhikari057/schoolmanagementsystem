import React, { useState, useRef, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
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
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const [zoomLevel, setZoomLevel] = useState(100);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);

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

  // Initialize form with edit data
  React.useEffect(() => {
    if (editTemplate && isOpen) {
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
      const style: React.CSSProperties = {
        position: 'absolute',
        left: `${(field.x / canvas.realWidth) * 100}%`,
        top: `${(field.y / canvas.realHeight) * 100}%`,
        width: `${(field.width / canvas.realWidth) * 100}%`,
        height: `${(field.height / canvas.realHeight) * 100}%`,
        border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        borderRadius: '3px',
        backgroundColor:
          field.fieldType === TemplateFieldType.TEXT
            ? 'transparent'
            : '#f8fafc',
        opacity: (field.opacity || 100) / 100,
        zIndex: isSelected ? 999 : field.zIndex || 1,
        cursor: 'pointer',
        fontSize: field.fontSize
          ? `${field.fontSize * (zoomLevel / 100)}px`
          : undefined,
        fontFamily: field.fontFamily,
        fontWeight: field.fontWeight,
        textAlign: field.textAlign?.toLowerCase() as
          | 'left'
          | 'center'
          | 'right',
        color: field.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          field.textAlign === 'CENTER'
            ? 'center'
            : field.textAlign === 'RIGHT'
              ? 'flex-end'
              : 'flex-start',
        padding: field.fieldType === TemplateFieldType.TEXT ? '2px 4px' : '4px',
        transition: 'all 0.2s ease-in-out',
        boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      };

      const content = () => {
        switch (field.fieldType) {
          case TemplateFieldType.TEXT: {
            const displayText =
              field.dataSource === 'static'
                ? field.staticText || field.placeholder || field.label
                : field.databaseField
                  ? `{${field.databaseField}}`
                  : field.label;
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
                return (
                  <div className='w-full h-full flex items-center justify-center bg-blue-50 border border-blue-200 rounded'>
                    <div className='text-center'>
                      <ImageIcon className='w-6 h-6 text-blue-400 mx-auto mb-1' />
                      <div className='text-xs text-blue-600'>
                        {field.databaseField}
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

      return (
        <div
          key={field.id}
          style={style}
          onClick={e => {
            e.stopPropagation();
            setSelectedField(field.id);
          }}
          className={`select-none transition-all duration-200 ${isSelected ? 'transform hover:scale-105' : 'hover:shadow-md'}`}
        >
          {content()}
          {isSelected && (
            <>
              {/* Selection handles */}
              <div className='absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md'></div>
              <div className='absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md'></div>
              <div className='absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md'></div>
              <div className='absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md'></div>

              {/* Field label overlay */}
              <div className='absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap'>
                {field.label}
              </div>
            </>
          )}
        </div>
      );
    },
    [canvasDimensions, selectedField, zoomLevel, qrDataUrls],
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
    } catch (error) {
      console.error('Error creating template:', error);
      // You could add error handling UI here
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
              <TabsList className='grid w-full grid-cols-4 m-3 bg-blue-100 flex-shrink-0 rounded-lg'>
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
                    className='space-y-4 mt-0 h-full flex flex-col overflow-y-auto'
                  >
                    <div className='space-y-4 flex-shrink-0'>
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

                      {/* Field Management with Inline Editing */}
                      <div className='space-y-2 flex-1 flex flex-col min-h-0 overflow-hidden'>
                        <Label className='text-sm font-semibold text-gray-900'>
                          Field Management
                        </Label>
                        <div className='space-y-3 flex-1 overflow-y-auto pr-2 min-h-0 pb-4 max-h-[calc(100vh-320px)]'>
                          {templateFields.length === 0 ? (
                            <div className='p-6 text-center text-gray-500 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/30'>
                              <Layout className='w-10 h-10 mx-auto mb-3 text-blue-400' />
                              <p className='text-sm font-medium text-blue-700'>
                                No fields added yet
                              </p>
                              <p className='text-xs text-blue-600'>
                                Add elements using the buttons above
                              </p>
                            </div>
                          ) : (
                            templateFields.map(field => (
                              <div key={field.id} className='space-y-0'>
                                <div
                                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedField === field.id
                                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                                      : 'border-gray-200 hover:bg-gray-50 hover:border-blue-300'
                                  }`}
                                  onClick={() =>
                                    setSelectedField(
                                      selectedField === field.id
                                        ? null
                                        : field.id,
                                    )
                                  }
                                >
                                  <div className='flex items-center justify-between mb-2'>
                                    <span className='text-sm font-semibold truncate text-gray-800'>
                                      {field.label}
                                    </span>
                                    <div className='flex items-center space-x-2'>
                                      <Badge
                                        variant='outline'
                                        className='text-xs bg-blue-100 text-blue-700 border-blue-200'
                                      >
                                        {field.fieldType}
                                      </Badge>
                                      <Button
                                        variant='outline'
                                        size='sm'
                                        className='h-8 w-8 p-0 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                                        onClick={e => {
                                          e.stopPropagation();
                                          duplicateField(field.id);
                                        }}
                                      >
                                        <Copy className='w-4 h-4 text-blue-600' />
                                      </Button>
                                      <Button
                                        variant='outline'
                                        size='sm'
                                        className='h-8 w-8 p-0 border-red-200 bg-white hover:bg-red-50 hover:border-red-300 shadow-sm'
                                        onClick={e => {
                                          e.stopPropagation();
                                          removeField(field.id);
                                        }}
                                      >
                                        <Minus className='w-4 h-4 text-red-600' />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className='text-xs text-gray-600 flex items-center space-x-4'>
                                    <span>
                                      Position: {field.x}, {field.y}
                                    </span>
                                    <span>
                                      Size: {field.width} × {field.height}
                                    </span>
                                  </div>
                                </div>

                                {/* Inline Edit Dialog - appears right below clicked element */}
                                {selectedField === field.id && (
                                  <div className='bg-white border-2 border-blue-300 rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-200 mt-2 overflow-y-auto max-h-[60vh] flex flex-col min-h-0'>
                                    <div className='space-y-4'>
                                      <div className='flex items-center justify-between'>
                                        <h5 className='font-semibold text-blue-900 flex items-center'>
                                          <Type className='w-4 h-4 mr-2' />
                                          Edit: {field.label}
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

                                      {/* Field Properties */}
                                      <div className='grid grid-cols-2 gap-3'>
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
                                              value={
                                                field.dataSource || 'static'
                                              }
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
                                      </div>

                                      {/* Field Type Specific Options */}
                                      {field.fieldType ===
                                        TemplateFieldType.TEXT && (
                                        <div className='space-y-4'>
                                          {field.dataSource === 'static' ? (
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
                                          ) : (
                                            <div className='space-y-2'>
                                              <Label className='text-xs font-medium text-gray-700'>
                                                Database Field
                                              </Label>
                                              <Select
                                                value={
                                                  field.databaseField || ''
                                                }
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

                                          {/* Typography Controls */}
                                          <div className='grid grid-cols-2 gap-3'>
                                            <div className='space-y-2'>
                                              <Label className='text-xs font-medium text-gray-700'>
                                                Font Family
                                              </Label>
                                              <Select
                                                value={
                                                  field.fontFamily || 'Inter'
                                                }
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
                                            <div className='space-y-2'>
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
                                          </div>

                                          <div className='grid grid-cols-2 gap-3'>
                                            <div className='space-y-2'>
                                              <Label className='text-xs font-medium text-gray-700'>
                                                Font Weight
                                              </Label>
                                              <Select
                                                value={
                                                  field.fontWeight || 'normal'
                                                }
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
                                            <div className='space-y-2'>
                                              <Label className='text-xs font-medium text-gray-700'>
                                                Text Color
                                              </Label>
                                              <div className='flex items-center space-x-2'>
                                                <Input
                                                  type='color'
                                                  value={
                                                    field.color || '#000000'
                                                  }
                                                  onChange={e =>
                                                    updateField(field.id, {
                                                      color: e.target.value,
                                                    })
                                                  }
                                                  className='w-8 h-8 p-1 border border-blue-200 rounded'
                                                />
                                                <Input
                                                  value={
                                                    field.color || '#000000'
                                                  }
                                                  onChange={e =>
                                                    updateField(field.id, {
                                                      color: e.target.value,
                                                    })
                                                  }
                                                  className='flex-1 h-8 text-sm border-blue-200'
                                                />
                                              </div>
                                            </div>
                                          </div>

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
                                        </div>
                                      )}

                                      {/* Image Field Specific Options */}
                                      {(field.fieldType ===
                                        TemplateFieldType.IMAGE ||
                                        field.fieldType ===
                                          TemplateFieldType.LOGO) && (
                                        <div className='space-y-3'>
                                          <div className='space-y-2'>
                                            <Label className='text-xs font-medium text-gray-700'>
                                              Image Source
                                            </Label>
                                            <Select
                                              value={
                                                field.databaseField || 'upload'
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
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          {(!field.databaseField ||
                                            field.databaseField ===
                                              'schoolLogo') && (
                                            <div className='space-y-2'>
                                              <Label className='text-xs font-medium text-gray-700'>
                                                Upload Image
                                              </Label>
                                              <div className='border-2 border-dashed border-blue-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer'>
                                                <input
                                                  type='file'
                                                  accept='image/png,image/jpeg,image/jpg'
                                                  className='hidden'
                                                  id={`image-upload-${field.id}`}
                                                  onChange={e => {
                                                    const file =
                                                      e.target.files?.[0];
                                                    if (file) {
                                                      const reader =
                                                        new FileReader();
                                                      reader.onload = event => {
                                                        updateField(field.id, {
                                                          imageUrl: event.target
                                                            ?.result as string,
                                                        });
                                                      };
                                                      reader.readAsDataURL(
                                                        file,
                                                      );
                                                    }
                                                  }}
                                                />
                                                <label
                                                  htmlFor={`image-upload-${field.id}`}
                                                  className='cursor-pointer'
                                                >
                                                  <ImageIcon className='w-8 h-8 mx-auto mb-2 text-blue-400' />
                                                  <p className='text-sm text-blue-600'>
                                                    Click to upload{' '}
                                                    {field.fieldType ===
                                                    TemplateFieldType.LOGO
                                                      ? 'school logo'
                                                      : 'image'}
                                                  </p>
                                                  <p className='text-xs text-gray-500'>
                                                    PNG, JPG up to 2MB
                                                  </p>
                                                </label>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* QR Code Field Options */}
                                      {field.fieldType ===
                                        TemplateFieldType.QR_CODE && (
                                        <div className='space-y-3'>
                                          <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                                            <h6 className='font-medium text-blue-900 mb-2 text-sm'>
                                              QR Code Configuration
                                            </h6>
                                            <p className='text-xs text-blue-700 mb-3'>
                                              QR codes will be automatically
                                              generated with
                                              student/teacher/staff data for
                                              unique identification.
                                            </p>
                                            <div className='space-y-2'>
                                              <Label className='text-xs font-medium text-gray-700'>
                                                QR Data Source
                                              </Label>
                                              <Select
                                                value={
                                                  field.databaseField ||
                                                  'studentId'
                                                }
                                                onValueChange={value =>
                                                  updateField(field.id, {
                                                    databaseField: value,
                                                  })
                                                }
                                              >
                                                <SelectTrigger className='h-8 border-blue-200'>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {settings.type ===
                                                    IDCardTemplateType.STUDENT && (
                                                    <>
                                                      <SelectItem value='studentId'>
                                                        Student ID
                                                      </SelectItem>
                                                      <SelectItem value='rollNumber'>
                                                        Roll Number
                                                      </SelectItem>
                                                      <SelectItem value='admissionNumber'>
                                                        Admission Number
                                                      </SelectItem>
                                                    </>
                                                  )}
                                                  {settings.type ===
                                                    IDCardTemplateType.TEACHER && (
                                                    <>
                                                      <SelectItem value='employeeId'>
                                                        Employee ID
                                                      </SelectItem>
                                                      <SelectItem value='teacherId'>
                                                        Teacher ID
                                                      </SelectItem>
                                                    </>
                                                  )}
                                                  {(settings.type ===
                                                    IDCardTemplateType.STAFF ||
                                                    settings.type ===
                                                      IDCardTemplateType.STAFF_NO_LOGIN) && (
                                                    <SelectItem value='employeeId'>
                                                      Employee ID
                                                    </SelectItem>
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Position & Size Controls */}
                                      <div className='grid grid-cols-4 gap-2'>
                                        <div className='space-y-1'>
                                          <Label className='text-xs font-medium text-gray-700'>
                                            X
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
                                            Y
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
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
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
                  }}
                  onClick={() => setSelectedField(null)}
                >
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
