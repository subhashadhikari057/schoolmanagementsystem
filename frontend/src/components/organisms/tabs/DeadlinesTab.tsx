'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Calendar, Users, AlertTriangle } from 'lucide-react';

interface DeadlineAssignment {
  id: string;
  title: string;
  class: string;
  subject: string;
  daysLeft: number;
  totalStudents: number;
  submissions: number;
  isUrgent: boolean;
}

export default function DeadlinesTab() {
  const deadlineAssignments: DeadlineAssignment[] = [
    {
      id: '1',
      title: 'An essay about Railway In Nepal (minimum 300 words)',
      class: 'Class 8-A',
      subject: 'Science',
      daysLeft: 1,
      totalStudents: 50,
      submissions: 12,
      isUrgent: true,
    },
    {
      id: '2',
      title: 'Complete Coordinate Geometry Problem Set, Page-34',
      class: 'Class 9-A',
      subject: 'Optional Mathematics',
      daysLeft: 4,
      totalStudents: 30,
      submissions: 25,
      isUrgent: false,
    },
    {
      id: '3',
      title: "Physics Lab Report - Newton's Laws of Motion",
      class: 'Class 11-A',
      subject: 'Physics Lab',
      daysLeft: 6,
      totalStudents: 18,
      submissions: 8,
      isUrgent: false,
    },
  ];

  const getDaysLeftText = (days: number) => {
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const getDaysLeftColor = (days: number) => {
    if (days <= 1) return 'text-red-600';
    if (days <= 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='Upcoming Deadlines'
            level={3}
            className='text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600'>
            Track assignments with approaching due dates
          </Label>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Calendar className='w-4 h-4' />
          <span>{deadlineAssignments.length} upcoming deadlines</span>
        </div>
      </div>

      {/* Deadlines List */}
      <div className='space-y-4'>
        {deadlineAssignments.map(assignment => (
          <div
            key={assignment.id}
            className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-3'>
                  {assignment.isUrgent && (
                    <span className='inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full'>
                      Urgent
                    </span>
                  )}
                  <span className='inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full'>
                    {assignment.subject}
                  </span>
                </div>

                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {assignment.title}
                </h3>

                <div className='flex items-center gap-6 text-sm text-gray-600 mb-4'>
                  <div className='flex items-center gap-2'>
                    <Users className='w-4 h-4' />
                    <span>{assignment.class}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    <span className={getDaysLeftColor(assignment.daysLeft)}>
                      {getDaysLeftText(assignment.daysLeft)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Users className='w-4 h-4' />
                    <span>{assignment.totalStudents} students</span>
                  </div>
                </div>

                {/* Submission Progress */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-600'>Submissions:</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {assignment.submissions}/{assignment.totalStudents}
                    </span>
                  </div>
                  <div className='text-sm text-gray-500'>
                    {Math.round(
                      (assignment.submissions / assignment.totalStudents) * 100,
                    )}
                    % submitted
                  </div>
                </div>

                <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${(assignment.submissions / assignment.totalStudents) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Submission Count Box */}
              <div className='ml-6'>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-center'>
                  <div className='text-lg font-bold text-blue-600'>
                    {assignment.submissions}/{assignment.totalStudents}
                  </div>
                  <div className='text-xs text-blue-600'>submissions</div>
                </div>
              </div>
            </div>

            {/* Urgent Warning */}
            {assignment.isUrgent && (
              <div className='mt-4 pt-4 border-t border-gray-200'>
                <div className='flex items-center gap-2 text-red-600'>
                  <AlertTriangle className='w-4 h-4' />
                  <span className='text-sm font-medium'>
                    This assignment is due soon! Consider sending a reminder to
                    students.
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {deadlineAssignments.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Calendar className='w-8 h-8 text-green-600' />
          </div>
          <Label className='text-gray-500 text-lg'>No upcoming deadlines</Label>
          <Label className='text-gray-400'>
            All assignments have comfortable due dates
          </Label>
        </div>
      )}
    </div>
  );
}
