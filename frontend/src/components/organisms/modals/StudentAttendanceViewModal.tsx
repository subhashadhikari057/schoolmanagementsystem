'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Student } from '@/components/templates/listConfigurations';
import { attendanceService } from '@/api/services/attendance.service';
import { toast } from 'sonner';

interface StudentAttendanceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

interface AttendanceStats {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

interface AttendanceRecord {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  sessionType: string;
}

interface MonthlyAttendanceData {
  year: number;
  month: number;
  stats: AttendanceStats;
  records: AttendanceRecord[];
  monthName: string;
}

const StudentAttendanceViewModal: React.FC<StudentAttendanceViewModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceData | null>(
    null,
  );

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const fetchMonthlyAttendance = useCallback(
    async (year: number, month: number) => {
      if (!student?.id) return;

      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      setLoading(true);
      setError(null);

      try {
        // Fetch both stats and detailed records
        const [statsResponse, attendanceResponse] = await Promise.all([
          attendanceService.getStudentAttendanceStats(
            String(student.id),
            month,
            year,
          ),
          attendanceService.getStudentAttendance(String(student.id), {
            month,
            year,
            limit: 50,
          }),
        ]);

        setMonthlyData({
          year,
          month,
          stats: statsResponse,
          records: attendanceResponse.records || [],
          monthName: monthNames[month - 1],
        });
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data. Please try again.');
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    },
    [student],
  );

  // Fetch attendance data for current month
  useEffect(() => {
    if (isOpen && student && student.id) {
      fetchMonthlyAttendance(currentYear, currentMonth);
    }
  }, [isOpen, student, currentYear, currentMonth, fetchMonthlyAttendance]);

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className='h-4 w-4' />;
      case 'ABSENT':
        return <XCircle className='h-4 w-4' />;
      case 'LATE':
        return <Clock className='h-4 w-4' />;
      case 'EXCUSED':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-full sm:max-w-5xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Calendar className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
                Student Attendance Details
              </h2>
              <p className='text-gray-600 mt-1 text-sm sm:text-base'>
                {student?.name} - {student?.studentId || student?.rollNo}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                <p className='text-gray-600'>Loading attendance data...</p>
              </div>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <XCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
                <p className='text-red-600 font-medium mb-2'>
                  Error Loading Data
                </p>
                <p className='text-gray-600 mb-4'>{error}</p>
                <button
                  onClick={() =>
                    fetchMonthlyAttendance(currentYear, currentMonth)
                  }
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Month Navigation and Stats */}
              <div className='mb-6'>
                <div className='flex items-center justify-between mb-4'>
                  <button
                    onClick={handlePreviousMonth}
                    className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors'
                  >
                    <ChevronLeft className='h-5 w-5' />
                  </button>

                  <h3 className='text-lg font-semibold text-gray-800'>
                    {monthlyData?.monthName} {monthlyData?.year}
                  </h3>

                  <button
                    onClick={handleNextMonth}
                    className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors'
                  >
                    <ChevronRight className='h-5 w-5' />
                  </button>
                </div>

                {/* Attendance Statistics */}
                {monthlyData?.stats && (
                  <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
                    <div className='bg-gray-50 p-4 rounded-lg text-center'>
                      <div className='flex items-center justify-center mb-2'>
                        <Users className='h-5 w-5 text-gray-600' />
                      </div>
                      <div className='text-2xl font-bold text-gray-800'>
                        {monthlyData.stats.totalWorkingDays}
                      </div>
                      <div className='text-sm text-gray-600'>Working Days</div>
                    </div>

                    <div className='bg-green-50 p-4 rounded-lg text-center'>
                      <div className='flex items-center justify-center mb-2'>
                        <CheckCircle className='h-5 w-5 text-green-600' />
                      </div>
                      <div className='text-2xl font-bold text-green-800'>
                        {monthlyData.stats.presentDays}
                      </div>
                      <div className='text-sm text-green-600'>Present</div>
                    </div>

                    <div className='bg-red-50 p-4 rounded-lg text-center'>
                      <div className='flex items-center justify-center mb-2'>
                        <XCircle className='h-5 w-5 text-red-600' />
                      </div>
                      <div className='text-2xl font-bold text-red-800'>
                        {monthlyData.stats.absentDays}
                      </div>
                      <div className='text-sm text-red-600'>Absent</div>
                    </div>

                    <div className='bg-yellow-50 p-4 rounded-lg text-center'>
                      <div className='flex items-center justify-center mb-2'>
                        <Clock className='h-5 w-5 text-yellow-600' />
                      </div>
                      <div className='text-2xl font-bold text-yellow-800'>
                        {monthlyData.stats.lateDays}
                      </div>
                      <div className='text-sm text-yellow-600'>Late</div>
                    </div>

                    <div className='bg-blue-50 p-4 rounded-lg text-center'>
                      <div className='flex items-center justify-center mb-2'>
                        <TrendingUp className='h-5 w-5 text-blue-600' />
                      </div>
                      <div className='text-2xl font-bold text-blue-800'>
                        {monthlyData.stats.attendancePercentage}%
                      </div>
                      <div className='text-sm text-blue-600'>
                        Attendance Rate
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendance Records */}
              <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
                <div className='bg-gray-50 px-6 py-3 border-b border-gray-200'>
                  <h4 className='text-lg font-semibold text-gray-800'>
                    Daily Attendance Records
                  </h4>
                  <p className='text-sm text-gray-600 mt-1'>
                    {monthlyData?.records?.length || 0} records found
                  </p>
                </div>

                <div className='max-h-96 overflow-y-auto'>
                  {monthlyData?.records && monthlyData.records.length > 0 ? (
                    <div className='divide-y divide-gray-200'>
                      {monthlyData.records.map((record, index) => (
                        <div
                          key={`${record.date}-${index}`}
                          className='px-6 py-4 hover:bg-gray-50'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-4'>
                              <div className='text-sm font-medium text-gray-900'>
                                {formatDate(record.date)}
                              </div>
                              <div
                                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}
                              >
                                {getStatusIcon(record.status)}
                                <span>{record.status}</span>
                              </div>
                            </div>
                            <div className='text-right'>
                              <div className='text-sm text-gray-500'>
                                {record.sessionType}
                              </div>
                              <div className='text-xs text-gray-400'>
                                {formatDate(record.date)}
                              </div>
                            </div>
                          </div>
                          {record.remarks && (
                            <div className='mt-2 text-sm text-gray-600'>
                              <span className='font-medium'>Remarks:</span>{' '}
                              {record.remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='px-6 py-8 text-center'>
                      <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-500 font-medium mb-2'>
                        No attendance records found
                      </p>
                      <p className='text-gray-400 text-sm'>
                        No attendance has been marked for{' '}
                        {monthlyData?.monthName} {monthlyData?.year}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className='bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200'>
          <div className='flex justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceViewModal;
