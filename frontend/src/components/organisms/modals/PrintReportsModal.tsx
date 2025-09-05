'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  FileText,
  Download,
  Search,
  User,
  Users,
  GraduationCap,
  BookOpen,
  Printer,
  Archive,
  Eye,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import { Card } from '@/components/ui/card';
import { gradingService } from '@/api/services/grading.service';
import { classService } from '@/api/services/class.service';
import { toast } from 'sonner';

interface Student {
  id: string;
  rollNumber: string;
  fullName: string;
  className: string;
}

interface Class {
  id: string;
  grade: number;
  section: string;
  totalStudents: number;
}

interface PrintReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExam: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  } | null;
  academicYear: string;
}

export default function PrintReportsModal({
  isOpen,
  onClose,
  selectedExam,
  academicYear,
}: PrintReportsModalProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'class'>('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load students from classes that have exam schedules (optimized for large databases)
  const loadStudents = useCallback(
    async (searchQuery?: string) => {
      if (!selectedExam) return;

      setIsLoading(true);
      try {
        console.log('🔍 Loading students with search term:', searchQuery);

        // If no search query, show only a sample of students to avoid performance issues
        if (!searchQuery?.trim()) {
          console.log('📋 No search term - loading limited sample of students');

          // Get first 2 classes only for initial display
          const classesResponse = await classService.getAllClasses();
          if (!classesResponse.success || !classesResponse.data) {
            throw new Error('Failed to load classes');
          }

          const sampleStudents: Student[] = [];
          let classesProcessed = 0;
          const maxClasses = 2; // Limit to first 2 classes for performance

          for (const classData of classesResponse.data) {
            if (classesProcessed >= maxClasses) break;

            try {
              const gradingData = await gradingService.getClassGradingData(
                classData.id,
                selectedExam.id,
              );

              if (
                gradingData.success &&
                gradingData.data &&
                gradingData.data.students.length > 0
              ) {
                // Take only first 10 students from each class
                const classStudents: Student[] = gradingData.data.students
                  .slice(0, 10)
                  .map(student => ({
                    id: student.id,
                    rollNumber: student.rollNumber,
                    fullName: student.user.fullName,
                    className: `${gradingData.data.class.grade}${gradingData.data.class.section}`,
                  }));

                sampleStudents.push(...classStudents);
                classesProcessed++;
              }
            } catch {
              console.log(
                `No exam data for class ${classData.grade}-${classData.section}`,
              );
            }
          }

          console.log('👥 Sample students loaded:', sampleStudents.length);
          setStudents(sampleStudents);
          return;
        }

        // For search queries, load from all classes but with filtering
        console.log('🔍 Search query provided - searching all students');
        const classesResponse = await classService.getAllClasses();
        if (!classesResponse.success || !classesResponse.data) {
          throw new Error('Failed to load classes');
        }

        const allStudents: Student[] = [];
        const searchLower = searchQuery.toLowerCase();

        // Get students from each class that has exam data
        for (const classData of classesResponse.data) {
          try {
            const gradingData = await gradingService.getClassGradingData(
              classData.id,
              selectedExam.id,
            );

            if (gradingData.success && gradingData.data) {
              // Filter students during loading for better performance
              const matchingStudents = gradingData.data.students
                .filter(
                  student =>
                    student.user.fullName.toLowerCase().includes(searchLower) ||
                    student.rollNumber.toLowerCase().includes(searchLower) ||
                    student.id.toLowerCase().includes(searchLower),
                )
                .map(student => ({
                  id: student.id,
                  rollNumber: student.rollNumber,
                  fullName: student.user.fullName,
                  className: `${gradingData.data.class.grade}${gradingData.data.class.section}`,
                }));

              allStudents.push(...matchingStudents);

              // Stop if we found enough matches (limit search results)
              if (allStudents.length >= 50) break;
            }
          } catch {
            console.log(
              `No exam data for class ${classData.grade}-${classData.section}`,
            );
          }
        }

        console.log('🔍 Search results:', allStudents.length);
        setStudents(allStudents);
      } catch (error) {
        console.error('💥 Error loading students:', error);
        toast.error(
          `Failed to load students: ${error instanceof Error ? error.message : 'Network error'}`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [selectedExam],
  );

  // Debounced search for students
  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (activeTab === 'student') {
          loadStudents(searchTerm); // Pass search term as parameter
        }
      },
      searchTerm.trim() ? 500 : 0,
    ); // Longer delay for search, immediate for initial load

    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, loadStudents]);

  // Load classes
  const loadClasses = useCallback(async () => {
    if (activeTab !== 'class') return;

    setIsLoading(true);
    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        // Only include classes that have exam schedules for this exam
        const classesWithSchedules = [];

        for (const classData of response.data) {
          try {
            const gradingData = await gradingService.getClassGradingData(
              classData.id,
              selectedExam!.id,
            );

            if (gradingData.success && gradingData.data) {
              classesWithSchedules.push({
                id: classData.id,
                grade: classData.grade,
                section: classData.section,
                totalStudents: gradingData.data.students.length,
              });
            }
          } catch {
            console.log(
              `No grading data for class ${classData.grade}-${classData.section}`,
            );
          }
        }

        setClasses(classesWithSchedules);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedExam]);

  // Load classes when tab changes to class
  useEffect(() => {
    if (activeTab === 'class' && selectedExam) {
      loadClasses();
    }
  }, [activeTab, selectedExam, loadClasses]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('student');
      setSearchTerm('');
      setSelectedStudent('');
      setSelectedClass('');
      setStudents([]);
      setClasses([]);
      // Load a small sample of students initially
      setTimeout(() => {
        loadStudents(''); // Load limited sample initially
      }, 100);
    }
  }, [isOpen, loadStudents]);

  // Generate individual student report
  const generateStudentReport = async () => {
    if (!selectedStudent || !selectedExam) {
      toast.error('Please select a student');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await gradingService.generateStudentReport(
        selectedStudent,
        selectedExam.id,
        academicYear,
      );

      if (response.success && response.data) {
        // Create blob and download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const student = students.find(s => s.id === selectedStudent);
        link.download = `${student?.fullName || 'Student'}_${selectedExam.name}_Report.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Student report downloaded successfully');
      } else {
        toast.error('Failed to generate student report');
      }
    } catch (error) {
      console.error('Error generating student report:', error);
      toast.error('Failed to generate student report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate class batch reports
  const generateClassReports = async () => {
    if (!selectedClass || !selectedExam) {
      toast.error('Please select a class');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await gradingService.generateClassReports(
        selectedClass,
        selectedExam.id,
        academicYear,
      );

      if (response.success && response.data) {
        // Create blob and download ZIP
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const classData = classes.find(c => c.id === selectedClass);
        link.download = `Class_${classData?.grade}${classData?.section}_${selectedExam.name}_Reports.zip`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Class reports downloaded successfully');
      } else {
        toast.error('Failed to generate class reports');
      }
    } catch (error) {
      console.error('Error generating class reports:', error);
      toast.error('Failed to generate class reports');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <FileText className='h-6 w-6 text-green-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                Print Reports
              </h2>
              <p className='text-sm text-gray-600'>
                Generate and download exam result reports
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg'
          >
            <X className='h-5 w-5 text-gray-500' />
          </Button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* Exam Info */}
          <Card className='p-4 mb-6 bg-blue-50 border-blue-200'>
            <div className='flex items-center space-x-3'>
              <BookOpen className='h-5 w-5 text-blue-600' />
              <div>
                <h3 className='font-medium text-blue-900'>
                  {selectedExam?.name || 'No exam selected'}
                </h3>
                <p className='text-sm text-blue-700'>
                  Academic Year: {academicYear} •
                  {selectedExam &&
                    ` ${selectedExam.startDate.toLocaleDateString()} - ${selectedExam.endDate.toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </Card>

          {/* Tab Selection */}
          <div className='flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg'>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
                activeTab === 'student'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className='h-4 w-4' />
              <span>Individual Student</span>
            </button>
            <button
              onClick={() => setActiveTab('class')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
                activeTab === 'class'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className='h-4 w-4' />
              <span>Class Batch</span>
            </button>
          </div>

          {/* Student Search Tab */}
          {activeTab === 'student' && (
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Search Student
                </label>
                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search by name, roll number, or student ID...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              {/* Student Results */}
              <div className='space-y-3'>
                {isLoading ? (
                  <div className='text-center py-8'>
                    <div className='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                    <p className='mt-2 text-gray-600'>Searching students...</p>
                  </div>
                ) : students.length > 0 ? (
                  <>
                    <label className='block text-sm font-medium text-gray-700'>
                      Select Student ({students.length}{' '}
                      {searchTerm.trim() ? 'found' : 'sample students shown'})
                    </label>
                    {!searchTerm.trim() && (
                      <p className='text-xs text-amber-600 mb-2'>
                        💡 Showing limited sample. Search to find specific
                        students.
                      </p>
                    )}
                    <div className='max-h-60 overflow-y-auto space-y-2'>
                      {students.map(student => (
                        <div
                          key={student.id}
                          onClick={() => setSelectedStudent(student.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedStudent === student.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <h4 className='font-medium text-gray-900'>
                                {student.fullName}
                              </h4>
                              <p className='text-sm text-gray-600'>
                                Roll: {student.rollNumber} • Class{' '}
                                {student.className}
                              </p>
                              <p className='text-xs text-gray-500'>
                                ID: {student.id.slice(0, 8)}...
                              </p>
                            </div>
                            <div className='flex items-center space-x-2'>
                              {selectedStudent === student.id && (
                                <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : searchTerm.trim() ? (
                  <div className='text-center py-8'>
                    <User className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                    <p className='text-gray-600'>No students found</p>
                    <p className='text-sm text-gray-500'>
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <Search className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                    <p className='text-gray-600'>Showing sample students</p>
                    <p className='text-sm text-gray-500'>
                      Search by name, roll number, or ID to find specific
                      students
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Class Selection Tab */}
          {activeTab === 'class' && (
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Select Class
                </label>
                {isLoading ? (
                  <div className='text-center py-8'>
                    <div className='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                    <p className='mt-2 text-gray-600'>Loading classes...</p>
                  </div>
                ) : classes.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {classes.map(classData => (
                      <div
                        key={classData.id}
                        onClick={() => setSelectedClass(classData.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedClass === classData.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div className='p-2 bg-blue-100 rounded-lg'>
                              <GraduationCap className='h-5 w-5 text-blue-600' />
                            </div>
                            <div>
                              <h4 className='font-medium text-gray-900'>
                                Class {classData.grade}
                                {classData.section}
                              </h4>
                              <p className='text-sm text-gray-600'>
                                {classData.totalStudents} students
                              </p>
                            </div>
                          </div>
                          {selectedClass === classData.id && (
                            <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <GraduationCap className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                    <p className='text-gray-600'>
                      No classes with exam data found
                    </p>
                    <p className='text-sm text-gray-500'>
                      Make sure exam schedules are created
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200'>
          <div className='text-sm text-gray-600'>
            {activeTab === 'student' ? (
              selectedStudent ? (
                <span className='flex items-center'>
                  <Eye className='h-4 w-4 mr-1' />
                  Ready to generate individual report
                </span>
              ) : (
                'Search and select a student to generate report'
              )
            ) : selectedClass ? (
              <span className='flex items-center'>
                <Archive className='h-4 w-4 mr-1' />
                Ready to generate class batch reports (ZIP)
              </span>
            ) : (
              'Select a class to generate batch reports'
            )}
          </div>

          <div className='flex items-center space-x-3'>
            <Button
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50'
            >
              Cancel
            </Button>
            <Button
              onClick={
                activeTab === 'student'
                  ? generateStudentReport
                  : generateClassReports
              }
              disabled={
                isGenerating ||
                !selectedExam ||
                (activeTab === 'student' ? !selectedStudent : !selectedClass)
              }
              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center'
            >
              {isGenerating ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Generating...
                </>
              ) : (
                <>
                  {activeTab === 'student' ? (
                    <>
                      <Printer className='h-4 w-4 mr-2' />
                      Generate Report
                    </>
                  ) : (
                    <>
                      <Download className='h-4 w-4 mr-2' />
                      Download ZIP
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
