'use client';

import React, { useState, useEffect } from 'react';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreateTemplateModal from '@/components/organisms/modals/CreateTemplateModal';
import TemplatePreviewModal from '@/components/organisms/modals/TemplatePreviewModal';
import TemplateCopyModal from '@/components/organisms/modals/TemplateCopyModal';
import TemplatesGrid from '@/components/organisms/templates/TemplatesGrid';
import { templateApiService } from '@/services/template.service';
import { IDCardTemplate, TemplateStats } from '@/types/template.types';
import PersonSearch from '@/components/organisms/id-generation/PersonSearch';
import TemplateSelection from '@/components/organisms/id-generation/TemplateSelection';
import BulkGeneration from '@/components/organisms/id-generation/BulkGeneration';
import GenerationResults from '@/components/organisms/id-generation/GenerationResults';
import { IDCardGenerationResults } from '@/types/generation-results.types';

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
} from 'lucide-react';

const IDCardGenerationPage = () => {
  // Template management states
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
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

      // Show success message and transition to results if needed
      alert(`ID card generated successfully for ${person.name}!`);

      // Reset to initial state after successful generation
      setGenerationType(null);
      setSelectedPersonType(null);
      setSelectedPerson(null);
      setCurrentStep('type');
    } catch (error) {
      console.error('Error generating ID card:', error);
      alert('Failed to generate ID card. Please try again.');
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
    <div className='min-h-screen bg-background px-2 sm:px-4 lg:px-6'>
      {/* Header */}
      <div className='pt-3 pb-2'>
        <div className='w-full'>
          <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'>
            ID Card Generation & Management
          </h1>
          <p className='text-xs sm:text-sm text-gray-600 mt-1'>
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
                  <div className='space-y-4 sm:space-y-6'>
                    {!generationType ? (
                      // Generation Type Selection
                      <div className='space-y-4'>
                        <div className='text-center sm:text-left'>
                          <h2 className='text-base sm:text-lg font-semibold text-gray-900'>
                            Choose Generation Type
                          </h2>
                          <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                            Select how you want to generate ID cards
                          </p>
                        </div>

                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                          {/* Individual Generation Block */}
                          <Card
                            className='p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-blue-300'
                            onClick={() => setGenerationType('individual')}
                          >
                            <div className='text-center space-y-3 sm:space-y-4'>
                              <div className='w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto'>
                                <User className='w-6 h-6 sm:w-8 sm:h-8 text-blue-600' />
                              </div>
                              <div>
                                <h3 className='text-base sm:text-lg font-semibold text-gray-900'>
                                  Individual Generation
                                </h3>
                                <p className='text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2'>
                                  Generate ID card for a single person by
                                  selecting them individually
                                </p>
                              </div>
                              <div className='space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-500'>
                                <div>
                                  • Select specific student, teacher, or staff
                                </div>
                                <div>• Choose from available templates</div>
                                <div>
                                  • Generate with real data and QR codes
                                </div>
                              </div>
                              <Button className='w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2'>
                                Start Individual Generation
                              </Button>
                            </div>
                          </Card>

                          {/* Bulk Generation Block */}
                          <Card
                            className='p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-green-300'
                            onClick={() => {
                              setGenerationType('bulk');
                              setCurrentStep('bulk');
                            }}
                          >
                            <div className='text-center space-y-3 sm:space-y-4'>
                              <div className='w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto'>
                                <Users className='w-6 h-6 sm:w-8 sm:h-8 text-green-600' />
                              </div>
                              <div>
                                <h3 className='text-base sm:text-lg font-semibold text-gray-900'>
                                  Bulk Generation
                                </h3>
                                <p className='text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2'>
                                  Generate ID cards for multiple people at once
                                </p>
                              </div>
                              <div className='space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-500'>
                                <div>• Class-wise student ID cards</div>
                                <div>• All teachers at once</div>
                                <div>• All staff members at once</div>
                              </div>
                              <Button className='w-full bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-2'>
                                Start Bulk Generation
                              </Button>
                            </div>
                          </Card>
                        </div>
                      </div>
                    ) : generationType === 'individual' ? (
                      // Individual Generation Flow
                      <div className='space-y-4 sm:space-y-6'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                          <div>
                            <h2 className='text-base sm:text-lg font-semibold text-gray-900'>
                              Individual ID Card Generation
                            </h2>
                            <p className='text-xs sm:text-sm text-gray-600'>
                              Select a person and generate their ID card
                            </p>
                          </div>
                          <Button
                            variant='outline'
                            onClick={resetGenerationFlow}
                            className='text-xs sm:text-sm w-full sm:w-auto'
                          >
                            Back to Selection
                          </Button>
                        </div>

                        {currentStep === 'type' ? (
                          // Person Type Selection
                          <div className='space-y-4'>
                            <h3 className='text-sm sm:text-md font-medium text-gray-900'>
                              Select Person Type
                            </h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                              <Card
                                className='p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-blue-300'
                                onClick={() => {
                                  setSelectedPersonType('student');
                                  setCurrentStep('person');
                                }}
                              >
                                <div className='text-center space-y-2 sm:space-y-3'>
                                  <div className='w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto'>
                                    <GraduationCap className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600' />
                                  </div>
                                  <div>
                                    <h4 className='text-sm sm:font-medium text-gray-900'>
                                      Student
                                    </h4>
                                    <p className='text-xs sm:text-sm text-gray-600'>
                                      Generate student ID card
                                    </p>
                                  </div>
                                </div>
                              </Card>

                              <Card
                                className='p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-green-300'
                                onClick={() => {
                                  setSelectedPersonType('teacher');
                                  setCurrentStep('person');
                                }}
                              >
                                <div className='text-center space-y-2 sm:space-y-3'>
                                  <div className='w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto'>
                                    <User className='w-5 h-5 sm:w-6 sm:h-6 text-green-600' />
                                  </div>
                                  <div>
                                    <h4 className='text-sm sm:font-medium text-gray-900'>
                                      Teacher
                                    </h4>
                                    <p className='text-xs sm:text-sm text-gray-600'>
                                      Generate teacher ID card
                                    </p>
                                  </div>
                                </div>
                              </Card>

                              <Card
                                className='p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-purple-300 sm:col-span-2 lg:col-span-1'
                                onClick={() => {
                                  setSelectedPersonType('staff');
                                  setCurrentStep('person');
                                }}
                              >
                                <div className='text-center space-y-2 sm:space-y-3'>
                                  <div className='w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto'>
                                    <UserCog className='w-5 h-5 sm:w-6 sm:h-6 text-purple-600' />
                                  </div>
                                  <div>
                                    <h4 className='text-sm sm:font-medium text-gray-900'>
                                      Staff
                                    </h4>
                                    <p className='text-xs sm:text-sm text-gray-600'>
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
                  <div className='space-y-4 sm:space-y-6'>
                    <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4'>
                      <div>
                        <h2 className='text-base sm:text-lg font-semibold text-gray-900'>
                          Template Builder
                        </h2>
                        <p className='text-xs sm:text-sm text-gray-600'>
                          Create and manage ID card templates
                        </p>
                      </div>
                      <div className='flex flex-col sm:flex-row gap-2'>
                        <Button
                          variant='outline'
                          className='flex items-center justify-center gap-2 text-xs sm:text-sm'
                        >
                          <Upload className='w-3 h-3 sm:w-4 sm:h-4' />
                          <span className='hidden sm:inline'>
                            Import Template
                          </span>
                          <span className='sm:hidden'>Import</span>
                        </Button>
                        <Button
                          onClick={() => setCreateTemplateModalOpen(true)}
                          className='flex items-center justify-center gap-2 text-xs sm:text-sm'
                        >
                          <Plus className='w-3 h-3 sm:w-4 sm:h-4' />
                          <span className='hidden sm:inline'>
                            Create Template
                          </span>
                          <span className='sm:hidden'>Create</span>
                        </Button>
                      </div>
                    </div>

                    {/* Template Management Stats */}
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
                      <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
                          <CardTitle className='text-xs sm:text-sm font-medium'>
                            Total Templates
                          </CardTitle>
                          <FileText className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
                          <div className='text-lg sm:text-2xl font-bold'>
                            {templateStats?.totalTemplates || 0}
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            {templateStats?.activeTemplates || 0} active,{' '}
                            {(templateStats?.totalTemplates || 0) -
                              (templateStats?.activeTemplates || 0)}{' '}
                            drafts
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
                          <CardTitle className='text-xs sm:text-sm font-medium'>
                            Most Used
                          </CardTitle>
                          <CreditCard className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
                          <div className='text-lg sm:text-2xl font-bold'>
                            125
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            Student Standard
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
                          <CardTitle className='text-xs sm:text-sm font-medium'>
                            Recent Updates
                          </CardTitle>
                          <Palette className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
                          <div className='text-lg sm:text-2xl font-bold'>3</div>
                          <p className='text-xs text-muted-foreground'>
                            This week
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
                          <CardTitle className='text-xs sm:text-sm font-medium'>
                            Total Usage
                          </CardTitle>
                          <Printer className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
                          <div className='text-lg sm:text-2xl font-bold'>
                            {templateStats?.totalUsage || 0}
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            Cards generated
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Templates Grid */}
                    {isLoading ? (
                      <div className='flex items-center justify-center py-8 sm:py-12'>
                        <div className='text-center'>
                          <div className='w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4'></div>
                          <p className='text-xs sm:text-sm text-gray-500'>
                            Loading templates...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <TemplatesGrid
                        templates={templates}
                        onPreview={handleTemplatePreview}
                        onEdit={handleTemplateEdit}
                        onCopy={handleTemplateCopy}
                      />
                    )}
                  </div>
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
    </div>
  );
};

export default IDCardGenerationPage;
