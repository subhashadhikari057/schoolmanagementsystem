'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Clock, Users } from 'lucide-react';

interface Submission {
  id: string;
  studentName: string;
  subject: string;
  assignment: string;
  timeAgo: string;
}

export default function SubmissionsTab() {
  const submissions: Submission[] = [
    {
      id: '1',
      studentName: 'Alice Johnson',
      subject: 'Science',
      assignment: 'Railway Essay',
      timeAgo: '2 hours ago',
    },
    {
      id: '2',
      studentName: 'Bob Smith',
      subject: 'Optional Mathematics',
      assignment: 'Coordinate Geometry',
      timeAgo: '4 hours ago',
    },
    {
      id: '3',
      studentName: 'Carol Davis',
      subject: 'Physics Lab',
      assignment: 'Physics Lab Report',
      timeAgo: '6 hours ago',
    },
    {
      id: '4',
      studentName: 'David Wilson',
      subject: 'Science',
      assignment: 'Railway Essay',
      timeAgo: '1 day ago',
    },
    {
      id: '5',
      studentName: 'Emma Brown',
      subject: 'Chemistry Theory',
      assignment: 'Chemical Bonding',
      timeAgo: '1 day ago',
    },
    {
      id: '6',
      studentName: 'Frank Miller',
      subject: 'Science',
      assignment: 'Photosynthesis',
      timeAgo: '2 days ago',
    },
  ];

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();

  return (
    <div className='space-y-6 px-3 sm:px-0'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <SectionTitle
            text='Recent Submissions'
            level={3}
            className='text-lg sm:text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600 text-sm sm:text-base'>
            Latest student submissions that need your attention
          </Label>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Users className='w-4 h-4' />
          <span>{submissions.length} new submissions</span>
        </div>
      </div>

      {/* Submissions List */}
      <div className='bg-white rounded-xl border border-gray-200 shadow-sm'>
        <div className='p-4 sm:p-6'>
          <div className='divide-y divide-gray-100'>
            {submissions.map(submission => (
              <div key={submission.id} className='py-4 first:pt-0 last:pb-0'>
                {/* Row: stack on mobile, inline on sm+ */}
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  {/* Left: avatar + details */}
                  <div className='flex items-start sm:items-center gap-3 sm:gap-4 min-w-0'>
                    <div className='w-10 h-10 shrink-0 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-600 font-semibold text-sm'>
                        {initials(submission.studentName)}
                      </span>
                    </div>
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2 sm:gap-3 mb-1'>
                        <span className='font-medium text-gray-900 text-sm sm:text-base truncate max-w-[14rem] sm:max-w-none'>
                          {submission.studentName}
                        </span>
                        <span className='inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] sm:text-xs rounded-full truncate max-w-[12rem]'>
                          {submission.subject}
                        </span>
                      </div>
                      <div className='text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-none'>
                        {submission.assignment}
                      </div>
                    </div>
                  </div>

                  {/* Right: time + action */}
                  <div className='flex flex-col-reverse gap-2 xs:flex-row xs:items-center xs:justify-end xs:gap-3 sm:gap-4'>
                    <div className='flex items-center gap-1.5 text-xs sm:text-sm text-gray-500'>
                      <Clock className='w-4 h-4 shrink-0' />
                      <span>{submission.timeAgo}</span>
                    </div>
                    <Button
                      label='Review'
                      className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 w-full xs:w-auto'
                      aria-label={`Review submission from ${submission.studentName}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State (if no submissions) */}
      {submissions.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Users className='w-8 h-8 text-gray-400' />
          </div>
          <Label className='text-gray-500 text-lg'>No new submissions</Label>
          <Label className='text-gray-400'>
            Students will appear here when they submit assignments
          </Label>
        </div>
      )}
    </div>
  );
}
