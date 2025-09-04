'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Search,
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Eye,
  Save,
  Award,
  BarChart3,
  FileText,
  Download,
  Upload,
  Shield,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { classService, type ClassResponse } from '@/api/services/class.service';
import { subjectService } from '@/api/services/subject.service';
import { calendarService } from '@/api/services/calendar.service';
import {
  gradingService,
  type ClassGradingData,
  type SubjectGradingData,
  type GradingScale,
} from '@/api/services/grading.service';
import GradingModal from '@/components/organisms/modals/GradingModal';
import StudentGradeModal from '@/components/organisms/modals/StudentGradeModal';
import GradingScaleModal from '@/components/organisms/modals/GradingScaleModal';
import GradingPermissionsModal from '@/components/organisms/modals/GradingPermissionsModal';
import PublishResultsModal from '@/components/organisms/modals/PublishResultsModal';
import PrintReportsModal from '@/components/organisms/modals/PrintReportsModal';

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
  publishedStudents: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'published';
}

interface SubjectBlock {
  id: string;
  name: string;
  code: string;
  totalStudents: number;
  gradedStudents: number;
  pendingStudents: number;
  publishedStudents: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'published';
}

export default function AdminGradingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('grading');
  const [viewMode, setViewMode] = useState<'class' | 'subject'>('class');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamEntry | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<string>('2024-2025');
  const [examEntries, setExamEntries] = useState<ExamEntry[]>([]);
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>([]);
  const [subjectBlocks, setSubjectBlocks] = useState<SubjectBlock[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [isStudentGradeModalOpen, setIsStudentGradeModalOpen] = useState(false);
  const [isGradingScaleModalOpen, setIsGradingScaleModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPrintReportsModalOpen, setIsPrintReportsModalOpen] = useState(false);
  const [selectedClassData, setSelectedClassData] =
    useState<ClassGradingData | null>(null);
  const [selectedSubjectData, setSelectedSubjectData] =
    useState<SubjectGradingData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedClassForPublish, setSelectedClassForPublish] =
    useState<ClassBlock | null>(null);

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

  // Load grading scales
  const loadGradingScales = useCallback(async () => {
    try {
      const response =
        await gradingService.getGradingScales(selectedAcademicYear);
      if (response.success && response.data) {
        setGradingScales(response.data);
      }
    } catch (error) {
      console.error('Error loading grading scales:', error);
    }
  }, [selectedAcademicYear]);

  // Load class blocks
  const loadClassBlocks = useCallback(async () => {
    if (!selectedExam) return;

    try {
      setIsLoading(true);
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
            const publishedStudents = gradingData.data.students.filter(s =>
              s.results.some(r => r.status === 'PUBLISHED'),
            ).length;
            const pendingStudents = totalStudents - gradedStudents;

            let status:
              | 'not-started'
              | 'in-progress'
              | 'completed'
              | 'published' = 'not-started';
            if (publishedStudents === totalStudents && totalStudents > 0) {
              status = 'published';
            } else if (gradedStudents === totalStudents && totalStudents > 0) {
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
              publishedStudents,
              status,
            });
          }
        } catch (error) {
          console.log(
            `Error loading class ${classData.grade}-${classData.section}:`,
            error,
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

  // Load subject blocks
  const loadSubjectBlocks = useCallback(async () => {
    if (!selectedExam) return;

    try {
      setIsLoading(true);
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
            const publishedStudents = gradingData.data.classes.reduce(
              (sum, cls) =>
                sum +
                cls.students.filter(
                  s => s.result && s.result.status === 'PUBLISHED',
                ).length,
              0,
            );
            const pendingStudents = totalStudents - gradedStudents;

            let status:
              | 'not-started'
              | 'in-progress'
              | 'completed'
              | 'published' = 'not-started';
            if (publishedStudents === totalStudents && totalStudents > 0) {
              status = 'published';
            } else if (gradedStudents === totalStudents && totalStudents > 0) {
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
              publishedStudents,
              status,
            });
          }
        } catch (error) {
          console.log(`Error loading subject ${subject.name}:`, error);
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
    loadGradingScales();
  }, [loadExamEntries, loadGradingScales]);

  useEffect(() => {
    if (selectedExam && activeTab === 'grading') {
      if (viewMode === 'class') {
        loadClassBlocks();
      } else {
        loadSubjectBlocks();
      }
    }
  }, [selectedExam, viewMode, activeTab, loadClassBlocks, loadSubjectBlocks]);

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

  const handlePublishResults = (classBlock: ClassBlock) => {
    setSelectedClassForPublish(classBlock);
    setIsPublishModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <Lock className='h-5 w-5 text-blue-600' />;
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
      case 'published':
        return 'bg-blue-50 border-blue-200';
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

  const renderGradingTab = () => (
    <div className='space-y-6'>
      {/* Exam Selection */}
      <Card className='p-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label className='text-sm font-medium text-gray-700'>
              Select Exam
            </Label>
            <div className='flex items-center space-x-4'>
              <Label className='text-sm text-gray-600'>Academic Year:</Label>
              <select
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
                className='px-3 py-1 border border-gray-300 rounded-lg text-sm'
              >
                <option value='2024-2025'>2024-2025</option>
                <option value='2023-2024'>2023-2024</option>
                <option value='2025-2026'>2025-2026</option>
              </select>
            </div>
          </div>
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

              <div className='flex items-center space-x-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder={`Search ${viewMode === 'class' ? 'classes' : 'subjects'}...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10 w-80'
                  />
                </div>
                <Button
                  onClick={() => setIsPermissionsModalOpen(true)}
                  className='bg-purple-600 hover:bg-purple-700 text-white'
                >
                  <Shield className='h-4 w-4 mr-2' />
                  Permissions
                </Button>
                <Button
                  onClick={() => setIsPrintReportsModalOpen(true)}
                  disabled={!selectedExam}
                  className='bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400'
                >
                  <FileText className='h-4 w-4 mr-2' />
                  Print Reports
                </Button>
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
                    ? `${filteredClassBlocks.length} classes`
                    : `${filteredSubjectBlocks.length} subjects`}
                </Label>
              </div>

              {isLoading ? (
                <div className='text-center py-12'>
                  <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                  <p className='mt-2 text-gray-600'>Loading grading data...</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {viewMode === 'class'
                    ? filteredClassBlocks.map(classBlock => (
                        <Card
                          key={classBlock.id}
                          className={`p-6 transition-all hover:shadow-md ${getStatusColor(classBlock.status)}`}
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
                                <span className='text-gray-600'>
                                  Grading Progress
                                </span>
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

                              {/* Publishing Progress */}
                              <div className='flex justify-between text-sm'>
                                <span className='text-gray-600'>Published</span>
                                <span className='font-medium'>
                                  {classBlock.totalStudents > 0
                                    ? `${Math.round((classBlock.publishedStudents / classBlock.totalStudents) * 100)}%`
                                    : '0%'}
                                </span>
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2'>
                                <div
                                  className='bg-green-600 h-2 rounded-full transition-all'
                                  style={{
                                    width:
                                      classBlock.totalStudents > 0
                                        ? `${(classBlock.publishedStudents / classBlock.totalStudents) * 100}%`
                                        : '0%',
                                  }}
                                />
                              </div>

                              <div className='grid grid-cols-3 gap-2 text-xs text-gray-500'>
                                <span>Graded: {classBlock.gradedStudents}</span>
                                <span>
                                  Pending: {classBlock.pendingStudents}
                                </span>
                                <span>
                                  Published: {classBlock.publishedStudents}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className='space-y-2'>
                              <Button
                                className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                                onClick={() => handleClassClick(classBlock)}
                              >
                                <Edit className='h-4 w-4 mr-2' />
                                Grade Students
                              </Button>

                              {classBlock.status === 'completed' && (
                                <Button
                                  className='w-full bg-green-600 hover:bg-green-700 text-white'
                                  onClick={() =>
                                    handlePublishResults(classBlock)
                                  }
                                >
                                  <Lock className='h-4 w-4 mr-2' />
                                  Publish Results
                                </Button>
                              )}

                              {classBlock.status === 'published' && (
                                <div className='text-center text-sm text-blue-600 font-medium py-2'>
                                  <Lock className='h-4 w-4 inline mr-1' />
                                  Results Published
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    : filteredSubjectBlocks.map(subjectBlock => (
                        <Card
                          key={subjectBlock.id}
                          className={`p-6 transition-all hover:shadow-md ${getStatusColor(subjectBlock.status)}`}
                        >
                          <div className='space-y-4'>
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
                            </div>

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
            </div>
          </Card>
        </>
      )}
    </div>
  );

  const renderGradingScalesTab = () => (
    <div className='space-y-6'>
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <SectionTitle
              text='Grading Scales'
              className='text-lg font-semibold text-gray-900'
            />
            <Label className='text-gray-600'>
              Manage grading scales and grade definitions
            </Label>
          </div>
          <Button
            onClick={() => setIsGradingScaleModalOpen(true)}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            <Award className='h-4 w-4 mr-2' />
            Add Grading Scale
          </Button>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {gradingScales.map(scale => (
            <Card key={scale.id} className='p-4'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-semibold text-gray-900'>
                      {scale.name}
                    </h3>
                    <p className='text-sm text-gray-600'>
                      {scale.academicYear}
                    </p>
                    {scale.isDefault && (
                      <span className='inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1'>
                        Default
                      </span>
                    )}
                  </div>
                  <Button className='p-2 hover:bg-gray-100 rounded-lg'>
                    <Edit className='h-4 w-4 text-gray-600' />
                  </Button>
                </div>

                {scale.description && (
                  <p className='text-sm text-gray-600'>{scale.description}</p>
                )}

                <div className='space-y-2'>
                  <Label className='text-xs text-gray-500'>
                    Grade Definitions
                  </Label>
                  <div className='grid grid-cols-2 gap-2'>
                    {scale.gradeDefinitions.map(grade => (
                      <div
                        key={grade.id}
                        className='p-2 bg-gray-50 rounded text-xs flex items-center justify-between'
                      >
                        <span className='font-medium'>{grade.grade}</span>
                        <span className='text-gray-600'>
                          {grade.minMarks}-{grade.maxMarks}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {gradingScales.length === 0 && (
          <div className='text-center py-12'>
            <Award className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-600 mb-2'>No grading scales found</p>
            <p className='text-sm text-gray-500'>
              Create a grading scale to get started
            </p>
          </div>
        )}
      </Card>
    </div>
  );

  const renderReportsTab = () => (
    <div className='space-y-6'>
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <SectionTitle
              text='Grading Reports'
              className='text-lg font-semibold text-gray-900'
            />
            <Label className='text-gray-600'>
              Generate and export grading reports
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Button className='bg-green-600 hover:bg-green-700 text-white'>
              <Download className='h-4 w-4 mr-2' />
              Export Results
            </Button>
            <Button className='bg-gray-600 hover:bg-gray-700 text-white'>
              <Upload className='h-4 w-4 mr-2' />
              Import Results
            </Button>
          </div>
        </div>

        <div className='text-center py-12'>
          <BarChart3 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>Reports feature coming soon</p>
        </div>
      </Card>
    </div>
  );

  const tabItems = [
    {
      id: 'grading',
      label: 'Grade Management',
      icon: <Edit className='h-4 w-4' />,
      content: renderGradingTab(),
    },
    {
      id: 'scales',
      label: 'Grading Scales',
      icon: <Award className='h-4 w-4' />,
      content: renderGradingScalesTab(),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className='h-4 w-4' />,
      content: renderReportsTab(),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='Exam Grading Management'
            className='text-2xl font-bold text-gray-900'
          />
          <Label className='text-gray-600'>
            Comprehensive grading system for all exams and students
          </Label>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabItems.map(item => ({
          name: item.label,
          content: item.content,
        }))}
        selectedIndex={tabItems.findIndex(item => item.id === activeTab)}
        onChange={index => setActiveTab(tabItems[index].id)}
        className='w-full'
      />

      {/* Modals */}
      <GradingModal
        isOpen={isGradingModalOpen}
        onClose={() => {
          setIsGradingModalOpen(false);
          setSelectedClassData(null);
          setSelectedSubjectData(null);
        }}
        classData={selectedClassData}
        subjectData={selectedSubjectData}
        onStudentClick={(student, result) => {
          setSelectedStudent({ ...student, result });
          setIsStudentGradeModalOpen(true);
        }}
        onSuccess={() => {
          if (viewMode === 'class') {
            loadClassBlocks();
          } else {
            loadSubjectBlocks();
          }
        }}
      />

      <StudentGradeModal
        isOpen={isStudentGradeModalOpen}
        onClose={() => {
          setIsStudentGradeModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSuccess={() => {
          if (viewMode === 'class') {
            loadClassBlocks();
          } else {
            loadSubjectBlocks();
          }
          setIsStudentGradeModalOpen(false);
          setSelectedStudent(null);
        }}
      />

      <GradingScaleModal
        isOpen={isGradingScaleModalOpen}
        onClose={() => setIsGradingScaleModalOpen(false)}
        academicYear={selectedAcademicYear}
        mode='create'
        onSave={() => {
          loadGradingScales();
          setIsGradingScaleModalOpen(false);
        }}
      />

      <GradingPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        onSave={() => {
          // Reload data
          if (viewMode === 'class') {
            loadClassBlocks();
          } else {
            loadSubjectBlocks();
          }
        }}
      />

      <PublishResultsModal
        isOpen={isPublishModalOpen}
        onClose={() => {
          setIsPublishModalOpen(false);
          setSelectedClassForPublish(null);
        }}
        onPublish={() => {
          loadClassBlocks();
          setIsPublishModalOpen(false);
          setSelectedClassForPublish(null);
        }}
      />

      <PrintReportsModal
        isOpen={isPrintReportsModalOpen}
        onClose={() => setIsPrintReportsModalOpen(false)}
        selectedExam={selectedExam}
        academicYear={selectedAcademicYear}
      />
    </div>
  );
}
