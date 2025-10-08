'use client';

import React, { useState, useEffect } from 'react';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreateTemplateModal from '@/components/organisms/modals/CreateTemplateModal';
import TemplatePreviewModal from '@/components/organisms/modals/TemplatePreviewModal';
import TemplateCopyModal from '@/components/organisms/modals/TemplateCopyModal';
import IDCardViewModal from '@/components/organisms/modals/IDCardViewModal';
import TemplatesGrid from '@/components/organisms/templates/TemplatesGrid';
import { templateApiService } from '@/services/template.service';
import { IDCardTemplate, TemplateStats } from '@/types/template.types';
import PersonSearch from '@/components/organisms/id-generation/PersonSearch';
import TemplateSelection from '@/components/organisms/id-generation/TemplateSelection';
import BulkGeneration from '@/components/organisms/id-generation/BulkGeneration';
import GenerationResults from '@/components/organisms/id-generation/GenerationResults';
import GeneratedIDCardsView from '@/components/organisms/id-generation/GeneratedIDCardsView';
import { IDCardGenerationResults } from '@/types/generation-results.types';
import { toast } from 'sonner';
import { showConfirmation } from '@/utils/confirmation-toast';

interface Person {
  id: string;
  name: string;
  type: 'student' | 'teacher' | 'staff';
  info: string;
  rollNumber?: string;
  employeeId?: string;
  email?: string;
}
import {
  CreditCard,
  Printer,
  CheckCircle,
  Plus,
  Upload,
  Layout,
  Palette,
  FileText,
  User,
  Users,
  GraduationCap,
  UserCog,
  AlertCircle,
} from 'lucide-react';

const IDCardGenerationPage = () => {
  // Template management states
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [idCardViewModalOpen, setIdCardViewModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<IDCardTemplate | null>(null);
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [templateStats, setTemplateStats] = useState<TemplateStats | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // ID Generation states
  const [generationType, setGenerationType] = useState<
    'individual' | 'bulk' | null
  >(null);
  const [selectedPersonType, setSelectedPersonType] = useState<
    'student' | 'teacher' | 'staff' | null
  >(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [currentStep, setCurrentStep] = useState<
    'type' | 'person' | 'template' | 'bulk' | 'results'
  >('type');
  const [generationResults, setGenerationResults] =
    useState<IDCardGenerationResults | null>(null);
  // Fetch templates and stats from backend
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const [templatesResponse, statsResponse] = await Promise.all([
        templateApiService.getTemplates(),
        templateApiService.getTemplateStats(),
      ]);
      setTemplates(templatesResponse.templates);
      setTemplateStats(statsResponse);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleTemplatePreview = (template: IDCardTemplate) => {
    setSelectedTemplate(template);
    setPreviewModalOpen(true);
  };

  const handleTemplateEdit = (template: IDCardTemplate) => {
    setSelectedTemplate(template);
    setCreateTemplateModalOpen(true); // Use create modal in edit mode
  };

  const handleTemplateCopy = (template: IDCardTemplate) => {
    // Create a copy of the template with modified name and reset data sources
    const copiedTemplate: IDCardTemplate = {
      ...template,
      id: '', // Clear ID for new template
      name: `${template.name} - Copy`,
      usageCount: 0, // Reset usage count
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Reset data sources for fields to allow re-selection for different user types
      fields:
        template.fields?.map(field => ({
          ...field,
          id: '', // Clear field ID
          dataSource:
            field.fieldType === 'TEXT' ? 'database' : field.dataSource, // Reset text fields to database
          staticText: undefined, // Clear static text to force re-selection
          databaseField: undefined, // Clear database field to force re-selection
        })) || [],
    };

    setSelectedTemplate(copiedTemplate);
    setCreateTemplateModalOpen(true); // Use create modal in copy mode
  };

  const handleNewTemplateCopy = (newTemplate: IDCardTemplate) => {
    console.log('New template created:', newTemplate);
    fetchTemplates(); // Refresh the templates list
  };

  const handleTemplateDelete = async (template: IDCardTemplate) => {
    showConfirmation({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await templateApiService.deleteTemplate(template.id);

          toast.success(
            `Template "${template.name}" has been deleted successfully`,
          );

          // Refresh templates list
          await fetchTemplates();
        } catch (error: unknown) {
          console.error('Error deleting template:', error);

          // Extract the error message
          const errorMessage =
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
            (error as { message?: string })?.message ||
            'Failed to delete template';

          // Show detailed error message
          if (errorMessage.includes('being used by')) {
            // Template is in use
            toast.error(errorMessage, {
              duration: 6000, // Show longer for important message
            });
          } else if (errorMessage.includes('default template')) {
            toast.error(
              'Cannot delete default template. Please set another template as default first.',
            );
          } else if (errorMessage.includes('Foreign key constraint')) {
            toast.error(
              'This template is currently being used and cannot be deleted. Please remove all ID cards using this template first.',
              {
                duration: 6000,
              },
            );
          } else {
            toast.error(errorMessage);
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // ID Generation handlers
  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    setCurrentStep('template');
  };

  const handleBackToPersonSearch = () => {
    setSelectedPerson(null);
    setCurrentStep('person');
  };

  const handleBackToPersonType = () => {
    setSelectedPersonType(null);
    setSelectedPerson(null);
    setCurrentStep('type');
  };

  const handleGenerateIDCard = async (
    person: Person,
    template: IDCardTemplate,
    expiryDate: string,
  ) => {
    try {
      console.log('Generating ID card:', { person, template, expiryDate });
      // The actual API call is handled in TemplateSelection component
      // This is just the success callback

      // Show success message with toast
      toast.success('ID Card Generated Successfully!', {
        description: `ID card for ${person.name} has been generated and is ready for download.`,
        duration: 5000,
      });

      // Wait a moment to show the success message
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Reset to initial state after successful generation
      setGenerationType(null);
      setSelectedPersonType(null);
      setSelectedPerson(null);
      setCurrentStep('type');

      // Optionally refresh the page or navigate to generated cards tab
      // You can add logic here to switch to the "Generated ID Cards" tab
    } catch (error) {
      console.error('Error generating ID card:', error);
      toast.error('Failed to Generate ID Card', {
        description:
          error instanceof Error
            ? error.message
            : 'Please try again or contact support.',
        duration: 6000,
      });
    }
  };

  const handleBulkGenerationComplete = (results: IDCardGenerationResults) => {
    setGenerationResults(results);
    setCurrentStep('results');
  };

  const handleBackToBulkGeneration = () => {
    setCurrentStep('bulk');
    setGenerationResults(null);
  };

  const handleStartNewGeneration = () => {
    resetGenerationFlow();
    setGenerationResults(null);
  };

  const resetGenerationFlow = () => {
    setGenerationType(null);
    setSelectedPersonType(null);
    setSelectedPerson(null);
    setCurrentStep('type');
  };
  const idCardStats = [
    {
      icon: Layout,
      bgColor: 'bg-blue-500',
      iconColor: 'text-white',
      value: templateStats?.totalTemplates?.toString() || '0',
      label: 'Available Templates',
      change: '5.2%',
      isPositive: true,
    },
    {
      icon: CheckCircle,
      bgColor: 'bg-green-500',
      iconColor: 'text-white',
      value: templateStats?.activeTemplates?.toString() || '0',
      label: 'Active Templates',
      change: '12.3%',
      isPositive: true,
    },
    {
      icon: CreditCard,
      bgColor: 'bg-purple-500',
      iconColor: 'text-white',
      value: templateStats?.totalUsage?.toString() || '0',
      label: 'Cards Generated',
      change: '2.1%',
      isPositive: true,
    },
    {
      icon: Users,
      bgColor: 'bg-orange-500',
      iconColor: 'text-white',
      value: '0',
      label: 'Ready to Generate',
      change: '0%',
      isPositive: true,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='pt-3'>
        <div className='w-full'>
          <h1 className='text-xl font-bold text-gray-900'>
            ID Card Generation & Management
          </h1>
          <p className='text-sm text-gray-600 mt-1'>
            Generate, Print, and Manage All ID Cards
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='mt-3'>
        <div className='w-full'>
          <Statsgrid stats={idCardStats} />
        </div>
      </div>

      {/* Main Content - Tabs */}
      <div className='mt-4 mb-6'>
        <div className='w-full'>
          <GenericTabs
            tabs={[
              {
                name: 'Generate ID Cards',
                content: (
                  <div className='space-y-6'>
                    {!generationType ? (
                      // Enhanced Generation Type Selection
                      <div className='bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 p-6 sm:p-8 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm'>
                        {/* Header Section */}
                        <div className='text-center mb-8'>
                          <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg'>
                            <CreditCard className='w-8 h-8 text-white' />
                          </div>
                          <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-2'>
                            Generate ID Cards
                          </h2>
                          <p className='text-gray-600 max-w-2xl mx-auto'>
                            Choose your preferred generation method to create
                            professional ID cards with real-time data and QR
                            codes
                          </p>
                        </div>

                        {/* No Templates Warning */}
                        {templates.length === 0 && !isLoading && (
                          <div className='bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8 shadow-sm'>
                            <div className='flex items-start space-x-4'>
                              <div className='flex-shrink-0'>
                                <div className='w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center'>
                                  <AlertCircle className='h-5 w-5 text-amber-600' />
                                </div>
                              </div>
                              <div className='flex-1'>
                                <h3 className='text-lg font-semibold text-amber-900 mb-2'>
                                  No Templates Available
                                </h3>
                                <p className='text-amber-800 mb-4'>
                                  You need to create at least one ID card
                                  template before generating ID cards. Templates
                                  define the layout, fields, and design of your
                                  ID cards.
                                </p>
                                <Button
                                  onClick={() => {
                                    /* Navigate to template builder tab */
                                  }}
                                  className='bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200'
                                >
                                  Create Your First Template
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Generation Options */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                          {/* Individual Generation Card */}
                          <div
                            className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                              isLoading || templates.length === 0
                                ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50'
                                : 'cursor-pointer border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl hover:scale-105'
                            }`}
                            onClick={() => {
                              if (!isLoading && templates.length > 0) {
                                setGenerationType('individual');
                              }
                            }}
                          >
                            {/* Background Pattern */}
                            <div className='absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5' />
                            <div className='absolute -top-24 -right-24 w-48 h-48 bg-blue-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300' />

                            <div className='relative p-8'>
                              {/* Icon */}
                              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300'>
                                <User className='w-8 h-8 text-white' />
                              </div>

                              {/* Content */}
                              <div className='text-center space-y-4'>
                                <h3 className='text-xl font-bold text-gray-900'>
                                  Individual Generation
                                </h3>
                                <p className='text-gray-600 leading-relaxed'>
                                  Generate ID card for a single person with
                                  personalized data and instant preview
                                </p>

                                {/* Features List */}
                                <div className='space-y-3 text-sm text-gray-500 pt-4'>
                                  <div className='flex items-center justify-center space-x-2'>
                                    <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                                    <span>
                                      Select specific student, teacher, or staff
                                    </span>
                                  </div>
                                  <div className='flex items-center justify-center space-x-2'>
                                    <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                                    <span>Choose from available templates</span>
                                  </div>
                                  <div className='flex items-center justify-center space-x-2'>
                                    <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                                    <span>Real-time data with QR codes</span>
                                  </div>
                                </div>

                                {/* Button */}
                                <div className='pt-6'>
                                  <Button
                                    disabled={
                                      isLoading || templates.length === 0
                                    }
                                    className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                                  >
                                    {templates.length === 0 ? (
                                      <>
                                        <AlertCircle className='w-4 h-4 mr-2' />
                                        No Templates Available
                                      </>
                                    ) : (
                                      <>
                                        <User className='w-4 h-4 mr-2' />
                                        Start Individual Generation
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bulk Generation Card */}
                          <div
                            className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                              isLoading || templates.length === 0
                                ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50'
                                : 'cursor-pointer border-gray-200 bg-white hover:border-green-300 hover:shadow-xl hover:scale-105'
                            }`}
                            onClick={() => {
                              if (!isLoading && templates.length > 0) {
                                setGenerationType('bulk');
                                setCurrentStep('bulk');
                              }
                            }}
                          >
                            {/* Background Pattern */}
                            <div className='absolute inset-0 bg-gradient-to-br from-green-600/5 via-transparent to-emerald-600/5' />
                            <div className='absolute -top-24 -right-24 w-48 h-48 bg-green-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300' />

                            <div className='relative p-8'>
                              {/* Icon */}
                              <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300'>
                                <Users className='w-8 h-8 text-white' />
                              </div>

                              {/* Content */}
                              <div className='text-center space-y-4'>
                                <h3 className='text-xl font-bold text-gray-900'>
                                  Bulk Generation
                                </h3>
                                <p className='text-gray-600 leading-relaxed'>
                                  Generate multiple ID cards simultaneously for
                                  entire classes or departments
                                </p>

                                {/* Features List */}
                                <div className='space-y-3 text-sm text-gray-500 pt-4'>
                                  <div className='flex items-center justify-center space-x-2'>
                                    <div className='w-1.5 h-1.5 bg-green-500 rounded-full' />
                                    <span>Class-wise student ID cards</span>
                                  </div>
                                  <div className='flex items-center justify-center space-x-2'>
                                    <div className='w-1.5 h-1.5 bg-green-500 rounded-full' />
                                    <span>All teachers at once</span>
                                  </div>
                                  <div className='flex items-center justify-center space-x-2'>
                                    <div className='w-1.5 h-1.5 bg-green-500 rounded-full' />
                                    <span>Complete staff directory</span>
                                  </div>
                                </div>

                                {/* Button */}
                                <div className='pt-6'>
                                  <Button
                                    disabled={
                                      isLoading || templates.length === 0
                                    }
                                    className='w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                                  >
                                    {templates.length === 0 ? (
                                      <>
                                        <AlertCircle className='w-4 h-4 mr-2' />
                                        No Templates Available
                                      </>
                                    ) : (
                                      <>
                                        <Users className='w-4 h-4 mr-2' />
                                        Start Bulk Generation
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        {templates.length > 0 && (
                          <div className='mt-8 pt-8 border-t border-gray-200'>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                              <div className='text-center'>
                                <div className='text-2xl font-bold text-blue-600'>
                                  {templateStats?.totalTemplates || 0}
                                </div>
                                <div className='text-sm text-gray-600'>
                                  Templates
                                </div>
                              </div>
                              <div className='text-center'>
                                <div className='text-2xl font-bold text-green-600'>
                                  {templateStats?.activeTemplates || 0}
                                </div>
                                <div className='text-sm text-gray-600'>
                                  Active
                                </div>
                              </div>
                              <div className='text-center'>
                                <div className='text-2xl font-bold text-purple-600'>
                                  {templateStats?.totalUsage || 0}
                                </div>
                                <div className='text-sm text-gray-600'>
                                  Generated
                                </div>
                              </div>
                              <div className='text-center'>
                                <div className='text-2xl font-bold text-orange-600'>
                                  0
                                </div>
                                <div className='text-sm text-gray-600'>
                                  In Queue
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : generationType === 'individual' ? (
                      // Individual Generation Flow
                      <div className='bg-white p-4 rounded-lg shadow space-y-6'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                          <div>
                            <h2 className='text-lg font-semibold text-gray-900'>
                              Individual ID Card Generation
                            </h2>
                            <p className='text-sm text-gray-600'>
                              Select a person and generate their ID card
                            </p>
                          </div>
                          <Button
                            variant='outline'
                            onClick={resetGenerationFlow}
                            className='border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium py-2 px-4 rounded-md transition-all duration-200 w-full sm:w-auto'
                            size='default'
                          >
                            Back to Selection
                          </Button>
                        </div>

                        {currentStep === 'type' ? (
                          // Person Type Selection
                          <div className='space-y-4'>
                            <h3 className='text-md font-medium text-gray-900'>
                              Select Person Type
                            </h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                              <Card
                                className='p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-blue-300'
                                onClick={() => {
                                  setSelectedPersonType('student');
                                  setCurrentStep('person');
                                }}
                              >
                                <div className='text-center space-y-3'>
                                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto'>
                                    <GraduationCap className='w-6 h-6 text-blue-600' />
                                  </div>
                                  <div>
                                    <h4 className='font-medium text-gray-900'>
                                      Student
                                    </h4>
                                    <p className='text-sm text-gray-600'>
                                      Generate student ID card
                                    </p>
                                  </div>
                                </div>
                              </Card>

                              <Card
                                className='p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-green-300'
                                onClick={() => {
                                  setSelectedPersonType('teacher');
                                  setCurrentStep('person');
                                }}
                              >
                                <div className='text-center space-y-3'>
                                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto'>
                                    <User className='w-6 h-6 text-green-600' />
                                  </div>
                                  <div>
                                    <h4 className='font-medium text-gray-900'>
                                      Teacher
                                    </h4>
                                    <p className='text-sm text-gray-600'>
                                      Generate teacher ID card
                                    </p>
                                  </div>
                                </div>
                              </Card>

                              <Card
                                className='p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-purple-300 sm:col-span-2 lg:col-span-1'
                                onClick={() => {
                                  setSelectedPersonType('staff');
                                  setCurrentStep('person');
                                }}
                              >
                                <div className='text-center space-y-3'>
                                  <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto'>
                                    <UserCog className='w-6 h-6 text-purple-600' />
                                  </div>
                                  <div>
                                    <h4 className='font-medium text-gray-900'>
                                      Staff
                                    </h4>
                                    <p className='text-sm text-gray-600'>
                                      Generate staff ID card
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        ) : currentStep === 'person' && selectedPersonType ? (
                          // Person Search
                          <PersonSearch
                            personType={selectedPersonType}
                            onPersonSelect={handlePersonSelect}
                            onBack={handleBackToPersonType}
                          />
                        ) : currentStep === 'template' && selectedPerson ? (
                          // Template Selection and Generation
                          <TemplateSelection
                            selectedPerson={selectedPerson}
                            onBack={handleBackToPersonSearch}
                            onGenerate={handleGenerateIDCard}
                          />
                        ) : null}
                      </div>
                    ) : currentStep === 'bulk' ? (
                      // Bulk Generation Flow
                      <BulkGeneration
                        onBack={resetGenerationFlow}
                        onComplete={handleBulkGenerationComplete}
                      />
                    ) : currentStep === 'results' && generationResults ? (
                      // Generation Results
                      <GenerationResults
                        results={generationResults}
                        isBulk={generationType === 'bulk'}
                        onBack={handleBackToBulkGeneration}
                        onStartNew={handleStartNewGeneration}
                      />
                    ) : null}
                  </div>
                ),
              },
              {
                name: 'Template Builder',
                content: (
                  <div className='space-y-6'>
                    {/* Header Section */}
                    <div className='bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 p-6 sm:p-8 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm'>
                      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-4 mb-4'>
                            <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg'>
                              <Palette className='w-6 h-6 text-white' />
                            </div>
                            <div>
                              <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-1'>
                                Template Builder
                              </h2>
                              <p className='text-gray-600'>
                                Design and manage professional ID card templates
                                with real-time preview
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='flex flex-col sm:flex-row gap-3 lg:flex-shrink-0'>
                          <Button
                            variant='outline'
                            className='group flex items-center justify-center gap-2 border-gray-300 bg-white/80 text-gray-700 hover:bg-white hover:border-purple-300 hover:text-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md'
                            size='default'
                          >
                            <Upload className='w-4 h-4 group-hover:scale-110 transition-transform duration-200' />
                            <span>Import Template</span>
                          </Button>
                          <Button
                            onClick={() => setCreateTemplateModalOpen(true)}
                            disabled={isLoading}
                            className='group flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                            size='default'
                          >
                            <Plus className='w-4 h-4 group-hover:scale-110 transition-transform duration-200' />
                            <span>
                              {isLoading
                                ? 'Creating...'
                                : 'Create New Template'}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Stats Cards */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                      {/* Total Templates Card */}
                      <div className='group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50 rounded-2xl border border-blue-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
                        <div className='absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full opacity-20 -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500' />
                        <div className='relative p-6'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-blue-500 rounded-xl shadow-lg'>
                              <FileText className='w-5 h-5 text-white' />
                            </div>
                            <div className='text-blue-500 text-sm font-medium bg-blue-100 px-2 py-1 rounded-full'>
                              Total
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <div className='text-3xl font-bold text-gray-900'>
                              {templateStats?.totalTemplates || 0}
                            </div>
                            <p className='text-sm text-gray-600'>
                              <span className='text-green-600 font-medium'>
                                {templateStats?.activeTemplates || 0} active
                              </span>
                              {' • '}
                              <span className='text-gray-500'>
                                {(templateStats?.totalTemplates || 0) -
                                  (templateStats?.activeTemplates || 0)}{' '}
                                drafts
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Most Used Card */}
                      <div className='group relative overflow-hidden bg-gradient-to-br from-white to-green-50/50 rounded-2xl border border-green-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
                        <div className='absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full opacity-20 -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500' />
                        <div className='relative p-6'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-green-500 rounded-xl shadow-lg'>
                              <CreditCard className='w-5 h-5 text-white' />
                            </div>
                            <div className='text-green-500 text-sm font-medium bg-green-100 px-2 py-1 rounded-full'>
                              Popular
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <div className='text-3xl font-bold text-gray-900'>
                              125
                            </div>
                            <p className='text-sm text-gray-600'>
                              <span className='font-medium'>
                                Student Standard
                              </span>
                              <br />
                              <span className='text-gray-500'>
                                Most used template
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recent Updates Card */}
                      <div className='group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/50 rounded-2xl border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
                        <div className='absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full opacity-20 -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500' />
                        <div className='relative p-6'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-purple-500 rounded-xl shadow-lg'>
                              <Palette className='w-5 h-5 text-white' />
                            </div>
                            <div className='text-purple-500 text-sm font-medium bg-purple-100 px-2 py-1 rounded-full'>
                              Recent
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <div className='text-3xl font-bold text-gray-900'>
                              3
                            </div>
                            <p className='text-sm text-gray-600'>
                              <span className='font-medium'>This week</span>
                              <br />
                              <span className='text-gray-500'>
                                Templates updated
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Total Usage Card */}
                      <div className='group relative overflow-hidden bg-gradient-to-br from-white to-orange-50/50 rounded-2xl border border-orange-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>
                        <div className='absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full opacity-20 -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500' />
                        <div className='relative p-6'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-orange-500 rounded-xl shadow-lg'>
                              <Printer className='w-5 h-5 text-white' />
                            </div>
                            <div className='text-orange-500 text-sm font-medium bg-orange-100 px-2 py-1 rounded-full'>
                              Usage
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <div className='text-3xl font-bold text-gray-900'>
                              {templateStats?.totalUsage || 0}
                            </div>
                            <p className='text-sm text-gray-600'>
                              <span className='font-medium'>
                                Cards generated
                              </span>
                              <br />
                              <span className='text-gray-500'>
                                All time total
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Templates Grid Section */}
                    <div className='bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden'>
                      {/* Grid Header */}
                      <div className='px-6 py-4 border-b border-gray-200/50 bg-gray-50/50'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                              Template Gallery
                            </h3>
                            <p className='text-sm text-gray-600'>
                              Manage, edit, and preview your ID card templates
                            </p>
                          </div>
                          <div className='text-sm text-gray-500'>
                            {templates.length}{' '}
                            {templates.length === 1 ? 'template' : 'templates'}
                          </div>
                        </div>
                      </div>

                      {/* Templates Content */}
                      <div className='p-6'>
                        {isLoading ? (
                          <div className='flex items-center justify-center py-12'>
                            <div className='text-center'>
                              <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
                              <p className='text-gray-600 font-medium'>
                                Loading templates...
                              </p>
                              <p className='text-sm text-gray-500 mt-1'>
                                Please wait while we fetch your templates
                              </p>
                            </div>
                          </div>
                        ) : templates.length === 0 ? (
                          <div className='text-center py-12'>
                            <div className='w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                              <FileText className='w-8 h-8 text-gray-400' />
                            </div>
                            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                              No Templates Found
                            </h3>
                            <p className='text-gray-600 mb-6 max-w-md mx-auto'>
                              Get started by creating your first ID card
                              template. You can design layouts, add fields, and
                              customize the appearance.
                            </p>
                            <Button
                              onClick={() => setCreateTemplateModalOpen(true)}
                              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200'
                            >
                              <Plus className='w-4 h-4 mr-2' />
                              Create Your First Template
                            </Button>
                          </div>
                        ) : (
                          <TemplatesGrid
                            templates={templates}
                            onPreview={handleTemplatePreview}
                            onEdit={handleTemplateEdit}
                            onCopy={handleTemplateCopy}
                            onDelete={handleTemplateDelete}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                name: 'Generated ID Cards',
                content: (
                  <GeneratedIDCardsView
                    onViewCard={cardId => {
                      setSelectedCardId(cardId);
                      setIdCardViewModalOpen(true);
                    }}
                  />
                ),
              },
            ]}
            className='w-full'
            defaultIndex={0}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateTemplateModal
        isOpen={createTemplateModalOpen}
        onClose={() => {
          setCreateTemplateModalOpen(false);
          setSelectedTemplate(null); // Clear selected template
        }}
        onSuccess={() => {
          setCreateTemplateModalOpen(false);
          setSelectedTemplate(null); // Clear selected template
          fetchTemplates(); // Refresh templates list with real data
        }}
        editTemplate={selectedTemplate} // Pass selected template for editing
      />

      <TemplatePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        template={selectedTemplate}
      />

      <TemplateCopyModal
        open={copyModalOpen}
        onOpenChange={setCopyModalOpen}
        template={selectedTemplate}
        onCopy={handleNewTemplateCopy}
      />

      <IDCardViewModal
        open={idCardViewModalOpen}
        onOpenChange={setIdCardViewModalOpen}
        cardId={selectedCardId}
      />
    </div>
  );
};

export default IDCardGenerationPage;
