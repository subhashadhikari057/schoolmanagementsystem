/**
 * =============================================================================
 * Teacher Attendance Layout
 * =============================================================================
 * Layout for attendance management in teacher dashboard
 * =============================================================================
 */

import React from 'react';

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>{children}</div>
    </div>
  );
}
