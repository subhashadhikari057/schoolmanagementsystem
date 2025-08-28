'use client';

import React, { useState, useEffect } from 'react';
import StudentAttendanceCalendar, {
  AttendanceEvent,
} from './StudentAttendanceCalendar';
import { CalendarLoader } from '@/components/atoms/loading';

import { bs2ad } from 'hamro-nepali-patro';

// Generate attendance records for भदौ 2082 (Nepali month)
const nepaliYear = 2082;
const nepaliMonth = 5; // भदौ
const attendanceEvents: AttendanceEvent[] = [
  (() => {
    const ad = bs2ad(nepaliYear, nepaliMonth, 1);
    const adDate = `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.date).padStart(2, '0')}`;
    return { id: '1', date: adDate, status: 'present' };
  })(),
  (() => {
    const ad = bs2ad(nepaliYear, nepaliMonth, 2);
    const adDate = `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.date).padStart(2, '0')}`;
    return { id: '2', date: adDate, status: 'absent' };
  })(),
];

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <CalendarLoader />;
  }

  return (
    <div className='w-full p-6'>
      <h1 className='text-lg font-bold mb-4'>Student Attendance Calendar</h1>
      <StudentAttendanceCalendar events={attendanceEvents} />
    </div>
  );
}
