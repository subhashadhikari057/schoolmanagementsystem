'use client';

import React, { useState } from 'react';
import { Search, Users } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';

import Button from '@/components/atoms/form-controls/Button';

interface ClassDetails {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  currentEnrollment?: number;
  students?: Array<{
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
      email?: string;
      phone?: string;
    };
  }>;
}

interface StudentsTabProps {
  classDetails: ClassDetails;
}

// Mock student data based on the image - in real app, this would come from classDetails.students
const mockStudents = [
  {
    id: '1',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '2',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '3',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '4',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '5',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '6',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '7',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '8',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '9',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '10',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '11',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
  {
    id: '12',
    name: 'Shobha Ghurti',
    email: 'subha@gmail.com',
    rollNumber: 'SG',
    avatar: '/placeholder-avatar.jpg',
  },
];

export default function StudentsTab({ classDetails }: StudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Use actual student data if available, otherwise use mock data
  const students =
    classDetails.students?.map(student => ({
      id: student.id,
      name: student.user.fullName,
      email: student.user.email || 'No email',
      rollNumber: student.rollNumber,
      avatar: '/placeholder-avatar.jpg', // You might want to add avatar field to the API
    })) || mockStudents;

  // Filter students based on search term
  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className='bg-white rounded-lg p-6'>
      {/* Header with Students Attendance indicator */}
      <div className='bg-blue-600 text-white rounded-lg p-4 flex items-center gap-3 mb-6'>
        <Users className='w-5 h-5' />
        <span className='font-medium'>Students Attendance</span>
      </div>

      {/* Students Section */}
      <div>
        <SectionTitle
          text='Students'
          level={3}
          className='text-lg font-semibold text-gray-900 mb-4'
        />

        {/* Search */}
        <div className='max-w-md mb-6'>
          <LabeledInputField
            type='search'
            placeholder='Search students...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search className='text-gray-400 w-4 h-4' />}
          />
        </div>

        {/* Students Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {filteredStudents.map(student => (
            <div
              key={student.id}
              className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium'>
                  {student.rollNumber}
                </div>
                <div>
                  <div className='font-medium text-gray-900'>
                    {student.name}
                  </div>
                  <div className='text-sm text-gray-600'>{student.email}</div>
                </div>
              </div>
              <Button
                label='Contact'
                className='text-blue-600 bg-transparent border border-blue-600 hover:bg-blue-50 px-4 py-1 text-sm rounded'
              />
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className='text-center py-8 text-gray-500'>
            No students found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
