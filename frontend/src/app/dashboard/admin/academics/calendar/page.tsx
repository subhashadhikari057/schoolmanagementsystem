'use client';

import React from 'react';
import AcademicCalendar from '@/components/organisms/calendar/AcademicCalendar';

export default function CalendarPage() {
  return (
    <AcademicCalendar
      title='Academic Calendar'
      subtitle='Plan and organize academic year events, holidays, and examinations'
      showExportButton={true}
      showActionButtons={true}
      showStatsGrid={true}
      showQuickActions={true}
      defaultLanguage='english'
    />
  );
}
