/**
 * =============================================================================
 * Template Preview Modal Component
 * =============================================================================
 * Simple modal for previewing ID card templates
 * =============================================================================
 */

import React from 'react';
import { CreditCard, Calendar, User, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { IDCardTemplate, IDCardTemplateType } from '@/types/template.types';
import TemplatePreview from '../templates/TemplatePreview';

interface TemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: IDCardTemplate | null;
}

export default function TemplatePreviewModal({
  open,
  onOpenChange,
  template,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const getTypeColor = (type: IDCardTemplateType) => {
    switch (type) {
      case IDCardTemplateType.STUDENT:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case IDCardTemplateType.TEACHER:
        return 'bg-green-100 text-green-800 border-green-200';
      case IDCardTemplateType.STAFF:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case IDCardTemplateType.STAFF_NO_LOGIN:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='pb-4'>
          <DialogTitle className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <CreditCard className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                {template.name}
              </h2>
              <p className='text-sm text-gray-500 mt-1'>Template Preview</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Template Info */}
          <div className='grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg'>
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <User className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Type:</span>
                <Badge className={`text-xs ${getTypeColor(template.type)}`}>
                  {template.type.toLowerCase()}
                </Badge>
              </div>

              <div className='flex items-center space-x-2'>
                <CreditCard className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Size:</span>
                <span className='text-sm font-medium'>
                  {template.dimensions} mm
                </span>
              </div>

              <div className='flex items-center space-x-2'>
                <Calendar className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Modified:</span>
                <span className='text-sm font-medium'>
                  {new Date(template.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Layers className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Fields:</span>
                <span className='text-sm font-medium'>
                  {template.fields?.length || 0} elements
                </span>
              </div>

              <div className='flex items-center space-x-2'>
                <div className='w-3 h-3 rounded-full bg-blue-500' />
                <span className='text-sm text-gray-600'>Status:</span>
                <span className='text-sm font-medium text-blue-600'>
                  Available
                </span>
              </div>

              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-600'>Used:</span>
                <span className='text-sm font-medium'>
                  {template.usageCount || 0} times
                </span>
              </div>
            </div>
          </div>

          {/* Template Description */}
          {template.description && (
            <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <h3 className='text-sm font-medium text-blue-900 mb-2'>
                Description
              </h3>
              <p className='text-sm text-blue-800'>{template.description}</p>
            </div>
          )}

          {/* Template Preview */}
          <div className='space-y-3'>
            <h3 className='text-lg font-medium text-gray-900'>
              Template Design
            </h3>
            <div className='flex justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200'>
              <div className='scale-150'>
                <TemplatePreview template={template} />
              </div>
            </div>
          </div>

          {/* Field List */}
          {template.fields && template.fields.length > 0 && (
            <div className='space-y-3'>
              <h3 className='text-lg font-medium text-gray-900'>
                Template Fields
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {template.fields.map((field, index) => (
                  <div
                    key={index}
                    className='p-3 bg-white border border-gray-200 rounded-lg'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-gray-900'>
                        {field.label}
                      </span>
                      <Badge variant='outline' className='text-xs'>
                        {field.fieldType}
                      </Badge>
                    </div>
                    <div className='text-xs text-gray-500 space-y-1'>
                      <div>
                        Position: {field.x}, {field.y}
                      </div>
                      <div>
                        Size: {field.width} × {field.height}
                      </div>
                      {field.databaseField && (
                        <div>Data: {field.databaseField}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className='flex justify-end pt-4 border-t'>
          <Button onClick={() => onOpenChange(false)} variant='outline'>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
