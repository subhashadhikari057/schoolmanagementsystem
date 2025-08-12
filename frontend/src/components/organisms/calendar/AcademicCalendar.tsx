'use client';

import React, { useState, useEffect } from 'react';

import UpcomingEventsPanel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import ChartCard from '@/components/atoms/display/ChartCard';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Calendar, Plus, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { Event } from '@/types/EventTypes';
import { ad2bs, bs2ad } from 'hamro-nepali-patro';

// Custom AD Calendar Component with Pure Tailwind
const CustomADCalendar = ({ events }: { events: Event[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // English month names
  const englishMonths = [
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

  // English weekday names
  const englishWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate AD calendar days for current month
  const generateCalendarDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  // Handle date selection
  const handleDateSelect = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDate(dateString);
  };

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return events.filter(event => event.date === dateString);
  };

  const calendarDays = generateCalendarDays();

  return (
    <ChartCard className='p-4 w-full bg-white shadow-lg rounded-xl border-0'>
      {/* Header */}
      <div className='mb-4'>
        <h2 className='text-lg font-semibold text-gray-900 mb-2'>
          Gregorian Calendar
        </h2>
        <div className='space-y-1'>
          <p className='text-gray-600'>
            Current Date:{' '}
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className='text-sm text-blue-600 font-semibold'>
            Nepal Time:{' '}
            {currentTime.toLocaleString('en-US', {
              timeZone: 'Asia/Kathmandu',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })}
          </p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className='bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-3 mb-3 shadow-md'>
        <div className='flex items-center justify-between text-white'>
          <button
            onClick={goToPreviousMonth}
            className='p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>

          <div className='text-center'>
            <h3 className='text-lg font-semibold mb-1'>
              {englishMonths[currentDate.getMonth()]}{' '}
              {currentDate.getFullYear()}
            </h3>
            <p className='text-emerald-100 text-sm'>
              {currentTime.toLocaleDateString('en-US', {
                timeZone: 'Asia/Kathmandu',
              })}{' '}
              •{' '}
              {currentTime.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kathmandu',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <button
            onClick={goToNextMonth}
            className='p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className='bg-gray-50 rounded-lg p-4 shadow-inner'>
        {/* Weekday Headers */}
        <div className='grid grid-cols-7 gap-2 mb-3'>
          {englishWeekdays.map((day, index) => (
            <div
              key={index}
              className={`text-center py-2 px-2 rounded-lg shadow-sm ${
                index === 6 // Saturday is index 6
                  ? 'bg-gradient-to-b from-red-500 to-red-600'
                  : 'bg-gradient-to-b from-gray-100 to-gray-200'
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  index === 6 ? 'text-white' : 'text-gray-700'
                }`}
              >
                {day}
                {index === 6 && (
                  <span className='block text-xs text-red-100 mt-1'>
                    Holiday
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className='grid grid-cols-7 gap-2'>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className='h-12'></div>;
            }

            const isSelected =
              selectedDate ===
              `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isTodayDate = isToday(day);
            const dayEvents = getEventsForDate(day);
            const hasEvents = dayEvents.length > 0;

            // Check if this day is Saturday (6 in JavaScript Date.getDay())
            const currentDayDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day,
            );
            const isSaturday = currentDayDate.getDay() === 6;

            return (
              <button
                key={index}
                onClick={() => handleDateSelect(day)}
                className={`
                  h-12 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 shadow-sm relative overflow-hidden
                  ${
                    isTodayDate
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-300'
                      : isSelected
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-teal-300'
                        : isSaturday
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300 hover:from-red-600 hover:to-red-700'
                          : hasEvents
                            ? 'bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-gray-800 border border-amber-300'
                            : 'bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 text-gray-700 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300'
                  }
                `}
              >
                <div className='flex flex-col items-center justify-center h-full'>
                  <span
                    className={`text-base ${isTodayDate || isSelected || isSaturday ? 'text-white' : hasEvents ? 'text-gray-800' : 'text-gray-900'}`}
                  >
                    {day}
                  </span>
                  {isTodayDate && (
                    <span className='text-xs text-emerald-100 mt-1'>Today</span>
                  )}
                  {isSaturday && !isTodayDate && (
                    <span className='text-xs text-red-100 mt-1'>Holiday</span>
                  )}
                  {hasEvents && !isTodayDate && !isSelected && (
                    <div className='absolute bottom-1 right-1 w-2 h-2 bg-amber-500 rounded-full'></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className='mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center'>
              <Calendar className='w-5 h-5 text-white' />
            </div>
            <div>
              <p className='text-emerald-800 font-semibold text-lg'>
                Selected Date
              </p>
              <p className='text-emerald-700 text-xl font-bold'>
                {selectedDate}
              </p>
              <p className='text-emerald-600 text-sm mt-1'>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
};

// Custom BS Calendar Component with Pure Tailwind
const CustomBSCalendar = ({ events: _events }: { events: Event[] }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentBSDate, setCurrentBSDate] = useState(() => {
    // Initialize with proper current BS date
    try {
      const today = new Date();
      return (
        ad2bs(today.getFullYear(), today.getMonth() + 1, today.getDate()) || {
          year: 2081,
          month: 4,
          day: 27,
        }
      );
    } catch {
      return { year: 2081, month: 4, day: 27 };
    }
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Nepali month names
  const nepaliMonths = [
    'बैशाख',
    'जेठ',
    'असार',
    'सावन',
    'भाद्र',
    'असोज',
    'कातिक',
    'मंगसिर',
    'पुष',
    'माघ',
    'फागुन',
    'चैत्र',
  ];

  // Nepali weekday names
  const nepaliWeekdays = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

  // Real-time updates for BS calendar
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      try {
        const bsNow = ad2bs(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate(),
        );
        if (
          bsNow &&
          (bsNow.year !== currentBSDate.year ||
            bsNow.month !== currentBSDate.month ||
            bsNow.date !== currentBSDate.day)
        ) {
          // Only update if viewing current month or if date actually changed
          if (
            currentBSDate.year === bsNow.year &&
            currentBSDate.month === bsNow.month
          ) {
            setCurrentBSDate(bsNow);
          }
        }
      } catch (error) {
        console.error('Real-time BS date conversion error:', error);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentBSDate]);

  // Initialize current BS date properly
  useEffect(() => {
    const today = new Date();
    try {
      const bsToday = ad2bs(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate(),
      );
      if (bsToday) {
        setCurrentBSDate(bsToday);
      }
    } catch (error) {
      console.error('Initial BS date conversion error:', error);
    }
  }, []);

  // Generate BS calendar days for current month
  const generateCalendarDays = () => {
    const days = [];
    const year = currentBSDate.year;
    const month = currentBSDate.month;

    // Get first day of BS month (convert to AD to get weekday)
    try {
      const firstDayAD = bs2ad(year, month, 1);
      const firstDay = new Date(
        firstDayAD.year,
        firstDayAD.month - 1,
        firstDayAD.date,
      );
      const startingDayOfWeek = firstDay.getDay();

      // Add empty cells for days before month starts
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }

      // Add days of the month (BS months can have 29-32 days)
      const daysInMonth = getDaysInBSMonth(year, month);
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }
    } catch (error) {
      console.error('Calendar generation error:', error);
      // Fallback to basic month
      for (let day = 1; day <= 30; day++) {
        days.push(day);
      }
    }

    return days;
  };

  // Get accurate number of days in BS month
  const getDaysInBSMonth = (year: number, month: number): number => {
    try {
      // Calculate by checking when the next month starts
      // Convert first day of next month to AD and subtract one day
      let nextMonth = month + 1;
      let nextYear = year;

      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }

      // Get first day of next month in AD
      const nextMonthFirstDay = bs2ad(nextYear, nextMonth, 1);
      if (nextMonthFirstDay) {
        // Create AD date and subtract one day to get last day of current month
        const nextMonthAD = new Date(
          nextMonthFirstDay.year,
          nextMonthFirstDay.month - 1,
          nextMonthFirstDay.date,
        );
        const lastDayOfCurrentMonthAD = new Date(
          nextMonthAD.getTime() - 24 * 60 * 60 * 1000,
        );

        // Convert back to BS to get the day number (which is the total days in month)
        const lastDayBS = ad2bs(
          lastDayOfCurrentMonthAD.getFullYear(),
          lastDayOfCurrentMonthAD.getMonth() + 1,
          lastDayOfCurrentMonthAD.getDate(),
        );
        if (lastDayBS) {
          return lastDayBS.date;
        }
      }

      // Fallback to more accurate BS month days pattern
      const accurateDaysInMonths = [
        31,
        31,
        32,
        32,
        31,
        30, // बैशाख to असोज
        30,
        29,
        30,
        29,
        30,
        30, // कातिक to चैत्र
      ];

      // Adjust for leap years (rough approximation)
      if (month === 12 && year % 4 === 1) {
        // Chaitra in some years
        return 31;
      }

      return accurateDaysInMonths[month - 1] || 30;
    } catch (error) {
      console.error('Error calculating BS month days:', error);
      // Ultimate fallback
      return 30;
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    let newMonth = currentBSDate.month - 1;
    let newYear = currentBSDate.year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setCurrentBSDate({ ...currentBSDate, year: newYear, month: newMonth });
  };

  const goToNextMonth = () => {
    let newMonth = currentBSDate.month + 1;
    let newYear = currentBSDate.year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setCurrentBSDate({ ...currentBSDate, year: newYear, month: newMonth });
  };

  // Check if date is today (using real-time current time)
  const isToday = (day: number) => {
    try {
      const bsToday = ad2bs(
        currentTime.getFullYear(),
        currentTime.getMonth() + 1,
        currentTime.getDate(),
      );
      if (!bsToday) return false;

      return (
        bsToday.year === currentBSDate.year &&
        bsToday.month === currentBSDate.month &&
        bsToday.date === day
      );
    } catch {
      return false;
    }
  };

  // Handle date selection
  const handleDateSelect = (day: number) => {
    const dateString = `${currentBSDate.year}-${currentBSDate.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDate(dateString);
  };

  const calendarDays = generateCalendarDays();

  return (
    <ChartCard className='p-4 w-full bg-white shadow-lg rounded-xl border-0'>
      {/* Header */}
      <div className='mb-4'>
        <h2 className='text-lg font-semibold text-gray-900 mb-2'>
          नेपाली पात्रो (बिक्रम संबत्)
        </h2>
        <div className='space-y-1'>
          <p className='text-gray-600'>
            हालको मिति:{' '}
            {(() => {
              try {
                const currentBS = ad2bs(
                  currentTime.getFullYear(),
                  currentTime.getMonth() + 1,
                  currentTime.getDate(),
                );
                if (currentBS) {
                  return `${nepaliWeekdays[currentTime.getDay()]}, ${nepaliMonths[currentBS.month - 1]} ${currentBS.date}, ${currentBS.year}`;
                }
              } catch (error) {
                console.debug('Date conversion error:', error);
              }
              return 'Loading...';
            })()}
          </p>
          <p className='text-sm text-blue-600 font-semibold'>
            Nepal Time:{' '}
            {currentTime.toLocaleTimeString('en-US', {
              timeZone: 'Asia/Kathmandu',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3 mb-3 shadow-md'>
        <div className='flex items-center justify-between text-white'>
          <button
            onClick={goToPreviousMonth}
            className='p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>

          <div className='text-center'>
            <h3 className='text-lg font-semibold mb-1'>
              {nepaliMonths[currentBSDate.month - 1]} {currentBSDate.year}
            </h3>
            <p className='text-blue-100 text-sm'>
              {currentTime.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
                timeZone: 'Asia/Kathmandu',
              })}{' '}
              •{' '}
              {currentTime.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kathmandu',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <button
            onClick={goToNextMonth}
            className='p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className='bg-gray-50 rounded-lg p-4 shadow-inner'>
        {/* Weekday Headers */}
        <div className='grid grid-cols-7 gap-2 mb-3'>
          {nepaliWeekdays.map((day, index) => (
            <div
              key={index}
              className={`text-center py-2 px-2 rounded-lg shadow-sm ${
                index === 6 // Saturday is index 6 (शनि)
                  ? 'bg-gradient-to-b from-red-500 to-red-600'
                  : 'bg-gradient-to-b from-gray-100 to-gray-200'
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  index === 6 ? 'text-white' : 'text-gray-700'
                }`}
              >
                {day}
                {index === 6 && (
                  <span className='block text-xs text-red-100 mt-1'>बिदा</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className='grid grid-cols-7 gap-2'>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className='h-12'></div>;
            }

            const isSelected =
              selectedDate ===
              `${currentBSDate.year}-${currentBSDate.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isTodayDate = isToday(day);

            // Check if this day is Saturday (convert BS date to AD to get weekday)
            let isSaturday = false;
            try {
              const adDate = bs2ad(
                currentBSDate.year,
                currentBSDate.month,
                day,
              );
              if (adDate) {
                const dayDate = new Date(
                  adDate.year,
                  adDate.month - 1,
                  adDate.date,
                );
                isSaturday = dayDate.getDay() === 6; // Saturday is 6
              }
            } catch (error) {
              console.debug('Saturday detection error:', error);
            }

            return (
              <button
                key={index}
                onClick={() => handleDateSelect(day)}
                className={`
                  h-12 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 shadow-sm
                  ${
                    isTodayDate
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-300'
                      : isSelected
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-300'
                        : isSaturday
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300 hover:from-red-600 hover:to-red-700'
                          : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-600 border border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                <div className='flex flex-col items-center justify-center h-full'>
                  <span
                    className={`text-base ${isTodayDate || isSelected || isSaturday ? 'text-white' : 'text-gray-900'}`}
                  >
                    {day}
                  </span>
                  {isTodayDate && (
                    <span className='text-xs text-blue-100 mt-1'>आज</span>
                  )}
                  {isSaturday && !isTodayDate && (
                    <span className='text-xs text-red-100 mt-1'>बिदा</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className='mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center'>
              <Calendar className='w-5 h-5 text-white' />
            </div>
            <div>
              <p className='text-green-800 font-semibold text-lg'>
                Selected Date
              </p>
              <p className='text-green-700 text-xl font-bold'>{selectedDate}</p>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
};

// Component Props Interface
interface AcademicCalendarProps {
  title?: string;
  subtitle?: string;
  showExportButton?: boolean;
  showActionButtons?: boolean;
  events?: Event[];
  className?: string;
}

export default function AcademicCalendar({
  title: _title = 'नेपाली शैक्षिक पात्रो',
  subtitle:
    _subtitle = 'Nepali Academic Calendar - Manage events, holidays, and important dates',
  showExportButton = true,
  showActionButtons = true,
  events = [],
  className = '',
}: AcademicCalendarProps) {
  const [calendarType, setCalendarType] = useState<'BS' | 'AD'>('BS');

  const handleRefresh = () => {
    console.log('Refreshing calendar...');
  };

  const handleAddEvent = () => {
    console.log('Adding new event...');
  };

  const toggleCalendarType = () => {
    setCalendarType(calendarType === 'BS' ? 'AD' : 'BS');
  };

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'>
              {calendarType === 'BS'
                ? 'नेपाली शैक्षिक पात्रो'
                : 'Academic Calendar'}
            </h1>
            <p className='text-xs sm:text-sm lg:text-base text-gray-600 mt-1'>
              {calendarType === 'BS'
                ? 'Nepali Academic Calendar (Bikram Sambat)'
                : 'Gregorian Academic Calendar (Current World Time)'}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            {/* Calendar Type Toggle */}
            <div className='flex items-center gap-3 bg-white rounded-xl p-1 shadow-lg border border-gray-200'>
              <button
                onClick={toggleCalendarType}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  calendarType === 'BS'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>BS</span>
              </button>
              <button
                onClick={toggleCalendarType}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  calendarType === 'AD'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>AD</span>
              </button>
            </div>

            {showExportButton && (
              <button
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                  calendarType === 'BS'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                }`}
              >
                <Plus className='w-4 h-4' />
                <span className='hidden sm:inline'>Export Calendar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Action Buttons */}
          {showActionButtons && (
            <ActionButtons
              pageType='calendar'
              onRefresh={handleRefresh}
              onAddNew={handleAddEvent}
            />
          )}

          {/* Calendar and Events Side by Side */}
          <div className='grid grid-cols-1 lg:grid-cols-10 gap-6'>
            {/* Calendar - 70% width */}
            <div className='lg:col-span-7'>
              {calendarType === 'BS' ? (
                <CustomBSCalendar events={events} />
              ) : (
                <CustomADCalendar events={events} />
              )}
            </div>

            {/* Upcoming Events Panel - 30% width */}
            <div className='lg:col-span-3'>
              <div className='mb-4'>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                    calendarType === 'BS'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <Globe className='w-3 h-3' />
                  <span>
                    {calendarType === 'BS' ? 'Events (BS)' : 'Events (AD)'}
                  </span>
                </div>
              </div>
              <UpcomingEventsPanel events={events} maxEvents={6} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
