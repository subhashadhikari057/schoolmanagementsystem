/**
 * =============================================================================
 * Templates Grid Component
 * =============================================================================
 * Grid component for displaying template cards
 * =============================================================================
 */

import React from 'react';
import {
  Eye,
  Edit,
  Copy,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IDCardTemplate, IDCardTemplateType } from '@/types/template.types';
import TemplatePreview from './TemplatePreview';

interface TemplatesGridProps {
  templates: IDCardTemplate[];
  onPreview: (template: IDCardTemplate) => void;
  onEdit: (template: IDCardTemplate) => void;
  onCopy: (template: IDCardTemplate) => void;
  onDelete: (template: IDCardTemplate) => void;
  onPublish?: (template: IDCardTemplate) => void;
}

export default function TemplatesGrid({
  templates,
  onPreview,
  onEdit,
  onCopy,
  onDelete,
  onPublish,
}: TemplatesGridProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {templates.map(template => (
        <div
          key={template.id}
          className='bg-white border border-blue-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200'
        >
          {/* Template Preview */}
          <div className='w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-3 flex items-center justify-center border-2 border-blue-200'>
            <TemplatePreview template={template} />
          </div>

          {/* Template Info */}
          <div className='space-y-2'>
            <div className='flex items-start justify-between'>
              <h3 className='font-medium text-gray-900 truncate'>
                {template.name}
              </h3>
              <div className='flex items-center space-x-1'>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <MoreVertical className='w-4 h-4' />
                </Button>
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  template.type === IDCardTemplateType.STUDENT
                    ? 'bg-blue-100 text-blue-800'
                    : template.type === IDCardTemplateType.TEACHER
                      ? 'bg-green-100 text-green-800'
                      : template.type === IDCardTemplateType.STAFF
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-orange-100 text-orange-800'
                }`}
              >
                {template.type.toLowerCase()}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  template.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : template.status === 'INACTIVE'
                      ? 'bg-gray-100 text-gray-800'
                      : template.status === 'ARCHIVED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {template.status === 'ACTIVE'
                  ? 'Published'
                  : (template.status || 'DRAFT').toLowerCase()}
              </span>
            </div>

            <div className='text-sm text-gray-600'>
              <p>Size: {template.dimensions}</p>
              <p>Used: {template.usageCount} times</p>
              <p>
                Modified: {new Date(template.updatedAt).toLocaleDateString()}
              </p>
            </div>

            {template.description && (
              <p className='text-sm text-gray-500 line-clamp-2'>
                {template.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className='space-y-2 pt-2'>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onPreview(template)}
                  className='flex-1 h-8 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'
                >
                  <Eye className='w-3 h-3 mr-1' />
                  Preview
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onEdit(template)}
                  className='flex-1 h-8 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'
                >
                  <Edit className='w-3 h-3 mr-1' />
                  Edit
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onCopy(template)}
                  className='flex-1 h-8 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'
                >
                  <Copy className='w-3 h-3 mr-1' />
                  Copy
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onDelete(template)}
                  className='h-8 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300'
                >
                  <Trash2 className='w-3 h-3' />
                </Button>
              </div>

              {/* Publish/Unpublish Button - Show for all templates if onPublish is provided */}
              {onPublish && (
                <Button
                  variant={template.status === 'ACTIVE' ? 'outline' : 'default'}
                  size='sm'
                  onClick={() => onPublish(template)}
                  className={`w-full h-8 ${
                    template.status === 'ACTIVE'
                      ? 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {template.status === 'ACTIVE' ? (
                    <>
                      <XCircle className='w-3 h-3 mr-1' />
                      Unpublish Template
                    </>
                  ) : (
                    <>
                      <CheckCircle className='w-3 h-3 mr-1' />
                      Publish Template
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <div className='col-span-full text-center py-8'>
          <div className='w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-3'>
            <span className='text-blue-400 text-xs'>Empty</span>
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No templates yet
          </h3>
          <p className='text-gray-500'>
            Create your first template to get started.
          </p>
        </div>
      )}
    </div>
  );
}
