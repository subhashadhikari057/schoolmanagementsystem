// StudentAttendanceCalendar.tsx
// This is a copy of AcademicCalendar.tsx, refactored for attendance use.

'use client';

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ad2bs, bs2ad } from 'hamro-nepali-patro';
import ChartCard from '@/components/atoms/display/ChartCard';

// Attendance status type
export type AttendanceStatus = 'present' | 'absent' | 'not-recorded';

export interface AttendanceEvent {
  id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

interface StudentAttendanceCalendarProps {
  events: AttendanceEvent[];
  selectedDate?: string;
  onDateSelect?: (dateString: string) => void;
}

const nepaliMonths = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
];
const nepaliWeekdays = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

function getCurrentBSDate() {
  try {
    const today = new Date();
    return ad2bs(today.getFullYear(), today.getMonth() + 1, today.getDate());
  } catch (error) {
    return { year: 2081, month: 1, date: 1 };
  }
}

function getAdDateFromBs(bsYear: number, bsMonth: number, bsDay: number) {
  try {
    const ad = bs2ad(bsYear, bsMonth, bsDay) as any;
    return new Date(ad.year, ad.month - 1, ad.date);
  } catch (_e) {
    return new Date();
  }
}

function formatAdDate(date: Date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const StudentAttendanceCalendar: React.FC<StudentAttendanceCalendarProps> = ({
  events,
  selectedDate,
  onDateSelect,
}) => {
  const [calendarType, setCalendarType] = useState<'BS' | 'AD'>('BS');
  const [currentBSDate, setCurrentBSDate] = useState(getCurrentBSDate());
  const [currentADDate, setCurrentADDate] = useState(new Date());

  // Generate calendar days for BS
  const getBsMonthMeta = (bsYear: number, bsMonth: number) => {
    const firstAd = getAdDateFromBs(bsYear, bsMonth, 1);
    const nextBsYear = bsMonth === 12 ? bsYear + 1 : bsYear;
    const nextBsMonth = bsMonth === 12 ? 1 : bsMonth + 1;
    const nextFirstAd = getAdDateFromBs(nextBsYear, nextBsMonth, 1);
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysInMonth = Math.round(
      (nextFirstAd.getTime() - firstAd.getTime()) / msPerDay,
    );
    const startingDayOfWeek = firstAd.getDay();
    return { firstAd, daysInMonth, startingDayOfWeek };
  };

  const generateBSCalendarDays = () => {
    const days: Array<any | null> = [];
    const { year: bsYear, month: bsMonth } = currentBSDate as any;
    const { firstAd, daysInMonth, startingDayOfWeek } = getBsMonthMeta(
      bsYear,
      bsMonth,
    );
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let bsDay = 1; bsDay <= daysInMonth; bsDay++) {
      const adDate = new Date(
        firstAd.getTime() + (bsDay - 1) * 24 * 60 * 60 * 1000,
      );
      days.push({ bsDay, adDate, adDateString: formatAdDate(adDate) });
    }
    return days;
  };

  // Generate calendar days for AD
  const generateADCalendarDays = () => {
    const days = [];
    const year = currentADDate.getFullYear();
    const month = currentADDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const adDate = new Date(year, month, day);
      days.push({ adDay: day, adDate, adDateString: formatAdDate(adDate) });
    }
    return days;
  };

  // Navigation
  const goToPreviousMonth = () => {
    if (calendarType === 'BS') {
      const prevMonth =
        currentBSDate.month === 1 ? 12 : currentBSDate.month - 1;
      const prevYear =
        currentBSDate.month === 1 ? currentBSDate.year - 1 : currentBSDate.year;
      setCurrentBSDate({ year: prevYear, month: prevMonth, date: 1 } as any);
    } else {
      setCurrentADDate(
        new Date(currentADDate.getFullYear(), currentADDate.getMonth() - 1, 1),
      );
    }
  };
  const goToNextMonth = () => {
    if (calendarType === 'BS') {
      const nextMonth =
        currentBSDate.month === 12 ? 1 : currentBSDate.month + 1;
      const nextYear =
        currentBSDate.month === 12
          ? currentBSDate.year + 1
          : currentBSDate.year;
      setCurrentBSDate({ year: nextYear, month: nextMonth, date: 1 } as any);
    } else {
      setCurrentADDate(
        new Date(currentADDate.getFullYear(), currentADDate.getMonth() + 1, 1),
      );
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  };

  const getAttendanceForDate = (adDateString: string): AttendanceStatus => {
    const event = events.find((e: AttendanceEvent) => e.date === adDateString);
    return event ? event.status : 'not-recorded';
  };

  // Legend
  const legend = [
    { color: 'bg-green-500', label: 'Present (उपस्थित)' },
    { color: 'bg-red-500', label: 'Absent (अनुपस्थित)' },
    // Removed 'Not Recorded' from legend
    // { color: 'bg-gray-200', label: 'Not Recorded (रिकॉर्ड छैन)' },
  ];

  // Toggle calendar type
  const handleToggleCalendarType = () => {
    setCalendarType(calendarType === 'BS' ? 'AD' : 'BS');
  };

  // Render
  return (
    <ChartCard className='p-2 sm:p-4 w-full bg-white shadow-lg rounded-xl border-0'>
      <div className='mb-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
          <h2 className='text-lg font-semibold text-gray-900'></h2>
          <button
            onClick={handleToggleCalendarType}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md ${calendarType === 'BS' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'}`}
          >
            {calendarType === 'BS' ? 'Switch to AD' : 'Switch to BS'}
          </button>
        </div>
        {/* Legend */}
        <div className='flex flex-wrap gap-2 sm:gap-4 mb-2'>
          {legend.map((item, idx) => (
            <div key={idx} className='flex items-center gap-2'>
              <span
                className={`inline-block w-4 h-4 rounded ${item.color} border border-gray-300`}
              ></span>
              <span className='text-xs text-gray-700'>{item.label}</span>
            </div>
          ))}
        </div>
        <div
          className={`flex items-center justify-between ${calendarType === 'BS' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'} text-white rounded-lg p-2 sm:p-4 shadow-lg mt-4`}
        >
          <button
            onClick={goToPreviousMonth}
            className='p-2 sm:p-3 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110'
            aria-label='Previous month'
          >
            <ChevronLeft className='w-6 h-6 sm:w-5 sm:h-5' />
          </button>
          <div className='text-center'>
            <h3 className='text-lg font-semibold mb-1'>
              {calendarType === 'BS'
                ? `${nepaliMonths[currentBSDate.month - 1] || 'N/A'} ${currentBSDate.year}`
                : `${currentADDate.toLocaleString('default', { month: 'long' })} ${currentADDate.getFullYear()}`}
            </h3>
          </div>
          <button
            onClick={goToNextMonth}
            className='p-2 sm:p-3 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110'
            aria-label='Next month'
          >
            <ChevronRight className='w-6 h-6 sm:w-5 sm:h-5' />
          </button>
        </div>
      </div>
      <div className='bg-gray-50 rounded-lg p-2 sm:p-4 shadow-inner'>
        {/* Weekday Headers */}
        <div className='grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3'>
          {(calendarType === 'BS'
            ? nepaliWeekdays
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          ).map((day, index) => (
            <div
              key={index}
              className={`text-center py-2 px-2 rounded-lg shadow-sm ${index === 6 ? 'bg-gradient-to-b from-red-500 to-red-600' : calendarType === 'BS' ? 'bg-gradient-to-b from-blue-100 to-blue-200' : 'bg-gradient-to-b from-gray-100 to-gray-200'}`}
            >
              <span
                className={`text-sm font-semibold ${index === 6 ? 'text-slate-200 font-bold drop-shadow-lg' : 'text-gray-700'}`}
              >
                {day}
                {index === 6 && (
                  <span className='block text-xs text-slate-200 mt-1 font-medium'>
                    {calendarType === 'BS' ? 'बिदा' : 'Holiday'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
        {/* Calendar Days */}
        <div className='grid grid-cols-7 gap-1 sm:gap-2'>
          {(calendarType === 'BS'
            ? generateBSCalendarDays()
            : generateADCalendarDays()
          ).map((dayObj, index) => {
            if (!dayObj) return <div key={index} className='h-16'></div>;
            const isBS = calendarType === 'BS';
            const day = isBS ? dayObj.bsDay : dayObj.adDay;
            const adDate: Date = dayObj.adDate as Date;
            const adDateString: string = dayObj.adDateString as string;
            const isSelected = selectedDate === adDateString;
            const isTodayDate = isToday(adDate);
            const attendanceStatus = getAttendanceForDate(adDateString);
            let bgColor = '';
            if (attendanceStatus === 'present')
              bgColor = 'bg-green-500 text-white';
            else if (attendanceStatus === 'absent')
              bgColor = 'bg-red-500 text-white';
            else bgColor = 'bg-gray-200 text-gray-700';
            return (
              <button
                key={index}
                onClick={() => onDateSelect?.(adDateString)}
                className={`h-12 sm:h-16 min-h-12 sm:min-h-16 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 shadow-sm relative overflow-hidden ${bgColor} ${isTodayDate ? 'ring-2 ring-blue-500' : ''} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                style={{ minWidth: '2.2rem' }}
              >
                <div className='flex flex-col h-full relative'>
                  <div className='flex-shrink-0 text-center py-1'>
                    <div className='flex flex-col items-center'>
                      <span className='text-xs sm:text-sm font-bold'>
                        {day}
                      </span>
                      {isTodayDate && (
                        <span className='text-[10px] sm:text-xs text-blue-100 leading-none'>
                          {isBS ? 'आज' : 'Today'}
                        </span>
                      )}
                      {(attendanceStatus === 'present' ||
                        attendanceStatus === 'absent') && (
                        <span className='text-[10px] sm:text-xs leading-none'>
                          {attendanceStatus === 'present'
                            ? isBS
                              ? 'उपस्थित'
                              : 'Present'
                            : attendanceStatus === 'absent'
                              ? isBS
                                ? 'अनुपस्थित'
                                : 'Absent'
                              : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
};

export default StudentAttendanceCalendar;
