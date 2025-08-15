'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Calendar, BarChart3, TrendingUp } from 'lucide-react';
import AttendanceRecords from '@/components/organisms/attendance/AttendanceRecords';
import QuickActions from '@/components/organisms/attendance/QuickActions';

export default function AttendancePage() {
  // Mock attendance records data
  const attendanceRecords = [
    { id: '1', present: 20, total: 29, date: 'Today', isToday: true },
    { id: '2', present: 18, total: 29, date: '6th April, 2025' },
    { id: '3', present: 22, total: 29, date: '5th April, 2025' },
    { id: '4', present: 19, total: 29, date: '4th April, 2025' },
    { id: '5', present: 21, total: 29, date: '3rd April, 2025' },
    { id: '6', present: 17, total: 29, date: '2nd April, 2025' },
    { id: '7', present: 20, total: 29, date: '1st April, 2025' },
    { id: '8', present: 23, total: 29, date: '31st March, 2025' },
    { id: '9', present: 16, total: 29, date: '30th March, 2025' },
    { id: '10', present: 19, total: 29, date: '29th March, 2025' },
    { id: '11', present: 21, total: 29, date: '28th March, 2025' },
    { id: '12', present: 18, total: 29, date: '27th March, 2025' },
  ];

  // Quick actions data
  const quickActions = [
    {
      title: 'Take Attendance',
      subtitle: "Mark today's attendance",
      icon: Calendar,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Attendance Reports',
      subtitle: 'View detailed reports',
      icon: BarChart3,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Student Analytics',
      subtitle: 'Analyze attendance patterns',
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  // Get current date
  const getCurrentDate = () => {
    const today = new Date();
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const day = today.getDate();
    const year = today.getFullYear();

    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };

    return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
  };

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='Attendance Management'
            level={1}
            className='text-2xl font-bold text-gray-900'
          />
          <Label className='mt-1 text-gray-600'>
            Track and manage student attendance efficiently
          </Label>
        </div>
        <div className='flex items-center gap-2 text-gray-600'>
          <Calendar className='w-5 h-5' />
          <span className='text-sm font-medium'>Today, {getCurrentDate()}</span>
        </div>
      </div>

      {/* Information Banner */}
      <div className='border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-4'>
        <div className='text-center text-blue-800 font-medium'>
          Attendance For today is tracked! Come again tomorrow!
        </div>
      </div>

      {/* Records Section */}
      <AttendanceRecords records={attendanceRecords} />

      {/* Quick Actions Section */}
      <QuickActions actions={quickActions} />
    </div>
  );
}
