'use client';

import React, { useMemo, useState, useEffect } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { Clock, Calendar, MapPin } from 'lucide-react';
import { calendarService } from '@/api/services/calendar.service';
import { CalendarEntryType } from '@sms/shared-types';
import { ad2bs } from 'hamro-nepali-patro';

interface Exam {
  id: string;
  title: string;
  examType?: string;
  date: string;
  timeRange: string;
  venue?: string;
  details?: string;
  status: 'grading' | 'completed' | 'scheduled';
}

export default function ExamsTab() {
  const [query, setQuery] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'grading' | 'completed' | 'scheduled'
  >('all');

  const formatExamType = (examType?: string) => {
    if (!examType) return 'Exam';
    return examType
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatExamDate = (startDate: string, endDate: string) => {
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

    const formatNepaliDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        const bsDate = ad2bs(
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate(),
        );
        const nepaliMonth = nepaliMonths[bsDate.month - 1] || 'N/A';
        return `${nepaliMonth} ${bsDate.date}, ${bsDate.year}`;
      } catch (_error) {
        return new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    };

    const startLabel = formatNepaliDate(startDate);
    const endLabel = formatNepaliDate(endDate);
    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  };

  const getStatusFromDates = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < now) return 'completed';
    if (start > now) return 'scheduled';
    return 'grading';
  };

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await calendarService.getCalendarEntries({
          page: 1,
          limit: 100,
          type: CalendarEntryType.EXAM,
        });
        const mappedExams: Exam[] = response.entries.map(entry => {
          const dateLabel = formatExamDate(entry.startDate, entry.endDate);
          const timeRange =
            entry.startTime && entry.endTime
              ? `${entry.startTime} - ${entry.endTime}`
              : entry.startTime || '';
          return {
            id: entry.id,
            title: entry.name,
            examType: entry.examType,
            date: dateLabel,
            timeRange,
            venue: entry.venue || undefined,
            details: entry.examDetails || undefined,
            status: getStatusFromDates(entry.startDate, entry.endDate),
          };
        });
        setExams(mappedExams);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load exams';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesQuery =
        exam.title.toLowerCase().includes(query.toLowerCase()) ||
        (exam.venue || '').toLowerCase().includes(query.toLowerCase()) ||
        formatExamType(exam.examType)
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || exam.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [exams, query, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'grading':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Search and Filters */}
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='w-full sm:flex-1'>
          <LabeledInputField
            type='search'
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search exams...'
            className='w-full bg-white'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z'
                />
              </svg>
            }
          />
        </div>
        <div className='flex items-center gap-2'>
          <Dropdown
            type='filter'
            title='Filter Status'
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'grading', label: 'Grading' },
              { value: 'completed', label: 'Completed' },
              { value: 'scheduled', label: 'Scheduled' },
            ]}
            selectedValue={statusFilter}
            onSelect={value =>
              setStatusFilter(
                value as 'all' | 'grading' | 'completed' | 'scheduled',
              )
            }
            className='max-w-xs'
          />
        </div>
      </div>

      {/* Exams List */}
      <div className='space-y-4'>
        {loading && (
          <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
            <p className='text-sm text-gray-600'>Loading exams...</p>
          </div>
        )}
        {!loading && error && (
          <div className='bg-white rounded-xl border border-red-200 p-6 shadow-sm'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}
        {!loading && !error && filteredExams.length === 0 && (
          <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
            <p className='text-sm text-gray-600'>
              No exams found for the selected filters.
            </p>
          </div>
        )}
        {!loading &&
          !error &&
          filteredExams.map(exam => (
            <div
              key={exam.id}
              className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm w-full'
            >
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4'>
                <div className='flex-1 min-w-0'>
                  <div className='flex flex-wrap gap-2 mb-3'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}
                    >
                      {exam.status}
                    </span>
                    <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
                      {formatExamType(exam.examType)}
                    </span>
                  </div>

                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words truncate'>
                    {exam.title}
                  </h3>

                  <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 text-xs sm:text-sm text-gray-600 mb-4'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      <span>{exam.date}</span>
                    </div>
                    {exam.timeRange && (
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4' />
                        <span>{exam.timeRange}</span>
                      </div>
                    )}
                    {exam.venue && (
                      <div className='flex items-center gap-2'>
                        <MapPin className='w-4 h-4' />
                        <span className='break-words'>{exam.venue}</span>
                      </div>
                    )}
                  </div>

                  {exam.details && (
                    <p className='text-xs sm:text-sm text-gray-600'>
                      {exam.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
