import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  FileText,
  Image as ImageIcon,
  Layout,
  Palette,
  CheckCircle,
  Loader2,
  Type,
  QrCode,
  CreditCard,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  Save,
  Copy,
  Grid,
  Ruler,
  Download,
  Smartphone,
  Monitor,
  Printer,
  Plus,
  Database,
} from 'lucide-react';

import {
  IDCardTemplate,
  CreateTemplateRequest,
  TemplateField,
  TemplateSettings,
  ComponentTemplateField,
  TemplateTypeInfo,
  PredefinedDimension,
  DatabaseField,
} from '@/types/template.types';
import { templateApiService } from '@/services/template.service';

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate?: IDCardTemplate;
  onTemplateCreated?: (template: IDCardTemplate) => void;
  onTemplateUpdated?: (template: IDCardTemplate) => void;
}

export function CreateTemplateModal({
  open,
  onOpenChange,
  editingTemplate,
}: CreateTemplateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [previewMode, setPreviewMode] = useState<
    'desktop' | 'mobile' | 'print'
  >('desktop');

  const canvasRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<TemplateSettings>({
    name: editingTemplate?.name || '',
    type: 'student',
    description: editingTemplate?.description || '',
    dimensions: `${editingTemplate?.width || 85.6}x${editingTemplate?.height || 53.98}`,
    orientation: editingTemplate?.orientation || 'portrait',
    backgroundColor: editingTemplate?.backgroundColor || '#ffffff',
    borderColor: editingTemplate?.borderColor || '#000000',
    borderWidth: editingTemplate?.borderWidth || 1,
    borderRadius: editingTemplate?.cornerRadius || 0,
    logoRequired: true,
    photoRequired: true,
    qrCodeRequired: true,
    barcodeRequired: false,
    printMargin: 5,
    bleedArea: 3,
    safeArea: 5,
  });

  const [templateFields, setTemplateFields] = useState<
    ComponentTemplateField[]
  >(
    editingTemplate?.fields?.map(field => ({
      id: field.id,
      type: field.fieldName,
      label: field.displayName,
      databaseField: field.fieldName,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      fontSize: field.fontSize,
      fontWeight: field.fontWeight,
      textAlign: field.alignment,
      fontFamily: field.fontFamily,
      color: field.color,
      required: field.isRequired,
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: 1,
    })) || [
      {
        id: 'logo',
        type: 'logo',
        label: 'School Logo',
        x: 10,
        y: 10,
        width: 40,
        height: 30,
        fontSize: 12,
        fontWeight: 'normal' as const,
        textAlign: 'center' as const,
        fontFamily: 'Inter',
        color: '#000000',
        required: true,
        visible: true,
        locked: false,
        opacity: 1,
        zIndex: 1,
      },
      {
        id: 'photo',
        type: 'image',
        label: 'Photo',
        x: 200,
        y: 20,
        width: 80,
        height: 100,
        fontSize: 12,
        fontWeight: 'normal' as const,
        textAlign: 'center' as const,
        fontFamily: 'Inter',
        color: '#000000',
        required: true,
        visible: true,
        locked: false,
        opacity: 1,
        zIndex: 2,
      },
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        x: 60,
        y: 25,
        width: 130,
        height: 20,
        fontSize: 14,
        fontWeight: 'bold' as const,
        textAlign: 'left' as const,
        fontFamily: 'Inter',
        color: '#000000',
        required: true,
        visible: true,
        locked: false,
        opacity: 1,
        zIndex: 3,
      },
      {
        id: 'id',
        type: 'text',
        label: 'ID Number',
        x: 60,
        y: 50,
        width: 130,
        height: 15,
        fontSize: 12,
        fontWeight: 'normal' as const,
        textAlign: 'left' as const,
        fontFamily: 'Inter',
        color: '#666666',
        required: true,
        visible: true,
        locked: false,
        opacity: 1,
        zIndex: 4,
      },
    ],
  );

  const templateTypes = [
    {
      value: 'student',
      label: 'Student ID Card',
      fields: [
        'Name',
        'Student ID',
        'Class',
        'Section',
        'Roll Number',
        'Academic Year',
        'Date of Birth',
        'Blood Group',
        'Emergency Contact',
      ],
      defaultColor: '#2563eb',
    },
    {
      value: 'teacher',
      label: 'Teacher ID Card',
      fields: [
        'Name',
        'Employee ID',
        'Department',
        'Subject',
        'Position',
        'Qualification',
        'Contact Number',
        'Emergency Contact',
      ],
      defaultColor: '#16a34a',
    },
    {
      value: 'staff',
      label: 'Staff ID Card',
      fields: [
        'Name',
        'Employee ID',
        'Department',
        'Position',
        'Shift',
        'Contact Number',
        'Emergency Contact',
      ],
      defaultColor: '#7c3aed',
    },
    {
      value: 'visitor',
      label: 'Visitor ID Card',
      fields: [
        'Name',
        'Company',
        'Purpose',
        'Valid Until',
        'Contact Person',
        'Phone',
      ],
      defaultColor: '#ea580c',
    },
  ];

  const predefinedDimensions = [
    {
      value: '85.6x53.98',
      label: 'Standard Credit Card (85.6 × 53.98 mm)',
      ratio: 1.6,
    },
    { value: '86x54', label: 'ISO/IEC 7810 ID-1 (86 × 54 mm)', ratio: 1.59 },
    { value: '105x74', label: 'Custom Large (105 × 74 mm)', ratio: 1.42 },
    { value: '70x100', label: 'Badge Style (70 × 100 mm)', ratio: 0.7 },
    { value: 'custom', label: 'Custom Dimensions', ratio: 1.6 },
  ];

  const fontFamilies = [
    'Inter',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Calibri',
    'Roboto',
    'Open Sans',
  ];

  const getCanvasDimensions = () => {
    const [width, height] = settings.dimensions.split('x').map(Number);
    const baseWidth = settings.orientation === 'horizontal' ? width : height;
    const baseHeight = settings.orientation === 'horizontal' ? height : width;
    const scale = zoomLevel / 100;

    return {
      width: baseWidth * 4 * scale, // Scale for display (4px per mm)
      height: baseHeight * 4 * scale,
      realWidth: baseWidth,
      realHeight: baseHeight,
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!settings.name.trim()) newErrors.name = 'Template name is required';
    if (!settings.type) newErrors.type = 'Template type is required';
    if (!settings.dimensions) newErrors.dimensions = 'Dimensions are required';
    if (settings.dimensions === 'custom') {
      if (!settings.customWidth || settings.customWidth <= 0)
        newErrors.customWidth = 'Valid width required';
      if (!settings.customHeight || settings.customHeight <= 0)
        newErrors.customHeight = 'Valid height required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveTab('basic');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        resetForm();
      }, 2000);
    }, 2000);
  };

  const resetForm = () => {
    setSettings({
      name: '',
      type: 'student',
      description: '',
      dimensions: '85.6x53.98',
      orientation: 'horizontal',
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      borderRadius: 0,
      logoRequired: true,
      photoRequired: true,
      qrCodeRequired: true,
      barcodeRequired: false,
      printMargin: 5,
      bleedArea: 3,
      safeArea: 5,
    });
    setTemplateFields([]);
    setActiveTab('basic');
    setErrors({});
    setSelectedField(null);
  };

  const addField = (type: string) => {
    const newField: ComponentTemplateField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      x: 50,
      y: 50,
      width: type === 'text' ? 100 : type === 'qr' ? 40 : 60,
      height: type === 'text' ? 20 : type === 'qr' ? 40 : 60,
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
      fontFamily: 'Inter',
      color: '#000000',
      required: false,
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: templateFields.length + 1,
    };
    setTemplateFields([...templateFields, newField]);
    setSelectedField(newField.id);
  };

  const updateField = (
    id: string,
    updates: Partial<ComponentTemplateField>,
  ) => {
    setTemplateFields(
      templateFields.map(field =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    );
  };

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

  const removeField = (id: string) => {
    setTemplateFields(templateFields.filter(field => field.id !== id));
    if (selectedField === id) {
      setSelectedField(null);
    }
  };

  const getSelectedTemplateType = () => {
    return templateTypes.find(t => t.value === settings.type);
  };

  const selectedFieldData = templateFields.find(f => f.id === selectedField);

  const renderField = (field: ComponentTemplateField) => {
    const canvas = getCanvasDimensions();
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${(field.x / canvas.realWidth) * 100}%`,
      top: `${(field.y / canvas.realHeight) * 100}%`,
      width: `${(field.width / canvas.realWidth) * 100}%`,
      height: `${(field.height / canvas.realHeight) * 100}%`,
      border:
        selectedField === field.id
          ? '2px solid #2563eb'
          : field.borderWidth
            ? `${field.borderWidth}px solid ${field.borderColor}`
            : 'none',
      borderRadius: field.borderRadius ? `${field.borderRadius}px` : '0',
      backgroundColor: field.backgroundColor || 'transparent',
      opacity: (field.opacity || 100) / 100,
      zIndex: field.zIndex || 1,
      cursor: 'pointer',
      fontSize: field.fontSize
        ? `${field.fontSize * (zoomLevel / 100)}px`
        : undefined,
      fontFamily: field.fontFamily,
      fontWeight: field.fontWeight,
      textAlign: field.textAlign,
      color: field.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent:
        field.textAlign === 'center'
          ? 'center'
          : field.textAlign === 'right'
            ? 'flex-end'
            : 'flex-start',
      padding: '2px',
    };

    const content = () => {
      switch (field.type) {
        case 'text':
          return field.placeholder || field.label;
        case 'image':
        case 'logo':
          return (
            <div className='w-full h-full bg-gray-100 flex items-center justify-center border border-gray-300 rounded'>
              <ImageIcon className='w-4 h-4 text-gray-400' />
            </div>
          );
        case 'qr':
          return (
            <div className='w-full h-full bg-gray-100 flex items-center justify-center border border-gray-300 rounded'>
              <QrCode className='w-4 h-4 text-gray-600' />
            </div>
          );
        case 'barcode':
          return (
            <div className='w-full h-full bg-gray-100 flex items-center justify-center border border-gray-300 rounded'>
              <div className='text-xs'>|||||||</div>
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
        onClick={() => setSelectedField(field.id)}
        className={`select-none ${selectedField === field.id ? 'ring-2 ring-blue-500' : ''}`}
      >
        {content()}
        {selectedField === field.id && (
          <>
            <div className='absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full'></div>
            <div className='absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full'></div>
            <div className='absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full'></div>
            <div className='absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full'></div>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[95vw] h-[95vh] overflow-hidden flex flex-col bg-white'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <CreditCard className='w-5 h-5' />
              <span>
                {editingTemplate ? 'Edit' : 'Create'} ID Card Template
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant={showGrid ? 'default' : 'outline'}
                size='sm'
                onClick={() => setShowGrid(!showGrid)}
                className={
                  showGrid ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                }
              >
                <Grid className='w-4 h-4' />
              </Button>
              <Button
                variant={showRulers ? 'default' : 'outline'}
                size='sm'
                onClick={() => setShowRulers(!showRulers)}
                className={
                  showRulers ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                }
              >
                <Ruler className='w-4 h-4' />
              </Button>
              <Select
                value={previewMode}
                onValueChange={(value: string) =>
                  setPreviewMode(value as 'desktop' | 'mobile' | 'print')
                }
              >
                <SelectTrigger className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='desktop'>
                    <div className='flex items-center space-x-2'>
                      <Monitor className='w-4 h-4' />
                      <span>Desktop</span>
                    </div>
                  </SelectItem>
                  <SelectItem value='mobile'>
                    <div className='flex items-center space-x-2'>
                      <Smartphone className='w-4 h-4' />
                      <span>Mobile</span>
                    </div>
                  </SelectItem>
                  <SelectItem value='print'>
                    <div className='flex items-center space-x-2'>
                      <Printer className='w-4 h-4' />
                      <span>Print</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <Alert className='flex-shrink-0'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <AlertDescription>
              {editingTemplate ? 'Updating' : 'Creating'} template... Please
              wait.
            </AlertDescription>
          </Alert>
        )}

        {showSuccess && (
          <Alert className='bg-green-50 border-green-200 flex-shrink-0'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-green-800'>
              Template {editingTemplate ? 'updated' : 'created'} successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className='flex-1 overflow-hidden flex'>
          <div className='w-80 border-r bg-white flex flex-col'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='flex-1'
            >
              <TabsList className='grid w-full grid-cols-4 m-2 bg-transparent'>
                <TabsTrigger
                  value='basic'
                  className='text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white'
                >
                  <FileText className='w-3 h-3' />
                </TabsTrigger>
                <TabsTrigger
                  value='layout'
                  className='text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white'
                >
                  <Layout className='w-3 h-3' />
                </TabsTrigger>
                <TabsTrigger
                  value='design'
                  className='text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white'
                >
                  <Palette className='w-3 h-3' />
                </TabsTrigger>
                <TabsTrigger
                  value='preview'
                  className='text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white'
                >
                  <Eye className='w-3 h-3' />
                </TabsTrigger>
              </TabsList>

              <div className='flex-1 overflow-hidden'>
                <ScrollArea className='h-full p-4'>
                  <TabsContent value='basic' className='space-y-4 mt-0'>
                    <div className='space-y-3'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Template Name *</Label>
                        <Input
                          id='name'
                          value={settings.name}
                          onChange={e =>
                            setSettings({ ...settings, name: e.target.value })
                          }
                          placeholder='e.g., Student ID Template 2025'
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className='text-xs text-red-500'>{errors.name}</p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='type'>Template Type *</Label>
                        <Select
                          value={settings.type}
                          onValueChange={(value: string) =>
                            setSettings({
                              ...settings,
                              type: value as TemplateSettings['type'],
                            })
                          }
                        >
                          <SelectTrigger
                            className={errors.type ? 'border-red-500' : ''}
                          >
                            <SelectValue placeholder='Select template type' />
                          </SelectTrigger>
                          <SelectContent>
                            {templateTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className='flex items-center space-x-2'>
                                  <div
                                    className='w-3 h-3 rounded-full'
                                    style={{
                                      backgroundColor: type.defaultColor,
                                    }}
                                  ></div>
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.type && (
                          <p className='text-xs text-red-500'>{errors.type}</p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='description'>Description</Label>
                        <Textarea
                          id='description'
                          value={settings.description}
                          onChange={e =>
                            setSettings({
                              ...settings,
                              description: e.target.value,
                            })
                          }
                          placeholder='Describe the template purpose...'
                          rows={2}
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='dimensions'>Card Dimensions *</Label>
                        <Select
                          value={settings.dimensions}
                          onValueChange={(value: string) =>
                            setSettings({ ...settings, dimensions: value })
                          }
                        >
                          <SelectTrigger
                            className={
                              errors.dimensions ? 'border-red-500' : ''
                            }
                          >
                            <SelectValue placeholder='Select dimensions' />
                          </SelectTrigger>
                          <SelectContent>
                            {predefinedDimensions.map(dim => (
                              <SelectItem key={dim.value} value={dim.value}>
                                {dim.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.dimensions && (
                          <p className='text-xs text-red-500'>
                            {errors.dimensions}
                          </p>
                        )}
                      </div>

                      {settings.dimensions === 'custom' && (
                        <div className='grid grid-cols-2 gap-2'>
                          <div className='space-y-2'>
                            <Label htmlFor='customWidth'>Width (mm)</Label>
                            <Input
                              id='customWidth'
                              type='number'
                              value={settings.customWidth || ''}
                              onChange={e =>
                                setSettings({
                                  ...settings,
                                  customWidth: Number(e.target.value),
                                })
                              }
                              className={
                                errors.customWidth ? 'border-red-500' : ''
                              }
                            />
                            {errors.customWidth && (
                              <p className='text-xs text-red-500'>
                                {errors.customWidth}
                              </p>
                            )}
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='customHeight'>Height (mm)</Label>
                            <Input
                              id='customHeight'
                              type='number'
                              value={settings.customHeight || ''}
                              onChange={e =>
                                setSettings({
                                  ...settings,
                                  customHeight: Number(e.target.value),
                                })
                              }
                              className={
                                errors.customHeight ? 'border-red-500' : ''
                              }
                            />
                            {errors.customHeight && (
                              <p className='text-xs text-red-500'>
                                {errors.customHeight}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className='space-y-2'>
                        <Label htmlFor='orientation'>Orientation</Label>
                        <Select
                          value={settings.orientation}
                          onValueChange={(value: string) =>
                            setSettings({
                              ...settings,
                              orientation:
                                value as TemplateSettings['orientation'],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='horizontal'>
                              Horizontal (Landscape)
                            </SelectItem>
                            <SelectItem value='vertical'>
                              Vertical (Portrait)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {getSelectedTemplateType() && (
                        <div className='p-3 bg-blue-50 rounded-lg'>
                          <h4 className='font-medium text-blue-900 mb-2 text-sm'>
                            Standard Fields
                          </h4>
                          <div className='flex flex-wrap gap-1'>
                            {getSelectedTemplateType()?.fields.map(field => (
                              <Badge
                                key={field}
                                variant='outline'
                                className='text-xs'
                              >
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value='layout' className='space-y-4 mt-0'>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h4 className='font-medium'>Add Elements</h4>
                        <Badge variant='outline'>
                          {templateFields.length} fields
                        </Badge>
                      </div>

                      <div className='grid grid-cols-2 gap-2'>
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => addField('text')}
                          className='justify-start bg-blue-600 hover:bg-blue-700 text-white'
                        >
                          <Type className='w-3 h-3 mr-1' />
                          Text
                        </Button>
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => addField('image')}
                          className='justify-start bg-blue-600 hover:bg-blue-700 text-white'
                        >
                          <ImageIcon className='w-3 h-3 mr-1' />
                          Image
                        </Button>
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => addField('qr')}
                          className='justify-start bg-blue-600 hover:bg-blue-700 text-white'
                        >
                          <QrCode className='w-3 h-3 mr-1' />
                          QR Code
                        </Button>
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => addField('logo')}
                          className='justify-start bg-blue-600 hover:bg-blue-700 text-white'
                        >
                          <ImageIcon className='w-3 h-3 mr-1' />
                          Logo
                        </Button>
                      </div>

                      <div className='space-y-2'>
                        <h4 className='font-medium text-sm'>Template Fields</h4>
                        <div className='space-y-1 max-h-80 overflow-y-auto'>
                          {templateFields.map(field => (
                            <div
                              key={field.id}
                              className={`p-2 border rounded cursor-pointer transition-colors ${
                                selectedField === field.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedField(field.id)}
                            >
                              <div className='flex items-center justify-between mb-1'>
                                <span className='text-sm font-medium truncate'>
                                  {field.label}
                                </span>
                                <div className='flex items-center space-x-1'>
                                  <Badge variant='outline' className='text-xs'>
                                    {field.type}
                                  </Badge>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-6 w-6 p-0'
                                    onClick={e => {
                                      e.stopPropagation();
                                      duplicateField(field.id);
                                    }}
                                  >
                                    <Copy className='w-3 h-3' />
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-6 w-6 p-0 text-red-600 hover:text-red-700'
                                    onClick={e => {
                                      e.stopPropagation();
                                      removeField(field.id);
                                    }}
                                  >
                                    <Minus className='w-3 h-3' />
                                  </Button>
                                </div>
                              </div>
                              <div className='text-xs text-gray-500'>
                                {field.x}×{field.y} • {field.width}×
                                {field.height}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedFieldData && (
                        <div className='space-y-3 p-3 border rounded-lg bg-white'>
                          <h4 className='font-medium text-sm'>
                            Field Properties
                          </h4>

                          <div className='space-y-2'>
                            <Label className='text-xs'>Label</Label>
                            <Input
                              value={selectedFieldData.label}
                              onChange={e =>
                                updateField(selectedField!, {
                                  label: e.target.value,
                                })
                              }
                              className='h-8 text-sm'
                            />
                          </div>

                          <div className='grid grid-cols-2 gap-2'>
                            <div className='space-y-2'>
                              <Label className='text-xs'>X Position</Label>
                              <Input
                                type='number'
                                value={selectedFieldData.x}
                                onChange={e =>
                                  updateField(selectedField!, {
                                    x: Number(e.target.value),
                                  })
                                }
                                className='h-8 text-sm'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-xs'>Y Position</Label>
                              <Input
                                type='number'
                                value={selectedFieldData.y}
                                onChange={e =>
                                  updateField(selectedField!, {
                                    y: Number(e.target.value),
                                  })
                                }
                                className='h-8 text-sm'
                              />
                            </div>
                          </div>

                          <div className='grid grid-cols-2 gap-2'>
                            <div className='space-y-2'>
                              <Label className='text-xs'>Width</Label>
                              <Input
                                type='number'
                                value={selectedFieldData.width}
                                onChange={e =>
                                  updateField(selectedField!, {
                                    width: Number(e.target.value),
                                  })
                                }
                                className='h-8 text-sm'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-xs'>Height</Label>
                              <Input
                                type='number'
                                value={selectedFieldData.height}
                                onChange={e =>
                                  updateField(selectedField!, {
                                    height: Number(e.target.value),
                                  })
                                }
                                className='h-8 text-sm'
                              />
                            </div>
                          </div>

                          {selectedFieldData.type === 'text' && (
                            <>
                              <div className='space-y-2'>
                                <Label className='text-xs'>Font Size</Label>
                                <Input
                                  type='number'
                                  value={selectedFieldData.fontSize || 12}
                                  onChange={e =>
                                    updateField(selectedField!, {
                                      fontSize: Number(e.target.value),
                                    })
                                  }
                                  className='h-8 text-sm'
                                />
                              </div>

                              <div className='space-y-2'>
                                <Label className='text-xs'>Font Family</Label>
                                <Select
                                  value={
                                    selectedFieldData.fontFamily || 'Inter'
                                  }
                                  onValueChange={(value: string) =>
                                    updateField(selectedField!, {
                                      fontFamily: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className='h-8'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fontFamilies.map(font => (
                                      <SelectItem key={font} value={font}>
                                        {font}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className='space-y-2'>
                                <Label className='text-xs'>Text Align</Label>
                                <div className='flex space-x-1'>
                                  {(
                                    [
                                      { value: 'left', icon: AlignLeft },
                                      { value: 'center', icon: AlignCenter },
                                      { value: 'right', icon: AlignRight },
                                    ] as {
                                      value: 'left' | 'center' | 'right';
                                      icon: typeof AlignLeft;
                                    }[]
                                  ).map(({ value, icon: Icon }) => (
                                    <Button
                                      key={value}
                                      variant={
                                        selectedFieldData.textAlign === value
                                          ? 'default'
                                          : 'outline'
                                      }
                                      size='sm'
                                      className='h-8 w-8 p-0'
                                      onClick={() =>
                                        updateField(selectedField!, {
                                          textAlign: value as
                                            | 'left'
                                            | 'center'
                                            | 'right',
                                        })
                                      }
                                    >
                                      <Icon className='w-3 h-3' />
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div className='space-y-2'>
                                <Label className='text-xs'>Color</Label>
                                <div className='flex items-center space-x-2'>
                                  <Input
                                    type='color'
                                    value={selectedFieldData.color || '#000000'}
                                    onChange={e =>
                                      updateField(selectedField!, {
                                        color: e.target.value,
                                      })
                                    }
                                    className='w-8 h-8 p-1 border rounded'
                                  />
                                  <Input
                                    value={selectedFieldData.color || '#000000'}
                                    onChange={e =>
                                      updateField(selectedField!, {
                                        color: e.target.value,
                                      })
                                    }
                                    className='flex-1 h-8 text-sm'
                                  />
                                </div>
                              </div>

                              <div className='space-y-2'>
                                <Label className='text-xs'>Placeholder</Label>
                                <Input
                                  value={selectedFieldData.placeholder || ''}
                                  onChange={e =>
                                    updateField(selectedField!, {
                                      placeholder: e.target.value,
                                    })
                                  }
                                  className='h-8 text-sm'
                                  placeholder='Sample text...'
                                />
                              </div>
                            </>
                          )}

                          <div className='space-y-2'>
                            <Label className='text-xs'>Opacity</Label>
                            <Slider
                              value={[selectedFieldData.opacity || 100]}
                              onValueChange={value =>
                                updateField(selectedField!, {
                                  opacity: value[0],
                                })
                              }
                              max={100}
                              min={0}
                              step={1}
                              className='w-full'
                            />
                            <div className='text-xs text-gray-500 text-center'>
                              {selectedFieldData.opacity || 100}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value='design' className='space-y-4 mt-0'>
                    <div className='space-y-3'>
                      <h4 className='font-medium'>Card Appearance</h4>

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
                          <Label className='text-xs'>Border</Label>
                          <div className='grid grid-cols-3 gap-2'>
                            <div className='space-y-1'>
                              <Label className='text-xs text-gray-500'>
                                Width
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
                                Color
                              </Label>
                              <Input
                                type='color'
                                value={settings.borderColor}
                                onChange={e =>
                                  setSettings({
                                    ...settings,
                                    borderColor: e.target.value,
                                  })
                                }
                                className='w-full h-8 p-1'
                              />
                            </div>
                            <div className='space-y-1'>
                              <Label className='text-xs text-gray-500'>
                                Radius
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
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-xs'>Print Settings</Label>
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
                                Safe
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

                        <div className='space-y-2'>
                          <Label className='text-xs'>Required Elements</Label>
                          <div className='space-y-2'>
                            {[
                              { key: 'logoRequired', label: 'School Logo' },
                              { key: 'photoRequired', label: 'Photo' },
                              { key: 'qrCodeRequired', label: 'QR Code' },
                              { key: 'barcodeRequired', label: 'Barcode' },
                            ].map(({ key, label }) => (
                              <div
                                key={key}
                                className='flex items-center space-x-2'
                              >
                                <input
                                  type='checkbox'
                                  id={key}
                                  checked={
                                    settings[
                                      key as keyof TemplateSettings
                                    ] as boolean
                                  }
                                  onChange={e =>
                                    setSettings({
                                      ...settings,
                                      [key]: e.target.checked,
                                    })
                                  }
                                  className='rounded'
                                />
                                <Label htmlFor={key} className='text-sm'>
                                  {label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value='preview' className='space-y-4 mt-0'>
                    <div className='space-y-3'>
                      <h4 className='font-medium'>Template Summary</h4>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Name:</span>
                          <span className='font-medium'>
                            {settings.name || 'Untitled'}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Type:</span>
                          <span className='font-medium'>
                            {getSelectedTemplateType()?.label}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Size:</span>
                          <span className='font-medium'>
                            {settings.dimensions} mm
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Fields:</span>
                          <span className='font-medium'>
                            {templateFields.length} elements
                          </span>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label className='text-xs'>Export Options</Label>
                        <div className='grid grid-cols-1 gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='justify-start'
                          >
                            <Download className='w-3 h-3 mr-2' />
                            Export as Template
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='justify-start'
                          >
                            <FileText className='w-3 h-3 mr-2' />
                            Generate PDF
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='justify-start'
                          >
                            <Printer className='w-3 h-3 mr-2' />
                            Print Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>

          <div className='flex-1 flex flex-col bg-gray-100'>
            <div className='bg-white border-b px-4 py-2 flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <Label className='text-sm'>Zoom:</Label>
                  <Select
                    value={zoomLevel.toString()}
                    onValueChange={(value: string) =>
                      setZoomLevel(Number(value))
                    }
                  >
                    <SelectTrigger className='w-20'>
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
                <div className='text-sm text-gray-500'>
                  {getCanvasDimensions().realWidth} ×{' '}
                  {getCanvasDimensions().realHeight} mm
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedField(null)}
                  className='border-blue-300 text-blue-700'
                >
                  Clear Selection
                </Button>
                {selectedField && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => duplicateField(selectedField)}
                    className='border-blue-300 text-blue-700'
                  >
                    <Copy className='w-4 h-4 mr-1' />
                    Duplicate
                  </Button>
                )}
              </div>
            </div>

            <div className='flex-1 overflow-auto p-8 flex items-center justify-center'>
              <div
                ref={canvasRef}
                className='relative border-2 border-gray-300 shadow-lg bg-white'
                style={{
                  width: `${getCanvasDimensions().width}px`,
                  height: `${getCanvasDimensions().height}px`,
                  backgroundColor: settings.backgroundColor,
                  borderColor: settings.borderColor,
                  borderWidth: `${settings.borderWidth}px`,
                  borderRadius: `${settings.borderRadius}px`,
                  backgroundImage: showGrid
                    ? `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `
                    : 'none',
                  backgroundSize: showGrid ? '20px 20px' : 'auto',
                }}
                onClick={() => setSelectedField(null)}
              >
                {showRulers && (
                  <>
                    <div className='absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-gray-200 to-gray-100 border-b border-gray-300 text-[10px] flex items-end overflow-hidden select-none pointer-events-none'>
                      {Array.from({
                        length: Math.ceil(getCanvasDimensions().realWidth) + 1,
                      }).map((_, i) => (
                        <div
                          key={i}
                          className='relative'
                          style={{
                            width: `${getCanvasDimensions().width / getCanvasDimensions().realWidth}px`,
                          }}
                        >
                          <div className='absolute bottom-0 left-0 h-3 w-px bg-gray-400' />
                          {i % 10 === 0 && (
                            <div className='absolute bottom-0 left-0 h-6 w-px bg-gray-500'>
                              <span className='absolute -bottom-5 left-0 translate-x-0'>
                                {i}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className='absolute top-0 left-0 bottom-0 w-6 bg-gradient-to-r from-gray-200 to-gray-100 border-r border-gray-300 text-[10px] flex flex-col items-end overflow-hidden select-none pointer-events-none'>
                      {Array.from({
                        length: Math.ceil(getCanvasDimensions().realHeight) + 1,
                      }).map((_, i) => (
                        <div
                          key={i}
                          className='relative'
                          style={{
                            height: `${getCanvasDimensions().height / getCanvasDimensions().realHeight}px`,
                          }}
                        >
                          <div className='absolute top-0 right-0 w-3 h-px bg-gray-400' />
                          {i % 10 === 0 && (
                            <div className='absolute top-0 right-0 w-6 h-px bg-gray-500'>
                              <span className='absolute top-0 right-0 translate-y-0 pr-1'>
                                {i}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className='absolute top-6 left-6 right-0 bottom-0'>
                      {templateFields.map(renderField)}
                      {previewMode === 'print' && (
                        <div
                          className='absolute border-2 border-dashed border-red-300 pointer-events-none'
                          style={{
                            top: `${settings.printMargin}px`,
                            left: `${settings.printMargin}px`,
                            right: `${settings.printMargin}px`,
                            bottom: `${settings.printMargin}px`,
                            width: `calc(100% - ${settings.printMargin * 2}px)`,
                            height: `calc(100% - ${settings.printMargin * 2}px)`,
                          }}
                        />
                      )}
                    </div>
                  </>
                )}
                {!showRulers && (
                  <>
                    {templateFields.map(renderField)}
                    {previewMode === 'print' && (
                      <div
                        className='absolute border-2 border-dashed border-red-300 pointer-events-none'
                        style={{
                          top: `${settings.printMargin}px`,
                          left: `${settings.printMargin}px`,
                          right: `${settings.printMargin}px`,
                          bottom: `${settings.printMargin}px`,
                          width: `calc(100% - ${settings.printMargin * 2}px)`,
                          height: `calc(100% - ${settings.printMargin * 2}px)`,
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='flex justify-between items-center p-4 border-t bg-white flex-shrink-0'>
          <div className='flex items-center space-x-2'>
            <Button
              variant='default'
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Save className='w-4 h-4 mr-2' />
              Save Draft
            </Button>
            <Button
              variant='default'
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Eye className='w-4 h-4 mr-2' />
              Preview
            </Button>
          </div>
          <div className='flex space-x-2'>
            <Button
              variant='default'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  {editingTemplate ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle className='w-4 h-4 mr-2' />
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTemplateModal;
