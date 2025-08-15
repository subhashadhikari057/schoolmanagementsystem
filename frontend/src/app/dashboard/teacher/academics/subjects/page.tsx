'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { BookOpen, Users, ListChecks, Gauge } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import ActivityTabs from '@/components/organisms/tabs/ActivityTabs';
import DeadlinesTabs from '@/components/organisms/tabs/DeadlinesTabs';
import SubjectsTabs from '@/components/organisms/tabs/SubjectsTabs';

export default function SubjectsPage() {
  const stats = [
    {
      icon: BookOpen,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      value: '4',
      label: 'Total Subjects',
      change: '',
      isPositive: true,
    },
    {
      icon: Users,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      value: '203',
      label: 'Total Students',
      change: '',
      isPositive: true,
    },
    {
      icon: ListChecks,
      bgColor: 'bg-orange-600',
      iconColor: 'text-white',
      value: '31',
      label: 'Active Assignments',
      change: '',
      isPositive: true,
    },
    {
      icon: Gauge,
      bgColor: 'bg-purple-600',
      iconColor: 'text-white',
      value: '91%',
      label: 'Avg Completion',
      change: '',
      isPositive: true,
    },
  ];

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

  // Reusable header + stats
  const Header = (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='My Subjects'
            level={1}
            className='text-2xl font-bold text-foreground'
          />
          <Label className='mt-1'>
            Manage your teaching subjects and monitor progress
          </Label>
        </div>
        <Button className='px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium'>
          Add Subject
        </Button>
      </div>

      <Statsgrid
        variant='solid'
        stats={stats as any}
        className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
      />
    </div>
  );

  return (
    <div className='space-y-6'>
      {Header}
      <Tabs
        tabs={[
          { name: 'Subjects', content: <SubjectsTabs /> },
          { name: 'Activities', content: <ActivityTabs /> },
          { name: 'Deadlines', content: <DeadlinesTabs /> },
        ]}
      />
    </div>
  );
}
