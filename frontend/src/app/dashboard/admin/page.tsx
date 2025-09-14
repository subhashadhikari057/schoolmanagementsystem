'use client';

import React from 'react';
import { useAnalyticsOverview } from '@/context/AnalyticsOverviewContext';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  Loader2,
} from 'lucide-react';
import UpcomingEventsPanel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import { useCalendarEvents } from '@/components/organisms/calendar/hooks/useCalendarEvents';
import NotificationPanel from '@/components/organisms/dashboard/NotificationPanel';
import QuickActions from '@/components/organisms/dashboard/QuickAction';
import ExpensesBreakdownChart from '@/components/organisms/dashboard/ExpensesBreakdownChart';
import ExamPerformanceChart from '@/components/organisms/dashboard/ExamPerformanceChart';
import FeeCollectionChart from '@/components/organisms/dashboard/FeeCollectionChart';
import AttendanceOverview from '@/components/organisms/dashboard/AttendanceOverview';
import SystemHealthOverview from '@/components/organisms/dashboard/SystemHealthOverview';
import { adminQuickActions } from '@/constants/mockData';
import { useDashboardStats } from '@/hooks/useDashboardStats';

// Staff and subject data - now using real backend data
const getStaffAndSubjectData = (staffCount: number, subjectCount: number) => [
  {
    icon: UserCheck,
    bgColor: 'bg-purple-600',
    iconColor: 'text-white',
    value: staffCount.toLocaleString(),
    label: 'Total Staff',
    change: '—', // No percentage change since we don't have historical data
    isPositive: true,
  },
  {
    icon: BookOpen,
    bgColor: 'bg-indigo-600',
    iconColor: 'text-white',
    value: subjectCount.toLocaleString(),
    label: 'Total Subjects',
    change: '—', // No percentage change since we don't have historical data
    isPositive: true,
  },
];

export default function AdminDashboard() {
  const [showAllCharts, setShowAllCharts] = React.useState(false);
  const [showDebug, setShowDebug] = React.useState(false);
  const { showAnalytics } = useAnalyticsOverview();
  const {
    studentCount,
    teacherCount,
    staffCount,
    subjectCount,
    loading,
    error,
    debug,
  } = useDashboardStats();

  // Fetch all calendar events (exams, holidays, events)
  const { events: calendarEvents } = useCalendarEvents({ page: 1, limit: 50 });
  // Map backend events to UpcomingEventsPanel's Event type
  const mappedEvents = calendarEvents.map(ev => ({
    id: ev.id,
    title: ev.title || ev.name || 'Untitled Event',
    date: ev.date,
    time: ev.time || ev.startTime || '',
    location: ev.location || ev.venue || '',
    status: typeof ev.status === 'string' ? ev.status : 'Active',
    type: ev.type || 'event',
  }));

  // Prepare stats data with real-time counts
  const statsData = [
    {
      icon: Users,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      value: loading ? '...' : studentCount.toLocaleString(),
      label: 'Total Students',
      change: '—', // Removed percentage change since we don't have historical data
      isPositive: true,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      value: loading ? '...' : teacherCount.toLocaleString(),
      label: 'Total Teachers',
      change: '—', // Removed percentage change
      isPositive: true,
    },
    ...getStaffAndSubjectData(
      loading ? 0 : staffCount,
      loading ? 0 : subjectCount,
    ),
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Mobile-optimized header */}
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'>
          Admin Dashboard
        </h1>
        <p className='text-xs sm:text-sm lg:text-base text-gray-600 mt-1'>
          Welcome back! Here&apos;s your school overview.
        </p>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='w-full space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Stats Grid - Mobile: 2x2 compact, Desktop: 1x4 */}
          {error ? (
            <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-800'>
              <p>Error loading statistics: {error}</p>
            </div>
          ) : (
            <>
              <Statsgrid stats={statsData} />

              {/* Debug information - double-click anywhere to toggle */}
              <div
                className='mt-2'
                onDoubleClick={() => setShowDebug(!showDebug)}
              >
                {showDebug && debug && (
                  <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono overflow-auto max-h-60'>
                    <p className='font-semibold mb-1'>Debug Information:</p>
                    <pre>{debug}</pre>
                    <p className='text-gray-500 mt-2 text-right'>
                      Double-click to hide
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Main Content Grid - Mobile: Stacked with proper spacing */}
          <div className='space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6'>
            <div className='lg:col-span-8'>
              {/* Pass all calendar events to UpcomingEventsPanel */}
              <UpcomingEventsPanel events={mappedEvents} />
            </div>
            <div className='lg:col-span-4'>
              <NotificationPanel />
            </div>
            <div className=' lg:col-span-12 mt-4 lg:mt-0'>
              <QuickActions actions={adminQuickActions} />
            </div>
          </div>

          {/* Charts Section - Mobile: Single column, Desktop: 2x2 */}
          {showAnalytics && (
            <div className='space-y-4'>
              <h2 className='text-base sm:text-lg font-semibold text-gray-900 px-1'>
                Analytics Overview
              </h2>

              {/* Mobile: Single column layout */}
              <div className='block lg:hidden space-y-4'>
                <AttendanceOverview />
                <FeeCollectionChart />
                {showAllCharts && (
                  <>
                    <ExamPerformanceChart />
                    <ExpensesBreakdownChart />
                  </>
                )}

                {/* View More Button */}
                <div className='flex justify-center pt-2'>
                  <button
                    onClick={() => setShowAllCharts(!showAllCharts)}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm'
                  >
                    {showAllCharts ? '📊 Show Less' : '📈 View More Charts'}
                  </button>
                </div>
              </div>

              {/* Desktop: 2x2 Grid */}
              <div className='hidden lg:grid lg:grid-cols-2 lg:gap-6'>
                <AttendanceOverview />
                <FeeCollectionChart />
                <ExamPerformanceChart />
                <ExpensesBreakdownChart />
              </div>
            </div>
          )}

          {/* System Health - Mobile: Horizontal scroll with indicators */}
          <div className='space-y-3'>
            <h2 className='text-base sm:text-lg font-semibold text-gray-900 px-1'>
              System Status
            </h2>
            <SystemHealthOverview />

            {/* Mobile scroll indicator */}
            <div className='block lg:hidden'>
              <p className='text-xs text-gray-500 text-center'>
                ← Swipe to view all metrics →
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
