'use client';

import React from 'react';

interface PageLoaderProps {
  className?: string;
}

export default function PageLoader({ className = '' }: PageLoaderProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        {/* Header skeleton */}
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-64'></div>
          <div className='h-4 bg-gray-200 rounded w-48'></div>
        </div>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Content skeleton */}
          <div className='animate-pulse space-y-6'>
            {/* Stats grid skeleton */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='h-24 bg-gray-200 rounded-lg'></div>
              ))}
            </div>

            {/* Main content skeleton */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2 space-y-4'>
                <div className='h-64 bg-gray-200 rounded-lg'></div>
                <div className='h-48 bg-gray-200 rounded-lg'></div>
              </div>
              <div className='space-y-4'>
                <div className='h-32 bg-gray-200 rounded-lg'></div>
                <div className='h-32 bg-gray-200 rounded-lg'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
