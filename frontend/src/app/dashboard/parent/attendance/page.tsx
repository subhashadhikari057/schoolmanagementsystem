'use client';
import React, { useState, useEffect } from 'react';
import StudentAttendanceCalendar, {
  AttendanceEvent,
} from '../../student/attendance/StudentAttendanceCalendar';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { CalendarLoader } from '@/components/atoms/loading';

const childrenList = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Doe' },
];

const nepaliYear = 2082;
const nepaliMonth = 5; // भदौ
const attendanceEventsByChild: { [key: string]: AttendanceEvent[] } = {
  '1': [
    (() => {
      const ad = require('hamro-nepali-patro').bs2ad(
        nepaliYear,
        nepaliMonth,
        1,
      );
      const adDate = `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.date).padStart(2, '0')}`;
      return { id: '1', date: adDate, status: 'present' };
    })(),
    (() => {
      const ad = require('hamro-nepali-patro').bs2ad(
        nepaliYear,
        nepaliMonth,
        2,
      );
      const adDate = `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.date).padStart(2, '0')}`;
      return { id: '2', date: adDate, status: 'absent' };
    })(),
  ],
  '2': [
    (() => {
      const ad = require('hamro-nepali-patro').bs2ad(
        nepaliYear,
        nepaliMonth,
        1,
      );
      const adDate = `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.date).padStart(2, '0')}`;
      return { id: '1', date: adDate, status: 'present' };
    })(),
    (() => {
      const ad = require('hamro-nepali-patro').bs2ad(
        nepaliYear,
        nepaliMonth,
        2,
      );
      const adDate = `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.date).padStart(2, '0')}`;
      return { id: '2', date: adDate, status: 'present' };
    })(),
  ],
};

export default function ParentAttendancePage() {
  const [selectedChild, setSelectedChild] = useState(childrenList[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const events = attendanceEventsByChild[selectedChild] || [];

  if (loading) {
    return <CalendarLoader />;
  }

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <SectionTitle text='Attendance' level={2} />
        <Dropdown
          options={childrenList.map(c => ({ label: c.name, value: c.id }))}
          selectedValue={selectedChild}
          onSelect={setSelectedChild}
          className='min-w-[150px] rounded-lg px-4 py-2'
          title='Select Child'
          type='filter'
        />
      </div>
      <StudentAttendanceCalendar events={events} />
    </div>
  );
}
