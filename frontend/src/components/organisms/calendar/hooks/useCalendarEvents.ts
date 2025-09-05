/**
 * =============================================================================
 * Calendar Events Hook
 * =============================================================================
 * Custom hook for managing calendar events and API interactions
 * =============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { calendarService } from '@/api/services/calendar.service';
import { examDateslotService } from '@/api/services/exam-timetable.service';
import { examScheduleService } from '@/api/services/exam-timetable.service';
import { CalendarEvent } from '@/components/organisms/calendar/types/calendar.types';
import {
  CalendarEntriesQueryDto,
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  BulkCalendarOperationDto,
  CalendarEntryType,
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

  // Prevent concurrent duplicate dateslot generations per calendar entry
  const syncingDateslotsRef = useRef<Set<string>>(new Set());

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
        const created = await calendarService.createCalendarEntry(data);
        // Auto-sync dateslots for exam entries (only if none exist to avoid duplicates)
        if (
          created?.type === CalendarEntryType.EXAM &&
          created?.startDate &&
          created?.endDate
        ) {
          try {
            if (!syncingDateslotsRef.current.has(created.id)) {
              syncingDateslotsRef.current.add(created.id);
              const existing =
                await examDateslotService.getDateslotsByCalendarEntry(
                  created.id,
                );
              const hasExisting =
                existing?.success &&
                Array.isArray(existing.data) &&
                existing.data.length > 0;
              if (!hasExisting) {
                await examDateslotService.generateDateslotsFromRange({
                  calendarEntryId: created.id,
                  startDate: created.startDate,
                  endDate: created.endDate,
                } as any);
              }
            }
          } catch (_e) {
            // Non-blocking: dateslot generation best-effort
          } finally {
            syncingDateslotsRef.current.delete(created.id);
          }
        }
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
        // Auto-sync dateslots for exam entries on date changes (only if none exist)
        if (
          (data as any)?.type === CalendarEntryType.EXAM &&
          (data as any)?.startDate &&
          (data as any)?.endDate
        ) {
          try {
            if (!syncingDateslotsRef.current.has(id)) {
              syncingDateslotsRef.current.add(id);
              const existing =
                await examDateslotService.getDateslotsByCalendarEntry(id);
              const hasExisting =
                existing?.success &&
                Array.isArray(existing.data) &&
                existing.data.length > 0;
              if (!hasExisting) {
                await examDateslotService.generateDateslotsFromRange({
                  calendarEntryId: id,
                  startDate: (data as any).startDate,
                  endDate: (data as any).endDate,
                } as any);
              }
            }
          } catch (_e) {
            // Non-blocking
          } finally {
            syncingDateslotsRef.current.delete(id);
          }
        }
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

        // Best-effort cascade cleanup for EXAM entries before deleting the calendar entry
        try {
          const entry = await calendarService.getCalendarEntryById(id);
          if (entry?.type === CalendarEntryType.EXAM) {
            // Delete exam schedules for this calendar entry
            try {
              const schedules =
                await examScheduleService.getExamSchedulesByCalendarEntry(id);
              if (schedules?.success && Array.isArray(schedules.data)) {
                for (const sched of schedules.data as any[]) {
                  try {
                    await examScheduleService.deleteExamSchedule(sched.id);
                  } catch (_e) {
                    console.warn(
                      'Failed to delete exam schedule during cascade:',
                      sched?.id,
                    );
                  }
                }
              }
            } catch (_e) {
              console.warn(
                'Failed to list/delete exam schedules during cascade',
              );
            }

            // Delete dateslots for this calendar entry
            try {
              const dateslots =
                await examDateslotService.getDateslotsByCalendarEntry(id);
              if (dateslots?.success && Array.isArray(dateslots.data)) {
                for (const ds of dateslots.data as any[]) {
                  try {
                    await examDateslotService.deleteDateslot(ds.id);
                  } catch (_e) {
                    console.warn(
                      'Failed to delete exam dateslot during cascade:',
                      ds?.id,
                    );
                  }
                }
              }
            } catch (_e) {
              console.warn(
                'Failed to list/delete exam dateslots during cascade',
              );
            }
          }
        } catch (_e) {
          // Ignore cascade failures; proceed to delete calendar entry
        }

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

  // Track if we've already made the initial fetch
  const initialFetchDone = useRef(false);

  // Initial load - only run once when component mounts
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchEvents();
    }
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
