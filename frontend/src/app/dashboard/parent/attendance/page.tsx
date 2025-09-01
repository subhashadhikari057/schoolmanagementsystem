'use client';
import React, { useState, useEffect, useCallback } from 'react';
import StudentAttendanceCalendar, {
  AttendanceEvent,
} from '../../student/attendance/StudentAttendanceCalendar';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { CalendarLoader } from '@/components/atoms/loading';
import { useAuth } from '@/hooks/useAuth';
import { parentService } from '@/api/services/parent.service';
import { attendanceService } from '@/api/services/attendance.service';

// Mock children data as fallback
const mockChildren = [
  {
    id: '1',
    name: 'Arjun Kumar Sharma',
    class: '10',
    section: 'A',
    rollNumber: '2024001',
    profilePic: '/uploads/students/profiles/arjun-sharma.jpg',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    class: '7',
    section: 'B',
    rollNumber: '2024012',
    profilePic: '/uploads/students/profiles/priya-sharma.jpg',
  },
];

interface Child {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  profilePic: string;
}

export default function ParentAttendancePage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>(mockChildren); // Start with mock data as fallback
  const [selectedChild, setSelectedChild] = useState<string>(
    mockChildren[0].id,
  );
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceEvent[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [childLoading, setChildLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch parent's children
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get current parent's profile using the /me endpoint
        const parentRes = await parentService.getMyProfile();

        if (!parentRes.success || !parentRes.data) {
          setLoading(false);
          return;
        }

        const parentData = parentRes.data;

        // Children data is already included in the parent response
        if (parentData.children && parentData.children.length > 0) {
          // Transform children data to match expected format
          const transformedChildren = parentData.children.map((child: any) => {
            return {
              id: child.studentId, // Use the studentId from the API response
              name: child.fullName || 'Unknown',
              class: child.className?.split('-')[0] || '',
              section: child.className?.split('-')[1] || '',
              rollNumber: child.rollNumber || 'N/A',
              profilePic: child.profilePhotoUrl || '',
            };
          });

          setChildren(transformedChildren);

          // Set first child as selected if available
          if (transformedChildren.length > 0) {
            const firstChildId = transformedChildren[0].id;
            setSelectedChild(firstChildId);
          }
        }
      } catch (error) {
        console.error('Error fetching children:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user?.id]);

  // Function to fetch attendance data for a specific month
  const fetchAttendanceData = useCallback(
    async (month: number, year: number, isMonthChange = false) => {
      if (!selectedChild) return;

      // Skip if selectedChild is still the mock data ID
      if (selectedChild === '1' || selectedChild === '2') {
        return;
      }

      try {
        if (isMonthChange) {
          setMonthLoading(true);
        } else {
          setChildLoading(true);
        }

        const attendanceResponse = await attendanceService.getStudentAttendance(
          selectedChild, // This is the student ID
          {
            month,
            year,
          },
        );

        // Transform attendance records to events format (same as student page)
        const events: AttendanceEvent[] = (
          attendanceResponse.records || []
        ).map((record: any) => ({
          id: record.date,
          date: record.date,
          status:
            record.status.toLowerCase() === 'late' ||
            record.status.toLowerCase() === 'absent' ||
            record.status.toLowerCase() === 'excused'
              ? 'absent'
              : (record.status.toLowerCase() as 'present' | 'absent'),
        }));

        setAttendanceData(events);
        setAttendanceStats(attendanceResponse.stats);
      } catch (error: any) {
        console.error('Error fetching attendance data:', error);
        setAttendanceData([]);
        setAttendanceStats(null);
      } finally {
        if (isMonthChange) {
          setMonthLoading(false);
        } else {
          setChildLoading(false);
        }
      }
    },
    [selectedChild],
  );

  // Fetch attendance data when child changes
  useEffect(() => {
    if (selectedChild) {
      // Reset to current month when child changes
      const now = new Date();
      setCurrentDate(now);
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = now.getFullYear();

      fetchAttendanceData(currentMonth, currentYear);
    }
  }, [selectedChild, fetchAttendanceData]);

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
    return <CalendarLoader />;
  }

  if (children.length === 0) {
    return (
      <div className='w-full p-6'>
        <SectionTitle text='Attendance' level={2} />
        <div className='text-center py-8 text-gray-500'>
          No children found. Please contact the school administration.
        </div>
      </div>
    );
  }

  return (
    <div className='w-full p-6'>
      <div className='flex items-center justify-between mb-6'>
        <SectionTitle text='Attendance' level={2} />
        <Dropdown
          options={children.map((c: Child) => ({
            label: `${c.name} (Class ${c.class}-${c.section})`,
            value: c.id,
          }))}
          selectedValue={selectedChild}
          onSelect={setSelectedChild}
          className='min-w-[200px] rounded-lg px-4 py-2'
          title='Select Child'
          type='filter'
        />
      </div>

      {childLoading ? (
        <CalendarLoader />
      ) : (
        <>
          {/* Show selected child info */}
          {selectedChild && (
            <div className='bg-white rounded-lg shadow p-4 mb-6'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 font-semibold text-lg'>
                    {children
                      .find(c => c.id === selectedChild)
                      ?.name?.charAt(0) || 'C'}
                  </span>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>
                    {children.find(c => c.id === selectedChild)?.name}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    Class {children.find(c => c.id === selectedChild)?.class}-
                    {children.find(c => c.id === selectedChild)?.section} |
                    Roll:{' '}
                    {children.find(c => c.id === selectedChild)?.rollNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {attendanceStats && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='bg-white rounded-lg shadow p-4'>
                <div className='text-sm text-gray-600'>Present Days</div>
                <div className='text-2xl font-bold text-green-600'>
                  {attendanceStats.presentDays}
                </div>
              </div>
              <div className='bg-white rounded-lg shadow p-4'>
                <div className='text-sm text-gray-600'>Absent Days</div>
                <div className='text-2xl font-bold text-red-600'>
                  {attendanceStats.absentDays}
                </div>
              </div>
              <div className='bg-white rounded-lg shadow p-4'>
                <div className='text-sm text-gray-600'>Attendance %</div>
                <div className='text-2xl font-bold text-blue-600'>
                  {attendanceStats.attendancePercentage}%
                </div>
              </div>
            </div>
          )}

          {monthLoading && (
            <div className='mb-4 text-center py-2'>
              <div className='inline-flex items-center gap-2 text-blue-600'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                <span className='text-sm'>Loading attendance data...</span>
              </div>
            </div>
          )}

          {/* Show calendar or no data message */}
          {attendanceData.length > 0 ? (
            <StudentAttendanceCalendar
              events={attendanceData}
              currentDate={currentDate}
              onMonthChange={handleMonthChange}
              onCalendarTypeChange={handleCalendarTypeChange}
            />
          ) : (
            <div className='bg-white rounded-lg shadow p-6 text-center'>
              <div className='text-gray-500 mb-2'>
                No attendance data available
              </div>
              <div className='text-sm text-gray-400'>
                Attendance records for{' '}
                {currentDate.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                will appear here
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
