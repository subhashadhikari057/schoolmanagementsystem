/**
 * =============================================================================
 * Template Copy Modal Component
 * =============================================================================
 * Modal for copying/duplicating templates
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  X,
  Copy,
  CheckCircle,
  Loader2,
  CreditCard,
  FileText,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  IDCardTemplate,
  IDCardTemplateType,
  TemplateOrientation,
} from '@/types/template.types';

interface TemplateCopyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: IDCardTemplate | null;
  onCopy: (newTemplate: IDCardTemplate) => void;
}

export default function TemplateCopyModal({
  open,
  onOpenChange,
  template,
  onCopy,
}: TemplateCopyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: template ? `${template.name} (Copy)` : '',
    description: template?.description || '',
    copyFields: true,
    copyDesign: true,
    copyFeatures: true,
    newType: template?.type || 'student',
  });

  const handleCopy = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a name for the copied template.');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newTemplate: IDCardTemplate = {
        id: `TPL${Date.now()}`,
        name: formData.name,
        description: formData.description,
        type: formData.newType as IDCardTemplateType,
        dimensions: template?.dimensions || '85.6x53.98',
        orientation: template?.orientation || TemplateOrientation.HORIZONTAL,
        backgroundColor: template?.backgroundColor || '#ffffff',
        borderColor: template?.borderColor || '#e5e7eb',
        borderWidth: template?.borderWidth || 1,
        borderRadius: template?.borderRadius || 4,
        logoRequired: template?.logoRequired || false,
        photoRequired: template?.photoRequired || false,
        qrCodeRequired: template?.qrCodeRequired || false,
        barcodeRequired: template?.barcodeRequired || false,
        printMargin: template?.printMargin || 5,
        bleedArea: template?.bleedArea || 3,
        safeArea: template?.safeArea || 5,
        features: formData.copyFeatures ? template?.features : [],
        metadata: template?.metadata || {},
        isDefault: false,
        isPublished: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: template?.fields || [],
      };

      setIsLoading(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onCopy?.(newTemplate);
        onOpenChange(false);
        // Reset form
        setFormData({
          name: template ? `${template.name} (Copy)` : '',
          description: template?.description || '',
          copyFields: true,
          copyDesign: true,
          copyFeatures: true,
          newType: template?.type || IDCardTemplateType.STUDENT,
        });
      }, 1500);
    }, 2000);
  };

  if (!open || !template) return null;

  return (
    <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl'>
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 border-b border-gray-100'>
          <div className='relative flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg'>
                <Copy className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white'>Copy Template</h2>
                <p className='text-xs text-blue-100 mt-1'>
                  Create a duplicate of the selected template
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

        {/* Loading/Success States */}
        {isLoading && (
          <div className='bg-blue-50 border-b border-blue-200 p-3'>
            <div className='flex items-center gap-2 text-blue-800'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span className='text-sm'>
                Creating copy of template... Please wait.
              </span>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className='bg-green-50 border-b border-green-200 p-3'>
            <div className='flex items-center gap-2 text-green-800'>
              <CheckCircle className='h-4 w-4' />
              <span className='text-sm'>Template copied successfully!</span>
            </div>
          </div>
        )}

        <div className='p-6 space-y-6'>
          {/* Original Template Info */}
          <div className='p-4 bg-gray-50 rounded-lg'>
            <div className='space-y-3'>
              <h4 className='font-medium text-sm mb-2'>Copying from:</h4>
              <div className='flex items-start justify-between'>
                <div className='space-y-2'>
                  <div>
                    <p className='font-semibold'>{template.name}</p>
                    <p className='text-sm text-gray-600'>
                      {template.description || 'No description'}
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${
                        template.type === IDCardTemplateType.STUDENT
                          ? 'bg-blue-100 text-blue-800'
                          : template.type === IDCardTemplateType.TEACHER
                            ? 'bg-green-100 text-green-800'
                            : template.type === IDCardTemplateType.STAFF
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {template.type}
                    </span>
                    <span className='px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800'>
                      Available
                    </span>
                  </div>
                </div>
                <div className='w-16 h-10 bg-white border rounded flex items-center justify-center'>
                  <CreditCard className='w-4 h-4 text-gray-400' />
                </div>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-2 border-t'>
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
                  <p className='font-medium'>
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Copy Configuration */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Left Column - Basic Settings */}
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900'>
                New Template Settings
              </h4>

              <div className='space-y-3'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Template Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder='Enter new template name...'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder='Describe the new template...'
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Template Type
                  </label>
                  <select
                    value={formData.newType}
                    onChange={e =>
                      setFormData({ ...formData, newType: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value={IDCardTemplateType.STUDENT}>
                      Student ID Card
                    </option>
                    <option value={IDCardTemplateType.TEACHER}>
                      Teacher ID Card
                    </option>
                    <option value={IDCardTemplateType.STAFF}>
                      Staff ID Card
                    </option>
                    <option value={IDCardTemplateType.STAFF_NO_LOGIN}>
                      Staff (No Login)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column - Copy Options */}
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900'>Copy Options</h4>

              <div className='space-y-4'>
                <div className='p-4 border border-gray-200 rounded-lg'>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id='copyFields'
                        checked={formData.copyFields}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            copyFields: e.target.checked,
                          })
                        }
                        className='rounded'
                      />
                      <div>
                        <label
                          htmlFor='copyFields'
                          className='text-sm font-medium'
                        >
                          Copy Layout & Fields
                        </label>
                        <p className='text-xs text-gray-500'>
                          Include all text fields, images, and positioning
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id='copyDesign'
                        checked={formData.copyDesign}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            copyDesign: e.target.checked,
                          })
                        }
                        className='rounded'
                      />
                      <div>
                        <label
                          htmlFor='copyDesign'
                          className='text-sm font-medium'
                        >
                          Copy Design & Styling
                        </label>
                        <p className='text-xs text-gray-500'>
                          Include colors, fonts, borders, and visual elements
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id='copyFeatures'
                        checked={formData.copyFeatures}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            copyFeatures: e.target.checked,
                          })
                        }
                        className='rounded'
                      />
                      <div>
                        <label
                          htmlFor='copyFeatures'
                          className='text-sm font-medium'
                        >
                          Copy Features
                        </label>
                        <p className='text-xs text-gray-500'>
                          Include QR codes, barcodes, and special elements
                        </p>
                      </div>
                    </div>

                    {/* Removed "Make Active" option - all templates are available by default */}
                  </div>
                </div>

                {/* Preview of what will be copied */}
                <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <h5 className='font-medium text-blue-900 mb-2'>
                    What will be copied:
                  </h5>
                  <div className='space-y-1 text-sm'>
                    {formData.copyFields && (
                      <div className='flex items-center space-x-2 text-blue-700'>
                        <FileText className='w-3 h-3' />
                        <span>Layout & Fields</span>
                      </div>
                    )}
                    {formData.copyDesign && (
                      <div className='flex items-center space-x-2 text-blue-700'>
                        <Palette className='w-3 h-3' />
                        <span>Design & Styling</span>
                      </div>
                    )}
                    {formData.copyFeatures && (
                      <div className='flex items-center space-x-2 text-blue-700'>
                        <CreditCard className='w-3 h-3' />
                        <span>Features & Elements</span>
                      </div>
                    )}
                    {!formData.copyFields &&
                      !formData.copyDesign &&
                      !formData.copyFeatures && (
                        <p className='text-gray-500 italic'>
                          Only basic template structure will be copied
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          {template.features && formData.copyFeatures && (
            <div className='p-4 border border-gray-200 rounded-lg'>
              <h5 className='font-medium mb-2'>Features to be copied:</h5>
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

          <div className='flex justify-end space-x-3 pt-4'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className='w-4 h-4 mr-2' />
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className='w-4 h-4 mr-2' />
                  Create Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
