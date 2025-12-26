'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import {
  Calendar,
  Download,
  FileText,
  GraduationCap,
  User,
  Loader2,
  Search,
  X,
  UserCog,
  BarChart3,
} from 'lucide-react';
import {
  AttendanceService,
  StudentAttendanceResponse,
} from '@/api/services/attendance.service';
import { TeacherAttendanceService } from '@/api/services/teacher-attendance.service';
import { TeacherAttendanceResponse } from '@/api/types/teacher-attendance';
import { StaffAttendanceService } from '@/api/services/staff-attendance.service';
import { StaffAttendanceResponse } from '@/api/types/staff-attendance';
import { httpClient } from '@/api/client';
import { debounce } from 'lodash';

interface Person {
  id: string;
  name: string;
  rollNumber?: string;
  employeeId?: string;
  class?: string;
  department?: string;
  email?: string;
  avatar?: string;
}

// Initialize attendance service
const attendanceService = new AttendanceService();
const teacherAttendanceService = new TeacherAttendanceService();
const staffAttendanceService = new StaffAttendanceService();

export default function AttendanceReports() {
  // Report data states
  const [studentReportData, setStudentReportData] = useState({
    personId: '',
    personName: '',
    rollNumber: '',
    class: '',
    fromDate: '',
    toDate: '',
  });

  const [teacherReportData, setTeacherReportData] = useState({
    personId: '',
    personName: '',
    employeeId: '',
    department: '',
    fromDate: '',
    toDate: '',
  });

  const [staffReportData, setStaffReportData] = useState({
    personId: '',
    personName: '',
    employeeId: '',
    department: '',
    fromDate: '',
    toDate: '',
  });

  // Search states
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');

  const [studentSuggestions, setStudentSuggestions] = useState<Person[]>([]);
  const [teacherSuggestions, setTeacherSuggestions] = useState<Person[]>([]);
  const [staffSuggestions, setStaffSuggestions] = useState<Person[]>([]);

  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);
  const [showTeacherSuggestions, setShowTeacherSuggestions] = useState(false);
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false);

  // Loading states
  const [isGeneratingStudent, setIsGeneratingStudent] = useState(false);
  const [isGeneratingTeacher] = useState(false);
  const [isGeneratingStaff] = useState(false);

  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [isSearchingTeacher, setIsSearchingTeacher] = useState(false);
  const [isSearchingStaff, setIsSearchingStaff] = useState(false);

  // Result state
  const [studentReportResult, setStudentReportResult] =
    useState<StudentAttendanceResponse | null>(null);
  const [teacherReportResult, setTeacherReportResult] =
    useState<TeacherAttendanceResponse | null>(null);
  const [staffReportResult, setStaffReportResult] =
    useState<StaffAttendanceResponse | null>(null);

  // Stats data
  const generatedCount =
    (studentReportResult ? 1 : 0) +
    (teacherReportResult ? 1 : 0) +
    (staffReportResult ? 1 : 0);
  const reportStats = [
    {
      icon: FileText,
      bgColor: 'bg-blue-500',
      iconColor: 'text-white',
      value: '3',
      label: 'Report Types',
      change: '',
      isPositive: true,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-green-500',
      iconColor: 'text-white',
      value: `${generatedCount}`,
      label: 'Generated Today',
      change: '',
      isPositive: true,
    },
    {
      icon: Download,
      bgColor: 'bg-purple-500',
      iconColor: 'text-white',
      value: `${generatedCount}`,
      label: 'Downloads',
      change: '',
      isPositive: true,
    },
    {
      icon: BarChart3,
      bgColor: 'bg-orange-500',
      iconColor: 'text-white',
      value: '100%',
      label: 'Success Rate',
      change: '',
      isPositive: true,
    },
  ];

  // Generic search function
  const createSearchFunction = (
    type: 'student' | 'teacher' | 'staff',
    setSuggestions: React.Dispatch<React.SetStateAction<Person[]>>,
    setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>,
    setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    return debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await httpClient.get<{
          persons: Array<{
            id: string;
            name: string;
            rollNumber?: string;
            employeeId?: string;
            info?: string;
            email?: string;
            avatar?: string;
          }>;
        }>(
          `/api/id-card-generation/search-persons?type=${type}&search=${encodeURIComponent(searchTerm)}&limit=10`,
          undefined,
          { requiresAuth: true },
        );

        const persons: Person[] = response.data.persons.map(
          (person: {
            id: string;
            name: string;
            rollNumber?: string;
            employeeId?: string;
            info?: string;
            email?: string;
            avatar?: string;
          }) => ({
            id: person.id,
            name: person.name,
            rollNumber: person.rollNumber,
            employeeId: person.employeeId,
            class: person.info,
            department: person.info,
            email: person.email,
            avatar: person.avatar,
          }),
        );

        setSuggestions(persons);
        setShowSuggestions(true);
      } catch (error) {
        console.error(`Error searching ${type}s:`, error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Debounced search functions
  const debouncedStudentSearch = useCallback(
    createSearchFunction(
      'student',
      setStudentSuggestions,
      setShowStudentSuggestions,
      setIsSearchingStudent,
    ),
    [],
  );

  const debouncedTeacherSearch = useCallback(
    createSearchFunction(
      'teacher',
      setTeacherSuggestions,
      setShowTeacherSuggestions,
      setIsSearchingTeacher,
    ),
    [],
  );

  const debouncedStaffSearch = useCallback(
    createSearchFunction(
      'staff',
      setStaffSuggestions,
      setShowStaffSuggestions,
      setIsSearchingStaff,
    ),
    [],
  );

  // Handle search input changes
  const handleStudentSearchChange = (value: string) => {
    setStudentSearchTerm(value);
    debouncedStudentSearch(value);
  };

  const handleTeacherSearchChange = (value: string) => {
    setTeacherSearchTerm(value);
    debouncedTeacherSearch(value);
  };

  const handleStaffSearchChange = (value: string) => {
    setStaffSearchTerm(value);
    debouncedStaffSearch(value);
  };

  // Handle person selections
  const handleStudentSelect = (person: Person) => {
    setStudentReportData(prev => ({
      ...prev,
      personId: person.id,
      personName: person.name,
      rollNumber: person.rollNumber || 'N/A',
      class: person.class || 'No Class',
    }));
    setStudentSearchTerm(person.name);
    setShowStudentSuggestions(false);
  };

  const handleTeacherSelect = (person: Person) => {
    setTeacherReportData(prev => ({
      ...prev,
      personId: person.id,
      personName: person.name,
      employeeId: person.employeeId || 'N/A',
      department: person.department || 'No Department',
    }));
    setTeacherSearchTerm(person.name);
    setShowTeacherSuggestions(false);
  };

  const handleStaffSelect = (person: Person) => {
    setStaffReportData(prev => ({
      ...prev,
      personId: person.id,
      personName: person.name,
      employeeId: person.employeeId || 'N/A',
      department: person.department || 'No Department',
    }));
    setStaffSearchTerm(person.name);
    setShowStaffSuggestions(false);
  };

  // Generate reports
  const generateStudentReport = async () => {
    if (
      !studentReportData.personId ||
      !studentReportData.fromDate ||
      !studentReportData.toDate
    ) {
      alert('Please fill all required fields for student report');
      return;
    }

    setIsGeneratingStudent(true);
    try {
      const attendanceData = await attendanceService.getStudentAttendance(
        studentReportData.personId,
        {
          startDate: studentReportData.fromDate,
          endDate: studentReportData.toDate,
          page: 1,
          limit: 1000,
        },
      );

      setStudentReportResult(attendanceData);

      // Build CSV for download
      const headers = ['Date', 'Status', 'Session Type', 'Remarks'];
      const csvRows = attendanceData.records.map(record =>
        [
          `="${record.date}"`,
          record.status,
          record.sessionType,
          record.remarks || '',
        ].join(','),
      );
      const stats = attendanceData.stats || (attendanceData as any).statistics;
      const summaryRows = [
        [],
        ['Summary'],
        [
          'Total Days',
          stats?.totalWorkingDays ?? '',
          'Present',
          stats?.presentDays ?? '',
        ],
        ['Absent', stats?.absentDays ?? '', 'Late', stats?.lateDays ?? ''],
        [
          'Excused',
          stats?.excusedDays ?? '',
          'Attendance %',
          stats?.attendancePercentage ?? '',
        ],
      ].map(row => row.join(','));

      const csvContent = [headers.join(','), ...csvRows, ...summaryRows].join(
        '\n',
      );
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-attendance-${studentReportData.personName.replace(/\s+/g, '-')}-${studentReportData.fromDate}-to-${studentReportData.toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Student attendance report generated, downloaded, and displayed.');
    } catch (error) {
      console.error('Error generating student report:', error);
    } finally {
      setIsGeneratingStudent(false);
    }
  };

  const generateTeacherReport = async () => {
    if (
      !teacherReportData.personId ||
      !teacherReportData.fromDate ||
      !teacherReportData.toDate
    )
      return;

    setTeacherReportResult(null);
    try {
      const res = await teacherAttendanceService.getTeacherAttendance(
        String(teacherReportData.personId),
        {
          startDate: teacherReportData.fromDate,
          endDate: teacherReportData.toDate,
          page: 1,
          limit: 1000,
        },
      );
      const data = ((res as any).data ?? res) as TeacherAttendanceResponse;
      setTeacherReportResult(data);
      // CSV
      const stats = data.stats;
      const headers = ['Date', 'Status', 'Session Type', 'Remarks'];
      const rows = data.records.map(
        (r: TeacherAttendanceResponse['records'][number]) =>
          [`="${r.date}"`, r.status, r.sessionType, r.remarks || ''].join(','),
      );
      const summary = [
        [],
        ['Summary'],
        ['Total Days', stats.totalWorkingDays, 'Present', stats.presentDays],
        ['Absent', stats.absentDays, 'Late', stats.lateDays],
        [
          'Excused',
          stats.excusedDays,
          'Attendance %',
          stats.attendancePercentage,
        ],
      ].map(r => r.join(','));
      const csv = [headers.join(','), ...rows, ...summary].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teacher-attendance-${teacherReportData.personName.replace(/\s+/g, '-')}-${teacherReportData.fromDate}-to-${teacherReportData.toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating teacher report:', error);
    }
  };

  const generateStaffReport = async () => {
    if (
      !staffReportData.personId ||
      !staffReportData.fromDate ||
      !staffReportData.toDate
    )
      return;

    setStaffReportResult(null);
    try {
      const res = await staffAttendanceService.getStaffAttendance(
        String(staffReportData.personId),
        {
          startDate: staffReportData.fromDate,
          endDate: staffReportData.toDate,
          page: '1',
          limit: '1000',
        },
      );
      const data = ((res as any).data ?? res) as StaffAttendanceResponse;
      setStaffReportResult(data);
      const stats = data.stats;
      const headers = ['Date', 'Status', 'Session Type', 'Remarks'];
      const rows = data.records.map(
        (r: StaffAttendanceResponse['records'][number]) =>
          [`="${r.date}"`, r.status, r.sessionType, r.remarks || ''].join(','),
      );
      const summary = [
        [],
        ['Summary'],
        ['Total Days', stats.totalWorkingDays, 'Present', stats.presentDays],
        ['Absent', stats.absentDays, 'Late', stats.lateDays],
        [
          'Excused',
          stats.excusedDays,
          'Attendance %',
          stats.attendancePercentage,
        ],
      ].map(r => r.join(','));
      const csv = [headers.join(','), ...rows, ...summary].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `staff-attendance-${staffReportData.personName.replace(/\s+/g, '-')}-${staffReportData.fromDate}-to-${staffReportData.toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating staff report:', error);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='pt-3'>
        <div className='w-full'>
          <h1 className='text-xl font-bold text-gray-900'>
            Attendance Reports
          </h1>
          <p className='text-sm text-gray-600 mt-1'>
            Generate individual attendance reports for students, teachers, and
            staff
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='mt-3'>
        <div className='w-full'>
          <Statsgrid stats={reportStats} />
        </div>
      </div>

      {/* Main Content - Tabs */}
      <div className='mt-4 mb-6'>
        <div className='w-full'>
          <GenericTabs
            tabs={[
              {
                name: 'Student Reports',
                content: (
                  <Card className='shadow border border-blue-100 bg-white'>
                    <CardContent className='space-y-8 pt-6'>
                      {/* Quick Stats Bar */}
                      <div className='flex flex-wrap gap-3 mb-2'>
                        <span className='bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shadow'>
                          Student
                        </span>
                        {studentReportData.personName && (
                          <span className='bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-xs font-semibold shadow'>
                            Selected: {studentReportData.personName}
                          </span>
                        )}
                        {studentReportData.class && (
                          <span className='bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200'>
                            Class: {studentReportData.class}
                          </span>
                        )}
                      </div>
                      {/* Student Search */}
                      <div className='space-y-3'>
                        <Label className='text-sm font-semibold text-blue-700'>
                          Search Student
                        </Label>
                        <div className='relative'>
                          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                          {isSearchingStudent && (
                            <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin' />
                          )}
                          <Input
                            placeholder='Search by name, roll number, or class...'
                            className='pl-10 pr-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                            value={studentSearchTerm}
                            onChange={e =>
                              handleStudentSearchChange(e.target.value)
                            }
                            onFocus={() =>
                              setShowStudentSuggestions(
                                studentSuggestions.length > 0,
                              )
                            }
                          />
                        </div>
                        {/* Search Suggestions */}
                        {showStudentSuggestions &&
                          studentSuggestions.length > 0 && (
                            <div className='absolute z-50 w-full bg-white border border-blue-200 rounded-xl shadow-lg max-h-60 overflow-y-auto mt-1'>
                              {studentSuggestions.map(person => (
                                <div
                                  key={person.id}
                                  className='p-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 flex items-center gap-3 transition-all duration-150'
                                  onClick={() => handleStudentSelect(person)}
                                >
                                  <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center'>
                                    <span className='text-white text-sm font-bold'>
                                      {person.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className='font-semibold text-blue-900'>
                                      {person.name}
                                    </p>
                                    <p className='text-xs text-blue-600'>
                                      Roll: {person.rollNumber} • {person.class}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        {/* Selected Student */}
                        {studentReportData.personName && (
                          <div className='p-3 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg border border-blue-200 flex items-center justify-between shadow'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center'>
                                <span className='text-white font-bold text-lg'>
                                  {studentReportData.personName
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className='font-semibold text-blue-900'>
                                  {studentReportData.personName}
                                </p>
                                <p className='text-xs text-blue-600'>
                                  Roll: {studentReportData.rollNumber} •{' '}
                                  {studentReportData.class}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='hover:bg-blue-200 rounded-full'
                              onClick={() => {
                                setStudentReportData({
                                  personId: '',
                                  personName: '',
                                  rollNumber: '',
                                  class: '',
                                  fromDate: studentReportData.fromDate,
                                  toDate: studentReportData.toDate,
                                });
                                setStudentSearchTerm('');
                                setShowStudentSuggestions(false);
                              }}
                            >
                              <X className='w-4 h-4 text-blue-700' />
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Date Range */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-blue-700'>
                            From Date
                          </Label>
                          <div className='relative'>
                            <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                            <Input
                              type='date'
                              className='pl-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                              value={studentReportData.fromDate}
                              onChange={e =>
                                setStudentReportData(prev => ({
                                  ...prev,
                                  fromDate: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-blue-700'>
                            To Date
                          </Label>
                          <div className='relative'>
                            <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                            <Input
                              type='date'
                              className='pl-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                              value={studentReportData.toDate}
                              onChange={e =>
                                setStudentReportData(prev => ({
                                  ...prev,
                                  toDate: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      {/* Generate Button */}
                      <Button
                        onClick={generateStudentReport}
                        disabled={
                          isGeneratingStudent ||
                          !studentReportData.personId ||
                          !studentReportData.fromDate ||
                          !studentReportData.toDate
                        }
                        className='w-full mt-4 bg-blue-500 text-white font-bold shadow-lg border-2 border-blue-600 hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 rounded-2xl py-4 text-lg transition-all duration-150 outline-none'
                      >
                        {isGeneratingStudent ? (
                          <>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />{' '}
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <Download className='w-4 h-4 mr-2' /> Generate &
                            Download Report
                          </>
                        )}
                      </Button>
                      {studentReportResult && (
                        <div className='mt-6 space-y-4'>
                          <div className='p-4 rounded-xl border border-blue-100 bg-blue-50/60 shadow-sm'>
                            <h4 className='font-semibold text-blue-900 mb-2'>
                              Report Summary
                            </h4>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-blue-800'>
                              <div>
                                <p className='text-xs text-blue-600'>
                                  Total Days
                                </p>
                                <p className='font-semibold'>
                                  {studentReportResult.stats
                                    ?.totalWorkingDays ??
                                    (studentReportResult as any).statistics
                                      ?.totalWorkingDays ??
                                    0}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-blue-600'>Present</p>
                                <p className='font-semibold'>
                                  {studentReportResult.stats?.presentDays ??
                                    (studentReportResult as any).statistics
                                      ?.presentDays ??
                                    0}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-blue-600'>Absent</p>
                                <p className='font-semibold'>
                                  {studentReportResult.stats?.absentDays ??
                                    (studentReportResult as any).statistics
                                      ?.absentDays ??
                                    0}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-blue-600'>
                                  Attendance %
                                </p>
                                <p className='font-semibold'>
                                  {studentReportResult.stats
                                    ?.attendancePercentage ??
                                    (studentReportResult as any).statistics
                                      ?.attendancePercentage ??
                                    0}
                                  %
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className='border rounded-xl border-blue-100 shadow-sm overflow-hidden'>
                            <div className='bg-blue-50 px-4 py-2 border-b border-blue-100'>
                              <h5 className='font-semibold text-blue-900 text-sm'>
                                Attendance Records
                              </h5>
                              <p className='text-xs text-blue-600'>
                                {studentReportResult.records.length} records
                                from {studentReportData.fromDate} to{' '}
                                {studentReportData.toDate}
                              </p>
                            </div>
                            <div className='max-h-80 overflow-y-auto'>
                              <table className='min-w-full text-sm'>
                                <thead className='bg-blue-50 text-blue-800 uppercase text-xs'>
                                  <tr>
                                    <th className='px-4 py-2 text-left'>
                                      Date
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Status
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Session
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Remarks
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {studentReportResult.records.map(record => (
                                    <tr
                                      key={`${record.date}-${record.sessionType}`}
                                      className='border-b border-blue-50'
                                    >
                                      <td className='px-4 py-2'>
                                        {record.date}
                                      </td>
                                      <td className='px-4 py-2'>
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            record.status === 'PRESENT'
                                              ? 'bg-green-100 text-green-800'
                                              : record.status === 'ABSENT'
                                                ? 'bg-red-100 text-red-800'
                                                : record.status === 'LATE'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-gray-100 text-gray-800'
                                          }`}
                                        >
                                          {record.status}
                                        </span>
                                      </td>
                                      <td className='px-4 py-2'>
                                        {record.sessionType}
                                      </td>
                                      <td className='px-4 py-2'>
                                        {record.remarks || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ),
              },
              {
                name: 'Teacher Reports',
                content: (
                  <Card className='shadow border border-blue-100 bg-white'>
                    <CardContent className='space-y-8 pt-6'>
                      {/* Quick Stats Bar */}
                      <div className='flex flex-wrap gap-3 mb-2'>
                        <span className='bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold shadow'>
                          Teacher
                        </span>
                        {teacherReportData.personName && (
                          <span className='bg-green-200 text-green-900 px-3 py-1 rounded-full text-xs font-semibold shadow'>
                            Selected: {teacherReportData.personName}
                          </span>
                        )}
                        {teacherReportData.department && (
                          <span className='bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold border border-green-200'>
                            Dept: {teacherReportData.department}
                          </span>
                        )}
                      </div>
                      {/* Teacher Search */}
                      <div className='space-y-3'>
                        <Label className='text-sm font-semibold text-blue-700'>
                          Search Teacher
                        </Label>
                        <div className='relative'>
                          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                          {isSearchingTeacher && (
                            <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin' />
                          )}
                          <Input
                            placeholder='Search by name, employee ID, or department...'
                            className='pl-10 pr-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                            value={teacherSearchTerm}
                            onChange={e =>
                              handleTeacherSearchChange(e.target.value)
                            }
                            onFocus={() =>
                              setShowTeacherSuggestions(
                                teacherSuggestions.length > 0,
                              )
                            }
                          />
                        </div>
                        {/* Search Suggestions */}
                        {showTeacherSuggestions &&
                          teacherSuggestions.length > 0 && (
                            <div className='absolute z-50 w-full bg-white border border-green-200 rounded-xl shadow-lg max-h-60 overflow-y-auto mt-1'>
                              {teacherSuggestions.map(person => (
                                <div
                                  key={person.id}
                                  className='p-3 hover:bg-green-50 cursor-pointer border-b border-green-100 last:border-b-0 flex items-center gap-3 transition-all duration-150'
                                  onClick={() => handleTeacherSelect(person)}
                                >
                                  <div className='w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center'>
                                    <span className='text-white text-sm font-bold'>
                                      {person.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className='font-semibold text-green-900'>
                                      {person.name}
                                    </p>
                                    <p className='text-xs text-green-600'>
                                      ID: {person.employeeId} •{' '}
                                      {person.department}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        {/* Selected Teacher */}
                        {teacherReportData.personName && (
                          <div className='p-3 bg-gradient-to-r from-green-100 to-green-50 rounded-lg border border-green-200 flex items-center justify-between shadow'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center'>
                                <span className='text-white font-bold text-lg'>
                                  {teacherReportData.personName
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className='font-semibold text-green-900'>
                                  {teacherReportData.personName}
                                </p>
                                <p className='text-xs text-green-600'>
                                  ID: {teacherReportData.employeeId} •{' '}
                                  {teacherReportData.department}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='hover:bg-green-200 rounded-full'
                              onClick={() => {
                                setTeacherReportData({
                                  personId: '',
                                  personName: '',
                                  employeeId: '',
                                  department: '',
                                  fromDate: teacherReportData.fromDate,
                                  toDate: teacherReportData.toDate,
                                });
                                setTeacherSearchTerm('');
                                setShowTeacherSuggestions(false);
                              }}
                            >
                              <X className='w-4 h-4 text-green-700' />
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Date Range */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-blue-700'>
                            From Date
                          </Label>
                          <div className='relative'>
                            <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                            <Input
                              type='date'
                              className='pl-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                              value={teacherReportData.fromDate}
                              onChange={e =>
                                setTeacherReportData(prev => ({
                                  ...prev,
                                  fromDate: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-blue-700'>
                            To Date
                          </Label>
                          <div className='relative'>
                            <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                            <Input
                              type='date'
                              className='pl-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                              value={teacherReportData.toDate}
                              onChange={e =>
                                setTeacherReportData(prev => ({
                                  ...prev,
                                  toDate: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      {/* Generate Button */}
                      <Button
                        onClick={generateTeacherReport}
                        disabled={
                          isGeneratingTeacher ||
                          !teacherReportData.personId ||
                          !teacherReportData.fromDate ||
                          !teacherReportData.toDate
                        }
                        className='w-full mt-4 bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 rounded-xl py-3 text-base transition-all duration-150'
                      >
                        {isGeneratingTeacher ? (
                          <>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />{' '}
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <Download className='w-4 h-4 mr-2' /> Generate &
                            Download Report
                          </>
                        )}
                      </Button>
                      {teacherReportResult && (
                        <div className='mt-6 space-y-4'>
                          <div className='p-4 rounded-xl border border-green-100 bg-green-50/60 shadow-sm'>
                            <h4 className='font-semibold text-green-900 mb-2'>
                              Report Summary
                            </h4>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-green-800'>
                              <div>
                                <p className='text-xs text-green-600'>
                                  Total Days
                                </p>
                                <p className='font-semibold'>
                                  {teacherReportResult.stats.totalWorkingDays}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-green-600'>
                                  Present
                                </p>
                                <p className='font-semibold'>
                                  {teacherReportResult.stats.presentDays}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-green-600'>Absent</p>
                                <p className='font-semibold'>
                                  {teacherReportResult.stats.absentDays}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-green-600'>
                                  Attendance %
                                </p>
                                <p className='font-semibold'>
                                  {
                                    teacherReportResult.stats
                                      .attendancePercentage
                                  }
                                  %
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className='border rounded-xl border-green-100 shadow-sm overflow-hidden'>
                            <div className='bg-green-50 px-4 py-2 border-b border-green-100'>
                              <h5 className='font-semibold text-green-900 text-sm'>
                                Attendance Records
                              </h5>
                              <p className='text-xs text-green-600'>
                                {teacherReportResult.records.length} records
                                from {teacherReportData.fromDate} to{' '}
                                {teacherReportData.toDate}
                              </p>
                            </div>
                            <div className='max-h-80 overflow-y-auto'>
                              <table className='min-w-full text-sm'>
                                <thead className='bg-green-50 text-green-800 uppercase text-xs'>
                                  <tr>
                                    <th className='px-4 py-2 text-left'>
                                      Date
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Status
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Session
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Remarks
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {teacherReportResult.records.map(record => (
                                    <tr
                                      key={`${record.date}-${record.sessionType}`}
                                      className='border-b border-green-50'
                                    >
                                      <td className='px-4 py-2'>
                                        {record.date}
                                      </td>
                                      <td className='px-4 py-2'>
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            record.status === 'PRESENT'
                                              ? 'bg-green-100 text-green-800'
                                              : record.status === 'ABSENT'
                                                ? 'bg-red-100 text-red-800'
                                                : record.status === 'LATE'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-gray-100 text-gray-800'
                                          }`}
                                        >
                                          {record.status}
                                        </span>
                                      </td>
                                      <td className='px-4 py-2'>
                                        {record.sessionType}
                                      </td>
                                      <td className='px-4 py-2'>
                                        {record.remarks || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ),
              },
              {
                name: 'Staff Reports',
                content: (
                  <Card className='shadow border border-blue-100 bg-white'>
                    <CardContent className='space-y-8 pt-6'>
                      {/* Quick Stats Bar */}
                      <div className='flex flex-wrap gap-3 mb-2'>
                        <span className='bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold shadow'>
                          Staff
                        </span>
                        {staffReportData.personName && (
                          <span className='bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-xs font-semibold shadow'>
                            Selected: {staffReportData.personName}
                          </span>
                        )}
                        {staffReportData.department && (
                          <span className='bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-semibold border border-purple-200'>
                            Dept: {staffReportData.department}
                          </span>
                        )}
                      </div>
                      {/* Staff Search */}
                      <div className='space-y-3'>
                        <Label className='text-sm font-semibold text-blue-700'>
                          Search Staff Member
                        </Label>
                        <div className='relative'>
                          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                          {isSearchingStaff && (
                            <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin' />
                          )}
                          <Input
                            placeholder='Search by name, employee ID, or department...'
                            className='pl-10 pr-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                            value={staffSearchTerm}
                            onChange={e =>
                              handleStaffSearchChange(e.target.value)
                            }
                            onFocus={() =>
                              setShowStaffSuggestions(
                                staffSuggestions.length > 0,
                              )
                            }
                          />
                        </div>
                        {/* Search Suggestions */}
                        {showStaffSuggestions &&
                          staffSuggestions.length > 0 && (
                            <div className='absolute z-50 w-full bg-white border border-purple-200 rounded-xl shadow-lg max-h-60 overflow-y-auto mt-1'>
                              {staffSuggestions.map(person => (
                                <div
                                  key={person.id}
                                  className='p-3 hover:bg-purple-50 cursor-pointer border-b border-purple-100 last:border-b-0 flex items-center gap-3 transition-all duration-150'
                                  onClick={() => handleStaffSelect(person)}
                                >
                                  <div className='w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center'>
                                    <span className='text-white text-sm font-bold'>
                                      {person.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className='font-semibold text-purple-900'>
                                      {person.name}
                                    </p>
                                    <p className='text-xs text-purple-600'>
                                      ID: {person.employeeId} •{' '}
                                      {person.department}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        {/* Selected Staff */}
                        {staffReportData.personName && (
                          <div className='p-3 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg border border-purple-200 flex items-center justify-between shadow'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center'>
                                <span className='text-white font-bold text-lg'>
                                  {staffReportData.personName
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className='font-semibold text-purple-900'>
                                  {staffReportData.personName}
                                </p>
                                <p className='text-xs text-purple-600'>
                                  ID: {staffReportData.employeeId} •{' '}
                                  {staffReportData.department}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='hover:bg-purple-200 rounded-full'
                              onClick={() => {
                                setStaffReportData({
                                  personId: '',
                                  personName: '',
                                  employeeId: '',
                                  department: '',
                                  fromDate: staffReportData.fromDate,
                                  toDate: staffReportData.toDate,
                                });
                                setStaffSearchTerm('');
                                setShowStaffSuggestions(false);
                              }}
                            >
                              <X className='w-4 h-4 text-purple-700' />
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Date Range */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-blue-700'>
                            From Date
                          </Label>
                          <div className='relative'>
                            <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                            <Input
                              type='date'
                              className='pl-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                              value={staffReportData.fromDate}
                              onChange={e =>
                                setStaffReportData(prev => ({
                                  ...prev,
                                  fromDate: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-blue-700'>
                            To Date
                          </Label>
                          <div className='relative'>
                            <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300' />
                            <Input
                              type='date'
                              className='pl-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-blue-50/60 hover:bg-blue-100 transition-all duration-150 shadow-sm'
                              value={staffReportData.toDate}
                              onChange={e =>
                                setStaffReportData(prev => ({
                                  ...prev,
                                  toDate: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      {/* Generate Button */}
                      <Button
                        onClick={generateStaffReport}
                        disabled={
                          isGeneratingStaff ||
                          !staffReportData.personId ||
                          !staffReportData.fromDate ||
                          !staffReportData.toDate
                        }
                        className='w-full mt-4 bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 rounded-xl py-3 text-base transition-all duration-150'
                      >
                        {isGeneratingStaff ? (
                          <>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />{' '}
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <Download className='w-4 h-4 mr-2' /> Generate &
                            Download Report
                          </>
                        )}
                      </Button>
                      {staffReportResult && (
                        <div className='mt-6 space-y-4'>
                          <div className='p-4 rounded-xl border border-purple-100 bg-purple-50/60 shadow-sm'>
                            <h4 className='font-semibold text-purple-900 mb-2'>
                              Report Summary
                            </h4>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-purple-800'>
                              <div>
                                <p className='text-xs text-purple-600'>
                                  Total Days
                                </p>
                                <p className='font-semibold'>
                                  {staffReportResult.stats.totalWorkingDays}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-purple-600'>
                                  Present
                                </p>
                                <p className='font-semibold'>
                                  {staffReportResult.stats.presentDays}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-purple-600'>
                                  Absent
                                </p>
                                <p className='font-semibold'>
                                  {staffReportResult.stats.absentDays}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-purple-600'>
                                  Attendance %
                                </p>
                                <p className='font-semibold'>
                                  {staffReportResult.stats.attendancePercentage}
                                  %
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className='border rounded-xl border-purple-100 shadow-sm overflow-hidden'>
                            <div className='bg-purple-50 px-4 py-2 border-b border-purple-100'>
                              <h5 className='font-semibold text-purple-900 text-sm'>
                                Attendance Records
                              </h5>
                              <p className='text-xs text-purple-600'>
                                {staffReportResult.records.length} records from{' '}
                                {staffReportData.fromDate} to{' '}
                                {staffReportData.toDate}
                              </p>
                            </div>
                            <div className='max-h-80 overflow-y-auto'>
                              <table className='min-w-full text-sm'>
                                <thead className='bg-purple-50 text-purple-800 uppercase text-xs'>
                                  <tr>
                                    <th className='px-4 py-2 text-left'>
                                      Date
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Status
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Session
                                    </th>
                                    <th className='px-4 py-2 text-left'>
                                      Remarks
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {staffReportResult.records.map(record => (
                                    <tr
                                      key={`${record.date}-${record.sessionType}`}
                                      className='border-b border-purple-50'
                                    >
                                      <td className='px-4 py-2'>
                                        {record.date}
                                      </td>
                                      <td className='px-4 py-2'>
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            record.status === 'PRESENT'
                                              ? 'bg-green-100 text-green-800'
                                              : record.status === 'ABSENT'
                                                ? 'bg-red-100 text-red-800'
                                                : record.status === 'LATE'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-gray-100 text-gray-800'
                                          }`}
                                        >
                                          {record.status}
                                        </span>
                                      </td>
                                      <td className='px-4 py-2'>
                                        {record.sessionType}
                                      </td>
                                      <td className='px-4 py-2'>
                                        {record.remarks || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
