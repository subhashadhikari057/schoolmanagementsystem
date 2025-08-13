/**
 * =============================================================================
 * Upcoming Calendar Events Component
 * =============================================================================
 * Enhanced upcoming events component that integrates with calendar service
 * Features:
 * - Displays dates in Bikram Sambat (BS) format with Nepali month names
 * - 7-day view with configurable date range
 * - Load more functionality with pagination
 * - Real-time refresh capability
 * - Today highlighting in BS calendar
 * - Event type and status indicators
 * =============================================================================
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { calendarService } from '@/api/services/calendar.service';
import { CalendarEvent } from '@/components/organisms/calendar/types/calendar.types';
import { CalendarEntryType } from '@sms/shared-types';
import { ad2bs } from 'hamro-nepali-patro';

interface UpcomingCalendarEventsProps {
  /** Maximum events to show initially */
  initialLimit?: number;
  /** Show next N days of events */
  daysAhead?: number;
  /** Whether to show the load more button */
  showLoadMore?: boolean;
  /** Whether to show the refresh button */
  showRefresh?: boolean;
  /** Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
  /** External events to display (if provided, will not fetch from API) */
  externalEvents?: CalendarEvent[];
  /** Callback when component needs to refresh */
  onRefresh?: () => void;
  /** External refreshing state for synchronized animation */
  externalRefreshing?: boolean;
}

const UpcomingCalendarEvents: React.FC<UpcomingCalendarEventsProps> = ({
  initialLimit = 7,
  daysAhead = 7,
  showLoadMore = true,
  showRefresh = true,
  onEventClick,
  externalEvents,
  onRefresh,
  externalRefreshing = false,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const [hasMore, setHasMore] = useState(false);
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
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      // Convert AD to BS
      const bsDate = ad2bs(year, month, day);
      const nepaliMonth = nepaliMonths[bsDate.month - 1] || 'N/A';

      return {
        day: bsDate.date,
        month: nepaliMonth.substring(0, 3), // Short form
        fullMonth: nepaliMonth,
        year: bsDate.year,
      };
    } catch (error) {
      console.error('Date conversion error:', error);
      // Fallback to AD format
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date
        .toLocaleDateString('en-US', { month: 'short' })
        .toUpperCase();
      return { day, month, fullMonth: month, year: date.getFullYear() };
    }
  };

  // Get color for event type
  const getEventTypeColor = (type: string): string => {
    const colors = {
      holiday: 'bg-red-100 text-red-700',
      event: 'bg-blue-100 text-blue-700',
      reminder: 'bg-yellow-100 text-yellow-700',
    };
    return (
      colors[type.toLowerCase() as keyof typeof colors] ||
      'bg-gray-100 text-gray-700'
    );
  };

  // Get status color
  const getStatusColor = (): string => {
    return 'bg-green-100 text-green-700'; // All events are active in simplified schema
  };

  // Check if event date is today (in BS)
  const isTodayBS = (eventDateStr: string): boolean => {
    try {
      const today = new Date();
      const todayBS = ad2bs(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate(),
      );

      const eventDate = new Date(eventDateStr);
      const eventDateBS = ad2bs(
        eventDate.getFullYear(),
        eventDate.getMonth() + 1,
        eventDate.getDate(),
      );

      return (
        todayBS.year === eventDateBS.year &&
        todayBS.month === eventDateBS.month &&
        todayBS.date === eventDateBS.date
      );
    } catch (error) {
      console.error('Error checking if date is today:', error);
      // Fallback to AD comparison
      return (
        new Date(eventDateStr).toDateString() === new Date().toDateString()
      );
    }
  };

  // Fetch upcoming events from API
  const fetchUpcomingEvents = useCallback(async () => {
    if (externalEvents) {
      return; // Don't fetch if external events are provided
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate date range for upcoming events
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + daysAhead);

      const response = await calendarService.getCalendarEntries({
        page: 1,
        limit: 50, // Fetch more than needed for filtering
        startDate: now.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      // Filter and sort events
      const upcomingEvents = response.entries
        .map(entry => calendarService.toCalendarEvent(entry))
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= now && eventDate <= endDate;
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      setEvents(upcomingEvents);
      setHasMore(upcomingEvents.length > displayLimit);
    } catch (err) {
      console.error('Failed to fetch upcoming events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [daysAhead, displayLimit, externalEvents]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      if (onRefresh) {
        onRefresh();
      } else {
        await fetchUpcomingEvents();
      }
    } finally {
      // Ensure minimum animation time for good UX
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500); // Minimum 500ms animation
    }
  }, [fetchUpcomingEvents, onRefresh]);

  // Load more events
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + initialLimit);
  };

  // Process events (either external or fetched)
  const processedEvents = externalEvents || events;
  const displayedEvents = processedEvents.slice(0, displayLimit);
  const hasMoreToShow = processedEvents.length > displayLimit;

  // Update hasMore when events change
  useEffect(() => {
    setHasMore(hasMoreToShow);
  }, [hasMoreToShow]);

  // Fetch events on mount and when dependencies change
  useEffect(() => {
    if (!externalEvents) {
      fetchUpcomingEvents();
    }
  }, [fetchUpcomingEvents, externalEvents]);

  // Update events when external events change
  useEffect(() => {
    if (externalEvents) {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + daysAhead);

      const filteredEvents = externalEvents
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= now && eventDate <= endDate;
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      setEvents(filteredEvents);
    }
  }, [externalEvents, daysAhead]);

  return (
    <div className='bg-white rounded-xl p-4'>
      <div className='flex justify-between items-center mb-2'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Upcoming Events
          </h3>
          <p className='text-xs text-gray-500 mt-1'>
            आगामी कार्यक्रमहरू (बि.सं.)
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
        {(loading || externalRefreshing) && !externalEvents && (
          <div className='flex items-center justify-center py-8 text-gray-500'>
            <RefreshCw className='w-5 h-5 animate-spin mr-2 text-blue-600' />
            <span className='text-sm animate-pulse'>Loading events...</span>
          </div>
        )}

        {error && (
          <div className='text-center py-8 text-red-500'>
            <Calendar className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p className='text-sm'>{error}</p>
            <button
              onClick={handleRefresh}
              className='mt-2 text-xs text-blue-600 hover:text-blue-800'
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && displayedEvents.length === 0 && (
          <div className='text-center py-8 text-gray-500'>
            <Calendar className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p className='text-sm'>
              No upcoming events in the next {daysAhead} days
            </p>
            <p className='text-xs text-gray-400 mt-1'>
              आगामी {daysAhead} दिनमा कुनै कार्यक्रम छैन
            </p>
          </div>
        )}

        {!loading && !error && displayedEvents.length > 0 && (
          <div className='space-y-4 max-h-96 overflow-y-auto modal-scrollbar'>
            {displayedEvents.map((event, index) => {
              const dateInfo = formatDateBadge(event.date);
              const { day, month } = dateInfo;
              const isToday = isTodayBS(event.date);

              return (
                <div
                  key={`${event.id}-${index}`}
                  className={`flex items-start gap-4 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                    isToday
                      ? 'bg-blue-50 border border-blue-200'
                      : 'border border-transparent'
                  }`}
                  onClick={() => onEventClick?.(event)}
                >
                  {/* Date Badge */}
                  <div
                    className='flex-shrink-0 text-center'
                    title={`${dateInfo.fullMonth} ${dateInfo.day}, ${dateInfo.year} बि.सं.`}
                  >
                    <div
                      className={`text-2xl font-bold ${
                        isToday ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {day}
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        isToday ? 'text-blue-500' : 'text-gray-500'
                      }`}
                    >
                      {month}
                    </div>
                    {isToday && (
                      <div className='text-xs text-blue-600 font-semibold mt-1'>
                        आज
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2 mb-2'>
                      <h4 className='text-sm font-semibold text-gray-900 line-clamp-2'>
                        {event.name || event.title || 'Untitled Event'}
                      </h4>
                      <div className='flex gap-1 flex-shrink-0'>
                        {event.type && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getEventTypeColor(event.type)}`}
                          >
                            {event.type}
                          </span>
                        )}
                        {/* <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor()}`}>
                          {event.status || 'Active'}
                        </span> */}
                      </div>
                    </div>

                    <div className='space-y-1'>
                      {event.time && event.time.trim() !== '' && (
                        <div className='flex items-center gap-1 text-xs text-gray-600'>
                          <Clock className='w-3 h-3 flex-shrink-0' />
                          <span>{event.time}</span>
                        </div>
                      )}

                      {(event.venue || event.location) && (
                        <div className='flex items-center gap-1 text-xs text-gray-600'>
                          <MapPin className='w-3 h-3 flex-shrink-0' />
                          <span className='line-clamp-1'>
                            {event.venue || event.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {showLoadMore && !loading && !error && hasMore && (
          <div className='text-center mt-4'>
            <button
              onClick={handleLoadMore}
              className='inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors'
            >
              <ChevronDown className='w-4 h-4' />
              Load more events
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingCalendarEvents;
