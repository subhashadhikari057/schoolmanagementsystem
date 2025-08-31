/**
 * =============================================================================
 * Template Preview Component
 * =============================================================================
 * Renders a mini preview of an ID card template
 * =============================================================================
 */

import React from 'react';
import { IDCardTemplate, TemplateFieldType } from '@/types/template.types';
import { Type, ImageIcon, QrCode } from 'lucide-react';

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

  // Scale to fit preview area (max 128px width)
  const scale = Math.min(128 / previewWidth, 80 / previewHeight);
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
            fontSize: `${Math.max(6, (field.fontSize || 12) * scale * 0.8)}px`,
            color: field.color || '#000000',
          };

          switch (field.fieldType) {
            case TemplateFieldType.TEXT:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-start overflow-hidden'
                >
                  <span className='truncate text-xs opacity-75'>
                    {field.label}
                  </span>
                </div>
              );

            case TemplateFieldType.IMAGE:
            case TemplateFieldType.LOGO:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-center bg-gray-100 border border-gray-300 rounded-sm'
                >
                  <ImageIcon className='w-2 h-2 text-gray-400' />
                </div>
              );

            case TemplateFieldType.QR_CODE:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='flex items-center justify-center bg-white border border-gray-300 rounded-sm'
                >
                  <QrCode className='w-2 h-2 text-gray-600' />
                </div>
              );

            default:
              return (
                <div
                  key={index}
                  style={fieldStyle}
                  className='bg-gray-200 border border-gray-300 rounded-sm flex items-center justify-center'
                >
                  <Type className='w-2 h-2 text-gray-500' />
                </div>
              );
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
