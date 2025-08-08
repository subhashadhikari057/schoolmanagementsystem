import React from 'react';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import ChartCard from '@/components/atoms/display/ChartCard';
import ExamPerformanceChart from '@/components/organisms/dashboard/ExamPerformanceChart';
import FeeCollectionChart from '@/components/organisms/dashboard/FeeCollectionChart';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';

import Icon from '@/components/atoms/display/Icon';

const BlueCircleIcon = () => (
  <Icon className='bg-blue-100'>
    <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
      <circle cx='12' cy='12' r='10' stroke='#3b82f6' strokeWidth='2' />
    </svg>
  </Icon>
);
const GreenRectIcon = () => (
  <Icon className='bg-green-100'>
    <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
      <rect
        x='4'
        y='4'
        width='16'
        height='16'
        rx='4'
        stroke='#22c55e'
        strokeWidth='2'
      />
    </svg>
  </Icon>
);
const PurpleRectIcon = () => (
  <Icon className='bg-purple-100'>
    <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
      <rect
        x='4'
        y='4'
        width='16'
        height='16'
        rx='4'
        stroke='#a21caf'
        strokeWidth='2'
      />
    </svg>
  </Icon>
);
const OrangeCircleIcon = () => (
  <Icon className='bg-orange-100'>
    <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
      <circle cx='12' cy='12' r='10' stroke='#f59e42' strokeWidth='2' />
    </svg>
  </Icon>
);

const stats = [
  {
    icon: BlueCircleIcon,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    value: '94.2%',
    label: 'Student Retention',
    change: '+2.1%',
    isPositive: true,
  },
  {
    icon: GreenRectIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    value: '87.5%',
    label: 'Teacher Satisfaction',
    change: '+5.3%',
    isPositive: true,
  },
  {
    icon: PurpleRectIcon,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    value: '91.8%',
    label: 'Course Completion',
    change: '-1.2%',
    isPositive: false,
  },
  {
    icon: OrangeCircleIcon,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    value: '88.7%',
    label: 'Academic Performance',
    change: '+3.5%',
    isPositive: true,
  },
];

const gradeEnrollment = [
  { grade: 'Grade 9', value: 750 },
  { grade: 'Grade 10', value: 800 },
  { grade: 'Grade 11', value: 700 },
  { grade: 'Grade 12', value: 650 },
];

const gradePerformance = [
  { grade: 'Grade 9', students: 720, capacity: 800, percent: 90 },
  { grade: 'Grade 10', students: 685, capacity: 750, percent: 91 },
  { grade: 'Grade 11', students: 642, capacity: 700, percent: 92 },
  { grade: 'Grade 12', students: 580, capacity: 650, percent: 89 },
];

export default function AcademicDashboard() {
  return (
    <div className='w-full max-w-7xl mx-auto space-y-8'>
      {/* Stats Grid */}
      <Statsgrid stats={stats} />

      {/* Charts Row */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <ChartCard className='p-6'>
          <SectionTitle
            text='Performance Trends'
            className='text-base font-semibold mb-1'
            level={3}
          />
          <Label className='mb-4'>Monthly tracking of key metrics</Label>
          <ExamPerformanceChart />
        </ChartCard>
        <ChartCard className='p-6'>
          <SectionTitle
            text='Grade-wise Enrollment'
            className='text-base font-semibold mb-1'
            level={3}
          />
          <Label className='mb-4'>Student distribution across grades</Label>
          {/* Replace with your custom bar chart if available */}
          <div>
            {/* Y-Axis */}
            <div className='flex flex-row items-end h-64 gap-0 w-full relative'>
              <div
                className='flex flex-col justify-between h-56 mr-2 text-xs text-gray-400 select-none'
                style={{ height: '224px' }}
              >
                {[800, 600, 400, 200, 0].map(tick => (
                  <div
                    key={tick}
                    style={{ height: '44.8px' }}
                    className='flex items-end justify-end pr-1'
                  >
                    <Label className='text-xs text-gray-400 min-w-[28px] text-right'>
                      {tick}
                    </Label>
                  </div>
                ))}
              </div>
              {/* Bars and X-Axis */}
              <div className='flex items-end h-64 gap-8 w-full'>
                {[
                  { grade: 'Grade 9', enrolled: 720, capacity: 800 },
                  { grade: 'Grade 10', enrolled: 685, capacity: 750 },
                  { grade: 'Grade 11', enrolled: 642, capacity: 700 },
                  { grade: 'Grade 12', enrolled: 580, capacity: 650 },
                ].map((g, i) => {
                  const max = Math.max(...[800, 750, 700, 650]);
                  return (
                    <div
                      key={g.grade}
                      className='flex flex-col items-center w-1/5'
                    >
                      <div className='w-10 h-56 flex flex-col justify-end relative'>
                        {/* Blue (enrolled) bar at bottom */}
                        <div
                          className='absolute bottom-0 left-0 w-10 bg-blue-500 rounded-t'
                          style={{ height: `${(g.enrolled / max) * 100}%` }}
                        />
                        {/* Gray (capacity cap) bar above blue */}
                        {g.capacity > g.enrolled && (
                          <div
                            className='absolute left-0 w-10 bg-gray-200 rounded-t'
                            style={{
                              height: `${((g.capacity - g.enrolled) / max) * 100}%`,
                              bottom: `${(g.enrolled / max) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      {/* X-Axis label */}
                      <Label className='mt-2 text-xs text-gray-700'>
                        {g.grade}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Legend */}
            <div className='flex gap-4 mt-4 justify-center'>
              <div className='flex items-center gap-1'>
                <span className='inline-block w-4 h-3 rounded bg-blue-500' />
                <Label className='text-xs text-gray-700'>Enrolled</Label>
              </div>
              <div className='flex items-center gap-1'>
                <span className='inline-block w-4 h-3 rounded bg-gray-200' />
                <Label className='text-xs text-gray-700'>Capacity</Label>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Grade Performance Analysis */}
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-6'>
        <SectionTitle
          text='Grade Performance Analysis'
          className='text-lg font-semibold mb-2'
          level={2}
        />
        <Label className='mb-4'>Detailed breakdown by grade level</Label>
        <div className='space-y-4'>
          {gradePerformance.map(g => (
            <div key={g.grade} className='flex flex-col gap-1'>
              <div className='flex items-center justify-between mb-1'>
                <div className='flex gap-2 items-center'>
                  <Label className='font-medium text-gray-900 text-sm'>
                    {g.grade}
                  </Label>
                  <span className='bg-blue-100 text-blue-700 text-xs rounded px-2 py-0.5'>
                    {g.students} students
                  </span>
                  <span className='bg-blue-50 text-blue-600 text-xs rounded px-2 py-0.5'>
                    {g.percent}% capacity
                  </span>
                </div>
                <div className='text-xs text-gray-500 font-medium'>
                  {g.students}/{g.capacity} Enrolled/Capacity
                </div>
              </div>
              <div className='w-full h-3 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-blue-500 rounded-full'
                  style={{ width: `${(g.students / g.capacity) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
