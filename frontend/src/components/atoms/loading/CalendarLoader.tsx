'use client';

import React from 'react';

interface CalendarLoaderProps {
  className?: string;
}

export default function CalendarLoader({
  className = '',
}: CalendarLoaderProps) {
  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className='animate-pulse space-y-4'>
        <div className='h-8 bg-gray-200 rounded w-64'></div>
        <div className='h-4 bg-gray-200 rounded w-96'></div>
      </div>

      {/* Calendar skeleton */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='animate-pulse space-y-4'>
          {/* Calendar header */}
          <div className='flex items-center justify-between'>
            <div className='h-6 bg-gray-200 rounded w-32'></div>
            <div className='flex gap-2'>
              <div className='h-8 w-8 bg-gray-200 rounded'></div>
              <div className='h-8 w-8 bg-gray-200 rounded'></div>
            </div>
          </div>

          {/* Calendar grid */}
          <div className='grid grid-cols-7 gap-2'>
            {/* Week headers */}
            {[...Array(7)].map((_, i) => (
              <div key={i} className='h-8 bg-gray-200 rounded'></div>
            ))}

            {/* Calendar days */}
            {[...Array(35)].map((_, i) => (
              <div key={i} className='h-12 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
