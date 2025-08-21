'use client';

import React from 'react';
import AcademicCalendar from '@/components/organisms/calendar/AcademicCalendar';

export default function ParentCalendarPage() {
  return (
    <AcademicCalendar
      title='Academic Calendar'
      subtitle='View academic year events, holidays, and examinations'
      showExportButton={true}
      showActionButtons={false} // Read-only for parents
    />
  );
}
