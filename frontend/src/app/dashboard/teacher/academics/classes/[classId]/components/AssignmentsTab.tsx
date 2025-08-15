'use client';

import React from 'react';
import { Plus, FileText } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';

interface ClassDetails {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  currentEnrollment?: number;
}

interface AssignmentsTabProps {
  classDetails: ClassDetails;
}

// Mock assignment data based on the image
const mockAssignments = [
  {
    id: '1',
    title: 'An essay about Railway in Nepal (minimum 300 words)',
    subject: 'Science',
    class: '8-A',
    submissions: '0/50',
    type: 'essay',
  },
  {
    id: '2',
    title: 'An essay about Railway in Nepal (minimum 300 words)',
    subject: 'Science',
    class: '8-A',
    submissions: '0/50',
    type: 'essay',
  },
  {
    id: '3',
    title: 'Complete Coordinate Geometry Problem Set, Page 34 - Optional Maths',
    subject: 'Optional Maths',
    class: '7-A',
    submissions: '12/50',
    type: 'problem-set',
  },
  {
    id: '4',
    title: 'Complete Coordinate Geometry Problem Set, Page 34 - Optional Maths',
    subject: 'Optional Maths',
    class: '7-A',
    submissions: '12/50',
    type: 'problem-set',
  },
];

export default function AssignmentsTab({ classDetails }: AssignmentsTabProps) {
  return (
    <div className='bg-white rounded-lg p-6'>
      {/* Header with Add Assignment Button */}
      <div className='bg-blue-600 text-white rounded-lg p-4 flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <FileText className='w-5 h-5' />
          <span className='font-medium'>Add a new Assignment</span>
        </div>
        <Button className='bg-white text-blue-600 hover:bg-gray-100 px-3 py-1 rounded flex items-center gap-2'>
          <Plus className='w-4 h-4' />
        </Button>
      </div>

      {/* Assignments Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {mockAssignments.map(assignment => (
          <div
            key={assignment.id}
            className='bg-white border border-gray-200 rounded-lg p-6'
          >
            {/* Assignment Title */}
            <div className='mb-4'>
              <h3 className='font-medium text-gray-900 mb-2 leading-tight'>
                {assignment.title}
              </h3>
              <div className='text-sm text-gray-600 mb-1'>
                Subject: {assignment.subject}
              </div>
              <div className='text-sm text-gray-600'>
                Class: {assignment.class}
              </div>
            </div>

            {/* Submissions Count */}
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-600'>
                {assignment.submissions} Submissions
              </div>
              <Button
                label='Learn More'
                className='bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm'
              />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (if no assignments) */}
      {mockAssignments.length === 0 && (
        <div className='text-center py-12 bg-gray-50 rounded-lg'>
          <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
          <div className='text-lg font-medium text-gray-900 mb-2'>
            No assignments yet
          </div>
          <div className='text-gray-600 mb-6'>
            Create your first assignment for this class
          </div>
          <Button
            label='Create Assignment'
            icon={<Plus className='w-4 h-4' />}
            className='bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded flex items-center gap-2 mx-auto'
          />
        </div>
      )}
    </div>
  );
}
