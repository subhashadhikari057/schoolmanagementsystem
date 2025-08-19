'use client';

import React, { useState } from 'react';

// Simple calendar grid for attendance
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const attendanceData = [
  { date: '2025-08-01', status: 'present' },
  { date: '2025-08-02', status: 'absent' },
  { date: '2025-08-03', status: 'present' },
  { date: '2025-08-04', status: 'present' },
  { date: '2025-08-05', status: 'absent' },
  // ...add more mock data as needed
];

function getAttendanceStatus(dateString: string) {
  const found = attendanceData.find(a => a.date === dateString);
  return found ? found.status : 'not-recorded';
}

export default function StudentAttendanceCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Generate calendar grid
  const calendarGrid = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarGrid.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarGrid.push(day);
  }

  // Month names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Navigation
  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div className='bg-white rounded-xl shadow p-6'>
      <div className='flex items-center justify-between mb-4'>
        <button onClick={prevMonth} className='px-3 py-1 rounded bg-gray-100'>
          Prev
        </button>
        <h2 className='text-lg font-bold'>
          {monthNames[month]} {year}
        </h2>
        <button onClick={nextMonth} className='px-3 py-1 rounded bg-gray-100'>
          Next
        </button>
      </div>
      <div className='grid grid-cols-7 gap-2 mb-2'>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className='text-center font-semibold text-gray-600'>
            {d}
          </div>
        ))}
      </div>
      <div className='grid grid-cols-7 gap-2'>
        {calendarGrid.map((day, idx) => {
          if (!day) return <div key={idx}></div>;
          const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const status = getAttendanceStatus(dateString);
          let bg = 'bg-gray-100';
          if (status === 'present') bg = 'bg-green-500 text-white';
          if (status === 'absent') bg = 'bg-red-500 text-white';
          if (status === 'not-recorded') bg = 'bg-yellow-100 text-gray-600';
          return (
            <div
              key={idx}
              className={`h-14 flex items-center justify-center rounded-lg font-bold ${bg}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className='mt-4 flex gap-4'>
        <span className='inline-flex items-center gap-2'>
          <span className='w-4 h-4 rounded bg-green-500 inline-block'></span>{' '}
          Present
        </span>
        <span className='inline-flex items-center gap-2'>
          <span className='w-4 h-4 rounded bg-red-500 inline-block'></span>{' '}
          Absent
        </span>
        <span className='inline-flex items-center gap-2'>
          <span className='w-4 h-4 rounded bg-yellow-100 border border-yellow-400 inline-block'></span>{' '}
          Not Recorded
        </span>
      </div>
    </div>
  );
}
