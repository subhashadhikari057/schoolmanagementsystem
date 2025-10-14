'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { ad2bs } from 'hamro-nepali-patro';

interface NepaliYearRangePickerProps {
  label?: string;
  value: string; // Format: "2082-2083"
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const NepaliYearRangePicker: React.FC<NepaliYearRangePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startYear, setStartYear] = useState<number>(2082);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Initialize from value or current year
  useEffect(() => {
    try {
      if (value && value.includes('-')) {
        const [start] = value.split('-').map(Number);
        setStartYear(start);
      } else {
        const today = new Date();
        const bsDate = ad2bs(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate(),
        );
        setStartYear(bsDate.year);
      }
    } catch (error) {
      console.error('Year initialization error:', error);
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

  const handleYearSelect = (year: number) => {
    const yearRange = `${year}-${year + 1}`;
    onChange(yearRange);
    setIsOpen(false);
  };

  const formatDisplayYear = (yearRange: string) => {
    if (!yearRange) return 'Select Academic Year';
    return `${yearRange} BS`;
  };

  // Generate year options (current year - 5 to current year + 10)
  const generateYearOptions = () => {
    const currentYear = startYear;
    const years: number[] = [];

    for (let i = currentYear - 5; i <= currentYear + 10; i++) {
      years.push(i);
    }

    return years;
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
              className={value ? 'text-gray-900 font-medium' : 'text-gray-500'}
            >
              {formatDisplayYear(value)}
            </span>
          </div>
          <div className='flex items-center space-x-1'>
            <ChevronDown className='h-4 w-4 text-gray-400' />
          </div>
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

      {/* Error Message */}
      {error && <p className='mt-1 text-xs text-red-600'>{error}</p>}

      {/* Year Range Dropdown */}
      {isOpen && (
        <div className='absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto'>
          <div className='p-2'>
            <div className='text-xs font-medium text-gray-700 mb-2 px-2'>
              Select Academic Year:
            </div>
            {generateYearOptions().map(year => {
              const yearRange = `${year}-${year + 1}`;
              const isSelected = value === yearRange;

              return (
                <button
                  key={year}
                  type='button'
                  onClick={() => handleYearSelect(year)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <div className='font-medium'>{yearRange} BS</div>
                  <div className='text-xs opacity-75'>
                    Academic Year {year} to {year + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NepaliYearRangePicker;
