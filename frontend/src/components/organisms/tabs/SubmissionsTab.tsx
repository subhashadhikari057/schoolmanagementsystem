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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='Recent Submissions'
            level={3}
            className='text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600'>
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
        <div className='p-6'>
          <div className='space-y-4'>
            {submissions.map(submission => (
              <div
                key={submission.id}
                className='flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-blue-600 font-semibold text-sm'>
                      {submission.studentName
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <div className='flex items-center gap-3 mb-1'>
                      <span className='font-medium text-gray-900'>
                        {submission.studentName}
                      </span>
                      <span className='inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full'>
                        {submission.subject}
                      </span>
                    </div>
                    <div className='text-sm text-gray-600'>
                      {submission.assignment}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <Clock className='w-4 h-4' />
                    <span>{submission.timeAgo}</span>
                  </div>
                  <Button
                    label='Review'
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700'
                  />
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
