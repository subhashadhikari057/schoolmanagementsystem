import React, { useState, useEffect, useCallback } from 'react';
import Input from '@/components/atoms/form-controls/Input';
import Button from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Icon from '@/components/atoms/display/Icon';
import { studentService } from '@/api/services/student.service';
import {
  attendanceService,
  type AttendanceRecord,
} from '@/api/services/attendance.service';

interface Student {
  id: string;
  name: string;
  roll: string;
  studentId: string;
  initials: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'excused' | 'unmarked';
}

interface SelectedClass {
  id: string;
  grade: string;
  section: string;
  students: number;
}

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass?: SelectedClass;
  onSuccess?: () => void; // Callback to refresh data after successful attendance marking
  restrictToToday?: boolean; // New prop to lock date to today only
}

interface ExistingAttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

interface ExistingAttendanceSession {
  id: string;
  classId: string;
  date: string;
  sessionType: string;
  records: ExistingAttendanceRecord[];
}

const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  onSuccess,
  restrictToToday = false, // Default to false for backward compatibility
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [dateStatus, setDateStatus] = useState<{
    isHoliday: boolean;
    isEvent: boolean;
    isExam: boolean;
    isSaturday: boolean;
    isWorkingDay: boolean;
    eventDetails?: {
      title: string;
      type: string;
      description?: string;
    };
  } | null>(null);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAttendanceLoaded(false);
      setError(null);
    }
  }, [isOpen]);

  // Fetch students when modal opens and class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;

      try {
        setIsLoading(true);
        setError(null);
        setAttendanceLoaded(false); // Reset attendance loaded state

        const response = await studentService.getAllStudents({
          classId: selectedClass.id,
          limit: 100, // Get all students in the class
          sortBy: 'rollNumber',
          sortOrder: 'asc',
        });

        console.log('API Response:', response);
        console.log('Response data:', response.data);

        // The API returns { data: students[], total, page, limit, totalPages }
        if (response && response.data && Array.isArray(response.data)) {
          const studentsData = response.data;

          if (studentsData.length > 0) {
            // Transform API response to local Student interface
            const transformedStudents: Student[] = studentsData.map(student => {
              const nameParts = student.fullName.split(' ');
              const initials = nameParts
                .map((part: string) => part.charAt(0).toUpperCase())
                .join('');

              return {
                id: student.id,
                name: student.fullName,
                roll: student.rollNumber,
                studentId: student.studentId || student.id,
                initials: initials,
                attendanceStatus: 'unmarked' as const,
              };
            });

            setStudents(transformedStudents);
          } else {
            // No students found in this class
            setStudents([]);
          }
        } else {
          // Handle unexpected response structure
          console.error('Unexpected response structure:', response);
          setError('Invalid response format from server');
          setStudents([]);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Error fetching students from server');
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && selectedClass) {
      fetchStudents();
    }
  }, [isOpen, selectedClass]);

  // Reset attendance loaded state when date or class changes
  useEffect(() => {
    if (selectedDate && selectedClass) {
      console.log('Date or class changed, resetting attendance state');
      setAttendanceLoaded(false);
      setError(null);
    }
  }, [selectedDate, selectedClass]);

  // Function to load existing attendance (extracted for reusability)
  const loadExistingAttendance = useCallback(
    async (forceReload = false) => {
      if (!selectedClass || !selectedDate || students.length === 0) {
        console.log('Skipping attendance load - missing requirements:', {
          hasClass: !!selectedClass,
          hasDate: !!selectedDate,
          studentsLength: students.length,
        });
        return;
      }

      if (attendanceLoaded && !forceReload) {
        console.log('Attendance already loaded, skipping unless forced');
        return;
      }

      try {
        console.log('Loading existing attendance for:', {
          classId: selectedClass.id,
          date: selectedDate,
        });

        // Validate date is not in the future
        const attendanceDate = new Date(selectedDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (attendanceDate > today) {
          setError('Cannot mark or view attendance for future dates');
          setAttendanceLoaded(true);
          return;
        }

        setError(null);

        // Check date status first
        const dateStatusResult =
          await attendanceService.checkDateStatus(selectedDate);
        setDateStatus(dateStatusResult);

        // If it's a holiday or non-working day, show appropriate message
        if (
          dateStatusResult.isHoliday ||
          dateStatusResult.isEvent ||
          dateStatusResult.isSaturday
        ) {
          let statusMessage = '';
          if (dateStatusResult.isSaturday) {
            statusMessage = `${new Date(selectedDate).toLocaleDateString()} is a Saturday (weekend)`;
          } else if (
            dateStatusResult.isHoliday &&
            dateStatusResult.eventDetails
          ) {
            statusMessage = `${new Date(selectedDate).toLocaleDateString()} is a holiday: ${dateStatusResult.eventDetails.title}`;
          } else if (
            dateStatusResult.isEvent &&
            dateStatusResult.eventDetails
          ) {
            statusMessage = `${new Date(selectedDate).toLocaleDateString()} is an event day: ${dateStatusResult.eventDetails.title}`;
          }

          setError(statusMessage);

          // Still load any existing attendance data, but with the holiday/event context
        }

        const existingAttendance = (await attendanceService.getClassAttendance(
          selectedClass.id,
          selectedDate,
          'daily',
        )) as ExistingAttendanceSession | null;

        console.log('Existing attendance response:', existingAttendance);

        if (existingAttendance && existingAttendance.records) {
          console.log(
            'Found existing attendance records:',
            existingAttendance.records.length,
          );
          // Update students with existing attendance data
          setStudents(prevStudents =>
            prevStudents.map(student => {
              const attendanceRecord = existingAttendance.records.find(
                (record: ExistingAttendanceRecord) =>
                  record.studentId === student.id,
              );

              if (attendanceRecord) {
                console.log(
                  `Student ${student.name}: ${attendanceRecord.status}`,
                );
                return {
                  ...student,
                  attendanceStatus:
                    attendanceRecord.status.toLowerCase() as Student['attendanceStatus'],
                };
              }

              return { ...student, attendanceStatus: 'unmarked' as const };
            }),
          );

          // If attendance exists but it's a holiday/event, don't set as error since we have date status indicator
          if (
            dateStatusResult.isHoliday ||
            dateStatusResult.isEvent ||
            dateStatusResult.isSaturday
          ) {
            // The date status indicator will show the holiday/event information
            // No need to set error message since this is handled by the date status banner
            setError(null);
          } else {
            setError(null);
          }
        } else {
          console.log('No existing attendance found - resetting to unmarked');
          // For previous dates with no attendance data, this is normal - not an error
          const selectedDateObj = new Date(selectedDate);

          // If it's a holiday/event but no attendance, keep the status message
          if (
            !dateStatusResult.isHoliday &&
            !dateStatusResult.isEvent &&
            !dateStatusResult.isSaturday
          ) {
            setError(null);
          }

          // Reset all to unmarked - ready for attendance marking
          setStudents(prevStudents =>
            prevStudents.map(student => ({
              ...student,
              attendanceStatus: 'unmarked' as const,
            })),
          );

          // Log for debugging - this is normal behavior
          console.log(
            `Ready to mark attendance for ${selectedDateObj.toLocaleDateString()} - no existing data found`,
          );
        }

        setAttendanceLoaded(true);
      } catch (err) {
        console.error('Error loading existing attendance:', err);

        // Check if it's a 404 (no attendance data) - this is normal, not an error
        const error = err as Error;
        const errorMessage = error?.message || '';

        if (
          errorMessage.includes('404') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('Not Found')
        ) {
          // No attendance data exists for this date - this is normal
          console.log(
            'No attendance data exists for this date - ready to mark new attendance',
          );
          setError(null);

          // Reset students to unmarked state - ready for attendance marking
          setStudents(prevStudents =>
            prevStudents.map(student => ({
              ...student,
              attendanceStatus: 'unmarked' as const,
            })),
          );
        } else if (
          errorMessage.includes('date') ||
          errorMessage.includes('Date')
        ) {
          setError(
            'Unable to load attendance data for this date. You can still mark attendance.',
          );
        } else {
          setError(
            'Unable to load existing attendance. You can still mark new attendance.',
          );
        }

        setAttendanceLoaded(true);
      }
    },
    [selectedClass, selectedDate, students.length, attendanceLoaded],
  );

  // Load existing attendance when conditions are met
  useEffect(() => {
    if (!attendanceLoaded && students.length > 0) {
      loadExistingAttendance();
    }
  }, [loadExistingAttendance, attendanceLoaded, students.length]);

  if (!isOpen) return null;

  // Calculate attendance statistics
  const totalStudents = students.length;
  const presentCount = students.filter(
    s => s.attendanceStatus === 'present',
  ).length;
  const absentCount = students.filter(
    s => s.attendanceStatus === 'absent',
  ).length;
  const lateCount = students.filter(s => s.attendanceStatus === 'late').length;
  const excusedCount = students.filter(
    s => s.attendanceStatus === 'excused',
  ).length;
  const unmarkedCount = students.filter(
    s => s.attendanceStatus === 'unmarked',
  ).length;

  // Filter students based on search term
  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll.includes(searchTerm) ||
      student.studentId.includes(searchTerm),
  );

  const markAttendance = (
    studentId: string,
    status: Student['attendanceStatus'],
  ) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, attendanceStatus: status }
          : student,
      ),
    );
  };

  const markAllPresent = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, attendanceStatus: 'present' })),
    );
  };

  const markAllAbsent = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, attendanceStatus: 'absent' })),
    );
  };

  const resetAttendance = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, attendanceStatus: 'unmarked' })),
    );
  };

  // Save attendance function
  const handleSaveAttendance = async () => {
    if (!selectedClass) return;

    try {
      setIsSaving(true);
      setError(null);

      // FOR TEACHERS: Check if attendance already exists for today when restrictToToday is true
      if (restrictToToday) {
        const todayDate = new Date().toISOString().split('T')[0];
        if (selectedDate === todayDate) {
          try {
            const existingAttendance =
              await attendanceService.getClassAttendance(
                selectedClass.id,
                todayDate,
              );
            let existingRecords = existingAttendance;
            if (
              existingAttendance &&
              typeof existingAttendance === 'object' &&
              'data' in existingAttendance
            ) {
              existingRecords = existingAttendance.data;
            }

            if (Array.isArray(existingRecords) && existingRecords.length > 0) {
              setError(
                'Attendance has already been marked for today. You cannot mark attendance multiple times per day.',
              );
              setIsSaving(false);
              return;
            }
          } catch (checkError) {
            console.warn(
              'Could not check existing attendance, proceeding with save:',
              checkError,
            );
          }
        }
      }

      // Validate date is not in the future
      const attendanceDate = new Date(selectedDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (attendanceDate > today) {
        setError('Cannot mark attendance for future dates');
        return;
      }

      // Prepare attendance records
      const attendanceRecords: AttendanceRecord[] = students
        .filter(student => student.attendanceStatus !== 'unmarked')
        .map(student => ({
          studentId: student.id,
          status:
            student.attendanceStatus === 'present'
              ? 'PRESENT'
              : student.attendanceStatus === 'absent'
                ? 'ABSENT'
                : student.attendanceStatus === 'late'
                  ? 'LATE'
                  : 'EXCUSED',
          remarks: undefined, // Add remarks if needed
        }));

      if (attendanceRecords.length === 0) {
        setError('Please mark attendance for at least one student');
        return;
      }

      // Call the attendance API
      const response = await attendanceService.markAttendance({
        classId: selectedClass.id,
        date: selectedDate,
        sessionType: 'daily',
        students: attendanceRecords,
        notes: `Attendance marked for ${attendanceRecords.length} students`,
      });

      console.log('Full API response:', response);

      // Success if either HttpClient success is true OR backend success is true
      const isSuccess = response && response.success === true;

      if (isSuccess) {
        console.log('Attendance saved successfully:', response);

        // Force reload attendance data to show updated status
        setAttendanceLoaded(false);
        await loadExistingAttendance(true);

        // Call the success callback to refresh parent component data
        if (onSuccess) {
          onSuccess();
        }

        // Close modal after refresh
        onClose();
      } else {
        setError(response?.message || 'Failed to save attendance');
      }
    } catch (error: unknown) {
      console.error('Error saving attendance:', error);

      // Extract error message based on the error structure
      let errorMessage = 'Failed to save attendance. Please try again.';

      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (error && typeof error === 'object' && 'details' in error) {
        errorMessage = (error as { details: string }).details;
      } else if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as { statusCode: number }).statusCode;
        if (statusCode === 400) {
          errorMessage = 'Invalid request data. Please check your selections.';
        } else if (statusCode === 404) {
          errorMessage =
            'Class or students not found. Please refresh and try again.';
        } else if (statusCode === 401) {
          errorMessage =
            'You are not authorized to mark attendance. Please login again.';
        } else if (statusCode === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }

      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl p-0 relative border border-gray-200 my-8 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <Icon className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-5 h-5 text-blue-600'
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
            </Icon>
            <SectionTitle
              text='Mark Attendance'
              className='text-xl font-semibold text-gray-900'
            />
          </div>
          <button
            className='text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors'
            onClick={onClose}
            aria-label='Close'
          >
            &times;
          </button>
        </div>

        {/* Filters */}
        <div className='px-6 pt-4 pb-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label className='block text-sm font-medium text-gray-700 mb-2'>
                Date
              </Label>
              <div className='relative'>
                {restrictToToday ? (
                  // Teacher mode: Show locked today's date with mobile-friendly message
                  <div className='h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-between'>
                    <span className='text-gray-700 font-medium'>
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className='text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full'>
                      Today Only
                    </span>
                  </div>
                ) : (
                  // Admin mode: Show date picker
                  <Input
                    type='date'
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    className='h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    title='Select date for attendance (cannot be in the future)'
                  />
                )}
                {/* Date status indicator */}
                {selectedDate && !restrictToToday && (
                  <div className='mt-1'>
                    {new Date(selectedDate) > new Date() ? (
                      <p className='text-red-500 text-xs'>
                        ⚠️ Future dates are not allowed for attendance marking
                      </p>
                    ) : (
                      <p className='text-gray-500 text-xs'>
                        📅{' '}
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                )}
                {/* Teacher mode: Show restriction message */}
                {restrictToToday && (
                  <div className='mt-1'>
                    <p className='text-blue-600 text-xs flex items-center'>
                      🔒 Teachers can only mark today's attendance
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label className='block text-sm font-medium text-gray-700 mb-2'>
                Selected Class
              </Label>
              <div className='h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center text-sm font-medium text-gray-900'>
                {selectedClass
                  ? `${selectedClass.grade} - ${selectedClass.section}`
                  : 'No class selected'}
              </div>
            </div>
          </div>
        </div>

        {/* Date Status Indicator */}
        {dateStatus &&
          (dateStatus.isHoliday ||
            dateStatus.isEvent ||
            dateStatus.isSaturday) && (
            <div className='px-6 pb-4'>
              <div
                className={`rounded-lg p-4 border-l-4 ${
                  dateStatus.isSaturday
                    ? 'bg-blue-50 border-blue-500'
                    : dateStatus.isHoliday
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    {dateStatus.isSaturday ? (
                      <svg
                        className='h-5 w-5 text-blue-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z'
                          clipRule='evenodd'
                        />
                      </svg>
                    ) : dateStatus.isHoliday ? (
                      <svg
                        className='h-5 w-5 text-red-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z'
                          clipRule='evenodd'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='h-5 w-5 text-yellow-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                          clipRule='evenodd'
                        />
                      </svg>
                    )}
                  </div>
                  <div className='ml-3'>
                    <h3
                      className={`text-sm font-medium ${
                        dateStatus.isSaturday
                          ? 'text-blue-800'
                          : dateStatus.isHoliday
                            ? 'text-red-800'
                            : 'text-yellow-800'
                      }`}
                    >
                      {dateStatus.isSaturday
                        ? 'Weekend Day'
                        : dateStatus.isHoliday
                          ? 'Holiday'
                          : 'Event Day'}
                    </h3>
                    <div
                      className={`mt-1 text-sm ${
                        dateStatus.isSaturday
                          ? 'text-blue-700'
                          : dateStatus.isHoliday
                            ? 'text-red-700'
                            : 'text-yellow-700'
                      }`}
                    >
                      {dateStatus.isSaturday
                        ? `${new Date(selectedDate).toLocaleDateString()} is a Saturday (weekend)`
                        : dateStatus.eventDetails
                          ? `${dateStatus.eventDetails.title} - ${new Date(selectedDate).toLocaleDateString()}`
                          : `${new Date(selectedDate).toLocaleDateString()}`}

                      {/* Show existing attendance info if any */}
                      {(() => {
                        const attendedStudents = students.filter(
                          s =>
                            s.attendanceStatus &&
                            s.attendanceStatus !== 'unmarked',
                        );
                        if (attendedStudents.length > 0) {
                          return (
                            <div className='mt-1 text-xs opacity-80'>
                              Attendance marked for {attendedStudents.length}{' '}
                              student{attendedStudents.length > 1 ? 's' : ''}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Error Display */}
        {error &&
          !dateStatus?.isHoliday &&
          !dateStatus?.isEvent &&
          !dateStatus?.isSaturday && (
            <div className='px-6 pb-4'>
              <div
                className={`rounded-lg p-4 ${
                  error.includes('No attendance data found')
                    ? 'bg-blue-50 border border-blue-200 text-blue-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <div className='flex items-center'>
                  <Icon
                    className={`w-5 h-5 mr-2 ${
                      error.includes('No attendance data found')
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`}
                  >
                    {error.includes('No attendance data found') ? (
                      <svg
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                    ) : (
                      <svg
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                    )}
                  </Icon>
                  <p className='text-sm font-medium'>{error}</p>
                </div>
              </div>
            </div>
          )}

        {/* Status Information - Show when no errors and students are loaded */}
        {!error && !isLoading && students.length > 0 && (
          <div className='px-6 pb-4'>
            <div className='rounded-lg p-3 bg-green-50 border border-green-200'>
              <div className='flex items-center'>
                <Icon className='w-5 h-5 mr-2 text-green-600'>
                  <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </Icon>
                <p className='text-sm font-medium text-green-800'>
                  {attendanceLoaded && unmarkedCount === totalStudents
                    ? `Ready to mark attendance for ${new Date(selectedDate).toLocaleDateString()} (${totalStudents} students)`
                    : `Attendance loaded for ${new Date(selectedDate).toLocaleDateString()} - ${totalStudents - unmarkedCount} students marked`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Summary Cards */}
        <div className='px-6 pb-4'>
          <div className='grid grid-cols-2 md:grid-cols-6 gap-4'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {presentCount}
              </div>
              <div className='text-sm text-green-700 font-medium'>Present</div>
            </div>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {absentCount}
              </div>
              <div className='text-sm text-red-700 font-medium'>Absent</div>
            </div>
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {lateCount}
              </div>
              <div className='text-sm text-yellow-700 font-medium'>Late</div>
            </div>
            <div className='bg-purple-50 border border-purple-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {excusedCount}
              </div>
              <div className='text-sm text-purple-700 font-medium'>Excused</div>
            </div>
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-gray-600'>
                {unmarkedCount}
              </div>
              <div className='text-sm text-gray-700 font-medium'>Unmarked</div>
            </div>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {totalStudents}
              </div>
              <div className='text-sm text-blue-700 font-medium'>
                Total Students
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className='px-6 pb-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Icon className='h-5 w-5 text-gray-400'>
                  <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </Icon>
              </div>
              <Input
                type='text'
                placeholder='Search students...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              />
            </div>
            <div className='flex gap-2'>
              <Button
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
                label='Filter'
                onClick={() => {}}
              />
              <Button
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
                label='Mark All Present'
                onClick={markAllPresent}
              />
              <Button
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
                label='Mark All Absent'
                onClick={markAllAbsent}
              />
              <Button
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
                label='Reset'
                onClick={resetAttendance}
              />
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className='px-6 pb-4'>
          <div className='bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto'>
            {isLoading ? (
              <div className='space-y-3'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className='animate-pulse bg-white rounded-lg p-4 border border-gray-200'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <div className='w-10 h-10 bg-gray-200 rounded-full'></div>
                        <div className='space-y-2'>
                          <div className='h-4 bg-gray-200 rounded w-32'></div>
                          <div className='h-3 bg-gray-200 rounded w-24'></div>
                        </div>
                      </div>
                      <div className='flex gap-1'>
                        <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                        <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                        <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                        <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className='text-center py-8'>
                <p className='text-red-600 mb-4'>{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                >
                  Retry
                </Button>
              </div>
            ) : students.length === 0 ? (
              <div className='text-center py-12'>
                <div className='mb-4'>
                  <svg
                    className='mx-auto h-12 w-12 text-gray-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No Students Enrolled
                </h3>
                <p className='text-gray-500 mb-1'>
                  No students are currently enrolled in {selectedClass?.grade} -{' '}
                  {selectedClass?.section}
                </p>
                <p className='text-sm text-gray-400'>
                  Please add students to this class before marking attendance.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    className='bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700'>
                        {student.initials}
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          {student.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          Roll: {student.roll} ID: {student.studentId}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='text-sm text-gray-500 mr-4'>
                        Status:{' '}
                        {student.attendanceStatus === 'unmarked'
                          ? 'Not marked'
                          : student.attendanceStatus}
                      </div>
                      <div className='flex gap-1'>
                        <button
                          onClick={() => markAttendance(student.id, 'present')}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                            student.attendanceStatus === 'present'
                              ? 'bg-green-100 text-green-600 border-green-300'
                              : 'bg-white text-gray-400 border-gray-300 hover:bg-green-50'
                          }`}
                          title='Present'
                        >
                          <Icon className='w-4 h-4'>
                            <svg
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M5 13l4 4L19 7'
                              />
                            </svg>
                          </Icon>
                        </button>
                        <button
                          onClick={() => markAttendance(student.id, 'absent')}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                            student.attendanceStatus === 'absent'
                              ? 'bg-red-100 text-red-600 border-red-300'
                              : 'bg-white text-gray-400 border-gray-300 hover:bg-red-50'
                          }`}
                          title='Absent'
                        >
                          <Icon className='w-4 h-4'>
                            <svg
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
                          </Icon>
                        </button>
                        <button
                          onClick={() => markAttendance(student.id, 'late')}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                            student.attendanceStatus === 'late'
                              ? 'bg-yellow-100 text-yellow-600 border-yellow-300'
                              : 'bg-white text-gray-400 border-gray-300 hover:bg-yellow-50'
                          }`}
                          title='Late'
                        >
                          <Icon className='w-4 h-4'>
                            <svg
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <circle cx='12' cy='12' r='10' />
                              <polyline points='12,6 12,12 16,14' />
                            </svg>
                          </Icon>
                        </button>
                        <button
                          onClick={() => markAttendance(student.id, 'excused')}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                            student.attendanceStatus === 'excused'
                              ? 'bg-purple-100 text-purple-600 border-purple-300'
                              : 'bg-white text-gray-400 border-gray-300 hover:bg-purple-50'
                          }`}
                          title='Excused'
                        >
                          <Icon className='w-4 h-4'>
                            <svg
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
                          </Icon>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress and Footer */}
        <div className='px-6 pb-6'>
          <div className='flex items-center justify-between mb-4'>
            <Label className='text-sm text-gray-600'>
              {totalStudents - unmarkedCount}/{totalStudents} marked
            </Label>
            <div className='w-32 bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${((totalStudents - unmarkedCount) / totalStudents) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className='flex justify-end gap-3'>
            <Button
              onClick={onClose}
              className='px-6 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
              label='Cancel'
            />
            <Button
              onClick={handleSaveAttendance}
              className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors ${
                isSaving || unmarkedCount === totalStudents
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              label={
                isSaving
                  ? 'Saving...'
                  : `Save Attendance (${unmarkedCount} remaining)`
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;
