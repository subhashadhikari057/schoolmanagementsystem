'use client';

import React, { useState } from 'react';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { Users, GraduationCap, DollarSign, CreditCard } from 'lucide-react';
import UpcomingEvents from '@/components/organisms/dashboard/UpcomingEvents';
import Notifications from '@/components/organisms/dashboard/Notification';
import QuickActions from '@/components/organisms/dashboard/QuickAction';
import ExpensesBreakdownChart from '@/components/organisms/dashboard/ExpensesBreakdownChart';
import ExamPerformanceChart from '@/components/organisms/dashboard/ExamPerformanceChart';
import FeeCollectionChart from '@/components/organisms/dashboard/FeeCollectionChart';
import AttendanceOverview from '@/components/organisms/dashboard/AttendanceOverview';
import SystemHealthOverview from '@/components/organisms/dashboard/SystemHealthOverview';
import {
  mockEvents,
  mockNotifications,
  mockQuickActions,
} from '@/constants/mockData';

const statsData = [
  {
    icon: Users,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    value: '2,856',
    label: 'Total Students',
    change: '3.1%',
    isPositive: true,
  },
  {
    icon: GraduationCap,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    value: '182',
    label: 'Total Teachers',
    change: '1.8%',
    isPositive: true,
  },
  {
    icon: DollarSign,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    value: '$428,560',
    label: 'Total Fees Collected',
    change: '5.2%',
    isPositive: true,
  },
  {
    icon: CreditCard,
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    value: '$215,400',
    label: 'Total Salaries Paid',
    change: '2.4%',
    isPositive: false,
  },
];

export default function AdminDashboard() {
  const [showAllCharts, setShowAllCharts] = useState(false);

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
        <div className='max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Stats Grid - Mobile: 2x2 compact, Desktop: 1x4 */}
          <Statsgrid stats={statsData} />

          {/* Main Content Grid - Mobile: Stacked with proper spacing */}
          <div className='space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6'>
            <div className='lg:col-span-8'>
              <UpcomingEvents events={mockEvents} className='w-full' />
            </div>
            <div className='lg:col-span-4'>
              <Notifications notifications={mockNotifications} />
            </div>
            <div className='lg:col-span-12 mt-4 lg:mt-0'>
              <QuickActions actions={mockQuickActions} />
            </div>
          </div>

          {/* Charts Section - Mobile: Single column, Desktop: 2x2 */}
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
