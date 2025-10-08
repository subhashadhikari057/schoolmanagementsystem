/**
 * =============================================================================
 * ID Card Preview Component
 * =============================================================================
 * Renders an ID card exactly as designed in the template with actual data
 * =============================================================================
 */

import React, { useState } from 'react';
import { User, ImageIcon, QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import { IDCardData } from '@/services/id-card.service';

interface IDCardPreviewProps {
  idCard: IDCardData;
  scale?: number; // Scale factor for display (default 1)
  className?: string;
}

export default function IDCardPreview({
  idCard,
  scale = 1,
  className = '',
}: IDCardPreviewProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (fieldId: string) => {
    setImageErrors(prev => new Set([...prev, fieldId]));
  };

  const template = idCard.template;
  
  // Parse dimensions
  const [width, height] = template.dimensions.includes('x')
    ? template.dimensions.split('x').map(Number)
    : [85.6, 53.98];

  const isHorizontal = template.orientation === 'HORIZONTAL';
  const cardWidth = isHorizontal ? width : height;
  const cardHeight = isHorizontal ? height : width;

  // Convert mm to pixels (assuming 96 DPI: 1mm ≈ 3.78px)
  const mmToPx = 3.78;
  const scaledWidth = cardWidth * mmToPx * scale;
  const scaledHeight = cardHeight * mmToPx * scale;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="relative shadow-xl bg-white"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          borderRadius: `${4 * scale}px`,
          border: `${1 * scale}px solid #e5e7eb`,
        }}
      >
        {/* Render all fields from renderedFields */}
        {idCard.renderedFields.map((field, index) => {
          const fieldStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${field.x * mmToPx * scale}px`,
            top: `${field.y * mmToPx * scale}px`,
            width: `${field.width * mmToPx * scale}px`,
            height: `${field.height * mmToPx * scale}px`,
          };

          switch (field.fieldType) {
            case 'TEXT':
              return (
                <div
                  key={field.fieldId || index}
                  style={{
                    ...fieldStyle,
                    fontSize: `${(field.style.fontSize || 12) * scale}px`,
                    color: field.style.color || '#000000',
                    fontWeight: field.style.fontWeight || 'normal',
                    fontFamily: field.style.fontFamily || 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      field.style.textAlign === 'center'
                        ? 'center'
                        : field.style.textAlign === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                    textAlign: (field.style.textAlign as 'left' | 'center' | 'right' | 'justify') || 'left',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                    backgroundColor: field.style.backgroundColor,
                  }}
                >
                  <span className="w-full px-1">
                    {field.value || field.label}
                  </span>
                </div>
              );

            case 'IMAGE':
            case 'PHOTO': {
              const hasImageError = imageErrors.has(field.fieldId || index.toString());
              return (
                <div
                  key={field.fieldId || index}
                  style={{
                    ...fieldStyle,
                    overflow: 'hidden',
                    borderRadius: `${2 * scale}px`,
                  }}
                >
                  {field.value && !hasImageError ? (
                    <img
                      src={field.value}
                      alt={field.label}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(field.fieldId || index.toString())}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200"
                      style={{ borderRadius: `${2 * scale}px` }}
                    >
                      <User 
                        style={{ 
                          width: `${Math.min(field.width * mmToPx * scale * 0.5, 50)}px`,
                          height: `${Math.min(field.height * mmToPx * scale * 0.5, 50)}px`
                        }} 
                        className="text-blue-400" 
                      />
                    </div>
                  )}
                </div>
              );
            }

            case 'LOGO':
              return (
                <div
                  key={field.fieldId || index}
                  style={{
                    ...fieldStyle,
                    overflow: 'hidden',
                  }}
                >
                  {field.value ? (
                    <img
                      src={field.value}
                      alt={field.label}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gray-100">
                              <svg class="w-1/2 h-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageIcon className="w-1/2 h-1/2 text-gray-400" />
                    </div>
                  )}
                </div>
              );

            case 'QR_CODE':
              return (
                <div
                  key={field.fieldId || index}
                  style={{
                    ...fieldStyle,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {idCard.qrCodeUrl ? (
                    <img
                      src={idCard.qrCodeUrl}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white border-2 border-gray-300">
                      <QrCode className="w-1/2 h-1/2 text-gray-400" />
                    </div>
                  )}
                </div>
              );

            case 'BARCODE':
              return (
                <div
                  key={field.fieldId || index}
                  style={{
                    ...fieldStyle,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center bg-white border-2 border-gray-300">
                    <BarcodeIcon className="w-3/4 h-3/4 text-gray-400" />
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
