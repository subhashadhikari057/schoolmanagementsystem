'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { AttendanceService } from '@/api/services/attendance.service';
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

  // Stats data
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
      value: '0',
      label: 'Generated Today',
      change: '',
      isPositive: true,
    },
    {
      icon: Download,
      bgColor: 'bg-purple-500',
      iconColor: 'text-white',
      value: '0',
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

      const reportContent = `
STUDENT ATTENDANCE REPORT
========================

Student Information:
- Name: ${studentReportData.personName}
- Roll Number: ${studentReportData.rollNumber}
- Class: ${studentReportData.class}

Report Period: ${studentReportData.fromDate} to ${studentReportData.toDate}

Attendance Statistics:
- Total Days: ${(attendanceData as any).statistics?.totalDays || 0}
- Present Days: ${(attendanceData as any).statistics?.presentDays || 0}
- Absent Days: ${(attendanceData as any).statistics?.absentDays || 0}
- Attendance Percentage: ${(attendanceData as any).statistics?.attendancePercentage || 0}%

Generated on: ${new Date().toLocaleString()}
      `;

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-attendance-${studentReportData.personName.replace(/\s+/g, '-')}-${studentReportData.fromDate}-to-${studentReportData.toDate}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Student attendance report generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating student report:', error);
      alert('Error generating student report. Please try again.');
    } finally {
      setIsGeneratingStudent(false);
    }
  };

  const generateTeacherReport = async () => {
    alert('Teacher attendance reports will be available in a future update.');
  };

  const generateStaffReport = async () => {
    alert('Staff attendance reports will be available in a future update.');
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
          <Tabs defaultValue='student' className='w-full'>
            <TabsList className='grid w-full grid-cols-3 mb-6'>
              <TabsTrigger value='student' className='flex items-center gap-2'>
                <GraduationCap className='w-4 h-4' />
                Student Reports
              </TabsTrigger>
              <TabsTrigger value='teacher' className='flex items-center gap-2'>
                <User className='w-4 h-4' />
                Teacher Reports
              </TabsTrigger>
              <TabsTrigger value='staff' className='flex items-center gap-2'>
                <UserCog className='w-4 h-4' />
                Staff Reports
              </TabsTrigger>
            </TabsList>

            {/* Student Reports Tab */}
            <TabsContent value='student' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <GraduationCap className='w-5 h-5' />
                    Student Attendance Report
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Student Search */}
                  <div className='space-y-3'>
                    <Label className='text-sm font-medium text-gray-700'>
                      Search Student
                    </Label>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                      {isSearchingStudent && (
                        <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin' />
                      )}
                      <Input
                        placeholder='Search by name, roll number, or class...'
                        className='pl-10 pr-10'
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
                        <div className='absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                          {studentSuggestions.map(person => (
                            <div
                              key={person.id}
                              className='p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0'
                              onClick={() => handleStudentSelect(person)}
                            >
                              <div className='flex items-center space-x-3'>
                                <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                                  <span className='text-white text-sm font-semibold'>
                                    {person.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className='font-medium text-gray-900'>
                                    {person.name}
                                  </p>
                                  <p className='text-sm text-gray-600'>
                                    Roll: {person.rollNumber} • {person.class}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Selected Student */}
                    {studentReportData.personName && (
                      <div className='p-3 bg-blue-50 rounded-md border border-blue-200'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center'>
                              <span className='text-white font-semibold'>
                                {studentReportData.personName
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className='font-semibold text-gray-900'>
                                {studentReportData.personName}
                              </p>
                              <p className='text-sm text-gray-600'>
                                Roll: {studentReportData.rollNumber} •{' '}
                                {studentReportData.class}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
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
                            <X className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-gray-700'>
                        From Date
                      </Label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          type='date'
                          className='pl-10'
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
                      <Label className='text-sm font-medium text-gray-700'>
                        To Date
                      </Label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          type='date'
                          className='pl-10'
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
                    className='w-full'
                  >
                    {isGeneratingStudent ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className='w-4 h-4 mr-2' />
                        Generate & Download Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teacher Reports Tab */}
            <TabsContent value='teacher' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <User className='w-5 h-5' />
                    Teacher Attendance Report
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Teacher Search */}
                  <div className='space-y-3'>
                    <Label className='text-sm font-medium text-gray-700'>
                      Search Teacher
                    </Label>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                      {isSearchingTeacher && (
                        <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500 animate-spin' />
                      )}
                      <Input
                        placeholder='Search by name, employee ID, or department...'
                        className='pl-10 pr-10'
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
                        <div className='absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                          {teacherSuggestions.map(person => (
                            <div
                              key={person.id}
                              className='p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0'
                              onClick={() => handleTeacherSelect(person)}
                            >
                              <div className='flex items-center space-x-3'>
                                <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                                  <span className='text-white text-sm font-semibold'>
                                    {person.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className='font-medium text-gray-900'>
                                    {person.name}
                                  </p>
                                  <p className='text-sm text-gray-600'>
                                    ID: {person.employeeId} •{' '}
                                    {person.department}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Selected Teacher */}
                    {teacherReportData.personName && (
                      <div className='p-3 bg-green-50 rounded-md border border-green-200'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center'>
                              <span className='text-white font-semibold'>
                                {teacherReportData.personName
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className='font-semibold text-gray-900'>
                                {teacherReportData.personName}
                              </p>
                              <p className='text-sm text-gray-600'>
                                ID: {teacherReportData.employeeId} •{' '}
                                {teacherReportData.department}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
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
                            <X className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-gray-700'>
                        From Date
                      </Label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          type='date'
                          className='pl-10'
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
                      <Label className='text-sm font-medium text-gray-700'>
                        To Date
                      </Label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          type='date'
                          className='pl-10'
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
                    className='w-full'
                  >
                    {isGeneratingTeacher ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className='w-4 h-4 mr-2' />
                        Generate & Download Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff Reports Tab */}
            <TabsContent value='staff' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <UserCog className='w-5 h-5' />
                    Staff Attendance Report
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Staff Search */}
                  <div className='space-y-3'>
                    <Label className='text-sm font-medium text-gray-700'>
                      Search Staff Member
                    </Label>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                      {isSearchingStaff && (
                        <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin' />
                      )}
                      <Input
                        placeholder='Search by name, employee ID, or department...'
                        className='pl-10 pr-10'
                        value={staffSearchTerm}
                        onChange={e => handleStaffSearchChange(e.target.value)}
                        onFocus={() =>
                          setShowStaffSuggestions(staffSuggestions.length > 0)
                        }
                      />
                    </div>

                    {/* Search Suggestions */}
                    {showStaffSuggestions && staffSuggestions.length > 0 && (
                      <div className='absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                        {staffSuggestions.map(person => (
                          <div
                            key={person.id}
                            className='p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0'
                            onClick={() => handleStaffSelect(person)}
                          >
                            <div className='flex items-center space-x-3'>
                              <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center'>
                                <span className='text-white text-sm font-semibold'>
                                  {person.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className='font-medium text-gray-900'>
                                  {person.name}
                                </p>
                                <p className='text-sm text-gray-600'>
                                  ID: {person.employeeId} • {person.department}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Selected Staff */}
                    {staffReportData.personName && (
                      <div className='p-3 bg-purple-50 rounded-md border border-purple-200'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center'>
                              <span className='text-white font-semibold'>
                                {staffReportData.personName
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className='font-semibold text-gray-900'>
                                {staffReportData.personName}
                              </p>
                              <p className='text-sm text-gray-600'>
                                ID: {staffReportData.employeeId} •{' '}
                                {staffReportData.department}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
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
                            <X className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-gray-700'>
                        From Date
                      </Label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          type='date'
                          className='pl-10'
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
                      <Label className='text-sm font-medium text-gray-700'>
                        To Date
                      </Label>
                      <div className='relative'>
                        <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          type='date'
                          className='pl-10'
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
                    className='w-full'
                  >
                    {isGeneratingStaff ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className='w-4 h-4 mr-2' />
                        Generate & Download Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
