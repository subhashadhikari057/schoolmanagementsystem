'use client';

import React, { useMemo, useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { BookOpen } from 'lucide-react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';

export default function SubjectsTabs() {
  const subjects = [
    {
      name: 'Science',
      classes: ['Class 7-B', 'Class 8-A', 'Class 8-B'],
      students: 89,
      assignments: 12,
      completion: 87,
      status: 'active',
    },
    {
      name: 'Optional Mathematics',
      classes: ['Class 9-A', 'Class 10-B'],
      students: 54,
      assignments: 8,
      completion: 92,
      status: 'active',
    },
    {
      name: 'Physics Lab',
      classes: ['Class 11-A', 'Class 12-A'],
      students: 32,
      assignments: 5,
      completion: 95,
      status: 'active',
    },
    {
      name: 'Chemistry Theory',
      classes: ['Class 11-B', 'Class 12-B'],
      students: 28,
      assignments: 6,
      completion: 89,
      status: 'inactive',
    },
  ];

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjects.filter(sub => {
      const matchesQuery =
        q.length === 0 ||
        sub.name.toLowerCase().includes(q) ||
        sub.classes.some(c => c.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === 'all' ? true : sub.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [subjects, query, statusFilter]);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='w-full sm:flex-1'>
          <LabeledInputField
            type='search'
            value={query}
            onChange={e => setQuery((e.target as HTMLInputElement).value)}
            placeholder='Search subjects...'
            className='w-full bg-white'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z'
                />
              </svg>
            }
          />
        </div>
        <div className='flex items-center gap-2'>
          <Dropdown
            type='filter'
            title='Filter Status'
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            selectedValue={statusFilter}
            onSelect={value =>
              setStatusFilter(value as 'all' | 'active' | 'inactive')
            }
            className='max-w-xs'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {filteredSubjects.map(sub => (
          <div
            key={sub.name}
            className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
          >
            <div className='flex items-start justify-between'>
              <div>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center'>
                    <BookOpen className='w-4 h-4' />
                  </div>
                  <div className='text-base font-semibold text-gray-900'>
                    {sub.name}
                  </div>
                </div>
                <Label className='mt-1'>{sub.classes.length} classes</Label>
              </div>
              <span
                className={`text-[10px] px-2 py-1 rounded-full font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {sub.status}
              </span>
            </div>

            <div className='grid grid-cols-3 gap-4 mt-4'>
              <div>
                <div className='text-lg font-semibold text-gray-900'>
                  {sub.students}
                </div>
                <Label className='mt-1'>Students</Label>
              </div>
              <div>
                <div className='text-lg font-semibold text-gray-900'>
                  {sub.assignments}
                </div>
                <Label className='mt-1'>Assignments</Label>
              </div>
              <div>
                <div className='text-lg font-semibold text-gray-900'>
                  {sub.completion}%
                </div>
                <Label className='mt-1'>Completion</Label>
              </div>
            </div>

            <div className='mt-3'>
              <div className='h-2 w-full bg-gray-200 rounded-full'>
                <div
                  className='h-2 bg-blue-600 rounded-full'
                  style={{ width: `${sub.completion}%` }}
                />
              </div>
            </div>

            <div className='mt-4'>
              <Label className='mb-2'>Classes:</Label>
              <div className='flex items-center gap-2 flex-wrap'>
                {sub.classes.map(c => (
                  <span
                    key={c}
                    className='px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs'
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
