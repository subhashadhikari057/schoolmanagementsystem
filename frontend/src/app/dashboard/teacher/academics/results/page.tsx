'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Plus } from 'lucide-react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import ExamsTab from '@/components/organisms/tabs/ExamsTab';
import ResultsTab from '@/components/organisms/tabs/ResultsTab';
import AnalyticsTab from '@/components/organisms/tabs/AnalyticsTab';
import ReportsTab from '@/components/organisms/tabs/ReportsTab';

export default function ResultsPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <SectionTitle
              text='Exams & Results'
              level={1}
              className='text-3xl font-bold text-gray-900 mb-2'
            />
            <Label className='text-lg text-gray-600'>
              Manage examinations and track student performance
            </Label>
          </div>
          <Button
            label='Create Exam'
            className='bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2'
          >
            <Plus className='w-4 h-4' />
            <span>Create Exam</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm text-gray-600 mb-1'>
                  Total Exams
                </Label>
                <div className='text-2xl font-bold text-gray-900'>4</div>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 14l9-5-9-5-9 5 9 5z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm text-gray-600 mb-1'>Completed</Label>
                <div className='text-2xl font-bold text-gray-900'>2</div>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm text-gray-600 mb-1'>Students</Label>
                <div className='text-2xl font-bold text-gray-900'>125</div>
              </div>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm text-gray-600 mb-1'>Avg Score</Label>
                <div className='text-2xl font-bold text-gray-900'>82.2%</div>
              </div>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-orange-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { name: 'Exams', content: <ExamsTab /> },
            { name: 'Results', content: <ResultsTab /> },
            { name: 'Analytics', content: <AnalyticsTab /> },
            { name: 'Reports', content: <ReportsTab /> },
          ]}
        />
      </div>
    </div>
  );
}
