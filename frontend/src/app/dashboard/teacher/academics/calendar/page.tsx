'use client';

import React from 'react';
import AcademicCalendar from '@/components/organisms/calendar/AcademicCalendar';
import { useCalendarEvents } from '@/components/organisms/calendar/hooks/useCalendarEvents';
import { CalendarLoader } from '@/components/atoms/loading';

export default function TeacherCalendarPage() {
  // Fetch all calendar events (same as admin)
  const { events, loading } = useCalendarEvents({ page: 1, limit: 100 });

  if (loading) {
    return <CalendarLoader />;
  }

  return (
    <AcademicCalendar
      title='Academic Calendar'
      subtitle='View academic year events, holidays, and examinations'
      showExportButton={true}
      showActionButtons={false} // Read-only for teachers
      events={events} // Show all events from backend
    />
  );
}
