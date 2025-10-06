/**
 * =============================================================================
 * Template Preview Component
 * =============================================================================
 * Renders a mini preview of an ID card template
 * =============================================================================
 */

import React from 'react';
import { IDCardTemplate, TemplateFieldType } from '@/types/template.types';
import { Type, ImageIcon } from 'lucide-react';

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

  // Scale to fit preview area (max 200px width for better visibility)
  const scale = Math.min(200 / previewWidth, 120 / previewHeight);
  const scaledWidth = previewWidth * scale;
  const scaledHeight = previewHeight * scale;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className='relative border-2 border-gray-300 shadow-sm'
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          backgroundColor: template.backgroundColor || '#ffffff',
          borderRadius: `${(template.borderRadius || 0) * scale}px`,
          borderColor: template.borderColor || '#e5e7eb',
        }}
      >
        {/* Render template fields as mini previews */}
        {template.fields?.map((field, index) => {
          const fieldStyle = {
            position: 'absolute' as const,
            left: `${(field.x / previewWidth) * 100}%`,
            top: `${(field.y / previewHeight) * 100}%`,
            width: `${(field.width / previewWidth) * 100}%`,
            height: `${(field.height / previewHeight) * 100}%`,
          };

          switch (field.fieldType) {
            case TemplateFieldType.TEXT: {
              // Calculate appropriate font size based on field height
              const baseFontSize = Math.max(
                4,
                Math.min(8, field.height * scale * 0.15),
              );
              const textStyle = {
                ...fieldStyle,
                fontSize: `${baseFontSize}px`,
                lineHeight: '1.2',
                color: field.color || '#000000',
                fontWeight:
                  field.fontWeight === 'bold'
                    ? 'bold'
                    : field.fontWeight === 'semibold'
                      ? '600'
                      : 'normal',
                textAlign: field.textAlign?.toLowerCase() as
                  | 'left'
                  | 'center'
                  | 'right'
                  | undefined,
              };

              return (
                <div
                  key={index}
                  style={textStyle}
                  className='flex items-center px-0.5 overflow-hidden'
                >
                  <span
                    className='truncate w-full'
                    style={{ fontSize: `${baseFontSize}px` }}
                  >
                    {field.placeholder || field.label || 'Text'}
                  </span>
                </div>
              );
            }

            case TemplateFieldType.IMAGE:
            case TemplateFieldType.LOGO: {
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-center bg-gray-100/80 border border-gray-300 rounded-sm'
                >
                  <ImageIcon className='w-3 h-3 text-gray-400' />
                </div>
              );
            }

            case TemplateFieldType.QR_CODE: {
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-center bg-white border border-gray-400 rounded-sm p-0.5'
                >
                  <div className='w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px]'>
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className='bg-gray-800 rounded-[0.5px]' />
                    ))}
                  </div>
                </div>
              );
            }

            default: {
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='bg-gray-200/50 border border-gray-300 rounded-sm'
                />
              );
            }
          }
        })}

        {/* Show placeholder if no fields */}
        {(!template.fields || template.fields.length === 0) && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='text-center'>
              <Type className='w-4 h-4 text-gray-400 mx-auto mb-1' />
              <div className='text-xs text-gray-400'>Empty</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
