'use client';

import React from 'react';

interface CardGridLoaderProps {
  cards?: number;
  className?: string;
  cardHeight?: string;
  columns?: string;
}

export default function CardGridLoader({
  cards = 6,
  className = '',
  cardHeight = 'h-32',
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}: CardGridLoaderProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className='animate-pulse'>
        <div className='h-6 bg-gray-200 rounded w-48 mb-2'></div>
        <div className='h-4 bg-gray-200 rounded w-64'></div>
      </div>

      {/* Cards grid skeleton */}
      <div className={`grid ${columns} gap-4`}>
        {[...Array(cards)].map((_, i) => (
          <div
            key={i}
            className={`bg-gray-200 animate-pulse rounded-lg ${cardHeight}`}
          ></div>
        ))}
      </div>
    </div>
  );
}
