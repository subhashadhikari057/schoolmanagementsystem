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
import AttendanceReportsModal from '@/components/organisms/modals/AttendanceReportsModal';
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
  GraduationCap,
  UserCog,
  BarChart3,
  FileText,
  Settings,
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
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Modal states
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isStaffAttendanceOpen, setIsStaffAttendanceOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [staffType, setStaffType] = useState<'teacher' | 'staff'>('teacher');
  const [selectedClass, setSelectedClass] = useState<ClassBlock | null>(null);

  // Data states
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<{
    overall: {
      totalStudents: number;
      totalPresent: number;
      totalAbsent: number;
      overallAttendanceRate: number;
    };
    classes: Array<{
      id: string;
      present: number;
      absent: number;
      status: string;
    }>;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key to trigger refresh
  const [teachers, setTeachers] = useState<TeacherForAttendance[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [staff, setStaff] = useState<StaffForAttendance[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Fetch today's teacher attendance
  const fetchTodaysTeacherAttendance = async () => {
    try {
      setIsLoadingTeachers(true);
      const today = new Date().toISOString().split('T')[0];

      const response =
        await teacherAttendanceService.getTeachersForAttendance(today);

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
  };

  // Fetch today's staff attendance
  const fetchTodaysStaffAttendance = async () => {
    try {
      setIsLoadingStaff(true);
      const today = new Date().toISOString().split('T')[0];

      const response =
        await staffAttendanceService.getStaffForAttendance(today);

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
  };

  // Fetch real class data and attendance statistics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        console.log('Fetching attendance stats for date:', today);

        // Fetch classes, attendance stats, and teacher attendance in parallel
        const [classesResponse, attendanceStatsResponse] = await Promise.all([
          classService.getAllClasses(),
          attendanceService.getClassWiseAttendanceStats(today), // Pass today's date
        ]);

        // Also fetch teacher and staff attendance
        fetchTodaysTeacherAttendance();
        fetchTodaysStaffAttendance();

        console.log('Classes response:', classesResponse);
        console.log('Attendance stats response:', attendanceStatsResponse);

        if (classesResponse.success && classesResponse.data) {
          // Create a map of attendance data for quick lookup
          const attendanceMap = new Map();
          if (attendanceStatsResponse?.classes) {
            attendanceStatsResponse.classes.forEach(classStats => {
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

          setClassBlocks(transformedClasses);
          setAttendanceStats(attendanceStatsResponse);
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
  }, [refreshKey]); // Re-fetch when refreshKey changes

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

  // Function to handle successful attendance marking
  const handleAttendanceSuccess = useCallback(() => {
    console.log('Attendance marked successfully - forcing refresh');
    refreshAttendanceData(true); // Force refresh after successful attendance marking
    fetchTodaysTeacherAttendance(); // Refresh teacher attendance data
    fetchTodaysStaffAttendance(); // Refresh staff attendance data
  }, [refreshAttendanceData]);

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
    <div className='space-y-6'>
      <Card className='bg-white shadow-sm border-0 rounded-xl'>
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
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

        <div className='p-6'>
          {isLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
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
    <div className='space-y-6'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Teachers Section */}
        <Card className='bg-white shadow-sm border-0 rounded-xl'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
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

          <div className='p-6'>
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

  const renderReportsTab = () => (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Student Attendance Reports */}
        <Card
          className='bg-white shadow-sm border-0 rounded-xl hover:shadow-md transition-all cursor-pointer'
          onClick={() => setIsReportsOpen(true)}
        >
          <div className='p-6'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <GraduationCap className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <SectionTitle
                  text='Student Reports'
                  level={3}
                  className='font-semibold text-gray-900'
                />
                <Label className='text-sm text-gray-600'>
                  Class-wise & individual reports
                </Label>
              </div>
            </div>
            <ul className='space-y-2 text-sm text-gray-600 mb-4'>
              <li>• Daily attendance summaries</li>
              <li>• Monthly class reports</li>
              <li>• Individual student tracking</li>
              <li>• Attendance trends</li>
            </ul>
            <Button className='w-full bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm'>
              <FileText className='w-4 h-4 mr-2' />
              Generate Reports
            </Button>
          </div>
        </Card>

        {/* Staff Attendance Reports */}
        <Card
          className='bg-white shadow-sm border-0 rounded-xl hover:shadow-md transition-all cursor-pointer'
          onClick={() => setIsReportsOpen(true)}
        >
          <div className='p-6'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                <UserCog className='w-6 h-6 text-purple-600' />
              </div>
              <div>
                <SectionTitle
                  text='Staff Reports'
                  level={3}
                  className='font-semibold text-gray-900'
                />
                <Label className='text-sm text-gray-600'>
                  Teacher & staff attendance
                </Label>
              </div>
            </div>
            <ul className='space-y-2 text-sm text-gray-600 mb-4'>
              <li>• Daily staff attendance</li>
              <li>• Department-wise reports</li>
              <li>• Late arrival tracking</li>
              <li>• Leave pattern analysis</li>
            </ul>
            <Button className='w-full bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm'>
              <FileText className='w-4 h-4 mr-2' />
              Generate Reports
            </Button>
          </div>
        </Card>

        {/* Analytics & Insights */}
        <Card
          className='bg-white shadow-sm border-0 rounded-xl hover:shadow-md transition-all cursor-pointer'
          onClick={() => setIsReportsOpen(true)}
        >
          <div className='p-6'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <BarChart3 className='w-6 h-6 text-green-600' />
              </div>
              <div>
                <SectionTitle
                  text='Analytics'
                  level={3}
                  className='font-semibold text-gray-900'
                />
                <Label className='text-sm text-gray-600'>
                  Insights & trends
                </Label>
              </div>
            </div>
            <ul className='space-y-2 text-sm text-gray-600 mb-4'>
              <li>• Attendance pattern analysis</li>
              <li>• Performance correlations</li>
              <li>• Predictive insights</li>
              <li>• Custom dashboards</li>
            </ul>
            <Button className='w-full bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm'>
              <BarChart3 className='w-4 h-4 mr-2' />
              View Analytics
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Report Actions */}
      <Card className='bg-white shadow-sm border-0 rounded-xl'>
        <div className='p-6'>
          <SectionTitle
            text='Quick Report Actions'
            level={3}
            className='text-lg font-semibold text-gray-900 mb-4'
          />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Button className='border border-gray-300 bg-white text-gray-700 h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50'>
              <Calendar className='w-6 h-6 text-blue-600' />
              <span className='text-sm'>Today's Summary</span>
            </Button>
            <Button className='border border-gray-300 bg-white text-gray-700 h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50'>
              <Download className='w-6 h-6 text-green-600' />
              <span className='text-sm'>Export CSV</span>
            </Button>
            <Button className='border border-gray-300 bg-white text-gray-700 h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50'>
              <FileText className='w-6 h-6 text-purple-600' />
              <span className='text-sm'>PDF Reports</span>
            </Button>
            <Button className='border border-gray-300 bg-white text-gray-700 h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50'>
              <Settings className='w-6 h-6 text-gray-600' />
              <span className='text-sm'>Configure</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTabIndex) {
      case 0:
        return renderDailyTab();
      case 1:
        return renderStaffTab();
      case 2:
        return renderReportsTab();
      default:
        return renderDailyTab();
    }
  };

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
    <div className='p-6 space-y-6 w-full'>
      {/* Header with Working Days Counter */}
      <div className='flex items-center justify-between'>
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
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
        <Tabs
          tabs={tabItems}
          defaultIndex={activeTabIndex}
          className='w-full'
        />
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
      <AttendanceReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
      />
    </div>
  );
}
