/**
 * =============================================================================
 * Calendar Events Hook
 * =============================================================================
 * Custom hook for managing calendar events and API interactions
 * =============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { calendarService } from '@/api/services/calendar.service';
import { CalendarEvent } from '@/components/organisms/calendar/types/calendar.types';
import {
  CalendarEntriesQueryDto,
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  BulkCalendarOperationDto,
} from '@sms/shared-types';

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  // Methods
  fetchEvents: (query?: CalendarEntriesQueryDto) => Promise<void>;
  createEvent: (data: CreateCalendarEntryDto) => Promise<void>;
  updateEvent: (id: string, data: UpdateCalendarEntryDto) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  bulkOperation: (data: BulkCalendarOperationDto) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

export const useCalendarEvents = (
  initialQuery?: CalendarEntriesQueryDto,
): UseCalendarEventsReturn => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Use ref to store initial query to prevent re-renders
  const initialQueryRef = useRef(initialQuery);
  initialQueryRef.current = initialQuery;

  // Fetch events from API
  const fetchEvents = useCallback(async (query?: CalendarEntriesQueryDto) => {
    try {
      setLoading(true);
      setError(null);

      const defaultQuery = {
        page: 1,
        limit: 100,
        ...initialQueryRef.current,
        ...query,
      };

      const response = await calendarService.getCalendarEntries(defaultQuery);
      const convertedEvents = response.entries.map(entry =>
        calendarService.toCalendarEvent(entry),
      );

      setEvents(convertedEvents);
      setPagination({
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch events';
      setError(errorMessage);
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loop

  // Create new event
  const createEvent = useCallback(
    async (data: CreateCalendarEntryDto) => {
      try {
        setLoading(true);
        setError(null);
        await calendarService.createCalendarEntry(data);
        await fetchEvents(); // Refresh events after creation
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create event';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEvents],
  );

  // Update existing event
  const updateEvent = useCallback(
    async (id: string, data: UpdateCalendarEntryDto) => {
      try {
        setLoading(true);
        setError(null);
        await calendarService.updateCalendarEntry(id, data);
        await fetchEvents(); // Refresh events after update
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update event';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEvents],
  );

  // Delete event
  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        await calendarService.deleteCalendarEntry(id);
        await fetchEvents(); // Refresh events after deletion
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete event';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEvents],
  );

  // Bulk operations
  const bulkOperation = useCallback(
    async (data: BulkCalendarOperationDto) => {
      try {
        setLoading(true);
        setError(null);
        await calendarService.bulkCalendarOperation(data);
        await fetchEvents(); // Refresh events after bulk operation
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to perform bulk operation';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEvents],
  );

  // Refresh events
  const refreshEvents = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  // Initial load - only run once when component mounts
  useEffect(() => {
    fetchEvents();
  }, []); // Empty dependency array to prevent infinite loop

  return {
    events,
    loading,
    error,
    pagination,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    bulkOperation,
    refreshEvents,
  };
};
