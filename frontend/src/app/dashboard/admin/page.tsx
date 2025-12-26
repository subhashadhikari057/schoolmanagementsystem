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
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { adminQuickActions } from '@/constants/mockData';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { studentService } from '@/api/services';
import { Card } from '@/components/ui/card';
import StatusBadge from '@/components/atoms/data/StatusBadge';

type GenderGradeGroup = {
  label: string;
  male: number;
  female: number;
  other: number;
  total: number;
};

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

type DemographicChart = {
  gender: 'Male' | 'Female' | 'Other';
  data: { name: string; value: number }[];
};

const PIE_COLORS = [
  '#2563eb',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#06b6d4',
  '#ef4444',
  '#94a3b8',
  '#ec4899',
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
  const [demographicCharts, setDemographicCharts] = React.useState<
    DemographicChart[]
  >([]);
  const [demographicLoading, setDemographicLoading] = React.useState(false);
  const [demographicError, setDemographicError] = React.useState<string | null>(
    null,
  );
  const [gradeStatsMap, setGradeStatsMap] = React.useState<
    Record<
      number,
      { male: number; female: number; other: number; total: number }
    >
  >({});

  // Fetch gender/ethnicity breakdown for students
  React.useEffect(() => {
    const loadDemographics = async () => {
      try {
        setDemographicLoading(true);
        setDemographicError(null);
        const res = await studentService.getGenderEthnicityStats();
        const payload = (res?.data as any) || {};
        const charts: DemographicChart[] = (
          ['male', 'female', 'other'] as const
        ).map(key => {
          const match =
            Array.isArray(payload.genders) &&
            payload.genders.find((g: any) => g && g.gender === key);
          const data =
            match && Array.isArray(match.breakdown)
              ? match.breakdown
                  .filter(
                    (item: any) =>
                      item &&
                      typeof item.count === 'number' &&
                      typeof item.ethnicity === 'string',
                  )
                  .map((item: any) => ({
                    name:
                      item.ethnicity && item.ethnicity.trim().length > 0
                        ? item.ethnicity
                        : 'Unspecified',
                    value: item.count,
                  }))
              : [];
          return {
            gender:
              key === 'male' ? 'Male' : key === 'female' ? 'Female' : 'Other',
            data,
          };
        });

        setDemographicCharts(charts);
      } catch (err) {
        console.error('Failed to load demographic data', err);
        setDemographicError('Failed to load student demographics');
      } finally {
        setDemographicLoading(false);
      }
    };

    loadDemographics();
  }, []);

  // Fetch grade-level gender stats
  React.useEffect(() => {
    const loadGenderGrade = async () => {
      try {
        const res = await studentService.getGenderGradeStats();
        const payload = (res?.data as any) || {};
        const gradesPayload: Array<{
          grade: number;
          male: number;
          female: number;
          other: number;
          total: number;
        }> = Array.isArray(payload.grades) ? payload.grades : [];

        const gradeMap: Record<
          number,
          { male: number; female: number; other: number; total: number }
        > = {};
        gradesPayload.forEach(g => {
          gradeMap[g.grade] = {
            male: g.male || 0,
            female: g.female || 0,
            other: g.other || 0,
            total: g.total || (g.male || 0) + (g.female || 0) + (g.other || 0),
          };
        });
        setGradeStatsMap(gradeMap);
      } catch (err) {
        console.error('Failed to load gender grade stats', err);
      }
    };

    loadGenderGrade();
  }, []);

  // Fetch all calendar events (exams, holidays, events)
  const { events: calendarEvents } = useCalendarEvents({ page: 1, limit: 50 });
  // Map backend events to UpcomingEventsPanel's Event type
  const mappedEvents = calendarEvents.map(ev => ({
    id: ev.id,
    title: ev.title || ev.name || 'Untitled Event',
    date: ev.date,
    endDate: ev.endDate,
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
                {showAllCharts && (
                  <>
                    <ExamPerformanceChart />
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
                <ExamPerformanceChart />
              </div>

              {/* Gender/Ethnicity Breakdown */}
              <div className='space-y-3'>
                <h3 className='text-sm sm:text-base font-semibold text-gray-900 px-1'>
                  Gender by Ethnicity (Students)
                </h3>
                {demographicError && (
                  <div className='p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
                    {demographicError}
                  </div>
                )}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {demographicLoading
                    ? Array.from({ length: 3 }).map((_, idx) => (
                        <Card
                          key={idx}
                          className='p-4 bg-white shadow-sm border border-gray-200'
                        >
                          <div className='h-40 flex items-center justify-center text-gray-400'>
                            <Loader2 className='h-6 w-6 animate-spin' />
                          </div>
                        </Card>
                      ))
                    : demographicCharts.map(chart => (
                        <Card
                          key={chart.gender}
                          className='p-4 bg-white shadow-sm border border-gray-200'
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <p className='font-semibold text-gray-900'>
                              {chart.gender}
                            </p>
                            <StatusBadge
                              status={`${chart.data.length} ethnicities`}
                              className='bg-blue-50 text-blue-700 border border-blue-100'
                            />
                          </div>
                          <div className='h-48'>
                            {chart.data.length > 0 ? (
                              <ResponsiveContainer width='100%' height='100%'>
                                <PieChart>
                                  <Pie
                                    data={chart.data}
                                    dataKey='value'
                                    nameKey='name'
                                    outerRadius='70%'
                                    labelLine={false}
                                  >
                                    {chart.data.map((_, idx) => (
                                      <Cell
                                        key={idx}
                                        fill={
                                          PIE_COLORS[idx % PIE_COLORS.length]
                                        }
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className='h-full flex items-center justify-center text-sm text-gray-500'>
                                No data yet
                              </div>
                            )}
                          </div>
                          {chart.data.length > 0 && (
                            <div className='mt-3 space-y-1 text-xs text-gray-700'>
                              {chart.data.map((item, idx) => (
                                <div
                                  key={item.name}
                                  className='flex items-center justify-between'
                                >
                                  <div className='flex items-center gap-2'>
                                    <span
                                      className='inline-block w-3 h-3 rounded-full'
                                      style={{
                                        backgroundColor:
                                          PIE_COLORS[idx % PIE_COLORS.length],
                                      }}
                                    />
                                    <span className='font-medium'>
                                      {item.name}
                                    </span>
                                  </div>
                                  <span className='text-gray-500'>
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                </div>
              </div>

              {/* Grade-wise Gender Table */}
              <div className='space-y-3'>
                <h3 className='text-sm sm:text-base font-semibold text-gray-900 px-1'>
                  Gender by Grade (School Population)
                </h3>
                <Card className='p-3 sm:p-4 bg-white shadow-sm border border-gray-200 overflow-x-auto'>
                  <table className='min-w-[900px] w-full text-[11px] sm:text-xs text-gray-800 border-collapse'>
                    <thead>
                      <tr className='text-gray-900'>
                        <th
                          className='border border-gray-200 px-2 py-2 font-bold bg-indigo-200'
                          colSpan={2}
                        >
                          ECD
                        </th>
                        <th
                          className='border border-gray-200 px-2 py-2 font-bold bg-indigo-200'
                          colSpan={10}
                        >
                          Basic Level (1-5)
                        </th>
                        <th
                          className='border border-gray-200 px-2 py-2 font-bold bg-indigo-300'
                          colSpan={6}
                        >
                          Basic Level (6-8)
                        </th>
                        <th
                          className='border border-gray-200 px-2 py-2 font-bold bg-indigo-400'
                          colSpan={4}
                        >
                          Secondary Level (9-10)
                        </th>
                        <th
                          className='border border-gray-200 px-2 py-2 font-bold bg-indigo-500 text-white'
                          colSpan={4}
                        >
                          Secondary Level (11-12)
                        </th>
                      </tr>
                      <tr className='bg-gray-100'>
                        {[
                          { label: 'ECD', grade: 0 },
                          { label: 'G1', grade: 1 },
                          { label: 'G2', grade: 2 },
                          { label: 'G3', grade: 3 },
                          { label: 'G4', grade: 4 },
                          { label: 'G5', grade: 5 },
                          { label: 'G6', grade: 6 },
                          { label: 'G7', grade: 7 },
                          { label: 'G8', grade: 8 },
                          { label: 'G9', grade: 9 },
                          { label: 'G10', grade: 10 },
                          { label: 'G11', grade: 11 },
                          { label: 'G12', grade: 12 },
                        ].map(item => {
                          const isBoundary = [1, 6, 9, 11].includes(item.grade);
                          return (
                            <th
                              key={item.label}
                              className={`border border-gray-200 px-2 py-2 font-semibold text-center ${isBoundary ? 'border-l-4 border-indigo-300' : ''}`}
                              colSpan={2}
                            >
                              {item.label}
                            </th>
                          );
                        })}
                      </tr>
                      <tr className='bg-gray-50 text-gray-700'>
                        {Array.from({ length: 13 }).map((_, idx) => {
                          const isBoundary = [1, 6, 9, 11].includes(idx);
                          return (
                            <React.Fragment key={idx}>
                              <th
                                className={`border border-gray-200 px-2 py-1 text-center font-medium text-pink-700 ${isBoundary ? 'border-l-4 border-indigo-300' : ''}`}
                              >
                                Girls
                              </th>
                              <th
                                className={`border border-gray-200 px-2 py-1 text-center font-medium text-blue-700 ${isBoundary ? 'border-l-4 border-indigo-300' : ''}`}
                              >
                                Boys
                              </th>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                          grade => {
                            const stats = gradeStatsMap[grade] || {
                              male: 0,
                              female: 0,
                            };
                            const isBoundary = [1, 6, 9, 11].includes(grade);
                            return (
                              <React.Fragment key={grade}>
                                <td
                                  className={`border border-gray-200 px-2 py-1 text-center text-pink-700 font-semibold ${isBoundary ? 'border-l-4 border-indigo-300' : ''}`}
                                >
                                  {stats.female || 0}
                                </td>
                                <td
                                  className={`border border-gray-200 px-2 py-1 text-center text-blue-700 font-semibold ${isBoundary ? 'border-l-4 border-indigo-300' : ''}`}
                                >
                                  {stats.male || 0}
                                </td>
                              </React.Fragment>
                            );
                          },
                        )}
                      </tr>
                    </tbody>
                  </table>
                </Card>
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
