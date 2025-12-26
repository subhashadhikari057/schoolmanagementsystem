'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import Input from '@/components/atoms/form-controls/Input';
import StatusBadge from '@/components/atoms/data/StatusBadge';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import MarkAttendanceModal from '@/components/organisms/modals/MarkAttendanceModal';
import StaffAttendanceModal from '@/components/organisms/modals/StaffAttendanceModal';
import WorkingDaysCounter from '@/components/organisms/attendance/WorkingDaysCounter';
import { classService, type ClassResponse } from '@/api/services/class.service';
import { attendanceService } from '@/api/services/attendance.service';
import { teacherAttendanceService } from '@/api/services/teacher-attendance.service';
import { staffAttendanceService } from '@/api/services/staff-attendance.service';
import { TeacherForAttendance } from '@/api/types/teacher-attendance';
import { StaffForAttendance } from '@/api/types/staff-attendance';
import {
  Search,
  Plus,
  Download,
  ClipboardCheck,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  UserCheck,
  UserCog,
  GraduationCap,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface ClassBlock {
  id: string;
  grade: string;
  section: string;
  students: number;
  present: number;
  absent: number;
  status: 'completed' | 'partial' | 'pending';
  classData?: ClassResponse; // Store original class data
}

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isStaffAttendanceOpen, setIsStaffAttendanceOpen] = useState(false);
  const [staffType, setStaffType] = useState<'teacher' | 'staff'>('teacher');
  const [selectedClass, setSelectedClass] = useState<ClassBlock | null>(null);

  // Data states
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<{
    date?: string;
    overall: {
      totalStudents: number;
      totalPresent: number;
      totalAbsent: number;
      totalLate?: number;
      totalExcused?: number;
      overallAttendanceRate: number;
      completedClasses?: number;
      pendingClasses?: number;
      partialClasses?: number;
    };
    classes: Array<{
      id: string;
      grade?: string;
      section?: string;
      totalStudents?: number;
      present: number;
      absent: number;
      late?: number;
      excused?: number;
      attendancePercentage?: number;
      status: string;
    }>;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key to trigger refresh
  const [teachers, setTeachers] = useState<TeacherForAttendance[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [staff, setStaff] = useState<StaffForAttendance[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [reportClassId, setReportClassId] = useState('');
  const [reportStartDate, setReportStartDate] = useState(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return start.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [reportSummary, setReportSummary] = useState<{
    classLabel: string;
    startDate: string;
    endDate: string;
    totalStudents: number;
    totalDays: number;
    attendanceRate: number;
    present: number;
    absent: number;
    status: string;
  } | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Fetch teacher attendance for a specific date
  const fetchTeacherAttendance = useCallback(
    async (targetDate = attendanceDate) => {
      try {
        setIsLoadingTeachers(true);
        const response =
          await teacherAttendanceService.getTeachersForAttendance(targetDate);

        if (response.success && response.data) {
          setTeachers(response.data);
        } else {
          console.error('Failed to load teacher attendance:', response.message);
          setTeachers([]);
        }
      } catch (error) {
        console.error('Error fetching teacher attendance:', error);
        setTeachers([]);
      } finally {
        setIsLoadingTeachers(false);
      }
    },
    [attendanceDate],
  );

  // Fetch staff attendance for a specific date
  const fetchStaffAttendance = useCallback(
    async (targetDate = attendanceDate) => {
      try {
        setIsLoadingStaff(true);

        const response =
          await staffAttendanceService.getStaffForAttendance(targetDate);

        if (response.success && response.data) {
          setStaff(response.data);
        } else {
          console.error('Failed to load staff attendance:', response.message);
          setStaff([]);
        }
      } catch (error) {
        console.error('Error fetching staff attendance:', error);
        setStaff([]);
      } finally {
        setIsLoadingStaff(false);
      }
    },
    [attendanceDate],
  );

  // Fetch real class data and attendance statistics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const targetDate = attendanceDate;
        console.log('Fetching attendance stats for date:', targetDate);

        // Fetch classes and attendance stats in parallel
        const [classesResponse, attendanceStatsResponse] = await Promise.all([
          classService.getAllClasses(),
          attendanceService.getClassWiseAttendanceStats(targetDate),
        ]);

        // Also fetch teacher and staff attendance
        await Promise.all([
          fetchTeacherAttendance(targetDate),
          fetchStaffAttendance(targetDate),
        ]);

        console.log('Classes response:', classesResponse);
        console.log('Attendance stats response:', attendanceStatsResponse);

        if (classesResponse.success && classesResponse.data) {
          const attendanceStatsData =
            (attendanceStatsResponse as { data?: any })?.data ||
            attendanceStatsResponse;

          // Create a map of attendance data for quick lookup
          const attendanceMap = new Map();
          if (attendanceStatsData?.classes) {
            attendanceStatsData.classes.forEach((classStats: any) => {
              attendanceMap.set(classStats.id, classStats);
            });
          }

          // Transform real class data into ClassBlock format with attendance data
          const transformedClasses: ClassBlock[] = classesResponse.data.map(
            classData => {
              const attendanceData = attendanceMap.get(classData.id);

              return {
                id: classData.id,
                grade: `Grade ${classData.grade}`,
                section: classData.section,
                students: classData.currentEnrollment,
                present: attendanceData?.present || 0,
                absent: attendanceData?.absent || 0,
                status: attendanceData?.status || 'pending',
                classData, // Store original data for reference
              };
            },
          );

          // Keep class cards stable and ordered by grade/section
          const getGradeNumber = (block: ClassBlock) => {
            if (block.classData && typeof block.classData.grade === 'number') {
              return block.classData.grade;
            }
            const match = block.grade.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          };

          transformedClasses.sort((a, b) => {
            const gradeDiff = getGradeNumber(a) - getGradeNumber(b);
            if (gradeDiff !== 0) return gradeDiff;
            return a.section.localeCompare(b.section);
          });

          setClassBlocks(prev => {
            const prevMap = new Map(prev.map(item => [item.id, item]));
            return transformedClasses.map(tc => {
              const prevBlock = prevMap.get(tc.id);
              const hasStats = attendanceMap.has(tc.id);
              const attendanceData = attendanceMap.get(tc.id);
              const shouldKeepPrev =
                hasStats &&
                attendanceData &&
                attendanceData.present === 0 &&
                attendanceData.absent === 0 &&
                attendanceData.status === 'pending' &&
                prevBlock &&
                (prevBlock.present > 0 ||
                  prevBlock.absent > 0 ||
                  prevBlock.status !== 'pending');

              return {
                ...tc,
                present: shouldKeepPrev
                  ? (prevBlock?.present ?? tc.present)
                  : hasStats
                    ? tc.present
                    : (prevBlock?.present ?? tc.present),
                absent: shouldKeepPrev
                  ? (prevBlock?.absent ?? tc.absent)
                  : hasStats
                    ? tc.absent
                    : (prevBlock?.absent ?? tc.absent),
                status: shouldKeepPrev
                  ? (prevBlock?.status ?? tc.status)
                  : hasStats
                    ? tc.status
                    : (prevBlock?.status ?? tc.status),
              };
            });
          });
          setAttendanceStats(attendanceStatsData);
        } else {
          setError(classesResponse.message || 'Failed to fetch classes');
        }
      } catch (err) {
        setError('Error fetching data');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    attendanceDate,
    fetchStaffAttendance,
    fetchTeacherAttendance,
    refreshKey,
  ]); // Re-fetch when refreshKey or date changes

  // Function to refresh attendance data
  const refreshAttendanceData = useCallback(
    (force = false) => {
      // Don't refresh if modal is open unless forced
      if (!force && isMarkAttendanceOpen) {
        console.log('Refresh blocked - attendance modal is open');
        return;
      }
      console.log('Refreshing attendance data...');
      setRefreshKey(prev => prev + 1);
    },
    [isMarkAttendanceOpen],
  );

  // New simplified class-wise attendance report (live data + dummy export layout)
  const renderReportsTab = () => {
    const selected = classBlocks.find(cls => cls.id === reportClassId);
    const dummyExcelPath = '/attendance/attendance-report.xlsx'; // Place your Excel in frontend/public/attendance/

    const getDateRangeList = (start: string, end: string) => {
      const dates: string[] = [];
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        return dates;
      }
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };

    const handleGenerate = async () => {
      if (!selected) {
        setReportSummary(null);
        return;
      }

      setIsGeneratingReport(true);

      try {
        const datesInRange = getDateRangeList(reportStartDate, reportEndDate);

        let presentCount = 0;
        let absentCount = 0;

        if (datesInRange.length === 0) {
          presentCount = selected.present;
          absentCount = selected.absent;
        } else {
          for (const date of datesInRange) {
            try {
              const attendanceForDay =
                await attendanceService.getClassAttendance(
                  selected.id,
                  date,
                  'daily',
                );
              const dayRecords =
                (attendanceForDay as any)?.records ||
                (attendanceForDay as any)?.data?.records ||
                [];

              dayRecords.forEach((record: any) => {
                switch (record.status) {
                  case 'PRESENT':
                  case 'LATE':
                  case 'EXCUSED':
                    presentCount += 1;
                    break;
                  case 'ABSENT':
                    absentCount += 1;
                    break;
                  default:
                    break;
                }
              });
            } catch (err) {
              console.warn(
                `Failed to fetch attendance for ${date} - skipping`,
                err,
              );
            }
          }
        }

        const totalDays = Math.max(datesInRange.length, 1);
        const totalPossibleMarks = selected.students * totalDays;
        const attendanceRate = totalPossibleMarks
          ? Math.round((presentCount / totalPossibleMarks) * 100)
          : 0;
        const status =
          presentCount + absentCount >= totalPossibleMarks
            ? 'completed'
            : presentCount + absentCount > 0
              ? 'partial'
              : selected.status;

        setReportSummary({
          classLabel: `${selected.grade} - Section ${selected.section}`,
          startDate: reportStartDate,
          endDate: reportEndDate,
          totalStudents: selected.students,
          totalDays,
          attendanceRate,
          present: presentCount,
          absent: absentCount,
          status,
        });
      } finally {
        setIsGeneratingReport(false);
      }
    };

    const exportDummyReport = () => {
      const link = document.createElement('a');
      link.href = dummyExcelPath;
      link.setAttribute('download', 'attendance-report.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className='space-y-6'>
        <Card className='bg-white shadow-sm border-0 rounded-xl'>
          <div className='p-6 space-y-4'>
            <SectionTitle
              text='Class-wise Attendance Report'
              level={3}
              className='text-lg font-semibold text-gray-900'
            />
            <Label className='text-sm text-gray-600'>
              Select a class/section to view attendance.
            </Label>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label className='text-sm text-gray-700'>Class & Section</Label>
                <select
                  value={reportClassId}
                  onChange={e => setReportClassId(e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500'
                >
                  <option value=''>Select class</option>
                  {classBlocks.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.grade} - Section {cls.section} ({cls.students}{' '}
                      students)
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm text-gray-700'>Date Range</Label>
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    type='date'
                    value={reportStartDate}
                    onChange={e => setReportStartDate(e.target.value)}
                  />
                  <Input
                    type='date'
                    value={reportEndDate}
                    min={reportStartDate}
                    onChange={e => setReportEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className='flex items-end gap-2'>
                <Button
                  className='w-full bg-primary hover:bg-primary/90 text-white'
                  onClick={handleGenerate}
                  disabled={!reportClassId || isGeneratingReport}
                >
                  <FileText className='w-4 h-4 mr-2' />
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  className='w-full'
                  onClick={exportDummyReport}
                >
                  <Download className='w-4 h-4 mr-2' />
                  Download Excel
                </Button>
              </div>
            </div>

            {reportSummary ? (
              <Card className='border border-gray-200 shadow-none'>
                <div className='p-4 space-y-3'>
                  <div className='flex flex-wrap gap-3 items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-500'>Class</p>
                      <p className='text-lg font-semibold text-gray-900'>
                        {reportSummary.classLabel}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Date Range</p>
                      <p className='text-lg font-semibold text-gray-900'>
                        {reportSummary.startDate} → {reportSummary.endDate}
                      </p>
                    </div>
                    <StatusBadge status={reportSummary.status} />
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='p-3 rounded-lg bg-blue-50 border border-blue-100'>
                      <p className='text-xs text-blue-600'>Total Students</p>
                      <p className='text-xl font-bold text-blue-900'>
                        {reportSummary.totalStudents}
                      </p>
                    </div>
                    <div className='p-3 rounded-lg bg-green-50 border border-green-100'>
                      <p className='text-xs text-green-600'>Present</p>
                      <p className='text-xl font-bold text-green-900'>
                        {reportSummary.present}
                      </p>
                    </div>
                    <div className='p-3 rounded-lg bg-red-50 border border-red-100'>
                      <p className='text-xs text-red-600'>Absent</p>
                      <p className='text-xl font-bold text-red-900'>
                        {reportSummary.absent}
                      </p>
                    </div>
                    <div className='p-3 rounded-lg bg-purple-50 border border-purple-100'>
                      <p className='text-xs text-purple-600'>Attendance Rate</p>
                      <p className='text-xl font-bold text-purple-900'>
                        {`${reportSummary.attendanceRate}%`}
                      </p>
                    </div>
                  </div>

                  <div className='text-sm text-gray-600'>
                    Report data above is pulled live from class attendance.
                  </div>
                </div>
              </Card>
            ) : (
              <div className='text-sm text-gray-500'>
                Select a class and click Generate to view the live summary.
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  // Function to handle successful attendance marking
  const handleAttendanceSuccess = useCallback(
    (
      payload?:
        | {
            type: 'class';
            classId: string;
            date: string;
            present: number;
            absent: number;
            total: number;
            status: 'completed' | 'partial' | 'pending';
          }
        | {
            type: 'staff';
            staffType: 'teacher' | 'staff';
            date: string;
            present: number;
            absent: number;
            late: number;
            excused: number;
            total: number;
            records: Array<{ id: string; status: string }>;
          },
    ) => {
      console.log('Attendance marked successfully - forcing refresh');

      if (payload?.date) {
        setAttendanceDate(payload.date);
        setReportStartDate(payload.date);
        setReportEndDate(payload.date);
      }

      if (payload?.type === 'class') {
        // Optimistically update the class card counts/status so UI reflects immediately
        setClassBlocks(prev => {
          const updated = prev.map(block =>
            block.id === payload.classId
              ? {
                  ...block,
                  present: payload.present,
                  absent: payload.absent,
                  students: payload.total || block.students,
                  status: payload.status || block.status,
                }
              : block,
          );

          // Recalculate stats immediately so the header cards update
          const totalStudents = updated.reduce(
            (sum, block) => sum + block.students,
            0,
          );
          const totalPresent = updated.reduce(
            (sum, block) => sum + block.present,
            0,
          );
          const totalAbsent = updated.reduce(
            (sum, block) => sum + block.absent,
            0,
          );
          const completedClasses = updated.filter(
            block => block.status === 'completed',
          ).length;
          const partialClasses = updated.filter(
            block => block.status === 'partial',
          ).length;
          const pendingClasses = updated.filter(
            block => block.status === 'pending',
          ).length;

          const overallAttendanceRate = totalStudents
            ? Math.round((totalPresent / totalStudents) * 100)
            : 0;

          setAttendanceStats(prev => ({
            date: payload.date || attendanceDate,
            classes: updated.map(block => ({
              id: block.id,
              grade: block.grade,
              section: block.section,
              totalStudents: block.students,
              present: block.present,
              absent: block.absent,
              late: prev?.classes?.find(c => c.id === block.id)?.late ?? 0,
              excused:
                prev?.classes?.find(c => c.id === block.id)?.excused ?? 0,
              attendancePercentage:
                block.students > 0
                  ? Math.round((block.present / block.students) * 100)
                  : 0,
              status: block.status as 'completed' | 'partial' | 'pending',
            })),
            overall: {
              totalStudents,
              totalPresent,
              totalAbsent,
              totalLate: prev?.overall?.totalLate ?? 0,
              totalExcused: prev?.overall?.totalExcused ?? 0,
              overallAttendanceRate,
              completedClasses,
              pendingClasses,
              partialClasses,
            },
          }));

          return updated;
        });
      }

      if (payload?.type === 'staff') {
        if (payload.staffType === 'teacher') {
          setTeachers(prev =>
            prev.map(teacher => {
              const match = payload.records.find(r => r.id === teacher.id);
              return match
                ? {
                    ...teacher,
                    status: match.status as any,
                    lastAttendance: payload.date,
                  }
                : teacher;
            }),
          );
        } else {
          setStaff(prev =>
            prev.map(member => {
              const match = payload.records.find(r => r.id === member.id);
              return match
                ? {
                    ...member,
                    status: match.status as any,
                    lastAttendance: payload.date,
                  }
                : member;
            }),
          );
        }
      }

      refreshAttendanceData(true); // Force refresh after successful attendance marking
      fetchTeacherAttendance(payload?.date); // Refresh teacher attendance data
      fetchStaffAttendance(payload?.date); // Refresh staff attendance data
    },
    [fetchStaffAttendance, fetchTeacherAttendance, refreshAttendanceData],
  );

  // Auto-refresh data every 30 seconds to keep it current (paused when modal is open)
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't auto-refresh when attendance modal is open
      if (!isMarkAttendanceOpen) {
        console.log('Auto-refreshing attendance data...');
        refreshAttendanceData();
      } else {
        console.log('Auto-refresh paused - attendance modal is open');
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isMarkAttendanceOpen, refreshAttendanceData]); // Re-create interval when modal state or refresh function changes

  // Refresh data when window gains focus (user returns to tab) - paused when modal is open
  useEffect(() => {
    const handleFocus = () => {
      // Don't refresh on focus when attendance modal is open
      if (!isMarkAttendanceOpen) {
        console.log('Window focused - refreshing attendance data...');
        refreshAttendanceData();
      } else {
        console.log('Focus refresh paused - attendance modal is open');
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isMarkAttendanceOpen, refreshAttendanceData]); // Re-create listener when modal state or refresh function changes

  // Calculate overall attendance rate
  const calculateOverallRate = () => {
    const totalStudents = classBlocks.reduce(
      (sum, block) => sum + block.students,
      0,
    );
    const totalPresent = classBlocks.reduce(
      (sum, block) => sum + block.present,
      0,
    );
    return totalStudents > 0
      ? Math.round((totalPresent / totalStudents) * 100)
      : 0;
  };

  const stats = [
    {
      title: 'Student Present',
      value:
        attendanceStats?.overall?.totalPresent?.toString() ||
        classBlocks.reduce((sum, block) => sum + block.present, 0).toString(),
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Student Absent',
      value:
        attendanceStats?.overall?.totalAbsent?.toString() ||
        classBlocks.reduce((sum, block) => sum + block.absent, 0).toString(),
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      title: 'Staff Present',
      value: (
        teachers.filter(t => t.status === 'PRESENT').length +
        staff.filter(s => s.status === 'PRESENT').length
      ).toString(),
      icon: UserCheck,
      color: 'bg-blue-500',
    },
    {
      title: 'Overall Rate',
      value: `${attendanceStats?.overall?.overallAttendanceRate || calculateOverallRate()}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleClassClick = (classBlock: ClassBlock) => {
    setSelectedClass(classBlock);
    setIsMarkAttendanceOpen(true);
  };

  const handleStaffAttendance = (type: 'teacher' | 'staff') => {
    setStaffType(type);
    setIsStaffAttendanceOpen(true);
  };

  const filteredClasses = classBlocks.filter(
    block =>
      block.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.section.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ...existing code...

  // ...existing code...

  // Place tabItems after all renderTab functions

  const renderDailyTab = () => (
    <div className='space-y-4 sm:space-y-6'>
      <Card className='bg-white shadow-sm border-0 rounded-xl'>
        <div className='p-4 sm:p-6 border-b border-gray-200'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <SectionTitle
                text='Class-wise Attendance'
                level={3}
                className='text-lg font-semibold text-gray-900'
              />
              <Label className='text-sm text-gray-600'>
                Click on any class to mark or view attendance
              </Label>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    placeholder='Search classes...'
                    className='pl-10 w-64'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  onClick={refreshAttendanceData}
                  className={`border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
                {isMarkAttendanceOpen && (
                  <div className='flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded'>
                    <div className='w-2 h-2 bg-amber-500 rounded-full mr-1'></div>
                    Auto-refresh paused
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='p-4 sm:p-6'>
          {isLoading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {Array.from({ length: 8 }).map((_, index) => (
                <Card
                  key={index}
                  className='p-4 animate-pulse border border-gray-200'
                >
                  <div className='space-y-3'>
                    <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                    <div className='space-y-2'>
                      <div className='h-3 bg-gray-200 rounded'></div>
                      <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                      <div className='h-3 bg-gray-200 rounded w-2/3'></div>
                    </div>
                    <div className='h-8 bg-gray-200 rounded'></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <p className='text-red-600 text-lg mb-2'>Error loading classes</p>
              <p className='text-gray-500'>{error}</p>
            </div>
          ) : classBlocks.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-500 text-lg'>No classes found</p>
              <p className='text-sm text-gray-400'>
                Classes will appear here once they are created
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {filteredClasses.map(classBlock => (
                <Card
                  key={classBlock.id}
                  className='p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-blue-300'
                  onClick={() => handleClassClick(classBlock)}
                >
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <SectionTitle
                        text={`${classBlock.grade} - ${classBlock.section}`}
                        level={4}
                        className='font-semibold text-gray-900'
                      />
                      <StatusBadge
                        status={classBlock.status}
                        className={getStatusColor(classBlock.status)}
                      />
                    </div>

                    <div className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>Total Students:</span>
                        <span className='font-medium'>
                          {classBlock.students}
                        </span>
                      </div>

                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-green-600'>Present:</span>
                        <span className='font-medium text-green-700'>
                          {classBlock.present}
                        </span>
                      </div>

                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-red-600'>Absent:</span>
                        <span className='font-medium text-red-700'>
                          {classBlock.absent}
                        </span>
                      </div>

                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-500'>Status:</span>
                        <span className='text-xs text-gray-600'>
                          {classBlock.status === 'pending'
                            ? 'Not started'
                            : classBlock.status === 'partial'
                              ? 'In progress'
                              : 'Completed'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className='space-y-1'>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-green-500 h-2 rounded-full transition-all'
                          style={{
                            width:
                              classBlock.students > 0
                                ? `${(classBlock.present / classBlock.students) * 100}%`
                                : '0%',
                          }}
                        />
                      </div>
                      <div className='text-xs text-gray-500 text-center'>
                        {classBlock.students > 0
                          ? `${Math.round((classBlock.present / classBlock.students) * 100)}% Present`
                          : 'No data'}
                      </div>
                    </div>

                    <Button
                      className='w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2'
                      onClick={() => handleClassClick(classBlock)}
                    >
                      <ClipboardCheck className='w-4 h-4' />
                      <span>Mark Attendance</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderStaffTab = () => (
    <div className='space-y-4 sm:space-y-6'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
        {/* Teachers Section */}
        <Card className='bg-white shadow-sm border-0 rounded-xl'>
          <div className='p-4 sm:p-6 border-b border-gray-200'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <GraduationCap className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <SectionTitle
                    text='Teachers'
                    level={3}
                    className='text-lg font-semibold text-gray-900'
                  />
                  <Label className='text-sm text-gray-600'>
                    {teachers.length} total teachers
                  </Label>
                </div>
              </div>
              <Button
                className='bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm'
                onClick={() => handleStaffAttendance('teacher')}
              >
                <Plus className='w-4 h-4 mr-2' />
                Mark Attendance
              </Button>
            </div>
          </div>

          <div className='p-4 sm:p-6'>
            {isLoadingTeachers ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-center'>
                  <RefreshCw className='w-6 h-6 animate-spin mx-auto mb-2 text-gray-400' />
                  <p className='text-sm text-gray-500'>
                    Loading teacher attendance...
                  </p>
                </div>
              </div>
            ) : teachers.length === 0 ? (
              <div className='text-center py-8'>
                <UserCheck className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                <p className='text-gray-500 mb-2'>
                  No attendance marked for today
                </p>
                <p className='text-sm text-gray-400'>
                  Teacher attendance has not been recorded yet.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {teachers.map(teacher => {
                  const getStatusColor = (status?: string) => {
                    switch (status) {
                      case 'PRESENT':
                        return 'bg-green-100 border-green-200 text-green-800';
                      case 'ABSENT':
                        return 'bg-red-100 border-red-200 text-red-800';
                      case 'LATE':
                        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
                      case 'EXCUSED':
                        return 'bg-purple-100 border-purple-200 text-purple-800';
                      default:
                        return 'bg-gray-100 border-gray-200 text-gray-600';
                    }
                  };

                  const getStatusText = (status?: string) => {
                    switch (status) {
                      case 'PRESENT':
                        return 'Present';
                      case 'ABSENT':
                        return 'Absent';
                      case 'LATE':
                        return 'Late';
                      case 'EXCUSED':
                        return 'Excused';
                      default:
                        return 'No Attendance';
                    }
                  };

                  return (
                    <div
                      key={teacher.id}
                      className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${getStatusColor(teacher.status)} text-center`}
                    >
                      {/* Avatar */}
                      <div className='flex justify-center mb-3'>
                        <div className='w-16 h-16 bg-white/50 rounded-full flex items-center justify-center border'>
                          <span className='text-lg font-bold'>
                            {teacher.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Name and Info */}
                      <div className='mb-4'>
                        <h4
                          className='font-semibold text-sm leading-tight mb-1'
                          title={teacher.name}
                        >
                          {teacher.name}
                        </h4>
                        <p
                          className='text-xs opacity-75 mb-1'
                          title={teacher.department || 'No Department'}
                        >
                          {teacher.department || 'No Department'}
                        </p>
                        <p
                          className='text-xs opacity-75'
                          title={teacher.designation}
                        >
                          {teacher.designation}
                        </p>
                      </div>

                      {/* Status */}
                      <div className='mb-3'>
                        <span className='inline-block px-3 py-1 text-xs font-medium rounded-full bg-white/40 border border-current'>
                          {getStatusText(teacher.status)}
                        </span>
                      </div>

                      {/* Last Attendance Date */}
                      {teacher.lastAttendance && (
                        <div className='text-xs opacity-75 bg-white/20 px-2 py-1 rounded'>
                          Last:{' '}
                          {new Date(
                            teacher.lastAttendance,
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Staff Section */}
        <Card className='bg-white shadow-sm border-0 rounded-xl'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <UserCog className='w-5 h-5 text-purple-600' />
                </div>
                <div>
                  <SectionTitle
                    text='Support Staff'
                    level={3}
                    className='text-lg font-semibold text-gray-900'
                  />
                  <Label className='text-sm text-gray-600'>
                    {staff.length} total staff
                  </Label>
                </div>
              </div>
              <Button
                className='bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm'
                onClick={() => handleStaffAttendance('staff')}
              >
                <Plus className='w-4 h-4 mr-2' />
                Mark Attendance
              </Button>
            </div>
          </div>

          <div className='p-6'>
            {isLoadingStaff ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-center'>
                  <RefreshCw className='w-6 h-6 animate-spin mx-auto mb-2 text-gray-400' />
                  <p className='text-sm text-gray-500'>
                    Loading staff attendance...
                  </p>
                </div>
              </div>
            ) : staff.length === 0 ? (
              <div className='text-center py-8'>
                <UserCog className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                <p className='text-gray-500 mb-2'>
                  No attendance marked for today
                </p>
                <p className='text-sm text-gray-400'>
                  Staff attendance has not been recorded yet.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {staff.map(staffMember => {
                  const getStatusColor = (status?: string) => {
                    switch (status) {
                      case 'PRESENT':
                        return 'bg-green-100 border-green-200 text-green-800';
                      case 'ABSENT':
                        return 'bg-red-100 border-red-200 text-red-800';
                      case 'LATE':
                        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
                      case 'EXCUSED':
                        return 'bg-purple-100 border-purple-200 text-purple-800';
                      default:
                        return 'bg-gray-100 border-gray-200 text-gray-600';
                    }
                  };

                  const getStatusText = (status?: string) => {
                    switch (status) {
                      case 'PRESENT':
                        return 'Present';
                      case 'ABSENT':
                        return 'Absent';
                      case 'LATE':
                        return 'Late';
                      case 'EXCUSED':
                        return 'Excused';
                      default:
                        return 'No Attendance';
                    }
                  };

                  return (
                    <div
                      key={staffMember.id}
                      className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${getStatusColor(staffMember.status)} text-center`}
                    >
                      {/* Avatar */}
                      <div className='flex justify-center mb-3'>
                        <div className='w-16 h-16 bg-white/50 rounded-full flex items-center justify-center border relative'>
                          <span className='text-lg font-bold'>
                            {staffMember.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                          {/* User account indicator */}
                          {staffMember.hasUserAccount && (
                            <div className='absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center'>
                              <span className='text-xs text-white'>🔑</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Name and Info */}
                      <div className='mb-4'>
                        <h4
                          className='font-semibold text-sm leading-tight mb-1'
                          title={staffMember.name}
                        >
                          {staffMember.name}
                        </h4>
                        <p
                          className='text-xs opacity-75 mb-1'
                          title={staffMember.department || 'No Department'}
                        >
                          {staffMember.department || 'No Department'}
                        </p>
                        <p
                          className='text-xs opacity-75'
                          title={staffMember.designation || 'No Designation'}
                        >
                          {staffMember.designation || 'No Designation'}
                        </p>
                        {!staffMember.hasUserAccount && (
                          <p className='text-xs text-blue-600 font-medium mt-1'>
                            No Login Access
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <div className='mb-3'>
                        <span className='inline-block px-3 py-1 text-xs font-medium rounded-full bg-white/40 border border-current'>
                          {getStatusText(staffMember.status)}
                        </span>
                      </div>

                      {/* Last Attendance Date */}
                      {staffMember.lastAttendance && (
                        <div className='text-xs opacity-75 bg-white/20 px-2 py-1 rounded'>
                          Last:{' '}
                          {new Date(
                            staffMember.lastAttendance,
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  // Place tabItems just before return so it's in scope
  const tabItems = [
    {
      name: 'Daily Attendance',
      content: renderDailyTab(),
    },
    {
      name: 'Staff Attendance',
      content: renderStaffTab(),
    },
    {
      name: 'Attendance Reports',
      content: renderReportsTab(),
    },
  ];

  return (
    <div className='p-3 sm:p-6 space-y-6 w-full'>
      {/* Header with Working Days Counter */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <SectionTitle
            text='Attendance Management'
            level={2}
            className='text-2xl font-bold text-gray-900'
          />
          <Label className='text-gray-600'>
            Manage daily attendance for students and staff
          </Label>
        </div>
        <div className='flex items-center gap-4'>
          <WorkingDaysCounter />
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Calendar className='h-4 w-4' />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={`p-6 bg-white shadow-sm border-0 rounded-xl transition-opacity ${isLoading ? 'opacity-75' : ''}`}
          >
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <Label className='text-sm font-medium text-gray-600 mb-1'>
                  {stat.title}
                </Label>
                <div className='flex items-center space-x-2'>
                  <SectionTitle
                    text={stat.value}
                    level={3}
                    className='text-2xl font-semibold text-gray-900'
                  />
                  {isLoading && (
                    <div className='w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin'></div>
                  )}
                </div>
              </div>
              <div
                className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
              >
                <stat.icon className='w-6 h-6 text-white' />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <div className='space-y-6'>
        <Tabs tabs={tabItems} defaultIndex={0} className='w-full' />
      </div>

      {/* Modals */}
      <MarkAttendanceModal
        isOpen={isMarkAttendanceOpen}
        onClose={() => setIsMarkAttendanceOpen(false)}
        onSuccess={handleAttendanceSuccess}
        selectedClass={
          selectedClass
            ? {
                id: selectedClass.id,
                grade: selectedClass.grade,
                section: selectedClass.section,
                students: selectedClass.students,
              }
            : undefined
        }
      />
      <StaffAttendanceModal
        isOpen={isStaffAttendanceOpen}
        onClose={() => setIsStaffAttendanceOpen(false)}
        onSuccess={handleAttendanceSuccess}
        staffType={staffType}
      />
    </div>
  );
}
