'use client';

import React, { useState } from 'react';
import {
  Calendar,
  BarChart3,
  Clock,
  Users,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import StatCard from '@/components/molecules/cards/StatCard';

// Placeholder component for Grading tab
function GradingTab() {
  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <div className='text-center py-12'>
        <BarChart3 className='mx-auto h-16 w-16 text-gray-400 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          Grading System
        </h3>
        <p className='text-gray-500'>
          Grading functionality will be implemented here.
        </p>
      </div>
    </div>
  );
}

// Exam Timetable Tab with integrated schedule builder
function ExamTimetableTab() {
  return (
    <div>
      {/* Integrated Exam Schedule Builder */}
      <div className='bg-white rounded-lg shadow'>
        <div className='p-0'>
          {/* Using dynamic import to avoid server-side rendering issues with Zustand store */}
          <div className='w-full'>
            {(() => {
              const {
                ExamScheduleBuilder,
              } = require('@/components/exam-schedule');
              return <ExamScheduleBuilder />;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamSummaryCards() {
  const cards = [
    {
      label: 'Upcoming Exams',
      value: 8,
      icon: CalendarDays,
      bgColor: 'bg-blue-100',
      iconColor: 'text-white',
      change: '+2',
      isPositive: true,
    },
    {
      label: 'Completed Exams',
      value: 24,
      icon: CheckCircle2,
      bgColor: 'bg-green-100',
      iconColor: 'text-white',
      change: '+5',
      isPositive: true,
    },
    {
      label: 'Results Pending',
      value: 3,
      icon: Clock,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-white',
      change: '-1',
      isPositive: false,
    },
    {
      label: 'Total Students',
      value: 2847,
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-white',
      change: '+120',
      isPositive: true,
    },
  ];
  return (
    <div className='flex flex-wrap gap-x-6 gap-y-6 w-full mb-8'>
      {cards.map(c => (
        <StatCard
          key={c.label}
          icon={c.icon}
          bgColor={c.bgColor}
          iconColor={c.iconColor}
          label={c.label}
          value={c.value}
          change={c.change}
          isPositive={c.isPositive}
          className='flex-1 min-w-[220px]'
        />
      ))}
    </div>
  );
}

export default function ExamsPage() {
  // Tab configuration for GenericTabs
  const tabs = [
    {
      name: 'Grading',
      icon: <BarChart3 className='h-4 w-4 mr-2' />,
      content: <GradingTab />,
    },
    {
      name: 'Exam Timetable',
      icon: <Calendar className='h-4 w-4 mr-2' />,
      content: <ExamTimetableTab />,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Exam Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage Exam Timetables and Grading
          </p>
        </div>
      </div>

      <div className='pt-3'>
        <div className='w-full'>
          <ExamSummaryCards />
        </div>
      </div>

      <div className='px-1 sm:px-2 lg:px-4 pb-6'>
        <div className='max-w-7xl mx-auto'>
          <GenericTabs tabs={tabs} />
        </div>
      </div>
    </div>
  );
}
