/**
 * =============================================================================
 * Template Preview Modal Component
 * =============================================================================
 * Modal for previewing ID card templates
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  X,
  Eye,
  Edit,
  Copy,
  CreditCard,
  Download,
  Share2,
  Settings,
  QrCode,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Printer,
  Info,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Template {
  id: string;
  name: string;
  type: string;
  status: string;
  dimensions: string;
  usageCount: number;
  lastModified: string;
  description?: string;
  features?: string[];
}

interface TemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onEdit?: () => void;
  onCopy?: () => void;
}

export default function TemplatePreviewModal({
  open,
  onOpenChange,
  template,
  onEdit,
  onCopy,
}: TemplatePreviewModalProps) {
  const [previewMode, setPreviewMode] = useState<
    'desktop' | 'mobile' | 'print'
  >('desktop');
  const [selectedSample, setSelectedSample] = useState('student');
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!open || !template) return null;

  const sampleData = {
    student: {
      name: 'Emily Johnson',
      id: 'STU2024001',
      class: 'Grade 10',
      section: 'A',
      rollNumber: '015',
      bloodGroup: 'O+',
      emergencyContact: '+1 234-567-8900',
      academicYear: '2024-2025',
      photo: '/sample-student.jpg',
    },
    teacher: {
      name: 'Dr. Sarah Johnson',
      id: 'EMP2024001',
      department: 'Mathematics',
      position: 'Head of Department',
      qualification: 'PhD Mathematics',
      contact: '+1 234-567-8901',
      emergencyContact: '+1 234-567-8902',
      photo: '/sample-teacher.jpg',
    },
    staff: {
      name: 'Michael Smith',
      id: 'STF2024001',
      department: 'Administration',
      position: 'Office Manager',
      shift: 'Morning',
      contact: '+1 234-567-8903',
      emergencyContact: '+1 234-567-8904',
      photo: '/sample-staff.jpg',
    },
  };

  const currentSample = sampleData[selectedSample as keyof typeof sampleData];

  const renderTemplatePreview = () => {
    const scale = zoomLevel / 100;
    const baseWidth = 400;
    const baseHeight = 250;

    return (
      <div className='flex items-center justify-center p-8'>
        <div
          className='relative bg-white border-2 border-gray-200 shadow-2xl rounded-lg overflow-hidden transition-transform'
          style={{
            width: `${baseWidth * scale}px`,
            height: `${baseHeight * scale}px`,
            backgroundColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: `${1 * scale}px`,
            borderRadius: `${8 * scale}px`,
            transform: `scale(${previewMode === 'mobile' ? 0.8 : 1})`,
          }}
        >
          {/* Sample Content Based on Template Type */}
          <div
            className='absolute inset-0'
            style={{ padding: `${4 * scale}px` }}
          >
            {/* School Logo */}
            <div
              className='absolute bg-blue-100 border border-blue-300 rounded flex items-center justify-center'
              style={{
                top: `${2 * scale}px`,
                left: `${2 * scale}px`,
                width: `${12 * scale}px`,
                height: `${10 * scale}px`,
              }}
            >
              <span
                style={{ fontSize: `${8 * scale}px` }}
                className='font-bold text-blue-600'
              >
                LOGO
              </span>
            </div>

            {/* School Name */}
            <div
              className='absolute'
              style={{
                top: `${2 * scale}px`,
                left: `${16 * scale}px`,
                right: `${20 * scale}px`,
              }}
            >
              <div
                style={{ fontSize: `${10 * scale}px` }}
                className='font-bold text-gray-800'
              >
                Springfield High School
              </div>
              <div
                style={{ fontSize: `${7 * scale}px` }}
                className='text-gray-600'
              >
                Excellence in Education
              </div>
            </div>

            {/* Photo */}
            <div
              className='absolute bg-gray-100 border border-gray-300 rounded flex items-center justify-center'
              style={{
                top: `${2 * scale}px`,
                right: `${2 * scale}px`,
                width: `${16 * scale}px`,
                height: `${20 * scale}px`,
              }}
            >
              <ImageIcon
                style={{ width: `${8 * scale}px`, height: `${8 * scale}px` }}
                className='text-gray-400'
              />
            </div>

            {/* Main Content */}
            <div
              className='absolute'
              style={{
                top: `${16 * scale}px`,
                left: `${2 * scale}px`,
                right: `${2 * scale}px`,
              }}
            >
              <div className='space-y-1'>
                <div
                  style={{ fontSize: `${14 * scale}px` }}
                  className='font-bold text-gray-900'
                >
                  {currentSample.name}
                </div>
                <div
                  style={{ fontSize: `${10 * scale}px` }}
                  className='text-gray-700'
                >
                  ID: {currentSample.id}
                </div>

                {template.type === 'student' && (
                  <div className='space-y-1'>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Class: {(currentSample as any).class} - Section{' '}
                      {(currentSample as any).section}
                    </div>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Roll Number: {(currentSample as any).rollNumber}
                    </div>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Blood Group: {(currentSample as any).bloodGroup}
                    </div>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Academic Year: {(currentSample as any).academicYear}
                    </div>
                  </div>
                )}

                {template.type === 'teacher' && (
                  <div className='space-y-1'>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Department: {(currentSample as any).department}
                    </div>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Position: {(currentSample as any).position}
                    </div>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Qualification: {(currentSample as any).qualification}
                    </div>
                  </div>
                )}

                {template.type === 'staff' && (
                  <div className='space-y-1'>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Department: {(currentSample as any).department}
                    </div>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Position: {(currentSample as any).position}
                    </div>
                    <div
                      style={{ fontSize: `${9 * scale}px` }}
                      className='text-gray-600'
                    >
                      Shift: {(currentSample as any).shift}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Elements */}
            <div
              className='absolute flex items-end justify-between'
              style={{
                bottom: `${2 * scale}px`,
                left: `${2 * scale}px`,
                right: `${2 * scale}px`,
              }}
            >
              {/* QR Code */}
              <div
                className='border border-gray-300 rounded flex items-center justify-center bg-white'
                style={{
                  width: `${10 * scale}px`,
                  height: `${10 * scale}px`,
                }}
              >
                <QrCode
                  style={{ width: `${6 * scale}px`, height: `${6 * scale}px` }}
                  className='text-gray-600'
                />
              </div>

              {/* Emergency Contact */}
              <div className='text-right'>
                <div
                  style={{ fontSize: `${7 * scale}px` }}
                  className='text-gray-500'
                >
                  Emergency:
                </div>
                <div
                  style={{ fontSize: `${7 * scale}px` }}
                  className='font-medium'
                >
                  {currentSample.emergencyContact}
                </div>
              </div>
            </div>

            {/* Validity */}
            <div
              className='absolute'
              style={{
                bottom: `${2 * scale}px`,
                right: `${2 * scale}px`,
              }}
            >
              <div
                style={{ fontSize: `${7 * scale}px` }}
                className='text-green-600 font-medium'
              >
                Valid till: Jul 2025
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl'>
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 border-b border-gray-100'>
          <div className='relative flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg'>
                <Eye className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white'>
                  Template Preview: {template.name}
                </h2>
                <div className='flex items-center gap-2 mt-1'>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      template.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.status}
                  </span>
                </div>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={onEdit}
                className='text-blue-100 hover:bg-white/20'
              >
                <Edit className='w-4 h-4 mr-2' />
                Edit
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={onCopy}
                className='text-blue-100 hover:bg-white/20'
              >
                <Copy className='w-4 h-4 mr-2' />
                Copy
              </Button>
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
        </div>

        {/* Content */}
        <div className='flex-1 overflow-hidden flex'>
          {/* Left Sidebar - Template Info & Controls */}
          <div className='w-80 border-r bg-gray-50 flex flex-col'>
            <div className='p-4 space-y-4 overflow-auto'>
              {/* Template Information */}
              <div>
                <h3 className='font-medium mb-3'>Template Information</h3>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Type:</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${
                        template.type === 'student'
                          ? 'bg-blue-100 text-blue-800'
                          : template.type === 'teacher'
                            ? 'bg-green-100 text-green-800'
                            : template.type === 'staff'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {template.type}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Dimensions:</span>
                    <span className='font-medium'>{template.dimensions}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Usage:</span>
                    <span className='font-medium'>
                      {template.usageCount} cards
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Modified:</span>
                    <span className='font-medium'>{template.lastModified}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {template.features && (
                <div>
                  <h3 className='font-medium mb-3'>Features</h3>
                  <div className='flex flex-wrap gap-1'>
                    {template.features.map((feature, index) => (
                      <span
                        key={index}
                        className='px-2 py-1 text-xs bg-gray-100 rounded'
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Controls */}
              <div className='space-y-4 pt-4 border-t'>
                <div>
                  <h3 className='font-medium mb-3'>Preview Controls</h3>

                  {/* View Mode */}
                  <div className='space-y-2 mb-4'>
                    <label className='text-sm font-medium'>View Mode</label>
                    <select
                      value={previewMode}
                      onChange={e =>
                        setPreviewMode(
                          e.target.value as 'desktop' | 'mobile' | 'print',
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value='desktop'>Desktop View</option>
                      <option value='mobile'>Mobile View</option>
                      <option value='print'>Print Preview</option>
                    </select>
                  </div>

                  {/* Sample Data */}
                  <div className='space-y-2 mb-4'>
                    <label className='text-sm font-medium'>Sample Data</label>
                    <select
                      value={selectedSample}
                      onChange={e => setSelectedSample(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value='student'>Student Sample</option>
                      <option value='teacher'>Teacher Sample</option>
                      <option value='staff'>Staff Sample</option>
                    </select>
                  </div>

                  {/* Zoom Controls */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Zoom Level</label>
                    <div className='flex items-center space-x-2'>
                      <select
                        value={zoomLevel}
                        onChange={e => setZoomLevel(Number(e.target.value))}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      >
                        <option value={50}>50%</option>
                        <option value={75}>75%</option>
                        <option value={100}>100%</option>
                        <option value={125}>125%</option>
                        <option value={150}>150%</option>
                        <option value={200}>200%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className='space-y-2 pt-4 border-t'>
                <h3 className='font-medium mb-3'>Actions</h3>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Export Template
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                >
                  <Share2 className='w-4 h-4 mr-2' />
                  Share Template
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                >
                  <Settings className='w-4 h-4 mr-2' />
                  Template Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Main Preview Area */}
          <div className='flex-1 flex flex-col min-w-0'>
            {/* Preview Toolbar */}
            <div className='bg-white border-b px-4 py-2 flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center space-x-4'>
                <span className='text-sm font-medium'>
                  Preview: {template.name}
                </span>
                <span className='px-2 py-1 text-xs bg-gray-100 rounded capitalize'>
                  {previewMode} Mode
                </span>
                <span className='px-2 py-1 text-xs bg-gray-100 rounded'>
                  {zoomLevel}% Zoom
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <Button variant='outline' size='sm'>
                  <Download className='w-4 h-4 mr-2' />
                  Download
                </Button>
                <Button variant='outline' size='sm'>
                  <Printer className='w-4 h-4 mr-2' />
                  Print
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className='flex-1 bg-gray-100 overflow-auto'>
              <Tabs defaultValue='front' className='h-full'>
                <div className='bg-white border-b px-4'>
                  <TabsList>
                    <TabsTrigger value='front'>Front Side</TabsTrigger>
                    <TabsTrigger value='back'>Back Side</TabsTrigger>
                    <TabsTrigger value='both'>Both Sides</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value='front' className='h-full m-0'>
                  <div className='h-full'>{renderTemplatePreview()}</div>
                </TabsContent>

                <TabsContent value='back' className='h-full m-0'>
                  <div className='h-full flex items-center justify-center'>
                    <div className='text-center text-gray-500'>
                      <CreditCard className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                      <h3 className='text-lg font-medium mb-2'>Back Side</h3>
                      <p>Back side design not configured</p>
                      <Button
                        variant='outline'
                        className='mt-4'
                        onClick={onEdit}
                      >
                        <Edit className='w-4 h-4 mr-2' />
                        Configure Back Side
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='both' className='h-full m-0'>
                  <div className='h-full grid grid-cols-1 xl:grid-cols-2 gap-8 p-8'>
                    <div className='space-y-4'>
                      <h4 className='font-medium text-center'>Front Side</h4>
                      {renderTemplatePreview()}
                    </div>
                    <div className='space-y-4'>
                      <h4 className='font-medium text-center'>Back Side</h4>
                      <div className='flex items-center justify-center h-64'>
                        <div className='text-center text-gray-400'>
                          <CreditCard className='w-12 h-12 mx-auto mb-2' />
                          <p className='text-sm'>Not configured</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-between items-center p-4 border-t bg-white'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <Info className='w-4 h-4' />
              <span>Template ID: {template.id}</span>
            </div>
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <CheckCircle className='w-4 h-4 text-green-600' />
              <span>Ready for use</span>
            </div>
          </div>
          <div className='flex space-x-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={onEdit} className='bg-primary hover:bg-primary/90'>
              <Edit className='w-4 h-4 mr-2' />
              Edit Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
