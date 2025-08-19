'use client';

import React, { useState } from 'react';
import Panel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import Button from '@/components/atoms/form-controls/Button';

import {
  FlaskConical,
  Calculator,
  Calendar,
  UserCheck,
  Plus,
} from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import AllNoticesTab from '@/components/organisms/tabs/AllNoticesTab';
import PinnedTab from '@/components/organisms/tabs/PinnedTab';
import ActivityTab from '@/components/organisms/tabs/ActivityTab';

const statsData = [
  {
    value: '6',
    label: 'Total Complaints',
    change: '2 completed, 4 upcoming',
    color: 'bg-blue-600',
  },
  {
    value: '158',
    label: 'Total Students',
    change: 'Across all classes',
    color: 'bg-green-600',
  },
  {
    value: '12',
    label: 'Pending Reviews',
    change: 'Assignments to grade',
    color: 'bg-orange-600',
  },
  {
    value: '89%',
    label: 'Monthly Average',
    change: '2% from last month',
    color: 'bg-purple-600',
  },
];

export default function ComplaintsPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <SectionTitle
              text='Complaints'
              level={1}
              className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'
            />
            <Label className='text-xs cursor-pointer sm:text-sm lg:text-base text-gray-600 mt-1'>
              Manage school complaints and communicate with students here!
            </Label>
          </div>
          <Button className='bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            <span>New Compalint Form</span>
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

          <Tabs
            tabs={[
              { name: 'My Complaints', content: <AllNoticesTab /> },
              { name: 'Pinned', content: <PinnedTab /> },
              { name: 'Activity', content: <ActivityTab /> },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
