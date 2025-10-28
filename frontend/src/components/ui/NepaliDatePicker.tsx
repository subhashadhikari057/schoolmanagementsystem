'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { ad2bs, bs2ad } from 'hamro-nepali-patro';

interface NepaliDatePickerProps {
  label?: string;
  value: string; // BS date string: YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize with today's date in Nepali calendar to avoid empty state
  const getInitialCalendarState = () => {
    try {
      const today = new Date();
      const bsDate = ad2bs(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate(),
      );
      return { month: bsDate.month, year: bsDate.year };
    } catch (error) {
      console.error('Error getting initial calendar state:', error);
      return { month: 1, year: 2082 }; // Fallback
    }
  };

  const [calendarState, setCalendarState] = useState<{
    month: number;
    year: number;
  }>(getInitialCalendarState());
  const pickerRef = useRef<HTMLDivElement>(null);

  // Use combined state for month and year to avoid race conditions
  const currentMonth = calendarState.month;
  const currentYear = calendarState.year;

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

  // Days in each Nepali month (approximation - can be 29-32 days)
  const getDaysInNepaliMonth = (year: number, month: number): number => {
    // Nepali calendar has varying days per month
    // This is a simplified version - for production, use a proper Nepali calendar library
    const daysMap: { [key: number]: number } = {
      1: 31, // Baisakh
      2: 31, // Jestha
      3: 31, // Ashadh
      4: 32, // Shrawan
      5: 31, // Bhadra
      6: 30, // Ashwin
      7: 30, // Kartik
      8: 30, // Mangsir
      9: 29, // Poush
      10: 30, // Magh
      11: 30, // Falgun
      12: 30, // Chaitra
    };
    return daysMap[month] || 30;
  };

  // Get the starting day of the month (0 = Sunday, 6 = Saturday)
  const getStartingDayOfMonth = (year: number, month: number): number => {
    try {
      const ad = bs2ad(year, month, 1);
      const adDate = new Date(ad.year, ad.month - 1, ad.date);
      return adDate.getDay();
    } catch (error) {
      return 0; // Default to Sunday
    }
  };

  // Initialize current month/year from value or today's date
  useEffect(() => {
    try {
      if (value) {
        const [year, month] = value.split('-').map(Number);
        setCalendarState({ year, month });
      } else {
        const today = new Date();
        const bsDate = ad2bs(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate(),
        );
        setCalendarState({ year: bsDate.year, month: bsDate.month });
      }
    } catch (error) {
      console.error('Date initialization error:', error);
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDateSelect = (
    day: number,
    yearOverride?: number,
    monthOverride?: number,
  ) => {
    const selectedYear = yearOverride || currentYear;
    const selectedMonth = monthOverride || currentMonth;
    const selectedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(selectedDate);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCalendarState({ month: 12, year: currentYear - 1 });
    } else {
      setCalendarState({ month: currentMonth - 1, year: currentYear });
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCalendarState({ month: 1, year: currentYear + 1 });
    } else {
      setCalendarState({ month: currentMonth + 1, year: currentYear });
    }
  };

  const goToToday = () => {
    try {
      const today = new Date();
      const bsDate = ad2bs(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate(),
      );

      // Create the today BS string
      const todayBSString = `${bsDate.year}-${String(bsDate.month).padStart(2, '0')}-${String(bsDate.date).padStart(2, '0')}`;

      // Set the calendar view and date in one atomic operation
      setCalendarState({ year: bsDate.year, month: bsDate.month });

      // Set the selected date and close the picker
      onChange(todayBSString);
      setIsOpen(false);
    } catch (error) {
      console.error('Error going to today:', error);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInNepaliMonth(currentYear, currentMonth);
    const startingDay = getStartingDayOfMonth(currentYear, currentMonth);
    const days: React.ReactNode[] = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className='p-0.5 text-center'>
          <div className='w-6 h-6'></div>
        </div>,
      );
    }

    // Add the days of the month
    const selectedDay = value ? parseInt(value.split('-')[2]) : null;
    const selectedMonth = value ? parseInt(value.split('-')[1]) : null;
    const selectedYear = value ? parseInt(value.split('-')[0]) : null;

    // Get today's date in BS
    const today = new Date();
    let todayBS: { year: number; month: number; date: number } | null = null;
    try {
      todayBS = ad2bs(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate(),
      );
    } catch (error) {
      console.error('Error getting today BS date:', error);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDay === day &&
        selectedMonth === currentMonth &&
        selectedYear === currentYear;

      const isToday =
        todayBS &&
        todayBS.date === day &&
        todayBS.month === currentMonth &&
        todayBS.year === currentYear;

      days.push(
        <div key={day} className='p-0.5'>
          <button
            type='button'
            onClick={() => handleDateSelect(day)}
            className={`w-6 h-6 rounded-full text-xs font-medium transition-all duration-150 hover:bg-blue-100 hover:scale-110 ${
              isSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : isToday
                  ? 'bg-orange-100 text-orange-700 border border-orange-400'
                  : 'text-gray-700 hover:text-blue-600'
            }`}
          >
            {day}
          </button>
        </div>,
      );
    }

    return days;
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select Date';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      return `${nepaliMonths[month - 1]} ${day}, ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const getEnglishDate = (bsDate: string) => {
    if (!bsDate) return '';
    try {
      const [year, month, day] = bsDate.split('-').map(Number);
      const ad = bs2ad(year, month, day);
      const adDate = new Date(ad.year, ad.month - 1, ad.date);
      return adDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {label && (
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          {label}
        </label>
      )}

      {/* Input Display */}
      <div className='relative'>
        <button
          type='button'
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-md bg-white transition-all duration-200 text-sm ${
            disabled
              ? 'bg-gray-100 cursor-not-allowed text-gray-500'
              : 'hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          } ${error ? 'border-red-500' : 'border-gray-300'}`}
        >
          <div className='flex items-center space-x-2'>
            <Calendar className='h-4 w-4 text-gray-400' />
            <span
              className={`text-xs ${value ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
            >
              {formatDisplayDate(value)}
            </span>
          </div>
          <ChevronDown className='h-4 w-4 text-gray-400' />
        </button>

        {/* Clear button positioned absolutely to avoid nesting */}
        {value && !disabled && (
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onChange('');
            }}
            className='absolute right-8 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-10'
          >
            <X className='h-3 w-3 text-gray-400' />
          </button>
        )}
      </div>

      {/* English Date Display */}
      {value && (
        <div className='mt-1 text-xs text-gray-500'>
          English: {getEnglishDate(value)}
        </div>
      )}

      {/* Error Message */}
      {error && <p className='mt-1 text-xs text-red-600'>{error}</p>}

      {/* Calendar Popup */}
      {isOpen && (
        <div className='absolute z-50 mt-1 w-72 bg-white rounded-md shadow-lg border border-gray-200 p-3'>
          {/* Calendar Header */}
          <div className='flex items-center justify-between mb-3'>
            <button
              type='button'
              onClick={goToPreviousMonth}
              className='p-1 hover:bg-gray-100 rounded-full transition-colors'
            >
              <ChevronLeft className='h-4 w-4 text-gray-600' />
            </button>

            <div className='text-center'>
              <div className='text-sm font-bold text-gray-900'>
                {nepaliMonths[currentMonth - 1]}
              </div>
              <div className='text-xs text-gray-600'>{currentYear}</div>
            </div>

            <button
              type='button'
              onClick={goToNextMonth}
              className='p-1 hover:bg-gray-100 rounded-full transition-colors'
            >
              <ChevronRight className='h-4 w-4 text-gray-600' />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className='grid grid-cols-7 gap-1 mb-2'>
            {nepaliWeekdays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-xs font-semibold py-1 ${
                  index === 6 ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className='grid grid-cols-7 gap-1 mb-2'>
            {renderCalendarDays()}
          </div>

          {/* Footer Actions */}
          <div className='flex items-center justify-between pt-2 border-t border-gray-200'>
            <button
              type='button'
              onClick={goToToday}
              className='px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors'
            >
              आज
            </button>
            <button
              type='button'
              onClick={() => setIsOpen(false)}
              className='px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NepaliDatePicker;
