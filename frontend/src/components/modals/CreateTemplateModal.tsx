'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Eye,
  Save,
  Grid,
  Type,
  Palette,
  Image,
  QrCode,
  Building2,
  Copy,
  Grid3X3,
  Ruler,
  Layers,
  ZoomIn,
  ZoomOut,
  Camera,
} from 'lucide-react';
import { templateApiService } from '@/services/template.service';
import {
  CreateTemplateDto,
  IDCardTemplate,
  TemplateField,
  IDCardTemplateType,
  TemplateOrientation,
  TemplateFieldType,
  TextAlignment,
  CARD_DIMENSIONS,
  TEMPLATE_TYPE_OPTIONS,
} from '@/types/template.types';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTemplate?: IDCardTemplate;
  mode?: 'create' | 'edit';
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editTemplate,
  mode = 'create',
}) => {
  const [activeTab, setActiveTab] = useState<
    'basic' | 'layout' | 'design' | 'preview'
  >('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showRuler, setShowRuler] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Data sources for different user types
  const DATA_SOURCES = {
    student: [
      { value: 'student.firstName', label: 'First Name' },
      { value: 'student.lastName', label: 'Last Name' },
      { value: 'student.fullName', label: 'Full Name' },
      { value: 'student.rollNumber', label: 'Roll Number' },
      { value: 'student.class', label: 'Class' },
      { value: 'student.section', label: 'Section' },
      { value: 'student.admissionNumber', label: 'Admission Number' },
      { value: 'student.dateOfBirth', label: 'Date of Birth' },
      { value: 'student.bloodGroup', label: 'Blood Group' },
      { value: 'student.phoneNumber', label: 'Phone Number' },
      { value: 'student.address', label: 'Address' },
      { value: 'student.photo', label: 'Student Photo' },
      { value: 'student.qrCode', label: 'Student QR Code' },
      { value: 'student.barcode', label: 'Student Barcode' },
    ],
    teacher: [
      { value: 'teacher.firstName', label: 'First Name' },
      { value: 'teacher.lastName', label: 'Last Name' },
      { value: 'teacher.fullName', label: 'Full Name' },
      { value: 'teacher.employeeId', label: 'Employee ID' },
      { value: 'teacher.designation', label: 'Designation' },
      { value: 'teacher.department', label: 'Department' },
      { value: 'teacher.subjects', label: 'Subjects' },
      { value: 'teacher.phoneNumber', label: 'Phone Number' },
      { value: 'teacher.email', label: 'Email' },
      { value: 'teacher.photo', label: 'Teacher Photo' },
      { value: 'teacher.qrCode', label: 'Teacher QR Code' },
      { value: 'teacher.barcode', label: 'Teacher Barcode' },
    ],
    staff: [
      { value: 'staff.firstName', label: 'First Name' },
      { value: 'staff.lastName', label: 'Last Name' },
      { value: 'staff.fullName', label: 'Full Name' },
      { value: 'staff.employeeId', label: 'Employee ID' },
      { value: 'staff.designation', label: 'Designation' },
      { value: 'staff.department', label: 'Department' },
      { value: 'staff.phoneNumber', label: 'Phone Number' },
      { value: 'staff.email', label: 'Email' },
      { value: 'staff.photo', label: 'Staff Photo' },
      { value: 'staff.qrCode', label: 'Staff QR Code' },
      { value: 'staff.barcode', label: 'Staff Barcode' },
    ],
    school: [
      { value: 'school.name', label: 'School Name' },
      { value: 'school.logo', label: 'School Logo' },
      { value: 'school.address', label: 'School Address' },
      { value: 'school.phone', label: 'School Phone' },
      { value: 'school.email', label: 'School Email' },
      { value: 'school.website', label: 'School Website' },
    ],
  };

  // Get available data sources based on template type
  const getAvailableDataSources = () => {
    const type = formData.type;
    let sources = [...DATA_SOURCES.school]; // Always include school info

    if (type === IDCardTemplateType.STUDENT) {
      sources = [...sources, ...DATA_SOURCES.student];
    } else if (type === IDCardTemplateType.TEACHER) {
      sources = [...sources, ...DATA_SOURCES.teacher];
    } else if (type === IDCardTemplateType.STAFF) {
      sources = [...sources, ...DATA_SOURCES.staff];
    }

    return sources;
  };

  const [formData, setFormData] = useState<CreateTemplateDto>({
    name: '',
    type: IDCardTemplateType.STUDENT,
    dimensions: 'cr80',
    customWidth: 85.6,
    customHeight: 53.98,
    orientation: TemplateOrientation.HORIZONTAL,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    logoRequired: false,
    photoRequired: false,
    qrCodeRequired: false,
    barcodeRequired: false,
    fields: [],
  });

  // Initialize form data with edit template
  useEffect(() => {
    if (editTemplate && mode === 'edit') {
      setFormData({
        name: editTemplate.name,
        type: editTemplate.type,
        dimensions: editTemplate.dimensions,
        customWidth: editTemplate.customWidth || 85.6,
        customHeight: editTemplate.customHeight || 53.98,
        orientation: editTemplate.orientation,
        backgroundColor: editTemplate.backgroundColor || '#ffffff',
        borderColor: editTemplate.borderColor || '#e5e7eb',
        borderWidth: editTemplate.borderWidth || 1,
        borderRadius: editTemplate.borderRadius || 8,
        logoRequired: editTemplate.logoRequired || false,
        photoRequired: editTemplate.photoRequired || false,
        qrCodeRequired: editTemplate.qrCodeRequired || false,
        barcodeRequired: editTemplate.barcodeRequired || false,
        fields:
          editTemplate.fields?.map(field => ({
            id: field.id,
            fieldType: field.fieldType,
            label: field.label,
            databaseField: field.databaseField,
            placeholder: field.placeholder,
            required: field.required,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            fontSize: field.fontSize,
            fontFamily: field.fontFamily,
            fontWeight: field.fontWeight,
            color: field.color,
            textAlign: field.textAlign,
          })) || [],
      });
    }
  }, [editTemplate, mode]);

  const addField = (fieldType: TemplateFieldType) => {
    const newField: Omit<TemplateField, 'id' | 'templateId'> = {
      fieldType,
      label: `${fieldType.toLowerCase()} Field`,
      required: false,
      x: 10,
      y: 10,
      width:
        fieldType === TemplateFieldType.TEXT
          ? 60
          : fieldType === TemplateFieldType.IMAGE
            ? 40
            : fieldType === TemplateFieldType.QR_CODE
              ? 20
              : fieldType === TemplateFieldType.LOGO
                ? 30
                : 40,
      height:
        fieldType === TemplateFieldType.TEXT
          ? 20
          : fieldType === TemplateFieldType.IMAGE
            ? 40
            : fieldType === TemplateFieldType.QR_CODE
              ? 20
              : fieldType === TemplateFieldType.LOGO
                ? 30
                : 20,
      fontSize: 14,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: TextAlignment.LEFT,
    };

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));
  };

  // Helper function to update a field
  const updateField = (index: number, updates: Partial<TemplateField>) => {
    setFormData(prev => ({
      ...prev,
      fields:
        prev.fields?.map((field, i) =>
          i === index ? { ...field, ...updates } : field,
        ) || [],
    }));
  };

  // Helper function to copy a field
  const copyField = (index: number) => {
    const fieldToCopy = formData.fields?.[index];
    if (fieldToCopy) {
      const copiedField = {
        ...fieldToCopy,
        label: `${fieldToCopy.label} Copy`,
        x: fieldToCopy.x + 10,
        y: fieldToCopy.y + 10,
      };
      setFormData(prev => ({
        ...prev,
        fields: [...(prev.fields || []), copiedField],
      }));
    }
  };

  // Helper function to remove a field
  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (mode === 'edit' && editTemplate) {
        await templateApiService.updateTemplate(editTemplate.id, formData);
      } else {
        await templateApiService.createTemplate(formData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div>
            <h2 className='text-xl font-semibold text-gray-800'>
              {mode === 'edit'
                ? 'Edit ID Card Template'
                : 'Create ID Card Template'}
            </h2>
            <p className='text-sm text-gray-600'>
              Design professional ID cards with custom layouts and styling
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className='border-b bg-gray-50'>
          <nav className='flex px-6'>
            {[
              { id: 'basic', label: 'Basic Info', icon: Type },
              { id: 'layout', label: 'Layout', icon: Grid },
              { id: 'design', label: 'Design', icon: Palette },
              { id: 'preview', label: 'Preview', icon: Eye },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as 'basic' | 'layout' | 'design' | 'preview',
                    )
                  }
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='flex-1 overflow-hidden'>
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className='p-6 h-full overflow-y-auto'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 h-full'>
                {/* Form Section */}
                <div className='space-y-6'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                      Template Information
                    </h3>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Template Name *
                        </label>
                        <input
                          type='text'
                          value={formData.name}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          placeholder='Enter template name'
                          required
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Template Type *
                        </label>
                        <select
                          value={formData.type}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              type: e.target.value as IDCardTemplateType,
                            }))
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          required
                        >
                          {TEMPLATE_TYPE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Card Dimensions *
                        </label>
                        <select
                          value={formData.dimensions}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              dimensions: e.target.value,
                            }))
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          required
                        >
                          {CARD_DIMENSIONS.map(dimension => (
                            <option
                              key={dimension.value}
                              value={dimension.value}
                            >
                              {dimension.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.dimensions === 'custom' && (
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                              Width (mm) *
                            </label>
                            <input
                              type='number'
                              value={formData.customWidth}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  customWidth:
                                    parseFloat(e.target.value) || 85.6,
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                              step='0.1'
                              min='10'
                              max='300'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                              Height (mm) *
                            </label>
                            <input
                              type='number'
                              value={formData.customHeight}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  customHeight:
                                    parseFloat(e.target.value) || 53.98,
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                              step='0.1'
                              min='10'
                              max='300'
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Orientation *
                        </label>
                        <div className='flex gap-4'>
                          <label className='flex items-center'>
                            <input
                              type='radio'
                              value={TemplateOrientation.HORIZONTAL}
                              checked={
                                formData.orientation ===
                                TemplateOrientation.HORIZONTAL
                              }
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  orientation: e.target
                                    .value as TemplateOrientation,
                                }))
                              }
                              className='mr-2'
                            />
                            Landscape
                          </label>
                          <label className='flex items-center'>
                            <input
                              type='radio'
                              value={TemplateOrientation.VERTICAL}
                              checked={
                                formData.orientation ===
                                TemplateOrientation.VERTICAL
                              }
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  orientation: e.target
                                    .value as TemplateOrientation,
                                }))
                              }
                              className='mr-2'
                            />
                            Portrait
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview Section */}
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex items-center justify-center'>
                  <div className='text-center'>
                    {(() => {
                      const currentDimension =
                        CARD_DIMENSIONS.find(
                          d => d.value === formData.dimensions,
                        ) || CARD_DIMENSIONS[0];
                      const width =
                        formData.dimensions === 'custom'
                          ? formData.customWidth || 85.6
                          : currentDimension.width || 85.6;
                      const height =
                        formData.dimensions === 'custom'
                          ? formData.customHeight || 53.98
                          : currentDimension.height || 53.98;

                      const isVertical =
                        formData.orientation === TemplateOrientation.VERTICAL;
                      const displayWidth = isVertical
                        ? Math.min(width, height)
                        : Math.max(width, height);
                      const displayHeight = isVertical
                        ? Math.max(width, height)
                        : Math.min(width, height);

                      const scale = Math.min(
                        300 / displayWidth,
                        200 / displayHeight,
                        4,
                      );
                      const scaledWidth = displayWidth * scale;
                      const scaledHeight = displayHeight * scale;

                      return (
                        <div className='space-y-4'>
                          <div className='text-sm text-gray-600'>
                            <div className='font-medium'>
                              {displayWidth.toFixed(1)} ×{' '}
                              {displayHeight.toFixed(1)} mm
                            </div>
                            <div className='text-xs'>
                              {formData.orientation ===
                              TemplateOrientation.VERTICAL
                                ? 'Portrait'
                                : 'Landscape'}
                            </div>
                          </div>

                          {/* Zoom Controls - Integrated with Live Preview */}
                          <div className='flex items-center justify-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm'>
                            <button
                              onClick={() =>
                                setZoomLevel(Math.max(25, zoomLevel - 25))
                              }
                              className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50'
                              disabled={zoomLevel <= 25}
                            >
                              <ZoomOut className='w-3.5 h-3.5' />
                            </button>
                            <span className='text-sm font-medium px-2 py-1 bg-gray-50 border border-gray-200 rounded min-w-[50px] text-center'>
                              {zoomLevel}%
                            </span>
                            <button
                              onClick={() =>
                                setZoomLevel(Math.min(400, zoomLevel + 25))
                              }
                              className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50'
                              disabled={zoomLevel >= 400}
                            >
                              <ZoomIn className='w-3.5 h-3.5' />
                            </button>
                            <button
                              onClick={() => setZoomLevel(100)}
                              className='px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors'
                            >
                              Reset
                            </button>
                          </div>

                          <div
                            className='bg-white border-2 border-gray-400 rounded-lg shadow-lg relative mx-auto flex flex-col items-center justify-center'
                            style={{
                              width: `${scaledWidth * (zoomLevel / 100)}px`,
                              height: `${scaledHeight * (zoomLevel / 100)}px`,
                              minWidth: '120px',
                              minHeight: '80px',
                            }}
                          >
                            {/* Header */}
                            <div className='absolute top-2 left-2 right-2 text-center'>
                              {formData.logoRequired && (
                                <div
                                  className='w-8 h-8 bg-blue-100 border border-blue-300 rounded mx-auto mb-1 flex items-center justify-center'
                                  style={{
                                    transform: `scale(${zoomLevel / 100})`,
                                    transformOrigin: 'center',
                                  }}
                                >
                                  <span className='text-xs text-blue-600'>
                                    LOGO
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Photo placeholder */}
                            {formData.photoRequired && (
                              <div
                                className='w-12 h-12 bg-gray-200 border border-gray-400 rounded-md flex items-center justify-center'
                                style={{
                                  transform: `scale(${zoomLevel / 100})`,
                                  transformOrigin: 'center',
                                }}
                              >
                                <span className='text-xs text-gray-600'>
                                  PHOTO
                                </span>
                              </div>
                            )}

                            {/* Template Type */}
                            <div
                              className='absolute bottom-8 left-2 right-2 text-center'
                              style={{
                                transform: `scale(${zoomLevel / 100})`,
                                transformOrigin: 'center',
                              }}
                            >
                              <div className='text-xs text-gray-600'>
                                {TEMPLATE_TYPE_OPTIONS.find(
                                  opt => opt.value === formData.type,
                                )?.label || 'Select Type'}
                              </div>
                            </div>

                            {/* QR Code and Barcode */}
                            <div className='absolute bottom-2 left-2 right-2 flex justify-between items-center'>
                              {formData.qrCodeRequired && (
                                <div
                                  className='w-6 h-6 bg-gray-800 text-white text-xs flex items-center justify-center'
                                  style={{
                                    transform: `scale(${zoomLevel / 100})`,
                                    transformOrigin: 'bottom left',
                                  }}
                                >
                                  QR
                                </div>
                              )}
                              {formData.barcodeRequired && (
                                <div
                                  className='w-12 h-3 bg-gray-800 text-white text-xs flex items-center justify-center'
                                  style={{
                                    transform: `scale(${zoomLevel / 100})`,
                                    transformOrigin: 'bottom right',
                                  }}
                                >
                                  ||||||||
                                </div>
                              )}
                            </div>
                          </div>

                          <div className='text-xs text-gray-500'>
                            Live preview updates as you make changes
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className='p-4 h-full'>
              <div className='flex gap-6 h-full'>
                {/* Left Panel - Entire Side Scrollable (40%) */}
                <div className='w-2/5 overflow-y-auto pr-2'>
                  <div className='space-y-4'>
                    {/* Add Elements Section */}
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <h4 className='font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                        <Plus className='w-4 h-4' />
                        Add Elements
                      </h4>
                      <div className='grid grid-cols-3 gap-2'>
                        <button
                          onClick={() => addField(TemplateFieldType.TEXT)}
                          className='flex flex-col items-center gap-1 p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors'
                        >
                          <Type className='w-4 h-4 text-blue-600' />
                          <span className='text-xs text-blue-800'>Text</span>
                        </button>
                        <button
                          onClick={() => addField(TemplateFieldType.IMAGE)}
                          className='flex flex-col items-center gap-1 p-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors'
                        >
                          <Image className='w-4 h-4 text-green-600' />
                          <span className='text-xs text-green-800'>Image</span>
                        </button>
                        <button
                          onClick={() => addField(TemplateFieldType.QR_CODE)}
                          className='flex flex-col items-center gap-1 p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors'
                        >
                          <QrCode className='w-4 h-4 text-purple-600' />
                          <span className='text-xs text-purple-800'>QR</span>
                        </button>
                        <button
                          onClick={() => addField(TemplateFieldType.LOGO)}
                          className='flex flex-col items-center gap-1 p-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors'
                        >
                          <Building2 className='w-4 h-4 text-orange-600' />
                          <span className='text-xs text-orange-800'>Logo</span>
                        </button>
                        <button
                          onClick={() =>
                            addField('barcode' as TemplateFieldType)
                          }
                          className='flex flex-col items-center gap-1 p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors'
                        >
                          <div className='w-4 h-4 text-red-600 text-xs font-mono flex items-center justify-center'>
                            |||
                          </div>
                          <span className='text-xs text-red-800'>Barcode</span>
                        </button>
                        <button
                          onClick={() => addField(TemplateFieldType.IMAGE)}
                          className='flex flex-col items-center gap-1 p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors'
                        >
                          <Camera className='w-4 h-4 text-indigo-600' />
                          <span className='text-xs text-indigo-800'>Photo</span>
                        </button>
                      </div>
                    </div>

                    {/* Grid and Ruler Controls Only */}
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <h4 className='font-semibold text-gray-800 mb-3'>
                        Visual Guides
                      </h4>
                      <div className='space-y-3'>
                        {/* Grid and Ruler */}
                        <div className='flex gap-4'>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={showGrid}
                              onChange={e => setShowGrid(e.target.checked)}
                              className='rounded border-gray-300'
                            />
                            <Grid3X3 className='w-4 h-4 text-gray-600' />
                            <span className='text-sm'>Grid</span>
                          </label>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={showRuler}
                              onChange={e => setShowRuler(e.target.checked)}
                              className='rounded border-gray-300'
                            />
                            <Ruler className='w-4 h-4 text-gray-600' />
                            <span className='text-sm'>Ruler</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Custom Elements */}
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <h4 className='font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                        <Layers className='w-4 h-4' />
                        Custom Elements ({(formData.fields || []).length})
                      </h4>
                      <div className='space-y-3'>
                        {(formData.fields || []).length === 0 ? (
                          <p className='text-sm text-gray-500 italic'>
                            No custom elements added yet
                          </p>
                        ) : (
                          (formData.fields || []).map((field, index) => (
                            <div
                              key={index}
                              className='bg-white p-3 rounded-lg border hover:border-blue-300 transition-colors'
                            >
                              <div className='flex items-center justify-between mb-2'>
                                <div className='flex items-center gap-2'>
                                  {field.fieldType ===
                                    TemplateFieldType.TEXT && (
                                    <Type className='w-4 h-4 text-blue-600' />
                                  )}
                                  {field.fieldType ===
                                    TemplateFieldType.IMAGE && (
                                    <Image className='w-4 h-4 text-green-600' />
                                  )}
                                  {field.fieldType ===
                                    TemplateFieldType.QR_CODE && (
                                    <QrCode className='w-4 h-4 text-purple-600' />
                                  )}
                                  {field.fieldType ===
                                    TemplateFieldType.LOGO && (
                                    <Building2 className='w-4 h-4 text-orange-600' />
                                  )}
                                  <span className='font-medium text-sm'>
                                    {field.label}
                                  </span>
                                </div>
                                <div className='flex items-center gap-1'>
                                  <button
                                    onClick={() => copyField(index)}
                                    className='p-1 text-gray-400 hover:text-blue-600 transition-colors'
                                    title='Copy'
                                  >
                                    <Copy className='w-3 h-3' />
                                  </button>
                                  <button
                                    onClick={() => removeField(index)}
                                    className='p-1 text-gray-400 hover:text-red-600 transition-colors'
                                    title='Delete'
                                  >
                                    <Trash2 className='w-3 h-3' />
                                  </button>
                                </div>
                              </div>

                              {/* Element Properties */}
                              <div className='space-y-2 text-xs'>
                                {/* Data Source */}
                                <div>
                                  <label className='block text-gray-600 mb-1 font-medium'>
                                    Data Source
                                  </label>
                                  <select
                                    value={field.databaseField || ''}
                                    onChange={e =>
                                      updateField(index, {
                                        databaseField: e.target.value,
                                      })
                                    }
                                    className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                  >
                                    <option value=''>
                                      Select data source...
                                    </option>
                                    {getAvailableDataSources().map(source => (
                                      <option
                                        key={source.value}
                                        value={source.value}
                                      >
                                        {source.label}
                                      </option>
                                    ))}
                                  </select>
                                  {field.databaseField && (
                                    <div className='text-xs text-green-600 mt-1'>
                                      Placeholder: {field.databaseField}
                                    </div>
                                  )}
                                </div>

                                {/* Label */}
                                <div>
                                  <label className='block text-gray-600 mb-1'>
                                    Label
                                  </label>
                                  <input
                                    type='text'
                                    value={field.label}
                                    onChange={e =>
                                      updateField(index, {
                                        label: e.target.value,
                                      })
                                    }
                                    className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                  />
                                </div>

                                {/* Position & Size */}
                                <div className='grid grid-cols-2 gap-2'>
                                  <div>
                                    <label className='block text-gray-600 mb-1'>
                                      X (mm)
                                    </label>
                                    <input
                                      type='number'
                                      value={field.x}
                                      onChange={e =>
                                        updateField(index, {
                                          x: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                      step='0.1'
                                    />
                                  </div>
                                  <div>
                                    <label className='block text-gray-600 mb-1'>
                                      Y (mm)
                                    </label>
                                    <input
                                      type='number'
                                      value={field.y}
                                      onChange={e =>
                                        updateField(index, {
                                          y: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                      step='0.1'
                                    />
                                  </div>
                                  <div>
                                    <label className='block text-gray-600 mb-1'>
                                      Width (mm)
                                    </label>
                                    <input
                                      type='number'
                                      value={field.width}
                                      onChange={e =>
                                        updateField(index, {
                                          width:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                      step='0.1'
                                    />
                                  </div>
                                  <div>
                                    <label className='block text-gray-600 mb-1'>
                                      Height (mm)
                                    </label>
                                    <input
                                      type='number'
                                      value={field.height}
                                      onChange={e =>
                                        updateField(index, {
                                          height:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                      step='0.1'
                                    />
                                  </div>
                                </div>

                                {/* Text-specific properties */}
                                {field.fieldType === TemplateFieldType.TEXT && (
                                  <>
                                    <div>
                                      <label className='block text-gray-600 mb-1'>
                                        Font Size
                                      </label>
                                      <input
                                        type='number'
                                        value={field.fontSize || 14}
                                        onChange={e =>
                                          updateField(index, {
                                            fontSize:
                                              parseInt(e.target.value) || 14,
                                          })
                                        }
                                        className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                        min='6'
                                        max='72'
                                      />
                                    </div>
                                    <div>
                                      <label className='block text-gray-600 mb-1'>
                                        Color
                                      </label>
                                      <input
                                        type='color'
                                        value={field.color || '#000000'}
                                        onChange={e =>
                                          updateField(index, {
                                            color: e.target.value,
                                          })
                                        }
                                        className='w-full h-8 border border-gray-300 rounded'
                                      />
                                    </div>
                                    <div>
                                      <label className='block text-gray-600 mb-1'>
                                        Alignment
                                      </label>
                                      <select
                                        value={
                                          field.textAlign || TextAlignment.LEFT
                                        }
                                        onChange={e =>
                                          updateField(index, {
                                            textAlign: e.target
                                              .value as TextAlignment,
                                          })
                                        }
                                        className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                      >
                                        <option value={TextAlignment.LEFT}>
                                          Left
                                        </option>
                                        <option value={TextAlignment.CENTER}>
                                          Center
                                        </option>
                                        <option value={TextAlignment.RIGHT}>
                                          Right
                                        </option>
                                      </select>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Visual Editor with EXACT Basic Info Preview (60%) */}
                <div className='flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex items-center justify-center'>
                  <div className='text-center'>
                    {(() => {
                      // EXACT same logic as Basic Info tab
                      const currentDimension =
                        CARD_DIMENSIONS.find(
                          d => d.value === formData.dimensions,
                        ) || CARD_DIMENSIONS[0];
                      const width =
                        formData.dimensions === 'custom'
                          ? formData.customWidth || 85.6
                          : currentDimension.width || 85.6;
                      const height =
                        formData.dimensions === 'custom'
                          ? formData.customHeight || 53.98
                          : currentDimension.height || 53.98;

                      const isVertical =
                        formData.orientation === TemplateOrientation.VERTICAL;
                      const displayWidth = isVertical
                        ? Math.min(width, height)
                        : Math.max(width, height);
                      const displayHeight = isVertical
                        ? Math.max(width, height)
                        : Math.min(width, height);

                      const scale = Math.min(
                        300 / displayWidth,
                        200 / displayHeight,
                        4,
                      );
                      const scaledWidth = displayWidth * scale;
                      const scaledHeight = displayHeight * scale;

                      return (
                        <>
                          {/* Rulers */}
                          {showRuler && (
                            <div className='relative mb-4'>
                              {/* Top ruler */}
                              <div
                                className='absolute top-0 left-0 h-4 bg-gray-200 border border-gray-400 text-xs flex items-center justify-center'
                                style={{
                                  width: `${scaledWidth * (zoomLevel / 100)}px`,
                                  transform: 'translateY(-20px)',
                                }}
                              >
                                {Array.from(
                                  { length: Math.ceil(displayWidth / 10) },
                                  (_, i) => (
                                    <div
                                      key={i}
                                      className='absolute text-xs text-gray-600'
                                      style={{
                                        left: `${i * 10 * scale * (zoomLevel / 100)}px`,
                                      }}
                                    >
                                      {i * 10}
                                    </div>
                                  ),
                                )}
                              </div>

                              {/* Left ruler */}
                              <div
                                className='absolute left-0 top-0 w-4 bg-gray-200 border border-gray-400 text-xs'
                                style={{
                                  height: `${scaledHeight * (zoomLevel / 100)}px`,
                                  transform: 'translateX(-20px)',
                                }}
                              >
                                {Array.from(
                                  { length: Math.ceil(displayHeight / 10) },
                                  (_, i) => (
                                    <div
                                      key={i}
                                      className='absolute text-xs text-gray-600'
                                      style={{
                                        top: `${i * 10 * scale * (zoomLevel / 100)}px`,
                                        transform:
                                          'rotate(-90deg) translateX(-10px)',
                                      }}
                                    >
                                      {i * 10}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          <div className='text-sm text-gray-600 mb-4'>
                            <div className='font-medium'>
                              {displayWidth.toFixed(1)} ×{' '}
                              {displayHeight.toFixed(1)} mm
                            </div>
                            <div className='text-xs'>
                              {formData.orientation ===
                              TemplateOrientation.VERTICAL
                                ? 'Portrait'
                                : 'Landscape'}
                            </div>
                          </div>

                          {/* Zoom Controls - Integrated with Live Preview */}
                          <div className='flex items-center justify-center gap-2 mb-4 p-2 bg-white rounded-lg border border-gray-200 shadow-sm'>
                            <button
                              onClick={() =>
                                setZoomLevel(Math.max(25, zoomLevel - 25))
                              }
                              className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50'
                              disabled={zoomLevel <= 25}
                            >
                              <ZoomOut className='w-3.5 h-3.5' />
                            </button>
                            <span className='text-sm font-medium px-2 py-1 bg-gray-50 border border-gray-200 rounded min-w-[50px] text-center'>
                              {zoomLevel}%
                            </span>
                            <button
                              onClick={() =>
                                setZoomLevel(Math.min(400, zoomLevel + 25))
                              }
                              className='p-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50'
                              disabled={zoomLevel >= 400}
                            >
                              <ZoomIn className='w-3.5 h-3.5' />
                            </button>
                            <button
                              onClick={() => setZoomLevel(100)}
                              className='px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors'
                            >
                              Reset
                            </button>
                          </div>

                          {/* EXACT Basic Info Card Preview with Improved Grid */}
                          <div
                            className='bg-white border-2 border-gray-400 rounded-lg shadow-lg relative mx-auto flex flex-col items-center justify-center'
                            style={{
                              width: `${scaledWidth * (zoomLevel / 100)}px`,
                              height: `${scaledHeight * (zoomLevel / 100)}px`,
                              minWidth: '120px',
                              minHeight: '80px',
                              backgroundImage: showGrid
                                ? `
                                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                              `
                                : 'none',
                              backgroundSize: showGrid
                                ? `${10 * scale * (zoomLevel / 100)}px ${10 * scale * (zoomLevel / 100)}px`
                                : 'auto',
                              backgroundPosition: showGrid ? '0 0' : 'initial',
                            }}
                          >
                            {/* Basic Info Elements - Static placeholders */}
                            {formData.logoRequired && (
                              <div className='absolute top-2 left-2 right-2 text-center'>
                                <div className='w-8 h-8 bg-blue-100 border border-gray-300 rounded mx-auto mb-1 flex items-center justify-center'>
                                  <span className='text-xs text-gray-600'>
                                    LOGO
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Photo placeholder */}
                            {formData.photoRequired && (
                              <div
                                className='absolute'
                                style={{
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                }}
                              >
                                <div className='w-12 h-12 bg-gray-200 border border-gray-300 rounded-md flex items-center justify-center'>
                                  <span className='text-xs text-gray-600'>
                                    PHOTO
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Template Type */}
                            <div className='absolute bottom-8 left-2 right-2 text-center'>
                              <div className='text-xs font-semibold text-gray-700'>
                                {formData.type?.toUpperCase()} ID CARD
                              </div>
                            </div>

                            {/* QR Code placeholder */}
                            {formData.qrCodeRequired && (
                              <div className='absolute bottom-2 right-2'>
                                <div className='w-8 h-8 bg-purple-100 border border-purple-300 rounded flex items-center justify-center'>
                                  <span className='text-xs text-purple-600'>
                                    QR
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Barcode placeholder */}
                            {formData.barcodeRequired && (
                              <div className='absolute bottom-2 left-2'>
                                <div className='w-12 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center'>
                                  <span className='text-xs text-red-600'>
                                    |||
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Custom Elements Overlay - Fixed positioning with zoom */}
                            {(formData.fields || []).map((field, index) => (
                              <div
                                key={index}
                                className='absolute border-2 border-blue-500 bg-blue-50 bg-opacity-75 rounded flex items-center justify-center cursor-pointer hover:bg-opacity-100 transition-all'
                                style={{
                                  left: `${(field.x / displayWidth) * scaledWidth * (zoomLevel / 100)}px`,
                                  top: `${(field.y / displayHeight) * scaledHeight * (zoomLevel / 100)}px`,
                                  width: `${(field.width / displayWidth) * scaledWidth * (zoomLevel / 100)}px`,
                                  height: `${(field.height / displayHeight) * scaledHeight * (zoomLevel / 100)}px`,
                                }}
                              >
                                <span className='text-xs text-blue-700 font-medium text-center'>
                                  {field.label}
                                  {field.databaseField && (
                                    <div className='text-xs text-blue-500 mt-0.5'>
                                      [{field.databaseField}]
                                    </div>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className='text-xs text-gray-500 text-center mt-2'>
                            🔵 Custom Elements | Use zoom controls to adjust
                            size
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Design Tab */}
          {activeTab === 'design' && (
            <div className='p-6 h-full overflow-y-auto'>
              <div className='max-w-2xl space-y-6'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                    Card Styling
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Background Color
                      </label>
                      <div className='flex items-center gap-3'>
                        <input
                          type='color'
                          value={formData.backgroundColor}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              backgroundColor: e.target.value,
                            }))
                          }
                          className='w-12 h-10 border border-gray-300 rounded'
                        />
                        <input
                          type='text'
                          value={formData.backgroundColor}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              backgroundColor: e.target.value,
                            }))
                          }
                          className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Border Color
                      </label>
                      <div className='flex items-center gap-3'>
                        <input
                          type='color'
                          value={formData.borderColor}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              borderColor: e.target.value,
                            }))
                          }
                          className='w-12 h-10 border border-gray-300 rounded'
                        />
                        <input
                          type='text'
                          value={formData.borderColor}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              borderColor: e.target.value,
                            }))
                          }
                          className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Border Width (px)
                      </label>
                      <input
                        type='number'
                        value={formData.borderWidth}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            borderWidth: parseInt(e.target.value) || 1,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        min='0'
                        max='10'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Border Radius (px)
                      </label>
                      <input
                        type='number'
                        value={formData.borderRadius}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            borderRadius: parseInt(e.target.value) || 8,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        min='0'
                        max='50'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className='p-6 h-full overflow-y-auto'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-gray-800 mb-6'>
                  Template Preview
                </h3>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 inline-block'>
                  <p className='text-gray-500'>Full preview coming soon...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-6 border-t bg-gray-50'>
          <div className='text-sm text-gray-600'>
            {activeTab === 'basic' && 'Configure basic template information'}
            {activeTab === 'layout' && 'Add and position template elements'}
            {activeTab === 'design' && 'Customize card styling and appearance'}
            {activeTab === 'preview' && 'Review your template before saving'}
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            {activeTab === 'preview' ? (
              <button
                onClick={handleSubmit}
                disabled={isLoading || !formData.name.trim()}
                className='flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading && (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                )}
                <Save className='w-4 h-4' />
                {mode === 'edit' ? 'Update Template' : 'Save Template'}
              </button>
            ) : (
              <button
                onClick={() => {
                  const tabs = [
                    'basic',
                    'layout',
                    'design',
                    'preview',
                  ] as const;
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={!formData.name.trim()}
                className='flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Next
                <Eye className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
