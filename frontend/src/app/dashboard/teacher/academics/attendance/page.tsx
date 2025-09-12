'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  ClipboardCheck,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  History,
  Search,
  CalendarDays,
} from 'lucide-react';
import MarkAttendanceModal from '@/components/organisms/modals/MarkAttendanceModal';
import { teacherService } from '@/api/services/teacher.service';
import { attendanceService } from '@/api/services/attendance.service';

interface AssignedClass {
  id: string;
  grade: number;
  section: string;
  currentEnrollment: number;
  present?: number;
  absent?: number;
  attendanceMarked?: boolean;
}

interface HistoryAttendanceRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

interface RawAttendanceRecord {
  studentId?: string;
  id?: string;
  studentName?: string;
  student?: {
    id?: string;
    name?: string;
    rollNumber?: string;
    user?: {
      fullName?: string;
    };
  };
  rollNumber?: string;
  status: string;
}

export default function TeacherAttendancePage() {
  const [assignedClass, setAssignedClass] = useState<AssignedClass | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false); // New state to track read-only mode
  const [attendanceStats, setAttendanceStats] = useState<{
    present: number;
    absent: number;
    total: number;
    percentage: number;
  } | null>(null);

  // History-related state
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('');
  const [historyAttendance, setHistoryAttendance] = useState<
    HistoryAttendanceRecord[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Check if attendance is already marked for today
  const checkTodayAttendance = useCallback(
    async (classId: string) => {
      try {
        console.log(
          'Checking attendance for classId:',
          classId,
          'date:',
          todayDate,
        );
        const attendanceData = await attendanceService.getClassAttendance(
          classId,
          todayDate,
        );
        console.log('Attendance API response:', attendanceData);

        // Handle different response formats - could be direct array or wrapped in data property
        let records = [];

        // @ts-ignore - Handle dynamic API response formats
        const data = attendanceData;

        // @ts-ignore - Check for records property
        if (data && data.records && Array.isArray(data.records)) {
          // @ts-ignore
          records = data.records;
          // @ts-ignore - Check for data wrapper
        } else if (data && typeof data === 'object' && 'data' in data) {
          // @ts-ignore - Check nested data.records
          if (
            data.data &&
            (data as any).data.records &&
            Array.isArray((data as any).data.records)
          ) {
            // @ts-ignore
            records = (data as any).data.records;
            // @ts-ignore - Check if data is direct array
          } else if (Array.isArray(data.data)) {
            // @ts-ignore
            records = data.data;
          }
        } else if (Array.isArray(data)) {
          // Direct array format
          records = data;
        }

        console.log('Processed attendance records:', records);

        if (Array.isArray(records) && records.length > 0) {
          // Check for any attendance records regardless of status
          const present = records.filter(
            (record: { status: string }) =>
              record.status?.toUpperCase() === 'PRESENT',
          ).length;
          const absent = records.filter(
            (record: { status: string }) =>
              record.status?.toUpperCase() === 'ABSENT',
          ).length;
          const late = records.filter(
            (record: { status: string }) =>
              record.status?.toUpperCase() === 'LATE',
          ).length;
          const excused = records.filter(
            (record: { status: string }) =>
              record.status?.toUpperCase() === 'EXCUSED',
          ).length;

          const total = present + absent + late + excused;
          const percentage = total > 0 ? (present / total) * 100 : 0;

          console.log('Attendance counts:', {
            present,
            absent,
            late,
            excused,
            total,
          });

          // If ANY attendance records exist for today, mark as already completed
          if (total > 0) {
            console.log(
              'Setting attendance as marked - records found for today',
            );
            setAttendanceStats({ present, absent, total, percentage });
            setAssignedClass(prev =>
              prev ? { ...prev, attendanceMarked: true } : null,
            );
            setIsReadOnlyMode(true); // Enable read-only mode
          } else {
            console.log('No valid attendance records found');
            setAttendanceStats(null);
            setAssignedClass(prev =>
              prev ? { ...prev, attendanceMarked: false } : null,
            );
            setIsReadOnlyMode(false); // Disable read-only mode
          }
        } else {
          // No attendance records found for today
          console.log('No attendance records found for today');
          setAttendanceStats(null);
          setAssignedClass(prev =>
            prev ? { ...prev, attendanceMarked: false } : null,
          );
          setIsReadOnlyMode(false); // Disable read-only mode
        }
      } catch (err) {
        console.error('Error checking today attendance:', err);
        // On error, assume attendance is not marked to allow retry
        setAttendanceStats(null);
        setAssignedClass(prev =>
          prev ? { ...prev, attendanceMarked: false } : null,
        );
        setIsReadOnlyMode(false); // Disable read-only mode on error
      }
    },
    [todayDate],
  );

  // Fetch teacher's assigned class
  useEffect(() => {
    const fetchAssignedClass = async () => {
      try {
        setIsLoading(true);
        const response = await teacherService.getMyClasses();
        console.log('Teacher classes response:', response);

        // Check if teacher is assigned as class teacher to any class
        const classTeacherClass = response.data.find(
          (c: {
            class: {
              id: string;
              grade: number;
              section: string;
              currentEnrollment?: number;
            };
          }) => c.class,
        );

        console.log('Found class teacher class:', classTeacherClass);

        if (!classTeacherClass) {
          setError('You are not assigned as a class teacher to any class.');
          return;
        }

        const classData = {
          id: classTeacherClass.class.id,
          grade: classTeacherClass.class.grade,
          section: classTeacherClass.class.section,
          currentEnrollment: classTeacherClass.class.currentEnrollment || 0,
        };

        console.log('Setting assigned class data:', classData);
        setAssignedClass(classData);

        // Check if attendance is already marked for today
        await checkTodayAttendance(classData.id);
      } catch (err) {
        setError('Failed to fetch class information. Please try again.');
        console.error('Error fetching assigned class:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedClass();
  }, [checkTodayAttendance]);

  // Periodic attendance status check to prevent duplicate marking
  useEffect(() => {
    if (!assignedClass?.id) return;

    const intervalId = setInterval(async () => {
      console.log('Periodic attendance check...');
      await checkTodayAttendance(assignedClass.id);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [assignedClass?.id, checkTodayAttendance]);

  // Check attendance status when window gains focus
  useEffect(() => {
    if (!assignedClass?.id) return;

    const handleFocus = async () => {
      console.log('Window focused - checking attendance status...');
      await checkTodayAttendance(assignedClass.id);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [assignedClass?.id, checkTodayAttendance]);

  // Function to fetch attendance history for a specific date
  const fetchAttendanceHistory = useCallback(
    async (date: string) => {
      if (!assignedClass?.id || !date) {
        console.log('Missing classId or date for history fetch:', {
          classId: assignedClass?.id,
          date,
        });
        return;
      }

      try {
        setIsLoadingHistory(true);
        setHistoryError(null);

        console.log('Fetching attendance history for:', {
          classId: assignedClass.id,
          date,
        });
        const attendanceData = await attendanceService.getClassAttendance(
          assignedClass.id,
          date,
        );
        console.log('Raw attendance history response:', attendanceData);

        // Handle the backend response format - attendance records are nested in attendanceData.records
        let records: RawAttendanceRecord[] = [];

        // @ts-ignore - Handle dynamic API response formats
        const data = attendanceData;

        // @ts-ignore - Check for records property
        if (data && data.records && Array.isArray(data.records)) {
          // @ts-ignore
          records = data.records;
          // @ts-ignore - Check for data wrapper
        } else if (data && typeof data === 'object' && 'data' in data) {
          // @ts-ignore - Check nested data.records
          if (
            data.data &&
            (data as any).data.records &&
            Array.isArray((data as any).data.records)
          ) {
            // @ts-ignore
            records = (data as any).data.records;
            // @ts-ignore - Check if data is direct array
          } else if (Array.isArray(data.data)) {
            // @ts-ignore
            records = data.data;
          }
        } else if (Array.isArray(data)) {
          // Direct array format
          records = data;
        }

        console.log('Processed attendance history records:', records);

        if (Array.isArray(records) && records.length > 0) {
          // Transform the records to match our interface
          const formattedRecords: HistoryAttendanceRecord[] = records.map(
            (record: RawAttendanceRecord) => ({
              studentId:
                record.studentId ||
                record.id ||
                record.student?.id ||
                'unknown',
              studentName:
                record.studentName ||
                record.student?.user?.fullName ||
                record.student?.name ||
                `Student ${record.studentId || record.id}`,
              rollNumber:
                record.rollNumber || record.student?.rollNumber || 'N/A',
              status: record.status?.toUpperCase() as
                | 'PRESENT'
                | 'ABSENT'
                | 'LATE'
                | 'EXCUSED',
            }),
          );

          console.log(
            'Formatted attendance history records:',
            formattedRecords,
          );
          setHistoryAttendance(formattedRecords);
        } else {
          console.log('No attendance records found for date:', date);
          setHistoryAttendance([]);
        }
      } catch (err) {
        console.error('Error fetching attendance history:', err);
        setHistoryError('Failed to fetch attendance history for this date.');
        setHistoryAttendance([]);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [assignedClass?.id],
  );

  // Handle date selection for history
  const handleHistoryDateChange = (date: string) => {
    setSelectedHistoryDate(date);
    if (date) {
      fetchAttendanceHistory(date);
    } else {
      setHistoryAttendance([]);
      setHistoryError(null);
    }
  };

  const handleMarkAttendance = async () => {
    if (!assignedClass) {
      return;
    }

    // Check read-only mode first
    if (isReadOnlyMode) {
      alert(
        'Attendance has already been marked for today. The system is now in read-only mode.',
      );
      return;
    }

    // Double-check attendance status before opening modal
    console.log('Double-checking attendance status before opening modal...');
    await checkTodayAttendance(assignedClass.id);

    // Check again after the refresh
    if (assignedClass.attendanceMarked || isReadOnlyMode) {
      alert(
        'Attendance has already been marked for today. You cannot mark attendance multiple times per day.',
      );
      return;
    }

    setIsMarkAttendanceOpen(true);
  };

  const handleAttendanceMarked = async () => {
    setIsMarkAttendanceOpen(false);

    if (assignedClass) {
      // Add a small delay to ensure the server has processed the attendance
      setTimeout(async () => {
        console.log('Re-checking attendance status after marking...');
        await checkTodayAttendance(assignedClass.id);

        // Force a page refresh of the attendance status after a longer delay
        setTimeout(async () => {
          console.log('Second attendance check...');
          await checkTodayAttendance(assignedClass.id);
        }, 2000);
      }, 1000);
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

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

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8'>
        <div className='w-full mx-auto'>
          <div className='flex justify-center items-center min-h-[400px]'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center w-full'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <Label className='text-gray-600'>
                Loading your class information...
              </Label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8'>
        <div className='w-full mx-auto'>
          <div className='flex justify-center items-center min-h-[400px]'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center w-full'>
              <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <SectionTitle
                text='Access Restricted'
                className='text-lg font-semibold text-gray-900 mb-2'
              />
              <Label className='text-gray-600 mb-4'>{error}</Label>
              <Label className='text-sm text-gray-500'>
                Please contact the administrator if you believe this is an
                error.
              </Label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8'>
      <div className='w-full mx-auto space-y-6'>
        {/* Header Section */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
            <div>
              <SectionTitle
                text='Class Attendance'
                className='text-2xl font-bold text-gray-900'
              />
              <Label className='text-gray-600 mt-1'>
                {assignedClass &&
                  `Grade ${assignedClass.grade} - Section ${assignedClass.section}`}
              </Label>
            </div>
            <div className='text-center sm:text-right'>
              <Label className='text-sm text-gray-500'>Today&apos;s Date</Label>
              <div className='text-lg font-semibold text-gray-900'>
                {getCurrentDate()}
              </div>
            </div>
          </div>
        </div>

        {/* Class Information Card */}
        {assignedClass && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div className='flex items-center space-x-4'>
                <div className='p-3 bg-blue-100 rounded-lg'>
                  <GraduationCap className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <SectionTitle
                    text={`Grade ${assignedClass.grade} - Section ${assignedClass.section}`}
                    className='text-lg font-semibold text-gray-900'
                  />
                  <Label className='text-gray-600'>
                    Total Students: {assignedClass.currentEnrollment}
                  </Label>
                </div>
              </div>
              <div className='text-center sm:text-right'>
                {assignedClass.attendanceMarked ? (
                  <div className='text-center'>
                    <div className='flex items-center space-x-2 text-green-600 mb-1'>
                      <CheckCircle className='h-5 w-5' />
                      <span className='font-semibold'>Attendance Marked</span>
                    </div>
                    <Label className='text-xs text-gray-500'>
                      Cannot mark again today
                    </Label>
                  </div>
                ) : (
                  <Button
                    onClick={handleMarkAttendance}
                    className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
                  >
                    <Calendar className='h-4 w-4' />
                    <span>Mark Attendance</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Status Banner */}
        {assignedClass?.attendanceMarked && (
          <div className='bg-white rounded-xl shadow-sm border border-green-200 p-6'>
            <div className='bg-green-50 rounded-lg p-4'>
              <div className='flex items-center justify-center space-x-3'>
                <CheckCircle className='h-6 w-6 text-green-600 flex-shrink-0' />
                <div className='text-center'>
                  <Label className='text-green-800 font-semibold'>
                    ✅ Today&apos;s attendance has been successfully recorded
                  </Label>
                  <Label className='text-green-600 text-sm block mt-1'>
                    You can only mark attendance once per day. Come back
                    tomorrow!
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Attendance Summary */}
        {attendanceStats && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <SectionTitle
              text="Today's Attendance Summary"
              className='text-lg font-semibold text-gray-900 mb-4'
            />
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='bg-green-50 p-4 rounded-lg border border-green-100'>
                <div className='flex items-center space-x-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <Label className='text-sm text-green-800 font-medium'>
                    Present
                  </Label>
                </div>
                <div className='text-2xl font-bold text-green-900 mt-2'>
                  {attendanceStats.present}
                </div>
              </div>
              <div className='bg-red-50 p-4 rounded-lg border border-red-100'>
                <div className='flex items-center space-x-2'>
                  <XCircle className='h-5 w-5 text-red-600' />
                  <Label className='text-sm text-red-800 font-medium'>
                    Absent
                  </Label>
                </div>
                <div className='text-2xl font-bold text-red-900 mt-2'>
                  {attendanceStats.absent}
                </div>
              </div>
              <div className='bg-blue-50 p-4 rounded-lg border border-blue-100'>
                <div className='flex items-center space-x-2'>
                  <Users className='h-5 w-5 text-blue-600' />
                  <Label className='text-sm text-blue-800 font-medium'>
                    Total
                  </Label>
                </div>
                <div className='text-2xl font-bold text-blue-900 mt-2'>
                  {attendanceStats.total}
                </div>
              </div>
              <div className='bg-purple-50 p-4 rounded-lg border border-purple-100'>
                <div className='flex items-center space-x-2'>
                  <ClipboardCheck className='h-5 w-5 text-purple-600' />
                  <Label className='text-sm text-purple-800 font-medium'>
                    Percentage
                  </Label>
                </div>
                <div className='text-2xl font-bold text-purple-900 mt-2'>
                  {attendanceStats.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance History Section */}
        {assignedClass && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center space-x-3 mb-6'>
              <CalendarDays className='h-6 w-6 text-blue-600' />
              <SectionTitle
                text='Attendance History'
                className='text-lg font-semibold text-gray-900'
              />
            </div>

            {/* Date Selector */}
            <div className='mb-6'>
              <Label className='block text-sm font-medium text-gray-700 mb-2'>
                Select Date to View History
              </Label>
              <div className='w-full'>
                <Input
                  type='date'
                  value={selectedHistoryDate}
                  onChange={e => handleHistoryDateChange(e.target.value)}
                  max={todayDate} // Prevent selecting future dates
                  className='w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500' // Increased height for mobile
                  placeholder='Select a date...'
                />
              </div>
              <Label className='text-xs text-gray-500 mt-1 block'>
                💡 Tip: You can view attendance records for any past date
              </Label>
            </div>

            {/* History Content */}
            {!selectedHistoryDate ? (
              // Default message when no date is selected
              <div className='text-center py-12 bg-gray-50 rounded-xl border border-gray-100'>
                <Search className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                <Label className='text-gray-600 text-lg font-medium'>
                  Select a Date to View Attendance History
                </Label>
                <Label className='text-gray-500 text-sm block mt-1'>
                  Choose any previous date to see the attendance records for
                  that day
                </Label>
              </div>
            ) : isLoadingHistory ? (
              // Loading state
              <div className='text-center py-12 bg-gray-50 rounded-xl border border-gray-100'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3'></div>
                <Label className='text-gray-600'>
                  Loading attendance history...
                </Label>
              </div>
            ) : historyError ? (
              // Error state
              <div className='text-center py-12 bg-red-50 rounded-xl border border-red-100'>
                <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-3' />
                <Label className='text-red-700 text-lg font-medium'>
                  Attendance Not Available
                </Label>
                <Label className='text-red-600 text-sm block mt-1'>
                  No attendance records found for{' '}
                  {new Date(selectedHistoryDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Label>
              </div>
            ) : historyAttendance.length === 0 ? (
              // No records found
              <div className='text-center py-12 bg-yellow-50 rounded-xl border border-yellow-100'>
                <History className='h-12 w-12 text-yellow-500 mx-auto mb-3' />
                <Label className='text-yellow-700 text-lg font-medium'>
                  No Attendance Records
                </Label>
                <Label className='text-yellow-600 text-sm block mt-1'>
                  No attendance was marked for{' '}
                  {new Date(selectedHistoryDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Label>
              </div>
            ) : (
              // Display attendance records
              <div>
                <div className='mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
                    <Label className='text-blue-800 font-medium'>
                      Attendance for{' '}
                      {new Date(selectedHistoryDate).toLocaleDateString(
                        'en-US',
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}
                    </Label>
                    <Label className='text-blue-600 text-sm mt-1 sm:mt-0'>
                      Total Records: {historyAttendance.length}
                    </Label>
                  </div>
                </div>

                {/* Statistics Summary */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
                  <div className='bg-green-50 p-4 rounded-xl text-center border border-green-100'>
                    <div className='text-green-600 text-lg font-bold'>
                      {
                        historyAttendance.filter(r => r.status === 'PRESENT')
                          .length
                      }
                    </div>
                    <div className='text-green-800 text-xs font-medium'>
                      Present
                    </div>
                  </div>
                  <div className='bg-red-50 p-4 rounded-xl text-center border border-red-100'>
                    <div className='text-red-600 text-lg font-bold'>
                      {
                        historyAttendance.filter(r => r.status === 'ABSENT')
                          .length
                      }
                    </div>
                    <div className='text-red-800 text-xs font-medium'>
                      Absent
                    </div>
                  </div>
                  <div className='bg-yellow-50 p-4 rounded-xl text-center border border-yellow-100'>
                    <div className='text-yellow-600 text-lg font-bold'>
                      {
                        historyAttendance.filter(r => r.status === 'LATE')
                          .length
                      }
                    </div>
                    <div className='text-yellow-800 text-xs font-medium'>
                      Late
                    </div>
                  </div>
                  <div className='bg-purple-50 p-4 rounded-xl text-center border border-purple-100'>
                    <div className='text-purple-600 text-lg font-bold'>
                      {
                        historyAttendance.filter(r => r.status === 'EXCUSED')
                          .length
                      }
                    </div>
                    <div className='text-purple-800 text-xs font-medium'>
                      Excused
                    </div>
                  </div>
                </div>

                {/* Student Records List */}
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {historyAttendance.map((record, index) => (
                    <div
                      key={record.studentId}
                      className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors'
                    >
                      <div className='flex items-center space-x-3 mb-2 sm:mb-0'>
                        <div className='flex-shrink-0 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center'>
                          <span className='text-sm font-medium text-gray-600'>
                            {index + 1}
                          </span>
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium text-gray-900 truncate'>
                            {record.studentName}
                          </div>
                          <div className='text-sm text-gray-500'>
                            Roll: {record.rollNumber}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center justify-end sm:justify-start'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            record.status === 'PRESENT'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : record.status === 'ABSENT'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : record.status === 'LATE'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {record.status === 'PRESENT' && (
                            <CheckCircle className='w-4 h-4 mr-1' />
                          )}
                          {record.status === 'ABSENT' && (
                            <XCircle className='w-4 h-4 mr-1' />
                          )}
                          {record.status === 'LATE' && (
                            <AlertCircle className='w-4 h-4 mr-1' />
                          )}
                          {record.status === 'EXCUSED' && (
                            <CheckCircle className='w-4 h-4 mr-1' />
                          )}
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mark Attendance Modal */}
        {assignedClass && !isReadOnlyMode && (
          <MarkAttendanceModal
            isOpen={isMarkAttendanceOpen}
            onClose={() => setIsMarkAttendanceOpen(false)}
            selectedClass={{
              id: assignedClass.id,
              grade: assignedClass.grade.toString(),
              section: assignedClass.section,
              students: assignedClass.currentEnrollment,
            }}
            onSuccess={handleAttendanceMarked}
            restrictToToday={true}
          />
        )}
      </div>
    </div>
  );
}
