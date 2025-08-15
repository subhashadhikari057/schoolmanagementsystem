'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Plus } from 'lucide-react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import AllAssignmentsTab from '@/components/organisms/tabs/AllAssignmentsTab';
import SubmissionsTab from '@/components/organisms/tabs/SubmissionsTab';
import GradingTab from '@/components/organisms/tabs/GradingTab';
import DeadlinesTab from '@/components/organisms/tabs/DeadlinesTab';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';

const statsData = [
  {
    value: '6',
    label: 'Total Assignments',
    change: '2 completed, 4 upcoming',
    color: 'bg-blue-600',
  },
];

export default function AssignmentsPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <SectionTitle
              text='Assignments'
              level={1}
              className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'
            />
            <Label className='text-xs cursor-pointer sm:text-sm lg:text-base text-gray-600 mt-1'>
              Manage school assignments and communicate with students here!
            </Label>
          </div>
          <Button className='bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            <span>New Assignment</span>
          </Button>
        </div>
      </div>
      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Top metrics via Statsgrid solid variant */}
          <Statsgrid
            variant='solid'
            stats={statsData.map(s => ({
              icon: () => null as any,
              bgColor: s.color,
              iconColor: '',
              value: s.value,
              label: s.label,
              change: s.change,
              isPositive: true,
            }))}
          />

          {/* Tabs */}
          <Tabs
            tabs={[
              { name: 'All', content: <AllAssignmentsTab /> },
              { name: 'Submissions', content: <SubmissionsTab /> },
              { name: 'Grading', content: <GradingTab /> },
              { name: 'Deadlines', content: <DeadlinesTab /> },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
