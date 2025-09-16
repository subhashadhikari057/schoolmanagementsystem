'use client';

import React from 'react';
import Avatar from '../../components/atoms/display/Avatar';

// Simple test page to debug image loading
export default function SimpleImageTest() {
  // Test with the direct backend URL that we know works
  const testImageUrl =
    'http://localhost:8080/api/v1/files/students/profile-1757667447140-983968297.png';

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-bold'>Simple Image Test</h1>

      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Direct Backend URL Test</h2>
        <div className='flex items-center space-x-4 border p-4 rounded'>
          <Avatar
            src={testImageUrl}
            name='Test Student'
            role='student'
            className='w-16 h-16 rounded-full'
          />
          <div>
            <p className='font-medium'>Direct Backend URL</p>
            <p className='text-sm text-gray-600 break-all'>{testImageUrl}</p>
          </div>
        </div>

        <h2 className='text-lg font-semibold'>Regular img tag test</h2>
        <div className='flex items-center space-x-4 border p-4 rounded'>
          <img
            src={testImageUrl}
            alt='Test'
            className='w-16 h-16 rounded-full object-cover'
            onError={e => {
              console.log('Image failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={e => {
              console.log('Image loaded successfully');
            }}
          />
          <div>
            <p className='font-medium'>Regular img tag</p>
            <p className='text-sm text-gray-600'>
              Direct image without Avatar component
            </p>
          </div>
        </div>

        <h2 className='text-lg font-semibold'>Proxy URL Test</h2>
        <div className='flex items-center space-x-4 border p-4 rounded'>
          <img
            src='/api/v1/files/students/profile-1757667447140-983968297.png'
            alt='Test'
            className='w-16 h-16 rounded-full object-cover'
            onError={e => {
              console.log('Proxy image failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={e => {
              console.log('Proxy image loaded successfully');
            }}
          />
          <div>
            <p className='font-medium'>Proxy URL</p>
            <p className='text-sm text-gray-600'>
              /api/v1/files/students/profile-1757667447140-983968297.png
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
