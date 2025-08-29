'use client';
// Student Subjects Page: Day-wise tabs, 7 periods per day, teacher info, consistent card UI
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import { CardGridLoader } from '@/components/atoms/loading';

// Days of the week (Sunday to Saturday)
const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Mock timetable: 7 periods per day, each with subject and teacher
const timetable = days.map(day => ({
  name: day,
  periods: Array.from({ length: 7 }, (_, i) => {
    // For demo, rotate subjects and teachers
    const subjects = [
      {
        name: 'Mathematics',
        teacher: 'Ram Bahadur',
        description: 'Algebra, Geometry, Trigonometry',
      },
      {
        name: 'Science',
        teacher: 'Hari Prasang',
        description: 'Physics, Chemistry, Biology',
      },
      {
        name: 'English',
        teacher: 'Sita Devi',
        description: 'Grammar, Literature, Writing',
      },
      {
        name: 'Social Studies',
        teacher: 'Krishna Sharma',
        description: 'History, Civics, Geography',
      },
      {
        name: 'Nepali',
        teacher: 'Maya Gurung',
        description: 'Language, Literature',
      },
      {
        name: 'Computer',
        teacher: 'Ramesh Shrestha',
        description: 'Programming, IT Skills',
      },
      {
        name: 'Health',
        teacher: 'Sunita Karki',
        description: 'Physical Education, Health Science',
      },
    ];
    const subject = subjects[(i + days.indexOf(day)) % subjects.length];
    return {
      period: i + 1,
      ...subject,
    };
  }),
}));

const tabs = timetable.map(day => ({
  name: day.name,
  // ...existing code...
}));

export default function StudentSubjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Attach router to cards
  const tabsWithNav = timetable.map(day => ({
    name: day.name,
    content: (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4'>
        {day.periods.map(period => (
          <div
            key={period.period}
            className='rounded-xl border border-gray-200 bg-white shadow-sm p-6 min-h-[120px] flex flex-col justify-between hover:shadow-lg hover:border-blue-400 transition-all duration-200 cursor-pointer group'
            onClick={() =>
              router.push(
                `/dashboard/student/subjects/${encodeURIComponent(period.name.toLowerCase())}`,
              )
            }
            title={`Go to ${period.name} details`}
          >
            <h3 className='text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors'>
              Period {period.period}: {period.name}
            </h3>
            <p className='text-sm text-gray-700 mb-1'>
              Teacher:{' '}
              <span className='font-semibold text-blue-700 group-hover:underline'>
                {period.teacher}
              </span>
            </p>
            <p className='text-xs text-gray-500'>{period.description}</p>
          </div>
        ))}
      </div>
    ),
  }));

  if (loading) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
        <div className='w-full'>
          <CardGridLoader
            cards={21}
            columns='grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            cardHeight='h-32'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
      <div className='w-full'>
        <SectionTitle
          text='My Subjects'
          level={1}
          className='text-2xl font-bold text-gray-900 mb-2'
        />
        <Label className='text-base text-gray-600 mb-6'>
          View your subjects for each day. Each day has 7 periods. Click a
          subject for more details.
        </Label>
        <div className='mb-8'>
          <GenericTabs tabs={tabsWithNav} defaultIndex={0} className='' />
        </div>
      </div>
    </div>
  );
}
