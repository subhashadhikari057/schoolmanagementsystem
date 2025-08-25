/**
 * =============================================================================
 * Create Template Modal Component
 * =============================================================================
 * Modal for creating and editing ID card templates
 * =============================================================================
 */

import React, { useState, useRef } from 'react';
import {
  X,
  CreditCard,
  FileText,
  Palette,
  Layout,
  Minus,
  Eye,
  Save,
  Copy,
  Type,
  QrCode,
  Image as ImageIcon,
  Grid,
  Ruler,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate?: {
    name?: string;
    type?: string;
    description?: string;
    dimensions?: string;
    orientation?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    logoRequired?: boolean;
    photoRequired?: boolean;
    qrCodeRequired?: boolean;
    barcodeRequired?: boolean;
    printMargin?: number;
    bleedArea?: number;
    safeArea?: number;
    fields?: TemplateField[];
  };
}

interface TemplateField {
  id: string;
  type: 'text' | 'image' | 'qr' | 'barcode' | 'logo';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  required: boolean;
  placeholder?: string;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
}

interface TemplateSettings {
  name: string;
  type: 'student' | 'teacher' | 'staff' | 'visitor';
  description: string;
  dimensions: string;
  customWidth?: number;
  customHeight?: number;
  orientation: 'horizontal' | 'vertical';
  backgroundColor: string;
  backgroundImage?: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  logoRequired: boolean;
  photoRequired: boolean;
  qrCodeRequired: boolean;
  barcodeRequired: boolean;
  watermark?: string;
  printMargin: number;
  bleedArea: number;
  safeArea: number;
}

export default function CreateTemplateModal({
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

  const canvasRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<TemplateSettings>({
    name: editingTemplate?.name || '',
    type:
      (editingTemplate?.type as 'student' | 'teacher' | 'staff' | 'visitor') ||
      'student',
    description: editingTemplate?.description || '',
    dimensions: editingTemplate?.dimensions || '85.6x53.98',
    orientation:
      (editingTemplate?.orientation as 'horizontal' | 'vertical') ||
      'horizontal',
    backgroundColor: editingTemplate?.backgroundColor || '#ffffff',
    borderColor: editingTemplate?.borderColor || '#000000',
    borderWidth: editingTemplate?.borderWidth || 1,
    borderRadius: editingTemplate?.borderRadius || 0,
    logoRequired: editingTemplate?.logoRequired ?? true,
    photoRequired: editingTemplate?.photoRequired ?? true,
    qrCodeRequired: editingTemplate?.qrCodeRequired ?? true,
    barcodeRequired: editingTemplate?.barcodeRequired ?? false,
    printMargin: editingTemplate?.printMargin || 5,
    bleedArea: editingTemplate?.bleedArea || 3,
    safeArea: editingTemplate?.safeArea || 5,
  });

  const [templateFields, setTemplateFields] = useState<TemplateField[]>(
    editingTemplate?.fields || [
      {
        id: 'logo',
        type: 'logo',
        label: 'School Logo',
        x: 10,
        y: 10,
        width: 40,
        height: 30,
        required: true,
        zIndex: 1,
        opacity: 100,
      },
      {
        id: 'photo',
        type: 'image',
        label: 'Photo',
        x: 200,
        y: 20,
        width: 80,
        height: 100,
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 4,
        required: true,
        zIndex: 2,
        opacity: 100,
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
        fontWeight: 'bold',
        textAlign: 'left',
        fontFamily: 'Inter',
        color: '#000000',
        required: true,
        placeholder: 'John Doe',
        zIndex: 3,
        opacity: 100,
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
        fontWeight: 'normal',
        textAlign: 'left',
        fontFamily: 'Inter',
        color: '#666666',
        required: true,
        placeholder: 'STU123456',
        zIndex: 4,
        opacity: 100,
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

    // Simulate API call
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

  const addField = (type: TemplateField['type']) => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      x: 50,
      y: 50,
      width: type === 'text' ? 100 : type === 'qr' ? 40 : 60,
      height: type === 'text' ? 20 : type === 'qr' ? 40 : 60,
      fontSize: type === 'text' ? 12 : undefined,
      fontWeight: type === 'text' ? 'normal' : undefined,
      textAlign: type === 'text' ? 'left' : undefined,
      fontFamily: type === 'text' ? 'Inter' : undefined,
      color: type === 'text' ? '#000000' : undefined,
      borderWidth: 0,
      borderColor: '#cccccc',
      borderRadius: 0,
      required: false,
      zIndex: templateFields.length + 1,
      opacity: 100,
    };
    setTemplateFields([...templateFields, newField]);
    setSelectedField(newField.id);
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

  if (!open) return null;

  return (
    <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl'>
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 border-b border-gray-100'>
          <div className='relative flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg'>
                <CreditCard className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white'>
                  {editingTemplate ? 'Edit' : 'Create'} ID Card Template
                </h2>
                <p className='text-xs text-blue-100 mt-1'>
                  Design and customize ID card templates
                </p>
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onOpenChange(false)}
              className='h-8 w-8 p-0 text-blue-100 hover:text-white hover:bg-white/20 rounded-xl'
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Loading/Success States */}
        {isLoading && (
          <div className='bg-blue-50 border-b border-blue-200 p-3'>
            <div className='flex items-center gap-2 text-blue-800'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span className='text-sm'>
                {editingTemplate ? 'Updating' : 'Creating'} template... Please
                wait.
              </span>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className='bg-green-50 border-b border-green-200 p-3'>
            <div className='flex items-center gap-2 text-green-800'>
              <CheckCircle className='h-4 w-4' />
              <span className='text-sm'>
                Template {editingTemplate ? 'updated' : 'created'} successfully!
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className='flex-1 overflow-hidden flex'>
          {/* Left Sidebar - Properties */}
          <div className='w-80 border-r bg-gray-50 flex flex-col'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='flex-1'
            >
              <div className='border-b p-2'>
                <TabsList className='grid w-full grid-cols-3'>
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
                </TabsList>
              </div>

              <div className='flex-1 overflow-auto p-4'>
                {/* Basic Tab */}
                <TabsContent value='basic' className='space-y-4 mt-0'>
                  <div className='space-y-3'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-gray-700'>
                        Template Name *
                      </label>
                      <Input
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
                      <label className='text-sm font-medium text-gray-700'>
                        Template Type *
                      </label>
                      <select
                        value={settings.type}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            type: e.target.value as
                              | 'student'
                              | 'teacher'
                              | 'staff'
                              | 'visitor',
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.type ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {templateTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.type && (
                        <p className='text-xs text-red-500'>{errors.type}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-gray-700'>
                        Description
                      </label>
                      <textarea
                        value={settings.description}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            description: e.target.value,
                          })
                        }
                        placeholder='Describe the template purpose...'
                        rows={2}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      />
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-gray-700'>
                        Card Dimensions *
                      </label>
                      <select
                        value={settings.dimensions}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            dimensions: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.dimensions
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {predefinedDimensions.map(dim => (
                          <option key={dim.value} value={dim.value}>
                            {dim.label}
                          </option>
                        ))}
                      </select>
                      {errors.dimensions && (
                        <p className='text-xs text-red-500'>
                          {errors.dimensions}
                        </p>
                      )}
                    </div>

                    {settings.dimensions === 'custom' && (
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='space-y-2'>
                          <label className='text-sm font-medium text-gray-700'>
                            Width (mm)
                          </label>
                          <Input
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
                          <label className='text-sm font-medium text-gray-700'>
                            Height (mm)
                          </label>
                          <Input
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
                  </div>
                </TabsContent>

                {/* Layout Tab */}
                <TabsContent value='layout' className='space-y-4 mt-0'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h4 className='font-medium'>Add Elements</h4>
                      <span className='text-xs text-gray-500'>
                        {templateFields.length} fields
                      </span>
                    </div>

                    <div className='grid grid-cols-2 gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => addField('text')}
                        className='justify-start'
                      >
                        <Type className='w-3 h-3 mr-1' />
                        Text
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => addField('image')}
                        className='justify-start'
                      >
                        <ImageIcon className='w-3 h-3 mr-1' />
                        Image
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => addField('qr')}
                        className='justify-start'
                      >
                        <QrCode className='w-3 h-3 mr-1' />
                        QR Code
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => addField('logo')}
                        className='justify-start'
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
                                <span className='text-xs px-1.5 py-0.5 bg-gray-100 rounded'>
                                  {field.type}
                                </span>
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
                              {field.x}×{field.y} • {field.width}×{field.height}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Design Tab */}
                <TabsContent value='design' className='space-y-4 mt-0'>
                  <div className='space-y-3'>
                    <h4 className='font-medium'>Card Appearance</h4>

                    <div className='space-y-3'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>
                          Background Color
                        </label>
                        <div className='flex items-center space-x-2'>
                          <input
                            type='color'
                            value={settings.backgroundColor}
                            onChange={e =>
                              setSettings({
                                ...settings,
                                backgroundColor: e.target.value,
                              })
                            }
                            className='w-8 h-8 border rounded cursor-pointer'
                          />
                          <Input
                            value={settings.backgroundColor}
                            onChange={e =>
                              setSettings({
                                ...settings,
                                backgroundColor: e.target.value,
                              })
                            }
                            className='flex-1'
                          />
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>
                          Border
                        </label>
                        <div className='grid grid-cols-3 gap-2'>
                          <div className='space-y-1'>
                            <label className='text-xs text-gray-500'>
                              Width
                            </label>
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
                              className='text-sm'
                            />
                          </div>
                          <div className='space-y-1'>
                            <label className='text-xs text-gray-500'>
                              Color
                            </label>
                            <input
                              type='color'
                              value={settings.borderColor}
                              onChange={e =>
                                setSettings({
                                  ...settings,
                                  borderColor: e.target.value,
                                })
                              }
                              className='w-full h-8 border rounded cursor-pointer'
                            />
                          </div>
                          <div className='space-y-1'>
                            <label className='text-xs text-gray-500'>
                              Radius
                            </label>
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
                              className='text-sm'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Main Canvas Area */}
          <div className='flex-1 flex flex-col bg-gray-100'>
            {/* Canvas Toolbar */}
            <div className='bg-white border-b px-4 py-2 flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <label className='text-sm'>Zoom:</label>
                  <select
                    value={zoomLevel}
                    onChange={e => setZoomLevel(Number(e.target.value))}
                    className='px-2 py-1 border rounded text-sm'
                  >
                    <option value={50}>50%</option>
                    <option value={75}>75%</option>
                    <option value={100}>100%</option>
                    <option value={125}>125%</option>
                    <option value={150}>150%</option>
                    <option value={200}>200%</option>
                  </select>
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
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid
                    className={`w-4 h-4 ${showGrid ? 'text-blue-600' : ''}`}
                  />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowRulers(!showRulers)}
                >
                  <Ruler
                    className={`w-4 h-4 ${showRulers ? 'text-blue-600' : ''}`}
                  />
                </Button>
              </div>
            </div>

            {/* Canvas */}
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
                {/* Render template fields here */}
                <div className='absolute inset-4 flex items-center justify-center text-gray-500'>
                  <div className='text-center'>
                    <CreditCard className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                    <p className='text-sm'>Template Preview</p>
                    <p className='text-xs'>Add fields from the left panel</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-between items-center p-4 border-t bg-white'>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm'>
              <Save className='w-4 h-4 mr-2' />
              Save Draft
            </Button>
            <Button variant='outline' size='sm'>
              <Eye className='w-4 h-4 mr-2' />
              Preview
            </Button>
          </div>
          <div className='flex space-x-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className='bg-primary hover:bg-primary/90'
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
      </div>
    </div>
  );
}
