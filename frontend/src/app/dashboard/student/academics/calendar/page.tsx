'use client';

import React, { useState, useEffect } from 'react';
import AcademicCalendar from '@/components/organisms/calendar/AcademicCalendar';
import { CalendarLoader } from '@/components/atoms/loading';

export default function StudentCalendarPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <CalendarLoader />;
  }

  return (
    <AcademicCalendar
      title='Academic Calendar'
      subtitle='View academic year events, holidays, and examinations'
      showExportButton={true}
      showActionButtons={false} // Read-only for students
    />
  );
}
