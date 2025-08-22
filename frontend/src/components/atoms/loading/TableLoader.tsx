'use client';

import React from 'react';

interface TableLoaderProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export default function TableLoader({
  rows = 5,
  columns = 4,
  className = '',
  showHeader = true,
}: TableLoaderProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    >
      <div className='p-6'>
        {/* Header */}
        <div className='animate-pulse mb-6'>
          <div className='h-6 bg-gray-200 rounded w-48 mb-2'></div>
          <div className='h-4 bg-gray-200 rounded w-64'></div>
        </div>

        {/* Table/List skeleton */}
        <div className='animate-pulse space-y-4'>
          {showHeader && (
            <div className='grid grid-cols-4 gap-4 pb-4 border-b border-gray-200'>
              {[...Array(columns)].map((_, i) => (
                <div key={i} className='h-4 bg-gray-200 rounded'></div>
              ))}
            </div>
          )}

          {[...Array(rows)].map((_, rowIndex) => (
            <div key={rowIndex} className='grid grid-cols-4 gap-4 py-3'>
              {[...Array(columns)].map((_, colIndex) => (
                <div key={colIndex} className='h-4 bg-gray-200 rounded'></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
