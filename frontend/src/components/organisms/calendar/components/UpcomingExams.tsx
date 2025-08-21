/**
 * =============================================================================
 * Upcoming Exams Component
 * =============================================================================
 * Displays upcoming exams with countdown, exam type, and detailed information
 * =============================================================================
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { calendarService } from '@/api/services/calendar.service';
import { CalendarEvent } from '@/components/organisms/calendar/types/calendar.types';
import { CalendarEntryType } from '@sms/shared-types';
import { ad2bs } from 'hamro-nepali-patro';

interface UpcomingExamsProps {
  /** Maximum exams to show initially */
  initialLimit?: number;
  /** Show next N days of exams */
  daysAhead?: number;
  /** Whether to show the refresh button */
  showRefresh?: boolean;
  /** Callback when an exam is clicked */
  onExamClick?: (exam: CalendarEvent) => void;
  /** External exams to display (if provided, will not fetch from API) */
  externalExams?: CalendarEvent[];
  /** Callback when component needs to refresh */
  onRefresh?: () => void;
  /** External refreshing state for synchronized animation */
  externalRefreshing?: boolean;
}

const UpcomingExams: React.FC<UpcomingExamsProps> = ({
  initialLimit = 5,
  daysAhead = 30,
  showRefresh = true,
  onExamClick,
  externalExams,
  onRefresh,
  externalRefreshing = false,
}) => {
  const [exams, setExams] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Format date for display badge (convert AD to BS)
  const formatDateBadge = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const bsDate = ad2bs(year, month, day);
      const nepaliMonth = nepaliMonths[bsDate.month - 1] || 'N/A';

      return {
        day: bsDate.date,
        month: nepaliMonth.substring(0, 3),
        fullMonth: nepaliMonth,
        year: bsDate.year,
      };
    } catch (error) {
      console.error('Date conversion error:', error);
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date
        .toLocaleDateString('en-US', { month: 'short' })
        .toUpperCase();
      return { day, month, fullMonth: month, year: date.getFullYear() };
    }
  };

  // Calculate days remaining until exam
  const getDaysRemaining = (examDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examStartDate = new Date(examDate);
    examStartDate.setHours(0, 0, 0, 0);

    const diffTime = examStartDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get exam type display label
  const getExamTypeLabel = (examType: string) => {
    const examTypeLabels: Record<string, string> = {
      FIRST_TERM: 'First Term',
      SECOND_TERM: 'Second Term',
      THIRD_TERM: 'Third Term',
      FINAL: 'Final Exam',
      UNIT_TEST: 'Unit Test',
      OTHER: 'Other',
    };
    return examTypeLabels[examType] || examType;
  };

  // Get countdown color based on days remaining
  const getCountdownColor = (daysRemaining: number) => {
    if (daysRemaining <= 0) return 'text-red-600 bg-red-100';
    if (daysRemaining <= 3) return 'text-orange-600 bg-orange-100';
    if (daysRemaining <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  // Fetch upcoming exams from API
  const fetchUpcomingExams = useCallback(async () => {
    if (externalExams !== undefined) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + daysAhead);

      const response = await calendarService.getCalendarEntries({
        page: 1,
        limit: 50,
        type: CalendarEntryType.EXAM,
        startDate: now.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      const upcomingExams = response.entries
        .map(entry => calendarService.toCalendarEvent(entry))
        .filter(exam => {
          const examDate = new Date(exam.date);
          return examDate >= now && examDate <= endDate;
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      setExams(upcomingExams);
    } catch (err) {
      console.error('Failed to fetch upcoming exams:', err);
      setError(err instanceof Error ? err.message : 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, [daysAhead, externalExams]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      if (onRefresh) {
        onRefresh();
      } else {
        await fetchUpcomingExams();
      }
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [fetchUpcomingExams, onRefresh]);

  // Process exams (either external or fetched)
  const processedExams = externalExams || exams;
  const displayedExams = processedExams.slice(0, initialLimit);

  // Fetch exams on mount ONLY if no external exams prop is provided
  useEffect(() => {
    if (externalExams === undefined) {
      fetchUpcomingExams();
    }
  }, []);

  // Update exams when external exams change
  useEffect(() => {
    if (externalExams) {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + daysAhead);

      const filteredExams = externalExams
        .filter(exam => exam.type === 'exam')
        .filter(exam => {
          const examDate = new Date(exam.date);
          return examDate >= now && examDate <= endDate;
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      setExams(filteredExams);
    }
  }, [externalExams, daysAhead]);

  return (
    <div className='bg-white rounded-xl p-4'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Upcoming Exams
          </h3>
          <p className='text-xs text-gray-500 mt-1'>
            आगामी परीक्षाहरू (बि.सं.)
          </p>
        </div>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            className={`p-1 rounded-md transition-colors duration-200 ${
              isRefreshing || loading || externalRefreshing
                ? 'text-blue-700 bg-blue-100 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
            }`}
            disabled={isRefreshing || loading || externalRefreshing}
            title={
              isRefreshing || loading || externalRefreshing
                ? 'Refreshing...'
                : 'Refresh'
            }
          >
            <RefreshCw
              className={`w-3 h-3 ${
                isRefreshing || loading || externalRefreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className='mt-4'>
        {(loading || externalRefreshing) && !externalExams && (
          <div className='flex items-center justify-center py-8 text-gray-500'>
            <RefreshCw className='w-5 h-5 animate-spin mr-2 text-blue-600' />
            <span className='text-sm animate-pulse'>Loading exams...</span>
          </div>
        )}

        {error && (
          <div className='text-center py-8 text-red-500'>
            <AlertTriangle className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p className='text-sm'>{error}</p>
            <button
              onClick={handleRefresh}
              className='mt-2 text-xs text-blue-600 hover:text-blue-800'
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && displayedExams.length === 0 && (
          <div className='text-center py-8 text-gray-500'>
            <FileText className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p className='text-sm'>
              No upcoming exams in the next {daysAhead} days
            </p>
            <p className='text-xs text-gray-400 mt-1'>
              आगामी {daysAhead} दिनमा कुनै परीक्षा छैन
            </p>
          </div>
        )}

        {!loading && !error && displayedExams.length > 0 && (
          <div className='space-y-2 max-h-72 overflow-y-auto modal-scrollbar'>
            {displayedExams.map((exam, index) => {
              const startDateInfo = formatDateBadge(exam.date);
              const endDateInfo = exam.endDate
                ? formatDateBadge(exam.endDate)
                : null;
              const daysRemaining = getDaysRemaining(exam.date);
              const isMultiDay = exam.endDate && exam.date !== exam.endDate;

              return (
                <div
                  key={`${exam.id}-${index}`}
                  className='flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer hover:bg-purple-50'
                  onClick={() => onExamClick?.(exam)}
                >
                  {/* Exam Icon */}
                  <div className='flex-shrink-0 p-1.5 bg-purple-100 text-purple-600 rounded-lg'>
                    <FileText size={14} />
                  </div>

                  {/* Exam Details */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2 mb-1.5'>
                      <h4 className='text-sm font-semibold text-gray-900'>
                        {exam.name || exam.title || 'Untitled Exam'}
                      </h4>
                      <div className='flex gap-1 flex-shrink-0'>
                        {/* Countdown Badge */}
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getCountdownColor(daysRemaining)}`}
                        >
                          {daysRemaining <= 0 ? 'Today' : `${daysRemaining}d`}
                        </span>
                        {/* Exam Type Badge */}
                        {exam.examType && (
                          <span className='text-xs px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700'>
                            {getExamTypeLabel(exam.examType)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className='space-y-1'>
                      {/* Date range display */}
                      <div className='flex items-center gap-1 text-xs text-gray-600'>
                        <Calendar className='w-3 h-3 flex-shrink-0' />
                        <span>
                          {startDateInfo.month} {startDateInfo.day}
                          {isMultiDay &&
                            endDateInfo &&
                            ` - ${endDateInfo.month} ${endDateInfo.day}`}
                        </span>
                      </div>

                      {/* Time display */}
                      {(exam.startTime || exam.endTime) && (
                        <div className='flex items-center gap-1 text-xs text-gray-600'>
                          <Clock className='w-3 h-3 flex-shrink-0' />
                          <span>
                            {exam.startTime}
                            {exam.endTime &&
                              exam.startTime !== exam.endTime &&
                              ` - ${exam.endTime}`}
                          </span>
                        </div>
                      )}

                      {/* Exam Details */}
                      {exam.examDetails && (
                        <div className='text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded'>
                          <div className='space-y-1'>
                            {/* Parse and display structured exam details */}
                            {(() => {
                              const details = exam.examDetails;

                              // Try to extract structured information
                              const subjectMatch = details.match(
                                /(?:Subject|Class|Grade):\s*([^,\n]+)/i,
                              );
                              const durationMatch = details.match(
                                /(?:Duration):\s*([^,\n]+)/i,
                              );
                              const marksMatch = details.match(
                                /(?:Total Marks|Marks):\s*([^,\n]+)/i,
                              );

                              // If we can parse structured data, show it nicely
                              if (subjectMatch || durationMatch || marksMatch) {
                                return (
                                  <>
                                    {subjectMatch && (
                                      <div className='flex items-center gap-1'>
                                        <span className='font-medium text-purple-600'>
                                          Subject:
                                        </span>
                                        <span>{subjectMatch[1].trim()}</span>
                                      </div>
                                    )}
                                    {durationMatch && (
                                      <div className='flex items-center gap-1'>
                                        <span className='font-medium text-purple-600'>
                                          Duration:
                                        </span>
                                        <span>{durationMatch[1].trim()}</span>
                                      </div>
                                    )}
                                    {marksMatch && (
                                      <div className='flex items-center gap-1'>
                                        <span className='font-medium text-purple-600'>
                                          Marks:
                                        </span>
                                        <span>{marksMatch[1].trim()}</span>
                                      </div>
                                    )}
                                  </>
                                );
                              }

                              // If it's just a simple string, show it as is
                              return (
                                <div>
                                  <span className='font-medium text-purple-600'>
                                    Details:
                                  </span>{' '}
                                  {details}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingExams;
