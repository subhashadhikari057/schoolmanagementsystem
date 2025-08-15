'use client';

import React, { useState } from 'react';
import Panel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import Button from '@/components/atoms/form-controls/Button';
import MarkAttendanceModal from '@/components/organisms/modals/MarkAttendanceModal';
import { FlaskConical, Calculator, Calendar, UserCheck } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';

const statsData = [
  {
    value: '6',
    label: "Today's Classes",
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

export default function TeacherDashboard() {
  const [showAttendance, setShowAttendance] = useState(false);

  const classes: {
    status: string;
    title: string;
    subtitle: string;
    tone: 'green' | 'blue' | 'gray';
  }[] = [
    {
      status: 'Completed',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'green',
    },
    {
      status: 'Completed',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'green',
    },
    {
      status: 'In Time',
      title: 'Class 8 - A',
      subtitle: 'Science Class',
      tone: 'blue',
    },
    {
      status: '9:10am - 10:10am',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'gray',
    },
    {
      status: 'in 10 mins',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'blue',
    },
    {
      status: 'Completed',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'green',
    },
    {
      status: 'Completed',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'green',
    },
    {
      status: '9:10am - 10:10am',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'gray',
    },
  ];

  const assignments = [
    {
      title: 'An essay about Railway in Nepal (minimum 300 words)',
      subject: 'Science',
      className: 'Class 8 - A',
      submissions: '0/50 Submissions',
    },
    {
      title: 'An essay about Railway in Nepal (minimum 300 words)',
      subject: 'Science',
      className: 'Class 8 - A',
      submissions: '0/50 Submissions',
    },
  ];

  const assignedSubjects = [
    { label: 'Science', icon: FlaskConical },
    { label: 'Optional Maths', icon: Calculator },
    { label: 'Class Routine', icon: Calendar },
    { label: 'Student Reports', icon: UserCheck },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <SectionTitle
          text='Teacher Dashboard'
          level={1}
          className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'
        />
        <Label className='text-xs cursor-pointer sm:text-sm lg:text-base text-gray-600 mt-1'>
          Welcome back, manage your classes efficiently.
        </Label>
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

          {/* Attendance CTA */}
          <div className='rounded-xl border border-blue-200 bg-blue-50/60'>
            <div className='px-4 py-2 space-y-1 flex flex-col items-start justify-start'>
              <Label className='!text-[11px] text-gray-600'>
                Hey its the first class!
              </Label>
              <Label className='!text-[12px] sm:!text-sm !text-foreground'>
                Lets track Your students Attendance
              </Label>
            </div>
            <div className='px-3 pb-3'>
              <div className='bg-blue-600/90 text-white rounded-md py-2 text-center shadow-sm hover:bg-blue-400'>
                <div className='flex items-center justify-center px-3'>
                  <Button
                    className=' text-white  rounded-md text-xs cursor-pointer font-semibold'
                    label='Track Now'
                    onClick={() => setShowAttendance(true)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Your Classes */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <SectionTitle
                text='Your Classes:'
                level={3}
                className='text-sm font-semibold text-gray-700'
              />
              <Label className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'>
                View All
              </Label>
            </div>
            <Statsgrid
              variant='classes'
              items={classes.slice(0, 8)}
              className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3'
            />
          </div>

          {/* Assignments to grade */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <SectionTitle
                text='Assignments to grade'
                level={3}
                className='text-sm font-semibold text-gray-700'
              />
              <Label className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'>
                View All
              </Label>
            </div>
            <Statsgrid
              variant='assignments'
              items={assignments}
              actionLabel='Learn More'
            />
          </div>

          {/* Events and Assigned Subjects */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            <div className='lg:col-span-8'>
              <Panel
                variant='list-cards'
                title='Upcoming Events'
                maxEvents={3}
                className='!bg-transparent !border-0 !p-0 !rounded-none !shadow-none'
              />
            </div>
            <div className='lg:col-span-4'>
              <Panel
                variant='subjects'
                title='Assigned Subjects'
                className='!bg-transparent !border-0 !p-0 !rounded-none !shadow-none'
                subjects={assignedSubjects.map((s, idx) => ({
                  id: `sub-${idx}`,
                  label: s.label,
                  icon: s.icon,
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      <MarkAttendanceModal
        isOpen={showAttendance}
        onClose={() => setShowAttendance(false)}
      />
    </div>
  );
}
