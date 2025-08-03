'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction, Clock } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  expectedFeatures?: string[];
  backUrl?: string;
}

export default function PlaceholderPage({
  title,
  description = 'This page is currently under development.',
  expectedFeatures = [],
  backUrl = '/dashboard/admin',
}: PlaceholderPageProps) {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center'>
        {/* Icon */}
        <div className='mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6'>
          <Construction className='w-8 h-8 text-yellow-600' />
        </div>

        {/* Title */}
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>{title}</h1>

        {/* Description */}
        <p className='text-gray-600 mb-6'>{description}</p>

        {/* Expected Features */}
        {expectedFeatures.length > 0 && (
          <div className='bg-blue-50 rounded-lg p-4 mb-6 text-left'>
            <h3 className='font-semibold text-blue-900 mb-2 flex items-center'>
              <Clock className='w-4 h-4 mr-2' />
              Coming Soon:
            </h3>
            <ul className='text-blue-800 text-sm space-y-1'>
              {expectedFeatures.map((feature, index) => (
                <li key={index} className='flex items-start'>
                  <span className='text-blue-500 mr-2'>•</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className='space-y-3'>
          <button
            onClick={() => router.push(backUrl)}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Dashboard
          </button>

          <button
            onClick={() => router.back()}
            className='w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200'
          >
            Go Back
          </button>
        </div>

        {/* Status Badge */}
        <div className='mt-6 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
          🚧 In Development
        </div>
      </div>
    </div>
  );
}
