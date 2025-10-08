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
  CreditCard,
  FileText,
  Loader2,
  Download,
  Eye,
} from 'lucide-react';
import { IDCardTemplate, IDCardTemplateType } from '@/types/template.types';
import { templateApiService } from '@/services/template.service';
import { personSearchService, Person } from '@/services/person-search.service';
import { toast } from 'sonner';

// Person interface is now imported from the service

interface TemplateSelectionProps {
  selectedPerson: Person;
  onBack: () => void;
  onGenerate: (
    person: Person,
    template: IDCardTemplate,
    expiryDate: string,
  ) => void;
}

export default function TemplateSelection({
  selectedPerson,
  onBack,
  onGenerate,
}: TemplateSelectionProps) {
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<IDCardTemplate | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Map person type to template type
  const getTemplateType = (personType: string): IDCardTemplateType => {
    switch (personType) {
      case 'student':
        return IDCardTemplateType.STUDENT;
      case 'teacher':
        return IDCardTemplateType.TEACHER;
      case 'staff':
        return IDCardTemplateType.STAFF;
      default:
        return IDCardTemplateType.STUDENT;
    }
  };

  // Generate default expiry date (1 year from now for students, 2 years for staff/teachers)
  const generateDefaultExpiryDate = () => {
    const now = new Date();
    const yearsToAdd = selectedPerson.type === 'student' ? 1 : 2;
    now.setFullYear(now.getFullYear() + yearsToAdd);
    return now.toISOString().split('T')[0];
  };

  // Load templates based on person type
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const templateType = getTemplateType(selectedPerson.type);

        const response = await templateApiService.getTemplates({
          type: templateType,
          // Only get active templates that are ready for use
          limit: 50,
        });

        // Filter for active templates only
        const activeTemplates = response.templates.filter(
          template => template.status === 'ACTIVE',
        );

        setTemplates(activeTemplates);

        // Auto-select the first template if available
        if (activeTemplates.length > 0) {
          setSelectedTemplate(activeTemplates[0]);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [selectedPerson.type]);

  // Set default expiry date when component mounts
  useEffect(() => {
    setExpiryDate(generateDefaultExpiryDate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson.type]);

  const handleGenerate = async () => {
    if (!selectedTemplate || !expiryDate) {
      toast.error('Missing Required Information', {
        description: 'Please select a template and set an expiry date.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Starting ID card generation...', {
        personId: selectedPerson.id,
        personType: selectedPerson.type,
        templateId: selectedTemplate.id,
        expiryDate,
      });

      // Use the real API service to generate the ID card
      const result = await personSearchService.generateIndividualIDCard({
        personId: selectedPerson.id,
        personType: selectedPerson.type,
        templateId: selectedTemplate.id,
        expiryDate,
      });

      console.log('ID card generated successfully:', result);

      // Show success toast
      toast.success('ID Card Generated!', {
        description: `Successfully generated ID card for ${selectedPerson.name}`,
        duration: 4000,
      });

      // Call the parent callback with the result
      await onGenerate(selectedPerson, selectedTemplate, expiryDate);
    } catch (error: unknown) {
      console.error('Error generating ID card:', error);

      // Extract error message
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to generate ID card';

      // Show detailed error toast
      toast.error('Generation Failed', {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPersonTypeColor = (type: string) => {
    switch (type) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'staff':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Generate ID Card
          </h3>
          <p className='text-sm text-gray-600'>
            Select template and configure ID card details
          </p>
        </div>
        <Button variant='outline' onClick={onBack}>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Search
        </Button>
      </div>

      {/* Selected Person Info */}
      <Card className='p-4 bg-blue-50 border-blue-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
              <CreditCard className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <h4 className='font-medium text-gray-900'>
                {selectedPerson.name}
              </h4>
              <p className='text-sm text-gray-600'>{selectedPerson.info}</p>
              <div className='flex items-center space-x-2 mt-1'>
                <Badge className={getPersonTypeColor(selectedPerson.type)}>
                  {selectedPerson.type}
                </Badge>
                {selectedPerson.rollNumber && (
                  <span className='text-xs text-gray-500'>
                    Roll: {selectedPerson.rollNumber}
                  </span>
                )}
                {selectedPerson.employeeId && (
                  <span className='text-xs text-gray-500'>
                    ID: {selectedPerson.employeeId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Template Selection */}
      <div className='space-y-4'>
        <div>
          <h4 className='text-md font-medium text-gray-900 mb-2'>
            Select Template
          </h4>
          <p className='text-sm text-gray-600'>
            Choose from available {selectedPerson.type} ID card templates
          </p>
        </div>

        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className='p-4 animate-pulse'>
                <div className='space-y-3'>
                  <div className='h-32 bg-gray-200 rounded'></div>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                </div>
              </Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <Card className='p-8 text-center'>
            <div className='space-y-3'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto'>
                <FileText className='w-8 h-8 text-gray-400' />
              </div>
              <div>
                <h4 className='text-lg font-medium text-gray-900'>
                  No Templates Available
                </h4>
                <p className='text-sm text-gray-600 mt-1'>
                  No active {selectedPerson.type} ID card templates found.
                  Please create a template first.
                </p>
              </div>
              <Button variant='outline' onClick={onBack}>
                Go Back
              </Button>
            </div>
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
                      <CreditCard className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-xs text-gray-500'>Template Preview</p>
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
                      <span>Orientation:</span>
                      <span>{template.orientation}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Fields:</span>
                      <span>{template.fields?.length || 0}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={e => {
                        e.stopPropagation();
                        // TODO: Implement template preview
                      }}
                    >
                      <Eye className='w-3 h-3 mr-1' />
                      Preview
                    </Button>
                    <Button
                      size='sm'
                      className={`flex-1 ${
                        selectedTemplate?.id === template.id
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                      }}
                    >
                      {selectedTemplate?.id === template.id
                        ? 'Selected'
                        : 'Select'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Expiry Date Configuration */}
      {selectedTemplate && (
        <Card className='p-4'>
          <div className='space-y-4'>
            <div>
              <h4 className='text-md font-medium text-gray-900 mb-2'>
                ID Card Configuration
              </h4>
              <p className='text-sm text-gray-600'>
                Set the expiry date for this ID card
              </p>
            </div>

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
                <p className='text-xs text-gray-500'>
                  Default:{' '}
                  {selectedPerson.type === 'student' ? '1 year' : '2 years'}{' '}
                  from today
                </p>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Selected Template
                </Label>
                <div className='p-3 bg-gray-50 rounded-lg'>
                  <div className='flex items-center space-x-2'>
                    <CreditCard className='w-4 h-4 text-gray-600' />
                    <span className='text-sm font-medium text-gray-900'>
                      {selectedTemplate.name}
                    </span>
                  </div>
                  <p className='text-xs text-gray-600 mt-1'>
                    {selectedTemplate.dimensions} •{' '}
                    {selectedTemplate.orientation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Generate Button */}
      {selectedTemplate && expiryDate && (
        <Card className='p-4 bg-green-50 border-green-200'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-medium text-green-900'>Ready to Generate</h4>
              <p className='text-sm text-green-700'>
                ID card will be generated with real data, QR code, and proper
                sizing
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
                  Generate ID Card
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
