/**
 * =============================================================================
 * Template Preview Component
 * =============================================================================
 * Renders a mini preview of an ID card template
 * =============================================================================
 */

import React from 'react';
import { IDCardTemplate, TemplateFieldType } from '@/types/template.types';
import { Type, ImageIcon, QrCode, User } from 'lucide-react';

interface TemplatePreviewProps {
  template: IDCardTemplate;
  className?: string;
}

export default function TemplatePreview({
  template,
  className = '',
}: TemplatePreviewProps) {
  const [width, height] = template.dimensions.includes('x')
    ? template.dimensions.split('x').map(Number)
    : [85.6, 53.98];

  const isHorizontal = template.orientation === 'HORIZONTAL';
  const previewWidth = isHorizontal ? width : height;
  const previewHeight = isHorizontal ? height : width;

  // Scale to fit preview area with better visibility
  const scale = Math.min(120 / previewWidth, 75 / previewHeight);
  const scaledWidth = previewWidth * scale;
  const scaledHeight = previewHeight * scale;

  return (
    <div className={`flex items-center justify-center p-3 ${className}`}>
      <div
        className='relative shadow-md hover:shadow-lg transition-shadow duration-200'
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          backgroundColor: template.backgroundColor || '#ffffff',
          borderRadius: `${(template.borderRadius || 2) * scale}px`,
          border: `${Math.max(1, (template.borderWidth || 1) * scale)}px solid ${template.borderColor || '#d1d5db'}`,
          backgroundImage: template.backgroundImage 
            ? `url(${template.backgroundImage})` 
            : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Simplified watermark */}
        {template.watermark && (
          <div className='absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none'>
            <span className='text-xs font-bold transform rotate-[-45deg] text-gray-400'>
              {template.watermark}
            </span>
          </div>
        )}

        {/* Render all fields */}
        {template.fields?.map((field, index) => {
          const fieldStyle = {
            position: 'absolute' as const,
            left: `${(field.x / previewWidth) * 100}%`,
            top: `${(field.y / previewHeight) * 100}%`,
            width: `${(field.width / previewWidth) * 100}%`,
            height: `${(field.height / previewHeight) * 100}%`,
            fontSize: `${Math.max(3, (field.fontSize || 12) * scale * 0.4)}px`,
            color: field.color || '#1f2937',
            fontWeight: field.fontWeight || 'normal',
          };

          switch (field.fieldType) {
            case TemplateFieldType.TEXT:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center overflow-hidden'
                >
                  <span className='truncate text-[5px] opacity-60 font-medium'>
                    {field.label?.substring(0, 20) || 'Text'}
                  </span>
                </div>
              );

            case TemplateFieldType.IMAGE:
            case TemplateFieldType.PHOTO:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-sm'
                >
                  <User className='w-1.5 h-1.5 text-blue-400' />
                </div>
              );

            case TemplateFieldType.LOGO:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-center bg-white border border-gray-200 rounded-sm'
                >
                  <ImageIcon className='w-1 h-1 text-gray-400' />
                </div>
              );

            case TemplateFieldType.QR_CODE:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-center bg-white border border-gray-300 rounded-sm p-px'
                >
                  <QrCode className='w-1.5 h-1.5 text-gray-700' />
                </div>
              );

            case TemplateFieldType.BARCODE:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-center bg-white border border-gray-200 rounded-sm overflow-hidden'
                >
                  <div className='flex gap-px h-full w-full p-px'>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className='flex-1 bg-black'
                        style={{ opacity: i % 2 === 0 ? 1 : 0.3 }}
                      />
                    ))}
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}

        {/* Empty state */}
        {(!template.fields || template.fields.length === 0) && (
          <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100'>
            <div className='text-center'>
              <div className='w-6 h-6 bg-white rounded-md shadow-sm flex items-center justify-center mx-auto mb-1 border border-gray-200'>
                <Type className='w-3 h-3 text-gray-400' />
              </div>
              <div className='text-[6px] text-gray-500 font-medium'>Empty</div>
            </div>
          </div>
        )}

        {/* Minimal corner accent */}
        <div 
          className='absolute top-0 right-0 w-3 h-3 opacity-5'
          style={{
            background: `linear-gradient(135deg, transparent 50%, ${template.borderColor || '#3b82f6'} 50%)`,
            borderTopRightRadius: `${(template.borderRadius || 2) * scale}px`,
          }}
        />
      </div>
    </div>
  );
}
