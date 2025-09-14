'use client';

import React, { useState, useEffect } from 'react';

import UpcomingEventsPanel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import UpcomingCalendarEvents from './components/UpcomingCalendarEvents';
import UpcomingExams from './components/UpcomingExams';

import ChartCard from '@/components/atoms/display/ChartCard';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Calendar, Plus, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { Event } from '@/types/EventTypes';
import { ad2bs, bs2ad } from 'hamro-nepali-patro';
import AddEventModal from './components/AddEventModal';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { AcademicCalendarProps } from './types/calendar.types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Custom BS Calendar Component with Nepali Dates
const CustomBSCalendar = ({
  events,
  selectedDate,
  onDateSelect,
  onDateDoubleClick,
}: {
  events: Event[];
  selectedDate: string;
  onDateSelect: (dateString: string) => void;
  onDateDoubleClick: (dateString: string) => void;
}) => {
  // Helper function to truncate titles with ellipsis only if needed
  const truncateTitle = (title: string, maxLength: number = 10) => {
    if (title.length > maxLength) {
      return title.slice(0, maxLength) + '...';
    }
    return title;
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Nepali month names
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

  // Nepali weekday names
  const nepaliWeekdays = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

  // Convert current date to BS for display
  const getCurrentBSDate = () => {
    try {
      const today = new Date();
      return ad2bs(today.getFullYear(), today.getMonth() + 1, today.getDate());
    } catch (error) {
      console.error('BS date conversion error:', error);
      return { year: 2081, month: 1, date: 1 };
    }
  };

  const [currentBSDate, setCurrentBSDate] = useState(getCurrentBSDate());

  // Helpers to work with BS <-> AD
  const getAdDateFromBs = (bsYear: number, bsMonth: number, bsDay: number) => {
    try {
      const ad = bs2ad(bsYear, bsMonth, bsDay) as any;
      return new Date(ad.year, ad.month - 1, ad.date);
    } catch (_e) {
      return new Date();
    }
  };

  const getBsMonthMeta = (bsYear: number, bsMonth: number) => {
    // First AD day that corresponds to BS Y-M-1
    const firstAd = getAdDateFromBs(bsYear, bsMonth, 1);
    // Next BS month first day (handle year rollover)
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

  const formatAdDate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Generate calendar days using BS month boundaries
  const generateCalendarDays = () => {
    const days: Array<any | null> = [];
    const { year: bsYear, month: bsMonth } = currentBSDate as any;
    const { firstAd, daysInMonth, startingDayOfWeek } = getBsMonthMeta(
      bsYear,
      bsMonth,
    );

    // Add empty cells before BS month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add BS days with mapped AD Date
    for (let bsDay = 1; bsDay <= daysInMonth; bsDay++) {
      const adDate = new Date(
        firstAd.getTime() + (bsDay - 1) * 24 * 60 * 60 * 1000,
      );
      days.push({
        bsDay,
        adDate,
        adDateString: formatAdDate(adDate),
      });
    }

    return days;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    const prevMonth = currentBSDate.month === 1 ? 12 : currentBSDate.month - 1;
    const prevYear =
      currentBSDate.month === 1 ? currentBSDate.year - 1 : currentBSDate.year;
    const firstAd = getAdDateFromBs(prevYear, prevMonth, 1);
    setCurrentBSDate({ year: prevYear, month: prevMonth, date: 1 } as any);
    setCurrentDate(firstAd);
  };

  const goToNextMonth = () => {
    const nextMonth = currentBSDate.month === 12 ? 1 : currentBSDate.month + 1;
    const nextYear =
      currentBSDate.month === 12 ? currentBSDate.year + 1 : currentBSDate.year;
    const firstAd = getAdDateFromBs(nextYear, nextMonth, 1);
    setCurrentBSDate({ year: nextYear, month: nextMonth, date: 1 } as any);
    setCurrentDate(firstAd);
  };

  // Check if date is today (using AD date)
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  };

  // Handle date selection
  const handleDateSelect = (adDateString: string) => {
    onDateSelect(adDateString);
  };

  // Get events for a specific AD date string (YYYY-MM-DD)
  const getEventsForDate = (adDateString: string) => {
    const dayEvents = events.filter(event => {
      // Check if this date falls within the event's date range
      const eventStartDate = event.date;
      const eventEndDate = event.endDate || event.date; // Use endDate if available, otherwise use start date

      // Convert dates to timestamps for comparison
      const currentDate = new Date(adDateString);
      const startDate = new Date(eventStartDate);
      const endDate = new Date(eventEndDate);

      // Check if current date is within the event's date range (inclusive)
      return currentDate >= startDate && currentDate <= endDate;
    });
    return dayEvents;
  };

  const calendarDays = generateCalendarDays();

  return (
    <ChartCard className='p-4 w-full bg-white shadow-lg rounded-xl border-0'>
      {/* Header */}
      <div className='mb-4'>
        <h2 className='text-lg font-semibold text-gray-900 mb-2'>
          नेपाली पात्रो (बिक्रम संवत्)
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
            {currentTime.toLocaleString('en-US', {
              timeZone: 'Asia/Kathmandu',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })}
          </p>
        </div>

        {/* Month Navigation */}
        <div className='flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-4 shadow-lg mt-4'>
          <button
            onClick={goToPreviousMonth}
            className='p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>

          <div className='text-center'>
            <h3 className='text-lg font-semibold mb-1'>
              {nepaliMonths[currentBSDate.month - 1] || 'N/A'}{' '}
              {currentBSDate.year}
            </h3>
            <p className='text-blue-100 text-sm'>
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
                  console.debug('BS date conversion error:', error);
                }
                return 'Loading...';
              })()}
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
                index === 6 // Saturday is index 6
                  ? 'bg-gradient-to-b from-red-500 to-red-600'
                  : 'bg-gradient-to-b from-blue-100 to-blue-200'
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  index === 6
                    ? 'text-slate-200 font-bold drop-shadow-lg'
                    : 'text-gray-700'
                }`}
              >
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className='grid grid-cols-7 gap-2'>
          {calendarDays.map((dayObj, index) => {
            if (!dayObj) {
              return <div key={index} className='h-16'></div>;
            }

            const bsDay = dayObj.bsDay as number;
            const adDate: Date = dayObj.adDate as Date;
            const adDateString: string = dayObj.adDateString as string;

            const isSelected = selectedDate === adDateString;
            const isTodayDate = isToday(adDate);
            const dayEvents = getEventsForDate(adDateString);
            const hasEvents = dayEvents.length > 0;
            const hasHoliday =
              hasEvents &&
              dayEvents.some(
                (e: any) =>
                  (e && (e as any).type
                    ? String((e as any).type).toLowerCase()
                    : '') === 'holiday',
              );
            const hasEvent =
              hasEvents &&
              dayEvents.some(
                (e: any) =>
                  (e && (e as any).type
                    ? String((e as any).type).toLowerCase()
                    : '') === 'event',
              );
            const hasExam =
              hasEvents &&
              dayEvents.some(
                (e: any) =>
                  (e && (e as any).type
                    ? String((e as any).type).toLowerCase()
                    : '') === 'exam',
              );
            const hasEmergencyClosure =
              hasEvents &&
              dayEvents.some(
                (e: any) =>
                  (e && (e as any).type
                    ? String((e as any).type).toLowerCase()
                    : '') === 'emergency_closure',
              );
            const hasOnlyEvent =
              hasEvents &&
              !hasHoliday &&
              !hasExam &&
              !hasEmergencyClosure &&
              hasEvent;
            const holidayEvent = hasHoliday
              ? dayEvents.find(
                  (e: any) =>
                    (e && (e as any).type
                      ? String((e as any).type).toLowerCase()
                      : '') === 'holiday',
                )
              : undefined;
            const holidayName = holidayEvent
              ? String(
                  (holidayEvent as any).title ||
                    (holidayEvent as any).name ||
                    'Holiday',
                )
              : '';

            // Saturday check from AD date
            const isSaturday = adDate.getDay() === 6;

            return (
              <TooltipProvider key={index}>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      className={`
                        h-16 min-h-16 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 shadow-sm relative overflow-hidden
                        ${
                          isSaturday
                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300 hover:from-red-600 hover:to-red-700'
                            : hasEmergencyClosure
                              ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-red-400 hover:from-red-700 hover:to-red-800'
                              : hasHoliday
                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300 hover:from-red-600 hover:to-red-700'
                                : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-600 border border-gray-200 hover:border-blue-300'
                        }
                      `}
                    >
                      <div className='flex flex-col h-full relative'>
                        {/* Day Number and Status */}
                        <div className='flex-shrink-0 text-center py-1'>
                          <div className='flex flex-col items-center'>
                            <span
                              className={`text-sm font-bold ${
                                isTodayDate
                                  ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                                  : isSaturday ||
                                      hasEmergencyClosure ||
                                      hasHoliday
                                    ? 'text-white'
                                    : 'text-gray-900'
                              }`}
                            >
                              {bsDay}
                            </span>
                          </div>
                        </div>

                        {/* Event Badges - Show dots only for non-holiday events */}
                        {hasEvents && (
                          <div className='absolute bottom-1 left-1 right-1 flex flex-wrap gap-1'>
                            {dayEvents
                              .filter(event => {
                                const eventType =
                                  (event as any).type?.toLowerCase() || 'event';
                                return eventType !== 'holiday';
                              })
                              .slice(0, 2)
                              .map((event, eventIndex) => {
                                const eventType =
                                  (event as any).type?.toLowerCase() || 'event';
                                let badgeColor = 'bg-blue-500 text-white';
                                let dotColor = 'bg-blue-600';

                                if (eventType === 'emergency_closure') {
                                  badgeColor = 'bg-red-700 text-white';
                                  dotColor = 'bg-red-800';
                                } else if (eventType === 'exam') {
                                  badgeColor = 'bg-purple-500 text-white';
                                  dotColor = 'bg-purple-600';
                                } else if (eventType === 'event') {
                                  badgeColor = 'bg-blue-500 text-white';
                                  dotColor = 'bg-blue-600';
                                }

                                return (
                                  <div
                                    key={`${event.id}-${eventIndex}`}
                                    className={`w-3 h-3 rounded-full ${dotColor} shadow-sm border border-white/20`}
                                  ></div>
                                );
                              })}
                            {dayEvents.filter(event => {
                              const eventType =
                                (event as any).type?.toLowerCase() || 'event';
                              return eventType !== 'holiday';
                            }).length > 2 && (
                              <div className='text-xs text-gray-500 px-1'>
                                +
                                {dayEvents.filter(event => {
                                  const eventType =
                                    (event as any).type?.toLowerCase() ||
                                    'event';
                                  return eventType !== 'holiday';
                                }).length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-sm bg-white border border-gray-200 shadow-lg'>
                    <div className='p-2'>
                      <div className='font-semibold text-sm text-gray-900 mb-1'>
                        {(() => {
                          try {
                            const currentBS = ad2bs(
                              adDate.getFullYear(),
                              adDate.getMonth() + 1,
                              adDate.getDate(),
                            );
                            return `${nepaliWeekdays[adDate.getDay()]}, ${nepaliMonths[currentBS.month - 1]} ${currentBS.date}, ${currentBS.year}`;
                          } catch (error) {
                            return adDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            });
                          }
                        })()}
                      </div>
                      {hasEvents ? (
                        <div className='space-y-1'>
                          {dayEvents.map((event, eventIndex) => {
                            const eventType =
                              (event as any).type?.toLowerCase() || 'event';
                            let borderColor = 'border-blue-500';
                            let icon = '📅';

                            if (eventType === 'holiday') {
                              borderColor = 'border-red-500';
                              icon = '🎉';
                            } else if (eventType === 'emergency_closure') {
                              borderColor = 'border-red-700';
                              icon = '🚨';
                            } else if (eventType === 'exam') {
                              borderColor = 'border-purple-500';
                              icon = '📝';
                            }

                            return (
                              <div
                                key={eventIndex}
                                className={`text-xs border-l-2 ${borderColor} pl-2`}
                              >
                                <div className='font-medium text-gray-900 flex items-center gap-1'>
                                  <span>{icon}</span>
                                  <span>
                                    {(event as any).title ||
                                      (event as any).name ||
                                      'Untitled Event'}
                                  </span>
                                </div>

                                {/* Holiday-specific details */}
                                {eventType === 'holiday' && (
                                  <div className='text-gray-600'>
                                    <div className='text-red-600 font-medium'>
                                      Holiday
                                    </div>
                                    {(event as any).description && (
                                      <div className='text-gray-500 text-xs mt-1'>
                                        {(event as any).description}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Emergency Closure-specific details */}
                                {eventType === 'emergency_closure' && (
                                  <div className='text-gray-600'>
                                    <div className='text-red-700 font-medium'>
                                      Emergency Closure
                                    </div>
                                    {(event as any).emergencyClosureType && (
                                      <div className='text-gray-500 text-xs'>
                                        🚨 {(event as any).emergencyClosureType}
                                      </div>
                                    )}
                                    {(event as any).emergencyReason && (
                                      <div className='text-gray-500 text-xs mt-1'>
                                        {(event as any).emergencyReason}
                                      </div>
                                    )}
                                    {(event as any).affectedAreas && (
                                      <div className='text-gray-500 text-xs'>
                                        📍 {(event as any).affectedAreas}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Exam-specific details */}
                                {eventType === 'exam' && (
                                  <div className='text-gray-600'>
                                    <div className='text-purple-600 font-medium'>
                                      Exam
                                    </div>
                                    {(event as any).subject && (
                                      <div className='text-gray-500 text-xs'>
                                        📚 {(event as any).subject}
                                      </div>
                                    )}
                                    {(event as any).duration && (
                                      <div className='text-gray-500 text-xs'>
                                        ⏱️ {(event as any).duration}
                                      </div>
                                    )}
                                    {(event as any).location &&
                                      (event as any).location !==
                                        'No location' && (
                                        <div className='text-gray-500 text-xs'>
                                          📍 {(event as any).location}
                                        </div>
                                      )}
                                  </div>
                                )}

                                {/* Regular event details */}
                                {eventType === 'event' && (
                                  <div className='text-gray-600'>
                                    <div className='text-blue-600 font-medium'>
                                      Event
                                    </div>
                                    {(event as any).location &&
                                      (event as any).location !==
                                        'No location' && (
                                        <div className='text-gray-500 text-xs'>
                                          📍 {(event as any).location}
                                        </div>
                                      )}
                                    {(event as any).description && (
                                      <div className='text-gray-500 text-xs mt-1'>
                                        {(event as any).description}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className='text-xs text-gray-500'>No events</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
};

// Custom AD Calendar Component with Pure Tailwind
const CustomADCalendar = ({
  events,
  selectedDate,
  onDateSelect,
  onDateDoubleClick,
}: {
  events: Event[];
  selectedDate: string;
  onDateSelect: (dateString: string) => void;
  onDateDoubleClick: (dateString: string) => void;
}) => {
  // Helper function to truncate titles with ellipsis only if needed
  const truncateTitle = (title: string, maxLength: number = 10) => {
    if (title.length > maxLength) {
      return title.slice(0, maxLength) + '...';
    }
    return title;
  };

  const [currentDate, setCurrentDate] = useState(new Date());
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
  const englishWeekdays = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Saturday',
  ];

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
    onDateSelect(dateString);
  };

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayEvents = events.filter(event => {
      // Check if this date falls within the event's date range
      const eventStartDate = event.date;
      const eventEndDate = event.endDate || event.date; // Use endDate if available, otherwise use start date

      // Convert dates to timestamps for comparison
      const currentDate = new Date(dateString);
      const startDate = new Date(eventStartDate);
      const endDate = new Date(eventEndDate);

      // Check if current date is within the event's date range (inclusive)
      return currentDate >= startDate && currentDate <= endDate;
    });

    return dayEvents;
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
      <div className='flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg p-4 shadow-lg mt-4'>
        <button
          onClick={goToPreviousMonth}
          className='p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110'
        >
          <ChevronLeft className='w-5 h-5' />
        </button>

        <div className='text-center'>
          <h3 className='text-lg font-semibold mb-1'>
            {englishMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <p className='text-emerald-100 text-sm'>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'Asia/Kathmandu',
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
                  index === 6
                    ? 'text-slate-200 font-bold drop-shadow-lg'
                    : 'text-gray-700'
                }`}
              >
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className='grid grid-cols-7 gap-2'>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className='h-16'></div>;
            }

            const isSelected =
              selectedDate ===
              `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isTodayDate = isToday(day);
            const dayEvents = getEventsForDate(day);
            const hasEvents = dayEvents.length > 0;
            const hasHoliday =
              hasEvents &&
              dayEvents.some(
                (e: any) =>
                  (e && (e as any).type
                    ? String((e as any).type).toLowerCase()
                    : '') === 'holiday',
              );
            const hasEmergencyClosure =
              hasEvents &&
              dayEvents.some(
                (e: any) =>
                  (e && (e as any).type
                    ? String((e as any).type).toLowerCase()
                    : '') === 'emergency_closure',
              );

            // Check if this day is Saturday (6 in JavaScript Date.getDay())
            const currentDayDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day,
            );
            const isSaturday = currentDayDate.getDay() === 6;

            return (
              <TooltipProvider key={index}>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      className={`
                        h-16 min-h-16 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 shadow-sm relative overflow-hidden
                        ${
                          isSaturday
                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300 hover:from-red-600 hover:to-red-700'
                            : hasEmergencyClosure
                              ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-red-400 hover:from-red-700 hover:to-red-800'
                              : hasHoliday
                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300 hover:from-red-600 hover:to-red-700'
                                : 'bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 text-gray-700 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300'
                        }
                      `}
                    >
                      <div className='flex flex-col h-full relative'>
                        {/* Day Number and Status */}
                        <div className='flex-shrink-0 text-center py-1'>
                          <div className='flex flex-col items-center'>
                            <span
                              className={`text-sm font-bold ${
                                isTodayDate
                                  ? 'bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                                  : isSelected ||
                                      isSaturday ||
                                      hasEmergencyClosure ||
                                      hasHoliday
                                    ? 'text-white'
                                    : 'text-gray-900'
                              }`}
                            >
                              {day}
                            </span>
                          </div>
                        </div>

                        {/* Event Badges - Show dots only for non-holiday events */}
                        {hasEvents && (
                          <div className='absolute bottom-1 left-1 right-1 flex flex-wrap gap-1'>
                            {dayEvents
                              .filter(event => {
                                const eventType =
                                  (event as any).type?.toLowerCase() || 'event';
                                return eventType !== 'holiday';
                              })
                              .slice(0, 2)
                              .map((event, eventIndex) => {
                                const eventType =
                                  (event as any).type?.toLowerCase() || 'event';
                                let badgeColor = 'bg-blue-500 text-white';
                                let dotColor = 'bg-blue-600';

                                if (eventType === 'emergency_closure') {
                                  badgeColor = 'bg-red-700 text-white';
                                  dotColor = 'bg-red-800';
                                } else if (eventType === 'exam') {
                                  badgeColor = 'bg-purple-500 text-white';
                                  dotColor = 'bg-purple-600';
                                } else if (eventType === 'event') {
                                  badgeColor = 'bg-blue-500 text-white';
                                  dotColor = 'bg-blue-600';
                                }

                                return (
                                  <div
                                    key={`${event.id}-${eventIndex}`}
                                    className={`w-3 h-3 rounded-full ${dotColor} shadow-sm border border-white/20`}
                                  ></div>
                                );
                              })}
                            {dayEvents.filter(event => {
                              const eventType =
                                (event as any).type?.toLowerCase() || 'event';
                              return eventType !== 'holiday';
                            }).length > 2 && (
                              <div className='text-xs text-gray-500 px-1'>
                                +
                                {dayEvents.filter(event => {
                                  const eventType =
                                    (event as any).type?.toLowerCase() ||
                                    'event';
                                  return eventType !== 'holiday';
                                }).length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-sm bg-white border border-gray-200 shadow-lg'>
                    <div className='p-2'>
                      <div className='font-semibold text-sm text-gray-900 mb-1'>
                        {currentDayDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      {hasEvents ? (
                        <div className='space-y-1'>
                          {dayEvents.map((event, eventIndex) => {
                            const eventType =
                              (event as any).type?.toLowerCase() || 'event';
                            let borderColor = 'border-blue-500';
                            let icon = '📅';

                            if (eventType === 'holiday') {
                              borderColor = 'border-red-500';
                              icon = '🎉';
                            } else if (eventType === 'emergency_closure') {
                              borderColor = 'border-red-700';
                              icon = '🚨';
                            } else if (eventType === 'exam') {
                              borderColor = 'border-purple-500';
                              icon = '📝';
                            }

                            return (
                              <div
                                key={eventIndex}
                                className={`text-xs border-l-2 ${borderColor} pl-2`}
                              >
                                <div className='font-medium text-gray-900 flex items-center gap-1'>
                                  <span>{icon}</span>
                                  <span>{event.title}</span>
                                </div>

                                {/* Holiday-specific details */}
                                {eventType === 'holiday' && (
                                  <div className='text-gray-600'>
                                    <div className='text-red-600 font-medium'>
                                      Holiday
                                    </div>
                                    {(event as any).description && (
                                      <div className='text-gray-500 text-xs mt-1'>
                                        {(event as any).description}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Emergency Closure-specific details */}
                                {eventType === 'emergency_closure' && (
                                  <div className='text-gray-600'>
                                    <div className='text-red-700 font-medium'>
                                      Emergency Closure
                                    </div>
                                    {(event as any).emergencyClosureType && (
                                      <div className='text-gray-500 text-xs'>
                                        🚨 {(event as any).emergencyClosureType}
                                      </div>
                                    )}
                                    {(event as any).emergencyReason && (
                                      <div className='text-gray-500 text-xs mt-1'>
                                        {(event as any).emergencyReason}
                                      </div>
                                    )}
                                    {(event as any).affectedAreas && (
                                      <div className='text-gray-500 text-xs'>
                                        📍 {(event as any).affectedAreas}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Exam-specific details */}
                                {eventType === 'exam' && (
                                  <div className='text-gray-600'>
                                    <div className='text-purple-600 font-medium'>
                                      Exam
                                    </div>
                                    {(event as any).subject && (
                                      <div className='text-gray-500 text-xs'>
                                        📚 {(event as any).subject}
                                      </div>
                                    )}
                                    {(event as any).duration && (
                                      <div className='text-gray-500 text-xs'>
                                        ⏱️ {(event as any).duration}
                                      </div>
                                    )}
                                    {event.location &&
                                      event.location !== 'No location' && (
                                        <div className='text-gray-500 text-xs'>
                                          📍 {event.location}
                                        </div>
                                      )}
                                  </div>
                                )}

                                {/* Regular event details */}
                                {eventType === 'event' && (
                                  <div className='text-gray-600'>
                                    <div className='text-blue-600 font-medium'>
                                      Event
                                    </div>
                                    {event.location &&
                                      event.location !== 'No location' && (
                                        <div className='text-gray-500 text-xs'>
                                          📍 {event.location}
                                        </div>
                                      )}
                                    {(event as any).description && (
                                      <div className='text-gray-500 text-xs mt-1'>
                                        {(event as any).description}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className='text-xs text-gray-500'>No events</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
};

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Use the calendar events hook
  const { events: calendarEvents, refreshEvents } = useCalendarEvents({
    page: 1,
    limit: 100,
  });

  // Convert CalendarEvent to Event format for legacy calendar components
  const convertToLegacyEvent = (calendarEvent: any): Event => {
    const event = {
      id: calendarEvent.id || `temp-${Date.now()}-${Math.random()}`,
      title: calendarEvent.name || calendarEvent.title || 'Untitled Event',
      date: calendarEvent.date || new Date().toISOString().split('T')[0],
      endDate: calendarEvent.endDate || undefined, // Include endDate for multi-day events
      time: calendarEvent.time || '00:00',
      location: calendarEvent.location || calendarEvent.venue || 'No location',
      status: calendarEvent.status || 'Active',
      // carry-through type so calendar can color days (holiday/event)
      ...(calendarEvent.type ? { type: calendarEvent.type } : {}),
    };

    return event;
  };

  // Convert calendar events to legacy format
  const legacyEvents: Event[] = calendarEvents.map(convertToLegacyEvent);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEvents();
    } finally {
      // Ensure minimum animation time for good UX
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600); // Slightly longer for main refresh
    }
  };

  const handleAddEvent = () => {
    setShowAddModal(true);
  };

  // Handle date selection from calendar
  const handleDateSelectFromCalendar = (dateString: string) => {
    setSelectedDate(dateString);
  };

  // Handle date double click to open modal with selected date
  const handleDateDoubleClickFromCalendar = (dateString: string) => {
    setSelectedDate(dateString);
    setShowAddModal(true);
  };

  const toggleCalendarType = () => {
    setCalendarType(calendarType === 'BS' ? 'AD' : 'BS');
  };

  const handleEventCreated = async () => {
    await refreshEvents();
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
        <div className='w-full space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Action Buttons */}
          {showActionButtons && (
            <ActionButtons
              pageType='calendar'
              onRefresh={handleRefresh}
              onAddNew={handleAddEvent}
              events={calendarEvents}
            />
          )}

          {/* Calendar and Events Side by Side */}
          <div className='grid grid-cols-1 lg:grid-cols-10 gap-6'>
            {/* Calendar - 70% width */}
            <div className='lg:col-span-7'>
              {calendarType === 'BS' ? (
                <CustomBSCalendar
                  events={legacyEvents}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelectFromCalendar}
                  onDateDoubleClick={handleDateDoubleClickFromCalendar}
                />
              ) : (
                <CustomADCalendar
                  events={legacyEvents}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelectFromCalendar}
                  onDateDoubleClick={handleDateDoubleClickFromCalendar}
                />
              )}
            </div>

            {/* Upcoming Events Panel - 30% width */}
            <div className='lg:col-span-3 space-y-6'>
              {/* Upcoming Exams */}
              <UpcomingExams
                externalExams={calendarEvents.filter(
                  event => event.type === 'exam',
                )}
                initialLimit={3}
                daysAhead={30}
                showRefresh={true}
                onRefresh={handleRefresh}
                externalRefreshing={isRefreshing}
              />

              {/* Upcoming Events */}
              <div>
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
                <UpcomingCalendarEvents
                  externalEvents={calendarEvents.filter(
                    event => event.type !== 'exam',
                  )}
                  initialLimit={7}
                  daysAhead={7}
                  showLoadMore={true}
                  showRefresh={true}
                  onRefresh={handleRefresh}
                  externalRefreshing={isRefreshing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedDate(''); // Clear selected date when closing
        }}
        onEventCreated={handleEventCreated}
        initialDate={selectedDate}
      />
    </div>
  );
}
