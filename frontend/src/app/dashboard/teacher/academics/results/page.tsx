'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Plus, BookOpen, CheckCircle, Users, BarChart3 } from 'lucide-react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import ExamsTab from '@/components/organisms/tabs/ExamsTab';
import ResultsTab from '@/components/organisms/tabs/ResultsTab';
import AnalyticsTab from '@/components/organisms/tabs/AnalyticsTab';
import ReportsTab from '@/components/organisms/tabs/ReportsTab';

export default function ResultsPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8'>
          <div className='flex-1'>
            <SectionTitle
              text='Exams & Results'
              level={1}
              className='text-2xl sm:text-3xl font-bold text-gray-900 mb-2'
            />
            <Label className='text-base sm:text-lg text-gray-600'>
              Manage examinations and track student performance
            </Label>
          </div>
          <div className='flex-shrink-0'>
            <Button
              label='Create Exam'
              className='bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center'
            >
              <Plus className='w-4 h-4' />
              <span className='hidden sm:inline'>Create Exam</span>
              <span className='sm:hidden'>New</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 mb-8'>
          {/* Card 1 */}
          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between h-full'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-xs sm:text-sm text-gray-600 mb-1'>
                  Total Exams
                </Label>
                <div className='text-xl sm:text-2xl font-bold text-gray-900'>
                  4
                </div>
              </div>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <BookOpen className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600' />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between h-full'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-xs sm:text-sm text-gray-600 mb-1'>
                  Completed
                </Label>
                <div className='text-xl sm:text-2xl font-bold text-gray-900'>
                  2
                </div>
              </div>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-5 h-5 sm:w-6 sm:h-6 text-green-600' />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between h-full'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-xs sm:text-sm text-gray-600 mb-1'>
                  Students
                </Label>
                <div className='text-xl sm:text-2xl font-bold text-gray-900'>
                  125
                </div>
              </div>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                <Users className='w-5 h-5 sm:w-6 sm:h-6 text-purple-600' />
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between h-full'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-xs sm:text-sm text-gray-600 mb-1'>
                  Avg Score
                </Label>
                <div className='text-xl sm:text-2xl font-bold text-gray-900'>
                  82.2%
                </div>
              </div>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <BarChart3 className='w-5 h-5 sm:w-6 sm:h-6 text-orange-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='w-full'>
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
    </div>
  );
}
