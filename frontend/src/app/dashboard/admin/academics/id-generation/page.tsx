'use client';

import React, { useState, useEffect } from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  IDCard,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GenerateIDCardModal from '@/components/organisms/modals/GenerateIDCardModal';
import CreateTemplateModal from '@/components/organisms/modals/CreateTemplateModal';
import TemplatePreviewModal from '@/components/organisms/modals/TemplatePreviewModal';
import TemplateEditModal from '@/components/organisms/modals/TemplateEditModal';
import TemplateCopyModal from '@/components/organisms/modals/TemplateCopyModal';
import TemplatesGrid from '@/components/organisms/templates/TemplatesGrid';
import { templateApiService } from '@/services/template.service';
import { IDCardTemplate, TemplateStats } from '@/types/template.types';
import {
  CreditCard,
  Printer,
  CheckCircle,
  AlertCircle,
  Plus,
  Upload,
  Layout,
  Palette,
  FileText,
} from 'lucide-react';

const IDCardGenerationPage = () => {
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<IDCardTemplate | null>(null);
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [templateStats, setTemplateStats] = useState<TemplateStats | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    setSelectedItems(selectedIds);
    console.log('Selected ID cards:', selectedIds);
  };
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
  const idCardStats = [
    {
      icon: CreditCard,
      bgColor: 'bg-blue-50',
      iconColor: 'text-white',
      value: '248',
      label: 'Total ID Cards',
      change: '5.2%',
      isPositive: true,
    },
    {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-white',
      value: '195',
      label: 'Printed Cards',
      change: '12.3%',
      isPositive: true,
    },
    {
      icon: Printer,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-white',
      value: '34',
      label: 'Pending Print',
      change: '2.1%',
      isPositive: false,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-white',
      value: '19',
      label: 'Generated Only',
      change: '8.7%',
      isPositive: false,
    },
  ];

  // Sample ID Card data
  const idCardsData: IDCard[] = [
    {
      id: 1,
      cardId: 'STU2025001',
      holderName: 'Emily Johnson',
      holderType: 'Student',
      holderInfo: 'Grade 10A',
      generatedDate: '2025-01-15',
      expiryDate: '2026-07-31',
      printStatus: 'Printed',
      template: 'Student Template A',
      hasPhoto: true,
      hasQR: true,
      printCount: 1,
      lastPrintDate: '2025-01-16',
      avatar: undefined,
    },
    {
      id: 2,
      cardId: 'TCH2025001',
      holderName: 'Dr. Sarah Mitchell',
      holderType: 'Teacher',
      holderInfo: 'Mathematics Dept',
      generatedDate: '2025-01-10',
      expiryDate: '2026-12-31',
      printStatus: 'Printed',
      template: 'Staff Template A',
      hasPhoto: true,
      hasQR: true,
      printCount: 1,
      lastPrintDate: '2025-01-11',
      avatar: undefined,
    },
    {
      id: 3,
      cardId: 'STU2025002',
      holderName: 'James Smith',
      holderType: 'Student',
      holderInfo: 'Grade 11B',
      generatedDate: '2025-01-27',
      expiryDate: '2026-07-31',
      printStatus: 'Pending Print',
      template: 'Student Template A',
      hasPhoto: true,
      hasQR: true,
      printCount: 0,
      avatar: undefined,
    },
    {
      id: 4,
      cardId: 'STF2025001',
      holderName: 'John Wilson',
      holderType: 'Staff',
      holderInfo: 'Administration',
      generatedDate: '2025-01-28',
      expiryDate: '2026-12-31',
      printStatus: 'Generated',
      template: 'Staff Template A',
      hasPhoto: false,
      hasQR: true,
      printCount: 0,
      avatar: undefined,
    },
    {
      id: 5,
      cardId: 'STU2025003',
      holderName: 'Sophia Brown',
      holderType: 'Student',
      holderInfo: 'Grade 9C',
      generatedDate: '2025-01-25',
      expiryDate: '2026-07-31',
      printStatus: 'Printed',
      template: 'Student Template A',
      hasPhoto: true,
      hasQR: true,
      printCount: 2,
      lastPrintDate: '2025-01-26',
      avatar: undefined,
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
          <Tabs defaultValue='id-cards' className='w-full'>
            <TabsList className='grid w-full grid-cols-2 mb-6'>
              <TabsTrigger value='id-cards' className='flex items-center gap-2'>
                <CreditCard className='w-4 h-4' />
                ID Card List
              </TabsTrigger>
              <TabsTrigger
                value='templates'
                className='flex items-center gap-2'
              >
                <Layout className='w-4 h-4' />
                Template Builder
              </TabsTrigger>
            </TabsList>

            {/* ID Cards Tab Content */}
            <TabsContent value='id-cards' className='space-y-4'>
              <div className='flex justify-between items-center'>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    ID Card Management
                  </h2>
                  <p className='text-sm text-gray-600'>
                    Generate, print, and manage all ID cards
                  </p>
                </div>
                <Button
                  onClick={() => setGenerateModalOpen(true)}
                  className='flex items-center gap-2'
                >
                  <Plus className='w-4 h-4' />
                  Generate ID Card
                </Button>
              </div>

              <GenericList<IDCard>
                config={getListConfig('id-cards')}
                data={idCardsData}
                currentPage={1}
                totalPages={25}
                totalItems={248}
                itemsPerPage={10}
                customActions={<ActionButtons pageType='id-cards' />}
                selectedItems={selectedItems}
                onSelectionChange={handleSelectionChange}
              />
            </TabsContent>

            {/* Templates Tab Content */}
            <TabsContent value='templates' className='space-y-6'>
              <div className='flex justify-between items-center'>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    Template Builder
                  </h2>
                  <p className='text-sm text-gray-600'>
                    Create and manage ID card templates
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' className='flex items-center gap-2'>
                    <Upload className='w-4 h-4' />
                    Import Template
                  </Button>
                  <Button
                    onClick={() => setCreateTemplateModalOpen(true)}
                    className='flex items-center gap-2'
                  >
                    <Plus className='w-4 h-4' />
                    Create Template
                  </Button>
                </div>
              </div>

              {/* Template Management Stats */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Templates
                    </CardTitle>
                    <FileText className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
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
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Most Used
                    </CardTitle>
                    <CreditCard className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>125</div>
                    <p className='text-xs text-muted-foreground'>
                      Student Standard
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Recent Updates
                    </CardTitle>
                    <Palette className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>3</div>
                    <p className='text-xs text-muted-foreground'>This week</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Usage
                    </CardTitle>
                    <Printer className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
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
                <div className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
                    <p className='text-gray-500'>Loading templates...</p>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <GenerateIDCardModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onSuccess={() => {
          setGenerateModalOpen(false);
          // Refresh data if needed
        }}
      />

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

      <TemplateEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
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
