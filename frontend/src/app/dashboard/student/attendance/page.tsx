'use client';

import React, { useState, useEffect, useCallback } from 'react';
import StudentAttendanceCalendar, {
  AttendanceEvent,
} from './StudentAttendanceCalendar';
import { CalendarLoader } from '@/components/atoms/loading';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/api/services/student.service';
import { attendanceService } from '@/api/services/attendance.service';
import { PageLoader } from '@/components/atoms/loading';

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user } = useAuth();

  // Function to fetch attendance data for a specific month
  const fetchAttendanceData = useCallback(
    async (month: number, year: number, isMonthChange = false) => {
      if (!studentProfile?.id) {
        return;
      }

      try {
        if (isMonthChange) {
          setMonthLoading(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const attendanceResponse = await attendanceService.getStudentAttendance(
          studentProfile.id,
          {
            month,
            year,
          },
        );

        if (!attendanceResponse) {
          throw new Error('No attendance response from server');
        }

        setAttendanceData(attendanceResponse);

        // Convert attendance records to events format
        const events: AttendanceEvent[] = (
          attendanceResponse.records || []
        ).map((record: any) => ({
          id: record.date,
          date: record.date,
          status: record.status?.toLowerCase() as
            | 'present'
            | 'absent'
            | 'not-recorded',
        }));

        setAttendanceEvents(events);
      } catch (error) {
        console.error('Failed to fetch attendance data:', error);
        setError('Failed to load attendance data. Please try again.');
      } finally {
        if (isMonthChange) {
          setMonthLoading(false);
        } else {
          setLoading(false);
        }
      }
    },
    [studentProfile?.id],
  );

  // Fetch student profile
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get student profile
        const studentResponse = await studentService.getStudentByUserId(
          user.id,
        );
        if (!studentResponse.success || !studentResponse.data) {
          throw new Error('Failed to fetch student profile');
        }

        const student = studentResponse.data;
        setStudentProfile(student);
      } catch (error) {
        console.error('Failed to fetch student data:', error);
        setError('Failed to load student data. Please try again.');
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user?.id]);

  // Fetch attendance data when student profile is available
  useEffect(() => {
    if (studentProfile?.id) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      fetchAttendanceData(currentMonth, currentYear);
    }
  }, [studentProfile?.id, fetchAttendanceData]);

  // Handle month change from calendar
  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate);
    const month = newDate.getMonth() + 1;
    const year = newDate.getFullYear();
    fetchAttendanceData(month, year, true);
  };

  // Handle calendar type switch (BS to AD or vice versa)
  const handleCalendarTypeChange = (newDate: Date) => {
    // This is called when user switches calendar type
    setCurrentDate(newDate);
    const month = newDate.getMonth() + 1;
    const year = newDate.getFullYear();
    fetchAttendanceData(month, year, true);
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className='w-full p-6'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
          <div className='text-center py-8'>
            <div className='text-red-600 mb-4'>
              <svg
                className='w-12 h-12 mx-auto'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-800 mb-2'>
              Error Loading Attendance
            </h3>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full p-6'>
      {/* Header Section */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>My Attendance</h1>
        {studentProfile && (
          <p className='text-gray-600'>
            {studentProfile.fullName ||
              `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.trim() ||
              user?.full_name ||
              'Student'}{' '}
            • Class {studentProfile.class?.grade || ''}
            {studentProfile.class?.section || ''}
          </p>
        )}
      </div>

      {/* Attendance Statistics */}
      {attendanceData && (
        <div className='grid grid-cols-2 gap-4 mb-6'>
          {/* Present Days Card */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200'>
            <div className='bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-lg border border-green-200'>
              <div className='flex items-center justify-between'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <svg
                    className='w-5 h-5 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-green-700'>
                    {attendanceData.stats?.presentDays || 0}
                  </div>
                  <div className='text-sm text-green-600'>Present Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Absent Days Card */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200'>
            <div className='bg-gradient-to-br from-red-50 to-pink-100 p-4 rounded-lg border border-red-200'>
              <div className='flex items-center justify-between'>
                <div className='p-2 bg-red-100 rounded-lg'>
                  <svg
                    className='w-5 h-5 text-red-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-red-700'>
                    {attendanceData.stats?.absentDays || 0}
                  </div>
                  <div className='text-sm text-red-600'>Absent Days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {monthLoading && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4'>
          <div className='text-center py-2'>
            <div className='inline-flex items-center gap-2 text-blue-600'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span className='text-sm'>Loading attendance data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Section */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'>
        {/* Show calendar or no data message */}
        {attendanceEvents.length > 0 ? (
          <StudentAttendanceCalendar
            events={attendanceEvents}
            currentDate={currentDate}
            onMonthChange={handleMonthChange}
            onCalendarTypeChange={handleCalendarTypeChange}
          />
        ) : (
          <div className='text-center py-12 bg-gray-50 rounded-lg'>
            <div className='text-gray-400 mb-4'>
              <svg
                className='w-16 h-16 mx-auto'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Attendance Data
            </h3>
            <p className='text-gray-600 mb-4'>
              No attendance records found for{' '}
              {currentDate.toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
              .
            </p>
            <p className='text-sm text-gray-500'>
              This could mean attendance hasn't been marked yet, or there are no
              school days in this month.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
