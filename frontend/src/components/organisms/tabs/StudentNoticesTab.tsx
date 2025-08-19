'use client';

import React, { useMemo, useState } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import { AlertCircle } from 'lucide-react';

// Mock data for student notices
const mockNotices = [
  {
    id: '1',
    title: 'School Reopens',
    date: '2025-09-01',
    status: 'active',
    description: 'School will reopen on September 1st after summer break.',
  },
  {
    id: '2',
    title: 'Parent-Teacher Meeting',
    date: '2025-09-10',
    status: 'upcoming',
    description: 'Parent-Teacher meeting scheduled for September 10th.',
  },
  {
    id: '3',
    title: 'Board Exam Notice',
    date: '2025-11-01',
    status: 'important',
    description:
      'Board exams will start from November 5th. Prepare accordingly.',
  },
  {
    id: '4',
    title: 'Holiday Notice',
    date: '2025-10-02',
    status: 'active',
    description:
      'School will remain closed on October 2nd for a public holiday.',
  },
];

interface StudentNotice {
  id: string;
  title: string;
  date: string;
  status: 'active' | 'upcoming' | 'important';
  description: string;
}

interface StudentNoticesTabProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export default function StudentNoticesTab({
  statusFilter,
  setStatusFilter,
}: StudentNoticesTabProps) {
  const [query, setQuery] = useState('');

  const filteredNotices = useMemo(() => {
    return mockNotices.filter(notice => {
      const matchesQuery =
        notice.title.toLowerCase().includes(query.toLowerCase()) ||
        notice.description.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && notice.status === 'active') ||
        (statusFilter === 'upcoming' && notice.status === 'upcoming') ||
        (statusFilter === 'important' && notice.status === 'important');

      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  return (
    <div className='space-y-6'>
      {/* Search and Filters */}
      <div className='flex flex-row gap-3 items-center w-full'>
        <div className='flex-1'>
          <LabeledInputField
            label=''
            placeholder='Search notices...'
            value={query}
            onChange={e => setQuery(e.target.value)}
            className='bg-white border border-gray-200 rounded-lg px-4 py-2 w-full'
          />
        </div>
        <Dropdown
          type='filter'
          title='Filter Status'
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'important', label: 'Important' },
          ]}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
          className='max-w-xs'
        />
      </div>

      {/* Notices List */}
      <div className='space-y-4'>
        {filteredNotices.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>
                No notices match your current filters.
              </p>
            </div>
          </div>
        ) : (
          filteredNotices.map(notice => (
            <div
              key={notice.id}
              className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        notice.status === 'active'
                          ? 'bg-blue-100 text-blue-700'
                          : notice.status === 'upcoming'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {notice.status}
                    </span>
                  </div>

                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    {notice.title}
                  </h3>

                  <div className='flex items-center gap-6 text-sm text-gray-600'>
                    <div className='flex items-center gap-2'>
                      <span>Date: {notice.date}</span>
                    </div>
                  </div>
                </div>

                <div className='flex gap-3'>
                  <Button
                    label='View Notice'
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700'
                    onClick={() => alert(notice.description)}
                  />
                </div>
              </div>

              {/* Notice Description */}
              <div className='mt-4 pt-4 border-t border-gray-200'>
                <span className='text-gray-600 text-sm'>
                  {notice.description}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
