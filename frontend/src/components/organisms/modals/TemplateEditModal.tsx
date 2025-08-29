/**
 * =============================================================================
 * Template Edit Modal Component
 * =============================================================================
 * Modal for editing template actions
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  X,
  Edit,
  Copy,
  Eye,
  Download,
  Share2,
  Settings,
  Archive,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTemplateModal from './CreateTemplateModal';

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

interface TemplateEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSave?: (updatedTemplate: Template) => void;
}

export default function TemplateEditModal({
  open,
  onOpenChange,
  template,
  onSave,
}: TemplateEditModalProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleEditTemplate = () => {
    setIsCreateModalOpen(true);
    onOpenChange(false);
  };

  if (!open || !template) return null;

  return (
    <>
      <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl'>
          {/* Header */}
          <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 border-b border-gray-100'>
            <div className='relative flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg'>
                  <Edit className='w-5 h-5 text-white' />
                </div>
                <div>
                  <h2 className='text-lg font-bold text-white'>
                    Template Actions
                  </h2>
                  <p className='text-xs text-blue-100 mt-1'>
                    Manage template settings and options
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

          <div className='p-6 space-y-6'>
            {/* Template Overview */}
            <div className='p-6 border-2 border-gray-200 rounded-lg'>
              <div className='space-y-4'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-2'>
                    <h4 className='text-xl font-semibold'>{template.name}</h4>
                    <p className='text-gray-600'>
                      {template.description || 'No description available'}
                    </p>
                    <div className='flex items-center space-x-2'>
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
                  <div className='w-24 h-16 bg-gray-100 rounded border-2 border-dashed flex items-center justify-center'>
                    <span className='text-xs text-gray-500'>Preview</span>
                  </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-500'>Dimensions:</span>
                    <p className='font-medium'>{template.dimensions}</p>
                  </div>
                  <div>
                    <span className='text-gray-500'>Usage:</span>
                    <p className='font-medium'>{template.usageCount} cards</p>
                  </div>
                  <div>
                    <span className='text-gray-500'>Modified:</span>
                    <p className='font-medium'>{template.lastModified}</p>
                  </div>
                  <div>
                    <span className='text-gray-500'>Status:</span>
                    <p className='font-medium'>{template.status}</p>
                  </div>
                </div>

                {template.features && (
                  <div className='space-y-2'>
                    <span className='text-sm font-medium text-gray-500'>
                      Features:
                    </span>
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
              </div>
            </div>

            {/* Action Options */}
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900'>Available Actions</h4>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <Button
                  variant='outline'
                  className='justify-start h-auto p-4'
                  onClick={handleEditTemplate}
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                      <Edit className='w-5 h-5 text-blue-600' />
                    </div>
                    <div className='text-left'>
                      <p className='font-medium'>Edit Template</p>
                      <p className='text-sm text-gray-500'>
                        Modify fields and design
                      </p>
                    </div>
                  </div>
                </Button>

                <Button variant='outline' className='justify-start h-auto p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                      <Copy className='w-5 h-5 text-green-600' />
                    </div>
                    <div className='text-left'>
                      <p className='font-medium'>Duplicate Template</p>
                      <p className='text-sm text-gray-500'>
                        Create a copy to modify
                      </p>
                    </div>
                  </div>
                </Button>

                <Button variant='outline' className='justify-start h-auto p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                      <Eye className='w-5 h-5 text-purple-600' />
                    </div>
                    <div className='text-left'>
                      <p className='font-medium'>Preview Template</p>
                      <p className='text-sm text-gray-500'>
                        View before making changes
                      </p>
                    </div>
                  </div>
                </Button>

                <Button variant='outline' className='justify-start h-auto p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'>
                      <Download className='w-5 h-5 text-orange-600' />
                    </div>
                    <div className='text-left'>
                      <p className='font-medium'>Export Template</p>
                      <p className='text-sm text-gray-500'>Download as file</p>
                    </div>
                  </div>
                </Button>

                <Button variant='outline' className='justify-start h-auto p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center'>
                      <Share2 className='w-5 h-5 text-cyan-600' />
                    </div>
                    <div className='text-left'>
                      <p className='font-medium'>Share Template</p>
                      <p className='text-sm text-gray-500'>
                        Share with other users
                      </p>
                    </div>
                  </div>
                </Button>

                <Button variant='outline' className='justify-start h-auto p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                      <Archive className='w-5 h-5 text-gray-600' />
                    </div>
                    <div className='text-left'>
                      <p className='font-medium'>Archive Template</p>
                      <p className='text-sm text-gray-500'>
                        Move to archived templates
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className='p-4 border border-red-200 bg-red-50 rounded-lg'>
              <div className='space-y-3'>
                <h4 className='font-medium text-red-900'>Danger Zone</h4>
                <p className='text-sm text-red-700'>
                  These actions cannot be undone. Please proceed with caution.
                </p>
                <Button
                  variant='outline'
                  className='border-red-300 text-red-700 hover:bg-red-100'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete Template
                </Button>
              </div>
            </div>

            <div className='flex justify-end space-x-3 pt-4'>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                <X className='w-4 h-4 mr-2' />
                Cancel
              </Button>
              <Button
                onClick={handleEditTemplate}
                className='bg-primary hover:bg-primary/90'
              >
                <Edit className='w-4 h-4 mr-2' />
                Open Editor
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CreateTemplateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        editingTemplate={undefined}
      />
    </>
  );
}
