/**
 * =============================================================================
 * Calendar Management Page
 * =============================================================================
 * Admin page for managing calendar entries
 * =============================================================================
 */

import React from 'react';
import CalendarManagement from '../../../components/organisms/calendar/CalendarManagement';

export default function CalendarPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <CalendarManagement />
    </div>
  );
}

export const metadata = {
  title: 'Calendar Management - Admin Dashboard',
  description:
    'Manage school calendar entries, holidays, events, and reminders',
};
