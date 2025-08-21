'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Users } from 'lucide-react';

interface StudentResult {
  id: string;
  studentName: string;
  class: string;
  grade: string;
  rollNo: string;
  marks: string;
  percentage: number;
}

export default function ResultsTab() {
  const studentResults: StudentResult[] = [
    {
      id: '1',
      studentName: 'David Wilson',
      class: 'Class 9-A',
      grade: 'A+',
      rollNo: '9401',
      marks: '75/80',
      percentage: 93.75,
    },
    {
      id: '2',
      studentName: 'Alice Johnson',
      class: 'Class 7-B',
      grade: 'A',
      rollNo: '7203',
      marks: '68/80',
      percentage: 85,
    },
    {
      id: '3',
      studentName: 'Bob Smith',
      class: 'Class 7-B',
      grade: 'B',
      rollNo: '7208',
      marks: '57.6/80',
      percentage: 72,
    },
    {
      id: '4',
      studentName: 'Carol Davis',
      class: 'Class 7-B',
      grade: 'B',
      rollNo: '7212',
      marks: '54.4/80',
      percentage: 68,
    },
    {
      id: '5',
      studentName: 'Eva Brown',
      class: 'Class 9-A',
      grade: 'A',
      rollNo: '9405',
      marks: '65/80',
      percentage: 81.25,
    },
  ];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'bg-green-100 text-green-700';
      case 'A':
        return 'bg-blue-100 text-blue-700';
      case 'B':
        return 'bg-yellow-100 text-yellow-700';
      case 'C':
        return 'bg-orange-100 text-orange-700';
      case 'D':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <SectionTitle
            text='Recent Results'
            level={3}
            className='text-lg sm:text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600 text-sm sm:text-base'>
            Latest student examination results
          </Label>
        </div>
        <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-600'>
          <Users className='w-4 h-4' />
          <span>{studentResults.length} results</span>
        </div>
      </div>

      {/* Results List */}
      <div className='bg-white rounded-xl border border-gray-200 shadow-sm'>
        <div className='p-3 sm:p-6'>
          <div className='space-y-4'>
            {studentResults.map(result => (
              <div
                key={result.id}
                className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 last:border-b-0'
              >
                <div className='flex items-center gap-3 sm:gap-4 min-w-0'>
                  <div className='w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <span className='text-blue-600 font-semibold text-xs sm:text-sm'>
                      {result.studentName
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2 sm:gap-3 mb-1'>
                      <span className='font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none'>
                        {result.studentName}
                      </span>
                      <span className='inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full'>
                        {result.class}
                      </span>
                    </div>
                    <div className='text-xs sm:text-sm text-gray-600'>
                      Roll No: {result.rollNo}
                    </div>
                  </div>
                </div>

                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6'>
                  <div className='flex flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 overflow-x-auto'>
                    <div className='text-center min-w-[70px]'>
                      <span className='text-gray-500'>Marks:</span>
                      <div className='font-medium text-gray-900'>
                        {result.marks}
                      </div>
                    </div>
                    <div className='text-center min-w-[90px]'>
                      <span className='text-gray-500'>Percentage:</span>
                      <div className='font-medium text-gray-900'>
                        {result.percentage}%
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0'>
                    <span
                      className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getGradeColor(result.grade)}`}
                    >
                      {result.grade}
                    </span>
                    <Button
                      label='View Details'
                      className='bg-gray-100 text-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 w-full sm:w-auto'
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {studentResults.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Users className='w-8 h-8 text-gray-400' />
          </div>
          <Label className='text-gray-500 text-lg'>No results available</Label>
          <Label className='text-gray-400'>
            Student results will appear here after exams are graded
          </Label>
        </div>
      )}
    </div>
  );
}
