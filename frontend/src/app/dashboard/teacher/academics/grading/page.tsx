'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Search,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Eye,
  Save,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { classService, type ClassResponse } from '@/api/services/class.service';
import { subjectService } from '@/api/services/subject.service';
import { calendarService } from '@/api/services/calendar.service';
import {
  gradingService,
  type ClassGradingData,
  type SubjectGradingData,
  type ExamResult,
} from '@/api/services/grading.service';
import GradingModal from '@/components/organisms/modals/GradingModal';
import StudentGradeModal from '@/components/organisms/modals/StudentGradeModal';

interface ExamEntry {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: string;
}

interface ClassBlock {
  id: string;
  grade: number;
  section: string;
  totalStudents: number;
  gradedStudents: number;
  pendingStudents: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

interface SubjectBlock {
  id: string;
  name: string;
  code: string;
  totalStudents: number;
  gradedStudents: number;
  pendingStudents: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

export default function TeacherGradingPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'class' | 'subject'>('class');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamEntry | null>(null);
  const [examEntries, setExamEntries] = useState<ExamEntry[]>([]);
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>([]);
  const [subjectBlocks, setSubjectBlocks] = useState<SubjectBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [isStudentGradeModalOpen, setIsStudentGradeModalOpen] = useState(false);
  const [selectedClassData, setSelectedClassData] =
    useState<ClassGradingData | null>(null);
  const [selectedSubjectData, setSelectedSubjectData] =
    useState<SubjectGradingData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Load exam entries
  const loadExamEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await calendarService.getCalendarEntries({
        page: 1,
        limit: 100,
        type: 'EXAM' as any,
        startDate: new Date(new Date().getFullYear(), 0, 1)
          .toISOString()
          .split('T')[0],
        endDate: new Date(new Date().getFullYear(), 11, 31)
          .toISOString()
          .split('T')[0],
      });

      if (response && response.entries) {
        const exams = response.entries.map((entry: any) => ({
          id: entry.id,
          name: entry.examDetails || 'Exam',
          startDate: new Date(entry.startDate),
          endDate: new Date(entry.endDate),
          type: entry.examType || 'OTHER',
        }));
        setExamEntries(exams);

        // Auto-select the most recent exam
        if (exams.length > 0) {
          setSelectedExam(exams[0]);
        }
      }
    } catch (error) {
      console.error('Error loading exam entries:', error);
      setError('Failed to load exam entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load class blocks for class view
  const loadClassBlocks = useCallback(async () => {
    if (!selectedExam) return;

    try {
      setIsLoading(true);
      // Get teacher's assigned classes
      const classesResponse = await classService.getAllClasses();
      if (!classesResponse.success || !classesResponse.data) return;

      const blocks: ClassBlock[] = [];

      for (const classData of classesResponse.data) {
        try {
          const gradingData = await gradingService.getClassGradingData(
            classData.id,
            selectedExam.id,
          );

          if (gradingData.success && gradingData.data) {
            const totalStudents = gradingData.data.students.length;
            const gradedStudents = gradingData.data.students.filter(s =>
              s.results.some(r => r.status !== 'DRAFT'),
            ).length;
            const pendingStudents = totalStudents - gradedStudents;

            let status: 'not-started' | 'in-progress' | 'completed' =
              'not-started';
            if (gradedStudents === totalStudents && totalStudents > 0) {
              status = 'completed';
            } else if (gradedStudents > 0) {
              status = 'in-progress';
            }

            blocks.push({
              id: classData.id,
              grade: classData.grade,
              section: classData.section,
              totalStudents,
              gradedStudents,
              pendingStudents,
              status,
            });
          }
        } catch (error) {
          // Skip classes the teacher doesn't have permission for
          console.log(
            `No permission for class ${classData.grade}-${classData.section}`,
          );
        }
      }

      setClassBlocks(blocks);
    } catch (error) {
      console.error('Error loading class blocks:', error);
      setError('Failed to load class data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedExam]);

  // Load subject blocks for subject view
  const loadSubjectBlocks = useCallback(async () => {
    if (!selectedExam) return;

    try {
      setIsLoading(true);
      // Get teacher's assigned subjects
      const subjectsResponse = await subjectService.getAllSubjects();
      if (!subjectsResponse.success || !subjectsResponse.data) return;

      const blocks: SubjectBlock[] = [];

      for (const subject of subjectsResponse.data) {
        try {
          const gradingData = await gradingService.getSubjectGradingData(
            subject.id,
            selectedExam.id,
          );

          if (gradingData.success && gradingData.data) {
            const totalStudents = gradingData.data.classes.reduce(
              (sum, cls) => sum + cls.students.length,
              0,
            );
            const gradedStudents = gradingData.data.classes.reduce(
              (sum, cls) =>
                sum +
                cls.students.filter(
                  s => s.result && s.result.status !== 'DRAFT',
                ).length,
              0,
            );
            const pendingStudents = totalStudents - gradedStudents;

            let status: 'not-started' | 'in-progress' | 'completed' =
              'not-started';
            if (gradedStudents === totalStudents && totalStudents > 0) {
              status = 'completed';
            } else if (gradedStudents > 0) {
              status = 'in-progress';
            }

            blocks.push({
              id: subject.id,
              name: subject.name,
              code: subject.code,
              totalStudents,
              gradedStudents,
              pendingStudents,
              status,
            });
          }
        } catch (error) {
          // Skip subjects the teacher doesn't have permission for
          console.log(`No permission for subject ${subject.name}`);
        }
      }

      setSubjectBlocks(blocks);
    } catch (error) {
      console.error('Error loading subject blocks:', error);
      setError('Failed to load subject data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedExam]);

  // Effects
  useEffect(() => {
    loadExamEntries();
  }, [loadExamEntries]);

  useEffect(() => {
    if (selectedExam) {
      if (viewMode === 'class') {
        loadClassBlocks();
      } else {
        loadSubjectBlocks();
      }
    }
  }, [selectedExam, viewMode, loadClassBlocks, loadSubjectBlocks]);

  // Handlers
  const handleClassClick = async (classBlock: ClassBlock) => {
    if (!selectedExam) return;

    try {
      const response = await gradingService.getClassGradingData(
        classBlock.id,
        selectedExam.id,
      );

      if (response.success && response.data) {
        setSelectedClassData(response.data);
        setIsGradingModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading class grading data:', error);
    }
  };

  const handleSubjectClick = async (subjectBlock: SubjectBlock) => {
    if (!selectedExam) return;

    try {
      const response = await gradingService.getSubjectGradingData(
        subjectBlock.id,
        selectedExam.id,
      );

      if (response.success && response.data) {
        setSelectedSubjectData(response.data);
        setIsGradingModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading subject grading data:', error);
    }
  };

  const handleStudentGradeClick = (student: any, result?: ExamResult) => {
    setSelectedStudent({ ...student, result });
    setIsStudentGradeModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'in-progress':
        return <Clock className='h-5 w-5 text-yellow-600' />;
      default:
        return <AlertTriangle className='h-5 w-5 text-gray-400' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredClassBlocks = classBlocks.filter(block =>
    `${block.grade}-${block.section}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const filteredSubjectBlocks = subjectBlocks.filter(
    block =>
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='Exam Grading'
            className='text-2xl font-bold text-gray-900'
          />
          <Label className='text-gray-600'>
            Grade student exams and manage results
          </Label>
        </div>
      </div>

      {/* Exam Selection */}
      <Card className='p-6'>
        <div className='space-y-4'>
          <Label className='text-sm font-medium text-gray-700'>
            Select Exam
          </Label>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {examEntries.map(exam => (
              <Card
                key={exam.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedExam?.id === exam.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedExam(exam)}
              >
                <div className='flex items-center space-x-3'>
                  <Calendar className='h-5 w-5 text-blue-600' />
                  <div>
                    <p className='font-medium text-gray-900'>{exam.name}</p>
                    <p className='text-sm text-gray-500'>
                      {exam.startDate.toLocaleDateString()} -{' '}
                      {exam.endDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {selectedExam && (
        <>
          {/* View Mode Toggle & Search */}
          <Card className='p-6'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0'>
              {/* View Mode Toggle */}
              <div className='flex items-center space-x-4'>
                <Label className='text-sm font-medium text-gray-700'>
                  View by:
                </Label>
                <div className='flex items-center space-x-2'>
                  <Button
                    onClick={() => setViewMode('class')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      viewMode === 'class'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className='h-4 w-4' />
                    <span>Class</span>
                  </Button>
                  <Button
                    onClick={() => setViewMode('subject')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      viewMode === 'subject'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <BookOpen className='h-4 w-4' />
                    <span>Subject</span>
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className='relative w-full sm:w-80'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder={`Search ${viewMode === 'class' ? 'classes' : 'subjects'}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
          </Card>

          {/* Grading Blocks */}
          <Card className='p-6'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <SectionTitle
                  text={`${viewMode === 'class' ? 'Classes' : 'Subjects'} - ${selectedExam.name}`}
                  className='text-lg font-semibold text-gray-900'
                />
                <Label className='text-sm text-gray-500'>
                  {viewMode === 'class'
                    ? `${filteredClassBlocks.length} classes available`
                    : `${filteredSubjectBlocks.length} subjects available`}
                </Label>
              </div>

              {isLoading ? (
                <div className='text-center py-12'>
                  <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                  <p className='mt-2 text-gray-600'>Loading grading data...</p>
                </div>
              ) : error ? (
                <div className='text-center py-12'>
                  <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
                  <p className='text-red-600 mb-4'>{error}</p>
                  <Button
                    onClick={() => {
                      setError(null);
                      if (viewMode === 'class') {
                        loadClassBlocks();
                      } else {
                        loadSubjectBlocks();
                      }
                    }}
                    className='bg-blue-600 text-white hover:bg-blue-700'
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {viewMode === 'class'
                    ? filteredClassBlocks.map(classBlock => (
                        <Card
                          key={classBlock.id}
                          className={`p-6 cursor-pointer transition-all hover:shadow-md ${getStatusColor(classBlock.status)}`}
                          onClick={() => handleClassClick(classBlock)}
                        >
                          <div className='space-y-4'>
                            {/* Header */}
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-3'>
                                <div className='p-2 bg-blue-100 rounded-lg'>
                                  <GraduationCap className='h-6 w-6 text-blue-600' />
                                </div>
                                <div>
                                  <h3 className='font-semibold text-gray-900'>
                                    Grade {classBlock.grade} -{' '}
                                    {classBlock.section}
                                  </h3>
                                  <p className='text-sm text-gray-600'>
                                    {classBlock.totalStudents} students
                                  </p>
                                </div>
                              </div>
                              {getStatusIcon(classBlock.status)}
                            </div>

                            {/* Progress */}
                            <div className='space-y-2'>
                              <div className='flex justify-between text-sm'>
                                <span className='text-gray-600'>Progress</span>
                                <span className='font-medium'>
                                  {classBlock.totalStudents > 0
                                    ? `${Math.round((classBlock.gradedStudents / classBlock.totalStudents) * 100)}%`
                                    : '0%'}
                                </span>
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2'>
                                <div
                                  className='bg-blue-600 h-2 rounded-full transition-all'
                                  style={{
                                    width:
                                      classBlock.totalStudents > 0
                                        ? `${(classBlock.gradedStudents / classBlock.totalStudents) * 100}%`
                                        : '0%',
                                  }}
                                />
                              </div>
                              <div className='flex justify-between text-xs text-gray-500'>
                                <span>Graded: {classBlock.gradedStudents}</span>
                                <span>
                                  Pending: {classBlock.pendingStudents}
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button
                              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                              onClick={() => handleClassClick(classBlock)}
                            >
                              <Edit className='h-4 w-4 mr-2' />
                              Grade Students
                            </Button>
                          </div>
                        </Card>
                      ))
                    : filteredSubjectBlocks.map(subjectBlock => (
                        <Card
                          key={subjectBlock.id}
                          className={`p-6 cursor-pointer transition-all hover:shadow-md ${getStatusColor(subjectBlock.status)}`}
                          onClick={() => handleSubjectClick(subjectBlock)}
                        >
                          <div className='space-y-4'>
                            {/* Header */}
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-3'>
                                <div className='p-2 bg-green-100 rounded-lg'>
                                  <BookOpen className='h-6 w-6 text-green-600' />
                                </div>
                                <div>
                                  <h3 className='font-semibold text-gray-900'>
                                    {subjectBlock.name}
                                  </h3>
                                  <p className='text-sm text-gray-600'>
                                    {subjectBlock.code} •{' '}
                                    {subjectBlock.totalStudents} students
                                  </p>
                                </div>
                              </div>
                              {getStatusIcon(subjectBlock.status)}
                            </div>

                            {/* Progress */}
                            <div className='space-y-2'>
                              <div className='flex justify-between text-sm'>
                                <span className='text-gray-600'>Progress</span>
                                <span className='font-medium'>
                                  {subjectBlock.totalStudents > 0
                                    ? `${Math.round((subjectBlock.gradedStudents / subjectBlock.totalStudents) * 100)}%`
                                    : '0%'}
                                </span>
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2'>
                                <div
                                  className='bg-green-600 h-2 rounded-full transition-all'
                                  style={{
                                    width:
                                      subjectBlock.totalStudents > 0
                                        ? `${(subjectBlock.gradedStudents / subjectBlock.totalStudents) * 100}%`
                                        : '0%',
                                  }}
                                />
                              </div>
                              <div className='flex justify-between text-xs text-gray-500'>
                                <span>
                                  Graded: {subjectBlock.gradedStudents}
                                </span>
                                <span>
                                  Pending: {subjectBlock.pendingStudents}
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button
                              className='w-full bg-green-600 hover:bg-green-700 text-white'
                              onClick={() => handleSubjectClick(subjectBlock)}
                            >
                              <Edit className='h-4 w-4 mr-2' />
                              Grade Students
                            </Button>
                          </div>
                        </Card>
                      ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading &&
                !error &&
                (viewMode === 'class'
                  ? filteredClassBlocks.length === 0
                  : filteredSubjectBlocks.length === 0) && (
                  <div className='text-center py-12'>
                    <GraduationCap className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-600 mb-2'>
                      No {viewMode === 'class' ? 'classes' : 'subjects'}{' '}
                      available for grading
                    </p>
                    <p className='text-sm text-gray-500'>
                      {searchTerm
                        ? 'Try adjusting your search terms'
                        : 'You may not have grading permissions or the exam schedule is not ready'}
                    </p>
                  </div>
                )}
            </div>
          </Card>
        </>
      )}

      {/* Grading Modal */}
      <GradingModal
        isOpen={isGradingModalOpen}
        onClose={() => {
          setIsGradingModalOpen(false);
          setSelectedClassData(null);
          setSelectedSubjectData(null);
        }}
        classData={selectedClassData}
        subjectData={selectedSubjectData}
        onStudentClick={handleStudentGradeClick}
        onSuccess={() => {
          // Reload data
          if (viewMode === 'class') {
            loadClassBlocks();
          } else {
            loadSubjectBlocks();
          }
        }}
      />

      {/* Student Grade Modal */}
      <StudentGradeModal
        isOpen={isStudentGradeModalOpen}
        onClose={() => {
          setIsStudentGradeModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSuccess={() => {
          // Reload data
          if (viewMode === 'class') {
            loadClassBlocks();
          } else {
            loadSubjectBlocks();
          }
          setIsStudentGradeModalOpen(false);
          setSelectedStudent(null);
        }}
      />
    </div>
  );
}
