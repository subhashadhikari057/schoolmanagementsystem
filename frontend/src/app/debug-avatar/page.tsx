'use client';

import React, { useEffect, useState } from 'react';
import Avatar from '../../components/atoms/display/Avatar';

// Test component to debug avatar image loading
export default function AvatarDebugTest() {
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch actual students data to see what URLs we're getting
    fetch('/api/v1/students?page=1&limit=3')
      .then(response => response.json())
      .then(data => {
        console.log('Students API Response:', data);
        if (data.success && data.data) {
          setStudentsData(data.data);
        }
      })
      .catch(error => {
        console.error('Error fetching students:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const testUrls = [
    // Different URL formats to test
    'http://localhost:8080/api/v1/files/students/profile-1757667447140-983968297.png',
    '/api/v1/files/students/profile-1757667447140-983968297.png',
    'api/v1/files/students/profile-1757667447140-983968297.png',
    '/uploads/students/profiles/profile-1757667447140-983968297.png',
    'uploads/students/profiles/profile-1757667447140-983968297.png',
  ];

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-bold'>Avatar Debug Test</h1>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Test URLs</h2>
        {testUrls.map((url, index) => (
          <div
            key={index}
            className='flex items-center space-x-4 border p-4 rounded'
          >
            <Avatar
              src={url}
              name='Test Student'
              role='student'
              className='w-12 h-12 rounded-full'
            />
            <div className='flex-1'>
              <p className='font-medium'>Test {index + 1}</p>
              <p className='text-sm text-gray-600 break-all'>{url}</p>
            </div>
          </div>
        ))}
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Actual Students Data</h2>
        {loading ? (
          <p>Loading students...</p>
        ) : studentsData.length > 0 ? (
          studentsData.map((student, index) => (
            <div
              key={index}
              className='flex items-center space-x-4 border p-4 rounded'
            >
              <Avatar
                src={student.profilePhotoUrl}
                name={student.fullName || 'Unknown'}
                role='student'
                className='w-12 h-12 rounded-full'
              />
              <div className='flex-1'>
                <p className='font-medium'>
                  {student.fullName || 'Unknown Student'}
                </p>
                <p className='text-sm text-gray-600'>
                  Profile URL: {student.profilePhotoUrl || 'None'}
                </p>
                <p className='text-sm text-gray-500'>
                  Student ID: {student.studentId || 'N/A'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No students found or API error</p>
        )}
      </div>

      <div className='flex items-center space-x-4 border p-4 rounded'>
        <Avatar
          name='No Image Student'
          role='student'
          className='w-12 h-12 rounded-full'
        />
        <div>
          <p className='font-medium'>Fallback Test</p>
          <p className='text-sm text-gray-600'>
            No src provided - should show initials
          </p>
        </div>
      </div>
    </div>
  );
}
