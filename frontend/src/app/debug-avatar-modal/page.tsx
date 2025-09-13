'use client';

import React, { useState, useEffect } from 'react';
import Avatar from '@/components/atoms/display/Avatar';

export default function DebugAvatarModal() {
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    // Simulate the actual URL that comes from backend getFileUrl function
    const backendGeneratedUrl =
      'http://localhost:8080/api/v1/files/students/profile-1757667447140-983968297.png';

    const simulatedStudent = {
      id: 1,
      name: 'Vijay Vijay Suthan',
      firstName: 'Vijay',
      lastName: 'Suthan',
      avatar: undefined, // Frontend doesn't have this initially
      profilePhotoUrl: backendGeneratedUrl, // This is what backend returns
    };

    // Transform like we do in the actual app
    const transformedStudent = {
      ...simulatedStudent,
      avatar:
        simulatedStudent.avatar ||
        simulatedStudent.profilePhotoUrl ||
        undefined,
    };

    setTestData({
      original: simulatedStudent,
      transformed: transformedStudent,
      backendUrl: backendGeneratedUrl,
    });
  }, []);

  if (!testData) return <div>Loading...</div>;

  return (
    <div className='p-8 space-y-8'>
      <h1 className='text-2xl font-bold'>Avatar Debug Page</h1>

      <div className='grid grid-cols-2 gap-8'>
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>List Context (Working)</h2>
          <div className='p-4 border rounded'>
            <Avatar
              src={testData.transformed.avatar}
              name={testData.transformed.name}
              role='student'
              context='debug-list'
              className='w-10 h-10 rounded-full'
            />
          </div>
          <pre className='text-xs bg-gray-100 p-2 rounded'>
            {JSON.stringify(testData.transformed, null, 2)}
          </pre>
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Modal Context (Not Working)</h2>
          <div className='p-4 border rounded'>
            <Avatar
              src={testData.transformed.avatar}
              name={testData.transformed.name}
              role='student'
              context='debug-modal'
              className='w-24 h-24 rounded-full'
            />
          </div>
          <pre className='text-xs bg-gray-100 p-2 rounded'>
            {JSON.stringify(testData.transformed, null, 2)}
          </pre>
        </div>
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Direct URL Test</h2>
        <div className='grid grid-cols-3 gap-4'>
          <div className='p-4 border rounded'>
            <h3 className='font-medium mb-2'>Backend Generated URL</h3>
            <p className='text-xs mb-2 text-gray-600'>{testData.backendUrl}</p>
            <img
              src={testData.backendUrl}
              alt='test'
              className='w-16 h-16 object-cover rounded'
              onError={e => console.error('Backend URL failed:', e)}
              onLoad={() => console.log('Backend URL loaded')}
            />
          </div>
          <div className='p-4 border rounded'>
            <h3 className='font-medium mb-2'>Proxy URL</h3>
            <p className='text-xs mb-2 text-gray-600'>
              /api/v1/files/students/profile-1757667447140-983968297.png
            </p>
            <img
              src='/api/v1/files/students/profile-1757667447140-983968297.png'
              alt='test'
              className='w-16 h-16 object-cover rounded'
              onError={e => console.error('Proxy URL failed:', e)}
              onLoad={() => console.log('Proxy URL loaded')}
            />
          </div>
          <div className='p-4 border rounded'>
            <h3 className='font-medium mb-2'>Avatar Component URL</h3>
            <p className='text-xs mb-2 text-gray-600'>
              Via Avatar getValidImageSrc
            </p>
            <Avatar
              src={testData.transformed.avatar}
              name={testData.transformed.name}
              role='student'
              context='debug-url-test'
              className='w-16 h-16 rounded'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
