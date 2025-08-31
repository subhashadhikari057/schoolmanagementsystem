'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Calendar,
  Users,
  GraduationCap,
  User,
  UserCog,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
} from 'lucide-react';
import { IDCardTemplate, IDCardTemplateType } from '@/types/template.types';
import { templateApiService } from '@/services/template.service';
import {
  personSearchService,
  ClassInfo,
  BulkGenerationStats,
} from '@/services/person-search.service';
import { BulkGenerationResult } from '@/types/generation-results.types';

interface BulkGenerationProps {
  onBack: () => void;
  onComplete: (results: BulkGenerationResult) => void;
}

export default function BulkGeneration({
  onBack,
  onComplete,
}: BulkGenerationProps) {
  const [selectedBulkType, setSelectedBulkType] = useState<
    'class' | 'all-teachers' | 'all-staff' | null
  >(null);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<IDCardTemplate | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Data states
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [stats, setStats] = useState<BulkGenerationStats | null>(null);

  // Loading states
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load templates when bulk type changes
  useEffect(() => {
    if (selectedBulkType) {
      loadTemplatesForType(selectedBulkType);
      setDefaultExpiryDate(selectedBulkType);
    }
  }, [selectedBulkType]);

  const loadInitialData = async () => {
    try {
      const [classesData, statsData] = await Promise.all([
        personSearchService.getAvailableClasses(),
        personSearchService.getBulkGenerationStats(),
      ]);

      setClasses(classesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load data. Please try again.');
    }
  };

  const loadTemplatesForType = async (bulkType: string) => {
    setIsLoadingTemplates(true);
    try {
      const templateType = getTemplateTypeFromBulkType(bulkType);
      const response = await templateApiService.getTemplates({
        type: templateType,
        limit: 50,
      });

      const activeTemplates = response.templates.filter(
        template => template.isPublished,
      );

      setTemplates(activeTemplates);

      // Auto-select first template
      if (activeTemplates.length > 0) {
        setSelectedTemplate(activeTemplates[0]);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const getTemplateTypeFromBulkType = (
    bulkType: string,
  ): IDCardTemplateType => {
    switch (bulkType) {
      case 'class':
        return IDCardTemplateType.STUDENT;
      case 'all-teachers':
        return IDCardTemplateType.TEACHER;
      case 'all-staff':
        return IDCardTemplateType.STAFF;
      default:
        return IDCardTemplateType.STUDENT;
    }
  };

  const setDefaultExpiryDate = (bulkType: string) => {
    const now = new Date();
    const yearsToAdd = bulkType === 'class' ? 1 : 2;
    now.setFullYear(now.getFullYear() + yearsToAdd);
    setExpiryDate(now.toISOString().split('T')[0]);
  };

  const handleBulkTypeSelect = (
    type: 'class' | 'all-teachers' | 'all-staff',
  ) => {
    setSelectedBulkType(type);
    setSelectedClass(null);
    setSelectedTemplate(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedBulkType || !selectedTemplate || !expiryDate) {
      setError('Please complete all required fields');
      return;
    }

    if (selectedBulkType === 'class' && !selectedClass) {
      setError('Please select a class');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request = {
        type: selectedBulkType,
        classId: selectedClass?.id,
        templateId: selectedTemplate.id,
        expiryDate,
        notes: notes.trim() || undefined,
      };

      const result = await personSearchService.generateBulkIDCards(request);
      onComplete(result);
    } catch (err) {
      console.error('Error generating bulk ID cards:', err);
      setError('Failed to generate ID cards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getBulkTypeInfo = (type: string) => {
    switch (type) {
      case 'class':
        return {
          icon: GraduationCap,
          color: 'bg-blue-100 text-blue-800',
          count: selectedClass?.currentEnrollment || 0,
          label: 'Students',
        };
      case 'all-teachers':
        return {
          icon: User,
          color: 'bg-green-100 text-green-800',
          count: stats?.teachers || 0,
          label: 'Teachers',
        };
      case 'all-staff':
        return {
          icon: UserCog,
          color: 'bg-purple-100 text-purple-800',
          count: stats?.staff || 0,
          label: 'Staff Members',
        };
      default:
        return {
          icon: Users,
          color: 'bg-gray-100 text-gray-800',
          count: 0,
          label: 'People',
        };
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Bulk ID Card Generation
          </h3>
          <p className='text-sm text-gray-600'>
            Generate ID cards for multiple people at once
          </p>
        </div>
        <Button variant='outline' onClick={onBack}>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Selection
        </Button>
      </div>

      {error && (
        <Card className='p-4 bg-red-50 border-red-200'>
          <div className='flex items-center space-x-2'>
            <AlertCircle className='w-5 h-5 text-red-600' />
            <p className='text-red-800'>{error}</p>
          </div>
        </Card>
      )}

      {/* Bulk Type Selection */}
      {!selectedBulkType ? (
        <div className='space-y-4'>
          <h4 className='text-md font-medium text-gray-900'>
            Select Generation Type
          </h4>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Class-wise Students */}
            <Card
              className='p-6 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-blue-300'
              onClick={() => handleBulkTypeSelect('class')}
            >
              <div className='text-center space-y-4'>
                <div className='w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto'>
                  <GraduationCap className='w-8 h-8 text-blue-600' />
                </div>
                <div>
                  <h5 className='text-lg font-semibold text-gray-900'>
                    Class Students
                  </h5>
                  <p className='text-sm text-gray-600 mt-2'>
                    Generate ID cards for all students in a specific class
                  </p>
                </div>
                <div className='space-y-2 text-sm text-gray-500'>
                  <div>• Select any class</div>
                  <div>• All active students included</div>
                  <div>• {stats?.classes || 0} classes available</div>
                </div>
                <Badge className='bg-blue-100 text-blue-800'>
                  {stats?.students || 0} Total Students
                </Badge>
              </div>
            </Card>

            {/* All Teachers */}
            <Card
              className='p-6 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-green-300'
              onClick={() => handleBulkTypeSelect('all-teachers')}
            >
              <div className='text-center space-y-4'>
                <div className='w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto'>
                  <User className='w-8 h-8 text-green-600' />
                </div>
                <div>
                  <h5 className='text-lg font-semibold text-gray-900'>
                    All Teachers
                  </h5>
                  <p className='text-sm text-gray-600 mt-2'>
                    Generate ID cards for all active teachers
                  </p>
                </div>
                <div className='space-y-2 text-sm text-gray-500'>
                  <div>• All active teachers</div>
                  <div>• All departments included</div>
                  <div>• Bulk processing</div>
                </div>
                <Badge className='bg-green-100 text-green-800'>
                  {stats?.teachers || 0} Teachers
                </Badge>
              </div>
            </Card>

            {/* All Staff */}
            <Card
              className='p-6 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-purple-300'
              onClick={() => handleBulkTypeSelect('all-staff')}
            >
              <div className='text-center space-y-4'>
                <div className='w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto'>
                  <UserCog className='w-8 h-8 text-purple-600' />
                </div>
                <div>
                  <h5 className='text-lg font-semibold text-gray-900'>
                    All Staff
                  </h5>
                  <p className='text-sm text-gray-600 mt-2'>
                    Generate ID cards for all active staff members
                  </p>
                </div>
                <div className='space-y-2 text-sm text-gray-500'>
                  <div>• All active staff</div>
                  <div>• All departments included</div>
                  <div>• Support & admin staff</div>
                </div>
                <Badge className='bg-purple-100 text-purple-800'>
                  {stats?.staff || 0} Staff Members
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Selected Type Info */}
          <Card className='p-4 bg-blue-50 border-blue-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                  {React.createElement(getBulkTypeInfo(selectedBulkType).icon, {
                    className: 'w-6 h-6 text-blue-600',
                  })}
                </div>
                <div>
                  <h4 className='font-medium text-gray-900'>
                    {selectedBulkType === 'class'
                      ? 'Class Students'
                      : selectedBulkType === 'all-teachers'
                        ? 'All Teachers'
                        : 'All Staff'}
                  </h4>
                  <p className='text-sm text-gray-600'>
                    {getBulkTypeInfo(selectedBulkType).count}{' '}
                    {getBulkTypeInfo(selectedBulkType).label}
                  </p>
                </div>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSelectedBulkType(null)}
              >
                Change Type
              </Button>
            </div>
          </Card>

          {/* Class Selection (for class type only) */}
          {selectedBulkType === 'class' && (
            <div className='space-y-4'>
              <h4 className='text-md font-medium text-gray-900'>
                Select Class
              </h4>

              {isLoadingClasses ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className='p-4 animate-pulse'>
                      <div className='space-y-3'>
                        <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                        <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {classes.map(classInfo => (
                    <Card
                      key={classInfo.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedClass?.id === classInfo.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedClass(classInfo)}
                    >
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <h5 className='font-medium text-gray-900'>
                            Grade {classInfo.grade} - {classInfo.section}
                          </h5>
                          <Badge className='bg-blue-100 text-blue-800'>
                            {classInfo.currentEnrollment} students
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600'>
                          {classInfo.name}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Selection */}
          <div className='space-y-4'>
            <h4 className='text-md font-medium text-gray-900'>
              Select Template
            </h4>

            {isLoadingTemplates ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className='p-4 animate-pulse'>
                    <div className='space-y-3'>
                      <div className='h-32 bg-gray-200 rounded'></div>
                      <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <Card className='p-8 text-center'>
                <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h4 className='text-lg font-medium text-gray-900'>
                  No Templates Available
                </h4>
                <p className='text-sm text-gray-600 mt-1'>
                  No active templates found for this type. Please create a
                  template first.
                </p>
              </Card>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {templates.map(template => (
                  <Card
                    key={template.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className='space-y-3'>
                      {/* Template Preview */}
                      <div className='h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300'>
                        <div className='text-center'>
                          <FileText className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                          <p className='text-xs text-gray-500'>
                            Template Preview
                          </p>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div>
                        <h5 className='font-medium text-gray-900 truncate'>
                          {template.name}
                        </h5>
                        <p className='text-sm text-gray-600 truncate'>
                          {template.description || 'No description'}
                        </p>
                      </div>

                      {/* Template Details */}
                      <div className='space-y-1 text-xs text-gray-500'>
                        <div className='flex justify-between'>
                          <span>Dimensions:</span>
                          <span>{template.dimensions}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Fields:</span>
                          <span>{template.fields?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Configuration */}
          {selectedTemplate &&
            (selectedBulkType !== 'class' || selectedClass) && (
              <Card className='p-6'>
                <div className='space-y-4'>
                  <h4 className='text-md font-medium text-gray-900'>
                    Generation Configuration
                  </h4>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label
                        htmlFor='expiry-date'
                        className='text-sm font-medium text-gray-700'
                      >
                        Expiry Date
                      </Label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          id='expiry-date'
                          type='date'
                          value={expiryDate}
                          onChange={e => setExpiryDate(e.target.value)}
                          className='pl-10'
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label
                        htmlFor='notes'
                        className='text-sm font-medium text-gray-700'
                      >
                        Notes (Optional)
                      </Label>
                      <Input
                        id='notes'
                        placeholder='Add any notes for this batch...'
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className='p-4 bg-gray-50 rounded-lg'>
                    <h5 className='font-medium text-gray-900 mb-2'>
                      Generation Summary
                    </h5>
                    <div className='space-y-1 text-sm text-gray-600'>
                      <div>
                        Type:{' '}
                        {selectedBulkType === 'class'
                          ? 'Class Students'
                          : selectedBulkType === 'all-teachers'
                            ? 'All Teachers'
                            : 'All Staff'}
                      </div>
                      {selectedClass && (
                        <div>
                          Class: Grade {selectedClass.grade} -{' '}
                          {selectedClass.section}
                        </div>
                      )}
                      <div>Template: {selectedTemplate.name}</div>
                      <div>
                        Count: {getBulkTypeInfo(selectedBulkType).count} people
                      </div>
                      <div>Expiry: {expiryDate}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

          {/* Generate Button */}
          {selectedTemplate &&
            (selectedBulkType !== 'class' || selectedClass) &&
            expiryDate && (
              <Card className='p-4 bg-green-50 border-green-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium text-green-900'>
                      Ready to Generate
                    </h4>
                    <p className='text-sm text-green-700'>
                      {getBulkTypeInfo(selectedBulkType).count} ID cards will be
                      generated with real data and QR codes
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className='bg-green-600 hover:bg-green-700 text-white'
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className='w-4 h-4 mr-2' />
                        Generate {getBulkTypeInfo(selectedBulkType).count} ID
                        Cards
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
        </div>
      )}
    </div>
  );
}
