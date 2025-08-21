import React from 'react';
import { useRouter } from 'next/navigation';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';

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

// Mock teacher routine: variable periods per day, each with class and time
const teacherRoutine = [
  {
    name: 'Sunday',
    periods: [],
  },
  {
    name: 'Monday',
    periods: [
      {
        class: 'Grade 10 - Mathematics',
        time: '08:00 - 08:45',
        status: 'completed',
      },
      {
        class: 'Grade 9 - Science',
        time: '09:00 - 09:45',
        status: 'completed',
      },
      {
        class: 'Grade 8 - Computer',
        time: '11:00 - 11:45',
        status: 'upcoming',
      },
    ],
  },
  {
    name: 'Tuesday',
    periods: [
      {
        class: 'Grade 10 - Mathematics',
        time: '08:00 - 08:45',
        status: 'completed',
      },
      { class: 'Grade 7 - Health', time: '10:00 - 10:45', status: 'upcoming' },
    ],
  },
  {
    name: 'Wednesday',
    periods: [
      {
        class: 'Grade 9 - Science',
        time: '09:00 - 09:45',
        status: 'completed',
      },
      {
        class: 'Grade 8 - Computer',
        time: '11:00 - 11:45',
        status: 'completed',
      },
      { class: 'Grade 7 - Health', time: '12:00 - 12:45', status: 'upcoming' },
    ],
  },
  {
    name: 'Thursday',
    periods: [
      {
        class: 'Grade 10 - Mathematics',
        time: '08:00 - 08:45',
        status: 'upcoming',
      },
    ],
  },
  {
    name: 'Friday',
    periods: [
      {
        class: 'Grade 9 - Science',
        time: '09:00 - 09:45',
        status: 'completed',
      },
      {
        class: 'Grade 8 - Computer',
        time: '11:00 - 11:45',
        status: 'upcoming',
      },
    ],
  },
  {
    name: 'Saturday',
    periods: [],
  },
];

const TeacherRoutine = () => {
  const router = useRouter();

  const tabsWithNav = teacherRoutine.map(day => ({
    name: day.name,
    content: (
      <div className='mt-6'>
        {day.periods.length === 0 ? (
          <div className='text-gray-400 text-center py-16 text-lg font-medium'>
            No classes scheduled for this day.
          </div>
        ) : (
          <div className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6'>
            {day.periods.map((period, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 sm:p-6 min-h-[60px] flex flex-col justify-center transition-all duration-150 shadow-sm hover:shadow-md ${period.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-blue-300'}`}
              >
                <span
                  className={`text-base sm:text-xl font-semibold mb-2 ${period.status === 'completed' ? 'text-green-700' : 'text-gray-900'}`}
                >
                  {period.class}
                </span>
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold w-fit ${period.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}
                >
                  {period.time}
                </span>
                <span
                  className={`mt-2 text-xs font-medium ${period.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}
                >
                  {period.status === 'completed' ? 'Completed' : 'Upcoming'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  }));

  return (
    <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
      <div className='max-w-8xl mx-auto'>
        <SectionTitle
          text='My Routine'
          level={1}
          className='text-2xl font-bold text-gray-900 mb-2'
        />
        <Label className='text-base text-gray-600 mb-6'>
          View your teaching routine for each day. Only scheduled classes will
          appear below.
        </Label>
        <div className='mb-8'>
          <GenericTabs tabs={tabsWithNav} defaultIndex={0} className='' />
        </div>
      </div>
    </div>
  );
};

export default TeacherRoutine;
