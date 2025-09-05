'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  BarChart3,
  Clock,
  Users,
  CalendarDays,
  CheckCircle2,
  Search,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Eye,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import StatCard from '@/components/molecules/cards/StatCard';
import { Card } from '@/components/ui/card';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import { calendarService } from '@/api/services/calendar.service';
import {
  gradingService,
  type ClassGradingData,
} from '@/api/services/grading.service';
import GradingInterface from '@/components/grading/GradingInterface';
import GridGradingInterface from '@/components/grading/GridGradingInterface';
import {
  examScheduleService,
  examTimetableService,
} from '@/api/services/exam-timetable.service';
import PrintReportsModal from '@/components/organisms/modals/PrintReportsModal';
import { toast } from 'sonner';

// Interfaces for grading
interface ExamEntry {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: string;
}

interface ClassGradingBlock {
  id: string;
  grade: number;
  section: string;
  totalStudents: number;
  gradedStudents: number;
  pendingStudents: number;
  status: 'not-started' | 'in-progress' | 'completed';
  subjects: {
    id: string;
    name: string;
    code: string;
    maxMarks: number;
    passMarks: number;
    examSlotId?: string;
    gradedCount: number;
    totalCount: number;
  }[];
}

// New Grading Tab with class-wise grading blocks
function GradingTab({
  onSwitchToTimetable,
}: {
  onSwitchToTimetable?: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamEntry | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<string>('2024-2025');
  const [examEntries, setExamEntries] = useState<ExamEntry[]>([]);
  const [classGradingBlocks, setClassGradingBlocks] = useState<
    ClassGradingBlock[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // New state for in-page grading
  const [selectedClass, setSelectedClass] = useState<ClassGradingBlock | null>(
    null,
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [classGradingData, setClassGradingData] =
    useState<ClassGradingData | null>(null);
  const [isLoadingGradingData, setIsLoadingGradingData] = useState(false);
  const [useGridInterface, setUseGridInterface] = useState(false);
  const [examScheduleId, setExamScheduleId] = useState<string | null>(null);
  const [isPrintReportsModalOpen, setIsPrintReportsModalOpen] = useState(false);

  // Load exam entries from calendar service using useCalendarEvents pattern
  const loadExamEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use the same pattern as useCalendarEvents hook - fetch all entries then filter
      const response = await calendarService.getCalendarEntries({
        page: 1,
        limit: 100,
      });

      if (response && response.entries) {
        // Filter for EXAM type entries after fetching
        const examEntries = response.entries
          .filter((entry: any) => entry.type === 'EXAM')
          .map((entry: any) => ({
            id: entry.id,
            name: entry.examDetails || entry.name || 'Exam',
            startDate: new Date(entry.startDate),
            endDate: new Date(entry.endDate),
            type: entry.examType || 'OTHER',
          }));
        setExamEntries(examEntries);

        // Auto-select first upcoming exam
        if (examEntries.length > 0 && !selectedExam) {
          setSelectedExam(examEntries[0]);
        }
      }
    } catch (error) {
      console.error('Error loading exam entries:', error);
      // Don't set blocking error for exam loading failures
      // Let the UI show "No exams found" message instead
    } finally {
      setIsLoading(false);
    }
  }, [selectedExam]);

  // Load class grading blocks for selected exam
  const loadClassGradingBlocks = useCallback(async () => {
    if (!selectedExam) return;

    try {
      setIsLoading(true);
      // Fetch only classes that actually have an exam schedule for this calendar entry
      const schedulesResponse =
        await examScheduleService.getExamSchedulesByCalendarEntry(
          selectedExam.id,
        );
      if (!schedulesResponse?.success || !schedulesResponse.data) {
        setClassGradingBlocks([]);
        return;
      }

      // Build unique classes from schedules
      const classIdToSchedule = new Map<
        string,
        { grade: number; section: string; scheduleId: string }
      >();
      for (const sched of schedulesResponse.data as any[]) {
        if (sched?.class?.id && !classIdToSchedule.has(sched.class.id)) {
          classIdToSchedule.set(sched.class.id, {
            grade: sched.class.grade,
            section: sched.class.section,
            scheduleId: sched.id,
          });
        }
      }

      const blocks: ClassGradingBlock[] = [];
      for (const [classId, meta] of classIdToSchedule.entries()) {
        try {
          // Fetch timetable to list subjects scheduled for this class
          const timetableResp = await examTimetableService.getExamTimetable(
            classId,
            selectedExam.id,
            meta.scheduleId,
          );

          const subjectsMap = new Map<
            string,
            {
              id: string;
              name: string;
              code: string;
              maxMarks: number;
              passMarks: number;
              examSlotId?: string;
            }
          >();

          if (timetableResp?.success && Array.isArray(timetableResp.data)) {
            for (const slot of timetableResp.data as any[]) {
              const subj = slot?.subject;
              if (subj?.id && !subjectsMap.has(subj.id)) {
                subjectsMap.set(subj.id, {
                  id: subj.id,
                  name: subj.name,
                  code: subj.code,
                  maxMarks: subj.maxMarks,
                  passMarks: subj.passMarks,
                  examSlotId: slot?.id,
                });
              }
            }
          }

          // Fetch actual grading data to calculate accurate counts
          let totalStudents = 0;
          let gradedStudents = 0;
          const subjectsWithCounts = [];

          try {
            const gradingData = await gradingService.getClassGradingData(
              classId,
              selectedExam.id,
            );

            if (gradingData.success && gradingData.data) {
              totalStudents = gradingData.data.students.length;

              // Calculate graded students (students who have at least one result)
              gradedStudents = gradingData.data.students.filter(
                student => student.results && student.results.length > 0,
              ).length;

              // Calculate subject-specific counts
              for (const subject of Array.from(subjectsMap.values())) {
                const gradedCount = gradingData.data.students.filter(student =>
                  student.results.some(
                    result => result.examSlot?.subject?.id === subject.id,
                  ),
                ).length;

                subjectsWithCounts.push({
                  ...subject,
                  gradedCount,
                  totalCount: totalStudents,
                });
              }
            } else {
              // Fallback if grading data fetch fails
              subjectsWithCounts.push(
                ...Array.from(subjectsMap.values()).map(s => ({
                  ...s,
                  gradedCount: 0,
                  totalCount: 0,
                })),
              );
            }
          } catch (error) {
            console.warn(
              `Error fetching grading data for class ${classId}:`,
              error,
            );
            subjectsWithCounts.push(
              ...Array.from(subjectsMap.values()).map(s => ({
                ...s,
                gradedCount: 0,
                totalCount: 0,
              })),
            );
          }

          const pendingStudents = totalStudents - gradedStudents;
          let status: 'not-started' | 'in-progress' | 'completed' =
            'not-started';

          if (gradedStudents === totalStudents && totalStudents > 0) {
            status = 'completed';
          } else if (gradedStudents > 0) {
            status = 'in-progress';
          }

          blocks.push({
            id: classId,
            grade: meta.grade,
            section: meta.section,
            totalStudents,
            gradedStudents,
            pendingStudents,
            status,
            subjects: subjectsWithCounts,
          });
        } catch {
          // If timetable fetch fails, still show the class block with no subjects
          blocks.push({
            id: classId,
            grade: meta.grade,
            section: meta.section,
            totalStudents: 0,
            gradedStudents: 0,
            pendingStudents: 0,
            status: 'not-started',
            subjects: [],
          });
        }
      }

      setClassGradingBlocks(blocks);
    } catch (error) {
      console.error('Error loading class grading blocks:', error);
      // Don't set error state for validation failures - just continue with empty blocks
      // This prevents blocking UI errors when exam schedules don't exist yet
    } finally {
      setIsLoading(false);
    }
  }, [selectedExam]);

  useEffect(() => {
    loadExamEntries();
  }, [loadExamEntries]);

  useEffect(() => {
    // Only load class grading blocks if we have a selected exam
    if (selectedExam) {
      loadClassGradingBlocks();
    }
  }, [selectedExam, loadClassGradingBlocks]);

  // Load detailed grading data for selected class
  const loadClassGradingData = useCallback(
    async (classBlock: ClassGradingBlock, useGrid: boolean = false) => {
      if (classBlock.subjects.length === 0) {
        console.warn('No exam schedule found for this class');
        return;
      }

      setIsLoadingGradingData(true);
      try {
        // First get the exam schedule ID for this class and exam
        const schedulesResponse =
          await examScheduleService.getExamSchedulesByCalendarEntry(
            selectedExam!.id,
          );

        let scheduleId: string | null = null;
        if (schedulesResponse?.success && schedulesResponse.data) {
          const schedule = (schedulesResponse.data as any[]).find(
            sched => sched?.class?.id === classBlock.id,
          );
          scheduleId = schedule?.id || null;
        }

        if (!scheduleId) {
          toast.error('Exam schedule not found for this class');
          return;
        }

        const gradingData = await gradingService.getClassGradingData(
          classBlock.id,
          selectedExam!.id,
          scheduleId,
        );

        if (gradingData.success) {
          setClassGradingData(gradingData.data);
          setSelectedClass(classBlock);
          setSelectedSubject(null);
          setUseGridInterface(useGrid);
          setExamScheduleId(scheduleId);
        }
      } catch (err) {
        console.warn('Failed to load class grading data:', err);
      } finally {
        setIsLoadingGradingData(false);
      }
    },
    [selectedExam],
  );

  // Handle back to class selection
  const handleBackToClasses = () => {
    setSelectedClass(null);
    setSelectedSubject(null);
    setClassGradingData(null);
    setUseGridInterface(false);
    setExamScheduleId(null);
  };

  // Filter class blocks based on search
  const filteredClassBlocks = classGradingBlocks.filter(
    block =>
      `${block.grade}${block.section}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      block.subjects.some(
        subject =>
          subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.code.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSubjectStatusColor = (gradedCount: number, totalCount: number) => {
    if (gradedCount === totalCount && totalCount > 0)
      return 'text-green-600 bg-green-100';
    if (gradedCount > 0) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className='space-y-6'>
      {/* Header - only show when not grading */}
      {!selectedClass && (
        <div className='flex justify-between items-center'>
          <div>
            <SectionTitle text='Class-wise Grading' />
            <p className='text-gray-500 text-sm mt-1'>
              Grade students by class blocks for each subject exam
            </p>
          </div>
          <div className='flex items-center space-x-3'>
            <Button
              onClick={() => setIsPrintReportsModalOpen(true)}
              disabled={!selectedExam}
              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center'
            >
              <FileText className='h-4 w-4 mr-2' />
              Print Reports
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filters - only show when not grading */}
      {!selectedClass && (
        <Card className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <Label>Search Classes/Subjects</Label>
              <div className='relative'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search by class or subject...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div>
              <Label>Select Exam</Label>
              <select
                value={selectedExam?.id || ''}
                onChange={e => {
                  const exam = examEntries.find(ex => ex.id === e.target.value);
                  setSelectedExam(exam || null);
                }}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Select an exam...</option>
                {examEntries.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.startDate.toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Academic Year</Label>
              <Input
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
                placeholder='2024-2025'
              />
            </div>
          </div>
        </Card>
      )}

      {/* Class Grading Blocks */}
      {selectedExam && !selectedClass ? (
        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Grading for: {selectedExam.name}
            </h3>
            <div className='text-sm text-gray-500'>
              {filteredClassBlocks.length} classes found
            </div>
          </div>

          {isLoading ? (
            <Card className='p-8'>
              <div className='text-center'>
                <Clock className='mx-auto h-8 w-8 text-gray-400 animate-spin mb-4' />
                <p className='text-gray-500'>Loading grading data...</p>
              </div>
            </Card>
          ) : filteredClassBlocks.length === 0 ? (
            <Card className='p-8'>
              <div className='text-center'>
                <GraduationCap className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No Classes Found
                </h3>
                <p className='text-gray-500'>
                  {searchTerm
                    ? 'No classes match your search criteria'
                    : 'No classes available for grading in this exam'}
                </p>
              </div>
            </Card>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {filteredClassBlocks.map(classBlock => (
                <Card
                  key={classBlock.id}
                  className='p-6 hover:shadow-lg transition-shadow'
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div>
                      <h4 className='text-lg font-semibold text-gray-900'>
                        Class {classBlock.grade}
                        {classBlock.section}
                      </h4>
                      <p className='text-sm text-gray-500'>
                        {classBlock.totalStudents} students
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(classBlock.status)}`}
                    >
                      {classBlock.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Class Overview Stats */}
                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {classBlock.gradedStudents}
                      </div>
                      <div className='text-xs text-gray-500'>Graded</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {classBlock.pendingStudents}
                      </div>
                      <div className='text-xs text-gray-500'>Pending</div>
                    </div>
                  </div>

                  {/* Subjects List */}
                  <div className='space-y-3'>
                    <h5 className='text-sm font-medium text-gray-700'>
                      Subjects:
                    </h5>
                    {classBlock.subjects.length > 0 ? (
                      classBlock.subjects.map(subject => (
                        <div
                          key={subject.id}
                          className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'
                        >
                          <div className='flex-1'>
                            <div className='font-medium text-sm text-gray-900'>
                              {subject.name}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {subject.code} • Max: {subject.maxMarks} • Pass:{' '}
                              {subject.passMarks}
                            </div>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getSubjectStatusColor(subject.gradedCount, subject.totalCount)}`}
                            >
                              {subject.gradedCount}/{subject.totalCount}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                        <div className='flex items-center'>
                          <AlertTriangle className='h-4 w-4 text-yellow-600 mr-2' />
                          <span className='text-sm text-yellow-800'>
                            No exam schedule created for this class yet
                          </span>
                        </div>
                        <p className='text-xs text-yellow-600 mt-1'>
                          Create an exam timetable first in the "Exam Timetable"
                          tab
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Class Action Buttons */}
                  <div className='mt-4 pt-4 border-t border-gray-200 space-y-2'>
                    {classBlock.subjects.length > 0 ? (
                      <>
                        <Button
                          onClick={() => loadClassGradingData(classBlock, true)}
                          className='w-full flex items-center justify-center bg-green-600 text-white hover:bg-green-700'
                        >
                          <BarChart3 className='w-4 h-4 mr-2' />
                          Grid Grade Class {classBlock.grade}
                          {classBlock.section}
                        </Button>
                        <Button
                          onClick={() =>
                            loadClassGradingData(classBlock, false)
                          }
                          className='w-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700'
                        >
                          <Eye className='w-4 h-4 mr-2' />
                          Subject-wise Grading
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={onSwitchToTimetable}
                        className='w-full flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600'
                      >
                        <Calendar className='w-4 h-4 mr-2' />
                        Create Schedule
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : !selectedClass ? (
        <Card className='p-8'>
          <div className='text-center'>
            <BookOpen className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Select an Exam
            </h3>
            <p className='text-gray-500'>
              Choose an exam from the dropdown above to start grading students
            </p>
          </div>
        </Card>
      ) : null}

      {/* Show grading interface for selected class */}
      {selectedClass && (
        <div className='space-y-6'>
          {/* Header with back button */}
          <Card className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <Button
                  onClick={handleBackToClasses}
                  className='flex items-center bg-gray-500 text-white hover:bg-gray-600'
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Back to Classes
                </Button>
                <div>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    {useGridInterface ? 'Grid Grade' : 'Grade'} Class{' '}
                    {selectedClass.grade}
                    {selectedClass.section}
                  </h2>
                  <p className='text-sm text-gray-500'>
                    {selectedExam?.name} • {selectedClass.totalStudents}{' '}
                    students
                  </p>
                </div>
                {!useGridInterface && (
                  <Button
                    onClick={() => setUseGridInterface(true)}
                    className='flex items-center bg-green-600 text-white hover:bg-green-700'
                  >
                    <BarChart3 className='w-4 h-4 mr-2' />
                    Switch to Grid View
                  </Button>
                )}
                {useGridInterface && (
                  <Button
                    onClick={() => setUseGridInterface(false)}
                    className='flex items-center bg-blue-600 text-white hover:bg-blue-700'
                  >
                    <Eye className='w-4 h-4 mr-2' />
                    Switch to Subject View
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Loading state */}
          {isLoadingGradingData ? (
            <Card className='p-8'>
              <div className='text-center'>
                <Clock className='mx-auto h-8 w-8 text-gray-400 animate-spin mb-4' />
                <p className='text-gray-500'>Loading grading data...</p>
              </div>
            </Card>
          ) : classGradingData ? (
            <>
              {useGridInterface ? (
                /* Grid Grading Interface */
                <GridGradingInterface
                  classId={selectedClass.id}
                  examScheduleId={examScheduleId!}
                  calendarEntryId={selectedExam!.id}
                  onBack={handleBackToClasses}
                  onSuccess={() => {
                    loadClassGradingData(selectedClass, true);
                    loadClassGradingBlocks();
                  }}
                />
              ) : (
                <>
                  {/* Subject Selection */}
                  <Card className='p-6'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                      Select Subject to Grade
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
                      {classGradingData.subjects.map(subject => (
                        <div
                          key={subject.id}
                          onClick={() => setSelectedSubject(subject.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedSubject === subject.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className='flex justify-between items-start mb-2'>
                            <div>
                              <h4 className='font-medium text-gray-900'>
                                {subject.name}
                              </h4>
                              <p className='text-sm text-gray-500'>
                                {subject.code}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='text-sm font-medium text-gray-700'>
                                Max: {subject.maxMarks} • Pass:{' '}
                                {subject.passMarks}
                              </p>
                            </div>
                          </div>
                          <div className='flex justify-between text-xs text-gray-600'>
                            <span>
                              Graded:{' '}
                              {
                                classGradingData.students.filter(s =>
                                  s.results.some(
                                    r => r.examSlot.subject?.id === subject.id,
                                  ),
                                ).length
                              }
                            </span>
                            <span>
                              Pending:{' '}
                              {
                                classGradingData.students.filter(
                                  s =>
                                    !s.results.some(
                                      r =>
                                        r.examSlot.subject?.id === subject.id,
                                    ),
                                ).length
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Student Grading Interface */}
                  {selectedSubject && (
                    <GradingInterface
                      classData={classGradingData}
                      selectedSubject={selectedSubject}
                      onSuccess={() => {
                        loadClassGradingData(selectedClass, false);
                        loadClassGradingBlocks();
                      }}
                    />
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Print Reports Modal */}
      <PrintReportsModal
        isOpen={isPrintReportsModalOpen}
        onClose={() => setIsPrintReportsModalOpen(false)}
        selectedExam={selectedExam}
        academicYear={selectedAcademicYear}
      />
    </div>
  );
}

// Exam Timetable Tab with integrated schedule builder
function ExamTimetableTab() {
  return (
    <div>
      {/* Integrated Exam Schedule Builder */}
      <div className='bg-white rounded-lg shadow'>
        <div className='p-0'>
          {/* Using dynamic import to avoid server-side rendering issues with Zustand store */}
          <div className='w-full'>
            {(() => {
              const {
                ExamScheduleBuilder,
              } = require('@/components/exam-schedule');
              return <ExamScheduleBuilder />;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamSummaryCards() {
  const cards = [
    {
      label: 'Upcoming Exams',
      value: 8,
      icon: CalendarDays,
      bgColor: 'bg-blue-100',
      iconColor: 'text-white',
      change: '+2',
      isPositive: true,
    },
    {
      label: 'Completed Exams',
      value: 24,
      icon: CheckCircle2,
      bgColor: 'bg-green-100',
      iconColor: 'text-white',
      change: '+5',
      isPositive: true,
    },
    {
      label: 'Pending Grading',
      value: 12,
      icon: Clock,
      bgColor: 'bg-orange-100',
      iconColor: 'text-white',
      change: '-3',
      isPositive: false,
    },
    {
      label: 'Total Students',
      value: 2847,
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-white',
      change: '+120',
      isPositive: true,
    },
  ];
  return (
    <div className='flex flex-wrap gap-x-6 gap-y-6 w-full mb-8'>
      {cards.map(c => (
        <StatCard
          key={c.label}
          icon={c.icon}
          bgColor={c.bgColor}
          iconColor={c.iconColor}
          label={c.label}
          value={c.value}
          change={c.change}
          isPositive={c.isPositive}
          className='flex-1 min-w-[220px]'
        />
      ))}
    </div>
  );
}

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Tab configuration for GenericTabs
  const tabs = [
    {
      name: 'Grading',
      icon: <BarChart3 className='h-4 w-4 mr-2' />,
      content: <GradingTab onSwitchToTimetable={() => setActiveTab(1)} />,
    },
    {
      name: 'Exam Timetable',
      icon: <Calendar className='h-4 w-4 mr-2' />,
      content: <ExamTimetableTab />,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Exam Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage Exam Grading and Timetables
          </p>
        </div>
      </div>

      <div className='pt-3'>
        <div className='w-full'>
          <ExamSummaryCards />
        </div>
      </div>

      <div className='px-1 sm:px-2 lg:px-4 pb-6'>
        <div className='max-w-7xl mx-auto'>
          <GenericTabs
            tabs={tabs}
            selectedIndex={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}
