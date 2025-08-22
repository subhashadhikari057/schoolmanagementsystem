'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { AlertTriangle, Clock, CheckCircle, BarChart3 } from 'lucide-react';

interface GradingAssignment {
  id: string;
  title: string;
  class: string;
  ungradedCount: number;
  totalSubmissions: number;
  avgGradingTime: string;
}

export default function GradingTab() {
  const gradingAssignments: GradingAssignment[] = [
    {
      id: '1',
      title: 'An essay about Railway In Nepal (minimum 300 words)',
      class: 'Class 8-A',
      ungradedCount: 7,
      totalSubmissions: 12,
      avgGradingTime: '2.5 hrs',
    },
    {
      id: '2',
      title: 'Complete Coordinate Geometry Problem Set, Page-34',
      class: 'Class 9-A',
      ungradedCount: 5,
      totalSubmissions: 25,
      avgGradingTime: '1.8 hrs',
    },
    {
      id: '3',
      title: "Physics Lab Report - Newton's Laws of Motion",
      class: 'Class 11-A',
      ungradedCount: 8,
      totalSubmissions: 8,
      avgGradingTime: '3.2 hrs',
    },
    {
      id: '4',
      title: 'Photosynthesis Diagram and Explanation',
      class: 'Class 7-B',
      ungradedCount: 13,
      totalSubmissions: 28,
      avgGradingTime: '2.1 hrs',
    },
  ];

  const totalUngraded = gradingAssignments.reduce(
    (sum, assignment) => sum + assignment.ungradedCount,
    0,
  );
  const avgGradingTime =
    gradingAssignments.reduce((sum, assignment) => {
      const time = parseFloat(assignment.avgGradingTime.replace(' hrs', ''));
      return sum + time;
    }, 0) / gradingAssignments.length;

  return (
    <div className='space-y-6 px-2 sm:px-0'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0'>
        <div>
          <SectionTitle
            text='Assignments Requiring Attention'
            level={3}
            className='text-lg sm:text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600 text-sm sm:text-base'>
            Focus on these assignments that need grading
          </Label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6'>
        {/* Primary Attention Card */}
        <div className='sm:col-span-1 md:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm'>
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center'>
              <AlertTriangle className='w-6 h-6 sm:w-8 sm:h-8 text-red-600' />
            </div>
            <div>
              <div className='text-2xl sm:text-3xl font-bold text-red-600'>
                {totalUngraded}
              </div>
              <Label className='text-gray-600 text-sm sm:text-base'>
                Pending Grading
              </Label>
            </div>
          </div>
        </div>

        {/* Average Grading Time */}
        <div className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm'>
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center'>
              <Clock className='w-6 h-6 sm:w-8 sm:h-8 text-yellow-600' />
            </div>
            <div>
              <div className='text-2xl sm:text-3xl font-bold text-yellow-600'>
                {avgGradingTime.toFixed(1)} hrs
              </div>
              <Label className='text-gray-600 text-sm sm:text-base'>
                Avg Grading Time
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className='space-y-4'>
        {gradingAssignments.map(assignment => (
          <div
            key={assignment.id}
            className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm'
          >
            <div className='flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 sm:gap-0'>
              <div className='flex-1 w-full'>
                <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-2'>
                  {assignment.title}
                </h3>
                <div className='flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600 mb-3'>
                  <span>{assignment.class}</span>
                  <span className='text-orange-600 font-medium'>
                    {assignment.ungradedCount} ungraded
                  </span>
                </div>
                <div className='flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500'>
                  <div className='flex items-center gap-2'>
                    <BarChart3 className='w-4 h-4' />
                    <span>{assignment.totalSubmissions} total submissions</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4' />
                    <span>Avg: {assignment.avgGradingTime}</span>
                  </div>
                </div>
              </div>

              <div className='w-full sm:w-auto mt-4 sm:mt-0'>
                <Button
                  label='Grade Now'
                  className='bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 w-full sm:w-auto'
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {gradingAssignments.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <CheckCircle className='w-8 h-8 text-green-600' />
          </div>
          <Label className='text-gray-500 text-base sm:text-lg'>
            All caught up!
          </Label>
          <Label className='text-gray-400 text-sm sm:text-base'>
            No assignments require grading at the moment
          </Label>
        </div>
      )}
    </div>
  );
}
