'use client';

/**
 * =============================================================================
 * Attendance Manager Organism
 * =============================================================================
 * Main attendance management component with tabs and state management
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AttendanceForm } from './AttendanceForm';
import { AttendanceHistory } from './AttendanceHistory';
import { Student, AttendanceRecord, AttendanceStats } from '@/types/attendance';
import { studentService } from '@/api/services/student.service';
import { attendanceService } from '@/api/services/attendance.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// No more dummy data - only real data from backend

export const AttendanceManager: React.FC<{ classId?: string }> = ({
  classId,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'take' | 'history'>('take');
  const [saving, setSaving] = useState<boolean>(false);
  const { user } = useAuth();

  // Load students for the class
  useEffect(() => {
    const loadStudents = async () => {
      if (!classId || !user?.id) {
        setLoading(false);
        toast.error('Missing required data', {
          description:
            'Class ID or user not available. Please refresh the page.',
        });
        return;
      }

      try {
        setLoading(true);
        toast.loading('Loading students...', {
          id: 'loading-students',
        });
        const response = await studentService.getStudentsByClass(classId);
        console.log('Student API response:', response);

        // Check if response has data - the API returns {success: true, data: Array}
        if (!response.data || !Array.isArray(response.data)) {
          console.warn('Invalid student data response:', response);
          throw new Error('Invalid student data response');
        }

        // Transform API response to match our Student interface
        const transformedStudents: Student[] = response.data.map(
          (student: any) => ({
            id: student.id,
            name: student.fullName,
            rollNumber: student.rollNumber,
            email: student.email,
            classId: student.classId,
          }),
        );

        console.log(
          'Transformed students:',
          transformedStudents.map(s => ({ id: s.id, name: s.name })),
        );

        console.log('Loaded students for class:', classId, transformedStudents);
        setStudents(transformedStudents);
        toast.success('Students loaded successfully!', {
          id: 'loading-students',
          description: `Loaded ${transformedStudents.length} students`,
        });
      } catch (error) {
        console.error('Failed to load students:', error);
        setStudents([]);
        toast.error('Failed to load students', {
          id: 'loading-students',
          description: 'Please refresh the page to try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [classId, user?.id]);

  // Load attendance records from localStorage on mount
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem('attendanceRecords');
      const lastUpdated = localStorage.getItem('attendanceLastUpdated');

      if (savedRecords) {
        const parsedRecords = JSON.parse(savedRecords);
        console.log('Initial load from localStorage:', parsedRecords.length);

        if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
          setAttendanceRecords(parsedRecords);

          // Check if today's attendance is already taken from saved records
          const today = new Date().toISOString().split('T')[0];
          const todayRecord = parsedRecords.find(
            record => record.date === today,
          );
          setIsLocked(!!todayRecord);

          console.log(
            'Loaded initial data from localStorage, last updated:',
            lastUpdated,
          );
        }
      }
    } catch (e) {
      console.warn(
        'Failed to load initial attendance records from localStorage:',
        e,
      );
    }
  }, []);

  // Load attendance records for the class
  useEffect(() => {
    const loadAttendanceRecords = async () => {
      if (!classId || !user?.id) {
        return;
      }

      try {
        toast.loading('Loading attendance data...', {
          id: 'loading-attendance',
        });
        const today = new Date().toISOString().split('T')[0];
        setCurrentDate(today);

        // Load recent attendance records (last 30 days for better history)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const response = await attendanceService.getAttendance({
          class_id: classId,
          start_date: startDate,
          end_date: endDate,
          limit: 100, // Increased limit for more history
        });

        console.log('Attendance API response:', response);
        console.log('Response data structure:', {
          hasData: !!response.data,
          hasDataData: !!(response.data && response.data.data),
          dataLength: response.data?.data?.length,
          firstRecord: response.data?.data?.[0],
        });

        console.log(
          'Raw API response structure:',
          JSON.stringify(response, null, 2),
        );

        // Check if the response is in the expected format
        let recordsToProcess: any[] = [];

        if (response.data && Array.isArray(response.data)) {
          // Direct array response
          recordsToProcess = response.data;
          console.log('Direct array response detected');
        } else if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          // Paginated response with data property
          recordsToProcess = response.data.data;
          console.log('Paginated response detected');
        } else if (response.data && typeof response.data === 'object') {
          // Single record response
          recordsToProcess = [response.data];
          console.log('Single record response detected');
        } else {
          console.error('Unexpected API response format:', response);
          recordsToProcess = [];
        }

        console.log('Records to process:', recordsToProcess.length);

        if (recordsToProcess.length > 0) {
          // Group attendance records by date
          const recordsByDate = recordsToProcess.reduce(
            (acc: { [date: string]: any }, record: any) => {
              // Handle different date formats from backend
              let date = record.date;
              if (typeof date === 'string') {
                // If it's a full ISO string, extract just the date part
                if (date.includes('T')) {
                  date = date.split('T')[0];
                }
              } else if (date instanceof Date) {
                date = date.toISOString().split('T')[0];
              }

              console.log('Processing record:', {
                originalDate: record.date,
                processedDate: date,
                studentId: record.student_id,
              });

              if (!acc[date]) {
                acc[date] = {
                  id: `date-${date}`,
                  date: date,
                  attendance: {},
                  remarks: {},
                  takenAt: record.created_at,
                  isLocked: true,
                  classId: record.class_id,
                };
              }

              acc[date].attendance[record.student_id] = record.status;
              if (record.remarks) {
                acc[date].remarks[record.student_id] = record.remarks;
              }

              return acc;
            },
            {},
          );

          const transformedRecords: AttendanceRecord[] =
            Object.values(recordsByDate);
          console.log('Transformed attendance records:', transformedRecords);
          console.log('Records by date:', recordsByDate);
          console.log("Today's date:", today);

          // Store the records in localStorage as a backup
          try {
            localStorage.setItem(
              'attendanceRecords',
              JSON.stringify(transformedRecords),
            );
            localStorage.setItem(
              'attendanceLastUpdated',
              new Date().toISOString(),
            );
            console.log('Attendance records saved to localStorage');
          } catch (e) {
            console.warn(
              'Failed to save attendance records to localStorage:',
              e,
            );
          }

          setAttendanceRecords(transformedRecords);

          // Check if today's attendance is already taken
          console.log("Looking for today's record. Today:", today);
          console.log(
            'Available dates:',
            transformedRecords.map(r => r.date),
          );
          const todayRecord = transformedRecords.find(
            record => record.date === today,
          );
          console.log("Today's record found:", todayRecord);
          if (todayRecord) {
            setIsLocked(true);
            console.log('Attendance is locked for today');
          }

          // Show success toast for data loading
          toast.success('Attendance data loaded successfully!', {
            id: 'loading-attendance',
            description: `Loaded ${transformedRecords.length} days of attendance records`,
          });
        } else {
          console.log(
            'No attendance records found, this is normal for new classes',
          );

          // Try to load from localStorage if available
          try {
            const savedRecords = localStorage.getItem('attendanceRecords');
            const lastUpdated = localStorage.getItem('attendanceLastUpdated');

            if (savedRecords) {
              const parsedRecords = JSON.parse(savedRecords);
              console.log(
                'Found saved records in localStorage:',
                parsedRecords.length,
              );

              if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
                setAttendanceRecords(parsedRecords);

                // Check if today's attendance is already taken from saved records
                const todayRecord = parsedRecords.find(
                  record => record.date === today,
                );
                setIsLocked(!!todayRecord);

                toast.info('Loaded attendance from local cache', {
                  id: 'loading-attendance',
                  description: `Last updated: ${new Date(lastUpdated || '').toLocaleString()}`,
                });
                return;
              }
            }
          } catch (e) {
            console.warn(
              'Failed to load attendance records from localStorage:',
              e,
            );
          }

          setAttendanceRecords([]);
          setIsLocked(false);
          toast.info('No attendance records found', {
            id: 'loading-attendance',
            description:
              'This is normal for new classes. Start taking attendance to see history.',
          });
        }
      } catch (error) {
        console.error('Failed to load attendance data:', error);

        // Try to load from localStorage if available
        try {
          const savedRecords = localStorage.getItem('attendanceRecords');
          const lastUpdated = localStorage.getItem('attendanceLastUpdated');

          if (savedRecords) {
            const parsedRecords = JSON.parse(savedRecords);
            console.log(
              'Found saved records in localStorage after API error:',
              parsedRecords.length,
            );

            if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
              setAttendanceRecords(parsedRecords);

              // Check if today's attendance is already taken from saved records
              const todayRecord = parsedRecords.find(
                record => record.date === currentDate,
              );
              setIsLocked(!!todayRecord);

              toast.warning('Using cached attendance data', {
                id: 'loading-attendance',
                description: `API call failed. Using local data from ${new Date(lastUpdated || '').toLocaleString()}`,
              });
              return;
            }
          }
        } catch (e) {
          console.warn(
            'Failed to load attendance records from localStorage:',
            e,
          );
        }

        setAttendanceRecords([]);
        setIsLocked(false);
        toast.error('Failed to load attendance data', {
          id: 'loading-attendance',
          description: 'Please refresh to try again.',
        });
      }
    };

    loadAttendanceRecords();
  }, [classId, user?.id]);

  // Auto-refresh data when component mounts to ensure we have latest data
  useEffect(() => {
    if (classId && user?.id && !loading) {
      // Small delay to ensure initial load is complete
      const timer = setTimeout(() => {
        refreshData();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [classId, user?.id, loading]);

  const saveAttendance = async (attendance: {
    [studentId: string]: 'present' | 'absent';
  }) => {
    if (!classId) return;

    try {
      setSaving(true);
      toast.loading('Saving attendance...', {
        id: 'saving-attendance',
      });

      // Transform attendance data to match backend API format
      const entries = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        status: status,
      }));

      const response = await attendanceService.markTodayAttendance({
        class_id: classId,
        entries,
      });

      if (response.data) {
        // Transform API response to match our AttendanceRecord interface
        const newRecord: AttendanceRecord = {
          id: Date.now().toString(),
          date: currentDate,
          attendance,
          takenAt: new Date().toISOString(),
          isLocked: true,
          classId,
        };

        // Update local state - replace existing record for today if it exists
        const existingRecordIndex = attendanceRecords.findIndex(
          record => record.date === currentDate,
        );
        let updatedRecords;
        if (existingRecordIndex >= 0) {
          // Replace existing record
          updatedRecords = [...attendanceRecords];
          updatedRecords[existingRecordIndex] = newRecord;
        } else {
          // Add new record
          updatedRecords = [...attendanceRecords, newRecord];
        }

        setAttendanceRecords(updatedRecords);
        setIsLocked(true);

        console.log('Updated attendance records:', updatedRecords);

        // Store the updated records in localStorage
        try {
          localStorage.setItem(
            'attendanceRecords',
            JSON.stringify(updatedRecords),
          );
          localStorage.setItem(
            'attendanceLastUpdated',
            new Date().toISOString(),
          );
          console.log('Updated attendance records saved to localStorage');
        } catch (e) {
          console.warn(
            'Failed to save updated attendance records to localStorage:',
            e,
          );
        }

        // Show success toast
        toast.success('Attendance saved successfully!', {
          id: 'saving-attendance',
          description: `Marked attendance for ${Object.keys(attendance).length} students`,
        });
      }
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('Failed to save attendance', {
        id: 'saving-attendance',
        description:
          'Please try again. If the problem persists, contact support.',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAttendanceWithRemark = async (
    studentId: string,
    status: 'present' | 'absent',
    remark: string,
  ) => {
    try {
      setSaving(true);
      toast.loading('Updating attendance...', {
        id: 'updating-attendance',
      });

      // First, get today's attendance records to find the specific record ID for this student
      const todayResponse = await attendanceService.getClassAttendance(
        classId!,
        currentDate,
      );

      console.log("Today's attendance response:", todayResponse);
      console.log('Looking for student ID:', studentId);
      console.log(
        'Available records:',
        todayResponse.data?.map(r => ({
          id: r.id,
          student_id: r.student_id,
          status: r.status,
        })),
      );

      if (!todayResponse.data || todayResponse.data.length === 0) {
        console.error('No attendance records found for today');
        toast.error('No attendance records found for today', {
          id: 'updating-attendance',
          description: 'Please take attendance first before editing.',
        });
        return;
      }

      // Find the specific attendance record for this student
      const studentRecord = todayResponse.data.find(
        record => record.student_id === studentId,
      );
      if (!studentRecord) {
        console.error('No attendance record found for this student');
        console.error(
          'Available student IDs:',
          todayResponse.data.map(r => r.student_id),
        );
        console.error('Looking for:', studentId);
        toast.error('No attendance record found for this student', {
          id: 'updating-attendance',
          description: 'Please take attendance first before editing.',
        });
        return;
      }

      console.log(
        'Updating attendance for student:',
        studentId,
        'record ID:',
        studentRecord.id,
      );

      const response = await attendanceService.updateAttendance(
        studentRecord.id,
        {
          status,
          remarks: remark,
        },
      );

      if (response.data) {
        console.log('Attendance updated successfully:', response.data);

        // Update local state
        const updatedRecords = attendanceRecords.map(record => {
          if (record.date === currentDate) {
            return {
              ...record,
              attendance: {
                ...record.attendance,
                [studentId]: status,
              },
              remarks: {
                ...record.remarks,
                [studentId]: remark,
              },
            };
          }
          return record;
        });

        setAttendanceRecords(updatedRecords);

        // Store the updated records in localStorage
        try {
          localStorage.setItem(
            'attendanceRecords',
            JSON.stringify(updatedRecords),
          );
          localStorage.setItem(
            'attendanceLastUpdated',
            new Date().toISOString(),
          );
          console.log(
            'Updated attendance records (with remark) saved to localStorage',
          );
        } catch (e) {
          console.warn(
            'Failed to save updated attendance records to localStorage:',
            e,
          );
        }

        toast.success('Attendance updated successfully!', {
          id: 'updating-attendance',
          description: `Updated student attendance to ${status}`,
        });
      }
    } catch (error) {
      console.error('Failed to update attendance:', error);
      toast.error('Failed to update attendance', {
        id: 'updating-attendance',
        description:
          'Please try again. If the problem persists, contact support.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getTodayRecord = () => {
    return attendanceRecords.find(record => record.date === currentDate);
  };

  const getAttendanceStats = (): AttendanceStats => {
    const todayRecord = getTodayRecord();
    if (!todayRecord) {
      return { present: 0, absent: 0, total: students.length, percentage: 0 };
    }

    const present = Object.values(todayRecord.attendance).filter(
      status => status === 'present',
    ).length;
    const absent = Object.values(todayRecord.attendance).filter(
      status => status === 'absent',
    ).length;
    const total = students.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, percentage };
  };

  // Function to refresh all data
  const refreshData = async () => {
    if (!classId || !user?.id) return;

    toast.loading('Refreshing data...', {
      id: 'refreshing-data',
    });

    try {
      // Reload students
      const studentResponse = await studentService.getStudentsByClass(classId);
      if (studentResponse.data && Array.isArray(studentResponse.data)) {
        const transformedStudents: Student[] = studentResponse.data.map(
          (student: any) => ({
            id: student.id,
            name: student.fullName,
            rollNumber: student.rollNumber,
            email: student.email,
            classId: student.classId,
          }),
        );
        setStudents(transformedStudents);
      }

      // Reload attendance records
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const attendanceResponse = await attendanceService.getAttendance({
        class_id: classId,
        start_date: startDate,
        end_date: endDate,
        limit: 100,
      });

      if (
        attendanceResponse.data &&
        attendanceResponse.data.data &&
        attendanceResponse.data.data.length > 0
      ) {
        const recordsByDate = attendanceResponse.data.data.reduce(
          (acc: { [date: string]: any }, record: any) => {
            // Handle different date formats from backend
            let date = record.date;
            if (typeof date === 'string') {
              // If it's a full ISO string, extract just the date part
              if (date.includes('T')) {
                date = date.split('T')[0];
              }
            } else if (date instanceof Date) {
              date = date.toISOString().split('T')[0];
            }

            if (!acc[date]) {
              acc[date] = {
                id: `date-${date}`,
                date: date,
                attendance: {},
                remarks: {},
                takenAt: record.created_at,
                isLocked: true,
                classId: record.class_id,
              };
            }

            acc[date].attendance[record.student_id] = record.status;
            if (record.remarks) {
              acc[date].remarks[record.student_id] = record.remarks;
            }

            return acc;
          },
          {},
        );

        const transformedRecords: AttendanceRecord[] =
          Object.values(recordsByDate);
        setAttendanceRecords(transformedRecords);

        // Store the refreshed records in localStorage
        try {
          localStorage.setItem(
            'attendanceRecords',
            JSON.stringify(transformedRecords),
          );
          localStorage.setItem(
            'attendanceLastUpdated',
            new Date().toISOString(),
          );
          console.log('Refreshed attendance records saved to localStorage');
        } catch (e) {
          console.warn(
            'Failed to save refreshed attendance records to localStorage:',
            e,
          );
        }

        const currentDate = new Date().toISOString().split('T')[0];
        const todayRecord = transformedRecords.find(
          record => record.date === currentDate,
        );
        setIsLocked(!!todayRecord);
      } else {
        // Try to load from localStorage if available
        try {
          const savedRecords = localStorage.getItem('attendanceRecords');
          if (savedRecords) {
            const parsedRecords = JSON.parse(savedRecords);
            if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
              setAttendanceRecords(parsedRecords);
              const currentDate = new Date().toISOString().split('T')[0];
              const todayRecord = parsedRecords.find(
                record => record.date === currentDate,
              );
              setIsLocked(!!todayRecord);
              return;
            }
          }
        } catch (e) {
          console.warn(
            'Failed to load attendance records from localStorage during refresh:',
            e,
          );
        }

        setAttendanceRecords([]);
        setIsLocked(false);
      }

      toast.success('Data refreshed successfully!', {
        id: 'refreshing-data',
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data', {
        id: 'refreshing-data',
        description: 'Please try again.',
      });
    }
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading students...</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>👥</div>
          <h3 className='text-xl font-semibold text-gray-900 mb-2'>
            No Students Found
          </h3>
          <p className='text-gray-600'>
            There are no students assigned to this class yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header Stats */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        {saving && (
          <div className='col-span-5 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center justify-center'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
              <span className='text-blue-800'>Saving attendance...</span>
            </div>
          </div>
        )}
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <span className='text-lg'>📅</span>
              <div>
                <p className='text-sm text-gray-600'>Date</p>
                <p className='font-semibold'>
                  {new Date(currentDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <span className='text-lg'>✅</span>
              <div>
                <p className='text-sm text-gray-600'>Present</p>
                <p className='font-semibold text-green-600'>{stats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <span className='text-lg'>❌</span>
              <div>
                <p className='text-sm text-gray-600'>Absent</p>
                <p className='font-semibold text-red-600'>{stats.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <span className='text-lg'>📊</span>
              <div>
                <p className='text-sm text-gray-600'>Percentage</p>
                <p className='font-semibold text-blue-600'>
                  {stats.percentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              {isLocked ? (
                <span className='text-lg'>🔒</span>
              ) : (
                <span className='text-lg'>⏰</span>
              )}
              <div>
                <p className='text-sm text-gray-600'>Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isLocked
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isLocked ? 'Locked' : 'Open'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className='flex items-center justify-between'>
        <div className='flex space-x-2'>
          <Button
            variant={activeTab === 'take' ? 'default' : 'outline'}
            onClick={() => setActiveTab('take')}
          >
            📝 Take Attendance
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
          >
            📅 View History
          </Button>
        </div>
        <Button
          variant='outline'
          onClick={refreshData}
          disabled={loading}
          className='flex items-center space-x-2'
        >
          🔄 Refresh
        </Button>
      </div>

      {/* Main Content */}
      {activeTab === 'take' ? (
        <AttendanceForm
          students={students}
          isLocked={isLocked}
          todayRecord={getTodayRecord()}
          onSaveAttendance={saveAttendance}
          onUpdateWithRemark={updateAttendanceWithRemark}
          saving={saving}
        />
      ) : (
        <AttendanceHistory
          students={students}
          attendanceRecords={attendanceRecords}
        />
      )}
    </div>
  );
};
