'use client';

import React from 'react';

interface FormLoaderProps {
  fields?: number;
  className?: string;
  showButtons?: boolean;
}

export default function FormLoader({
  fields = 5,
  className = '',
  showButtons = true,
}: FormLoaderProps) {
  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className='animate-pulse space-y-4'>
        <div className='h-8 bg-gray-200 rounded w-64'></div>
        <div className='h-4 bg-gray-200 rounded w-96'></div>
      </div>

      {/* Form skeleton */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='animate-pulse space-y-6'>
          {[...Array(fields)].map((_, i) => (
            <div key={i} className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded w-24'></div>
              <div className='h-10 bg-gray-200 rounded w-full'></div>
            </div>
          ))}

          {showButtons && (
            <div className='flex gap-3 justify-end pt-4'>
              <div className='h-10 w-20 bg-gray-200 rounded'></div>
              <div className='h-10 w-24 bg-gray-200 rounded'></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
