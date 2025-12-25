'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '@/api/services/assignment.service';
import { AssignmentResponse, SubmissionResponse } from '@/api/types/assignment';
import Panel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import { useCalendarEvents } from '@/components/organisms/calendar/hooks/useCalendarEvents';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import Button from '@/components/atoms/form-controls/Button';
import MarkAttendanceModal from '@/components/organisms/modals/MarkAttendanceModal';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/atoms/display/Icon';
import {
  BookOpen,
  FlaskConical,
  Calculator,
  Users,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/atoms/loading';

interface TeacherSubject {
  subject: {
    id: string;
    name: string;
    code: string;
    description?: string;
    maxMarks?: number;
    passMarks?: number;
  };
}

interface TeacherClass {
  class: {
    id: string;
    grade: number;
    section: string;
    capacity?: number;
    status?: string;
    currentEnrollment?: number;
  };
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  // Fetch all calendar events (exams, holidays, events)
  const { events: calendarEvents } = useCalendarEvents({ page: 1, limit: 50 });
  // Map backend events to UpcomingEventsPanel's Event type
  const mappedEvents = calendarEvents.map(ev => ({
    id: ev.id,
    title: ev.title || ev.name || 'Untitled Event',
    date: ev.date,
    endDate: ev.endDate,
    time: ev.time || ev.startTime || '',
    location: ev.location || ev.venue || '',
    status: typeof ev.status === 'string' ? ev.status : 'Active',
    type: ev.type || 'event',
  }));
  const router = useRouter();
  const [showAttendance, setShowAttendance] = useState(false);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [mainLoading, setMainLoading] = useState(true);

  // Class teacher status and attendance tracking
  const [classTeacherStatus, setClassTeacherStatus] = useState<{
    isClassTeacher: boolean;
    classDetails: {
      id: string;
      grade: number;
      section: string;
      currentEnrollment: number;
    } | null;
    attendanceTakenToday: boolean;
    message: string;
  } | null>(null);
  const [classTeacherStatusLoading, setClassTeacherStatusLoading] =
    useState(true);

  // Main page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const loadSubjects = useCallback(async () => {
    if (!user?.id) {
      setSubjectsLoading(false);
      return;
    }

    try {
      setSubjectsLoading(true);
      const response = await teacherService.getMySubjects();
      setSubjects(response.data);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setSubjectsLoading(false);
    }
  }, [user]);

  const loadClasses = useCallback(async () => {
    if (!user?.id) {
      setClassesLoading(false);
      return;
    }

    try {
      setClassesLoading(true);
      const response = await teacherService.getMyClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setClassesLoading(false);
    }
  }, [user]);

  const loadClassTeacherStatus = useCallback(async () => {
    if (!user?.id) {
      setClassTeacherStatusLoading(false);
      return;
    }

    try {
      setClassTeacherStatusLoading(true);
      const response = await teacherService.getClassTeacherStatus();
      setClassTeacherStatus(response.data);
    } catch (error) {
      console.error('Failed to load class teacher status:', error);
      setClassTeacherStatus({
        isClassTeacher: false,
        classDetails: null,
        attendanceTakenToday: false,
        message: 'Error loading status',
      });
    } finally {
      setClassTeacherStatusLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubjects();
    loadClasses();
    loadClassTeacherStatus();
  }, [loadSubjects, loadClasses, loadClassTeacherStatus]);

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/teacher/academics/classes/${classId}`);
  };

  const [assignments, setAssignments] = useState<
    {
      title: string;
      subject: string;
      className: string;
      submissions: string;
      onClick: () => void;
    }[]
  >([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  // Load assignments needing grading
  useEffect(() => {
    const loadAssignmentsToGrade = async () => {
      if (!user?.id) {
        setAssignmentsLoading(false);
        return;
      }
      try {
        setAssignmentsLoading(true);
        // Get teacherId from teacherService
        const teacherRes = await teacherService.getCurrentTeacher();
        const teacherId = teacherRes.data.id;
        // Get assignments for this teacher
        const res = await assignmentService.getAssignmentsByTeacher(teacherId);
        // Filter assignments with pending/ungraded submissions
        const filtered = (res.data || []).filter((a: AssignmentResponse) => {
          if (Array.isArray(a.submissions)) {
            return (a.submissions as SubmissionResponse[]).some(
              (sub: SubmissionResponse) => !sub.isCompleted,
            );
          }
          return true;
        });
        // Map to Statsgrid assignment format
        setAssignments(
          filtered.map((a: AssignmentResponse) => ({
            title: a.title,
            subject: a.subject?.name || '',
            className: `Grade ${a.class?.grade || ''} - ${a.class?.section || ''}`,
            submissions: `${a._count?.submissions || 0}/${a.class?.students?.length || 0} Submissions`,
            onClick: () =>
              router.push(`/dashboard/teacher/academics/assignments/${a.id}`),
          })),
        );
      } catch (err) {
        setAssignments([]);
      } finally {
        setAssignmentsLoading(false);
      }
    };
    loadAssignmentsToGrade();
  }, [user, router]);

  // Calculate dynamic stats from real data
  const totalStudents = classes.reduce(
    (sum, c) => sum + (c.class.currentEnrollment || 0),
    0,
  );

  const statsData = [
    {
      value: classes.length.toString(),
      label: 'My Classes',
      change: classes.length > 0 ? 'As Class Teacher' : 'No assignments',
      color: 'bg-blue-600',
    },
    {
      value: totalStudents.toString(),
      label: 'Total Students',
      change: 'Across all classes',
      color: 'bg-green-600',
    },
    {
      value: subjects.length.toString(),
      label: 'My Subjects',
      change: subjects.length > 0 ? 'Teaching subjects' : 'No assignments',
      color: 'bg-orange-600',
    },
    {
      value: Math.round(totalStudents / Math.max(classes.length, 1)).toString(),
      label: 'Avg Class Size',
      change: 'Students per class',
      color: 'bg-purple-600',
    },
  ];

  // Transform subjects for display - original Panel format
  const assignedSubjects = subjects.map(subjectItem => ({
    id: subjectItem.subject.id,
    label: subjectItem.subject.name,
    code: subjectItem.subject.code,
    icon: subjectItem.subject.name.toLowerCase().includes('science')
      ? FlaskConical
      : subjectItem.subject.name.toLowerCase().includes('math')
        ? Calculator
        : BookOpen,
  }));

  if (mainLoading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <SectionTitle
          text='Teacher Dashboard'
          level={1}
          className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'
        />
        <Label className='text-xs cursor-pointer sm:text-sm lg:text-base text-gray-600 mt-1'>
          Welcome back, manage your classes efficiently.
        </Label>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='w-full space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Top metrics via Statsgrid solid variant */}
          {classesLoading || subjectsLoading ? (
            <div className='animate-pulse'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className='h-24 bg-gray-200 rounded-lg'></div>
                ))}
              </div>
            </div>
          ) : (
            <Statsgrid
              variant='solid'
              stats={statsData.map(s => ({
                icon: () => null as React.ReactNode,
                bgColor: s.color,
                iconColor: '',
                value: s.value,
                label: s.label,
                change: s.change,
                isPositive: true,
              }))}
            />
          )}

          {/* Attendance CTA - Only show if teacher is a class teacher */}
          {classTeacherStatusLoading ? (
            <div className='rounded-xl border border-gray-200 bg-gray-50 animate-pulse'>
              <div className='px-4 py-6'>
                <div className='h-4 bg-gray-300 rounded w-1/2 mb-2'></div>
                <div className='h-3 bg-gray-300 rounded w-3/4'></div>
              </div>
            </div>
          ) : classTeacherStatus?.isClassTeacher ? (
            <div
              className={`rounded-xl border ${
                classTeacherStatus.attendanceTakenToday
                  ? 'border-green-200 bg-green-50/60'
                  : 'border-blue-200 bg-blue-50/60'
              }`}
            >
              <div className='px-4 py-2 space-y-1 flex flex-col items-start justify-start'>
                <Label className='!text-[11px] text-gray-600'>
                  {classTeacherStatus.attendanceTakenToday
                    ? '✅ Attendance completed for today!'
                    : '📋 Time to mark attendance'}
                </Label>
                <Label className='!text-[12px] sm:!text-sm !text-foreground'>
                  Grade {classTeacherStatus.classDetails?.grade}-
                  {classTeacherStatus.classDetails?.section} (
                  {classTeacherStatus.classDetails?.currentEnrollment} students)
                </Label>
              </div>
              {!classTeacherStatus.attendanceTakenToday && (
                <div className='px-3 pb-3'>
                  <div className='bg-blue-600/90 text-white rounded-md py-2 text-center shadow-sm hover:bg-blue-400'>
                    <div className='flex items-center justify-center px-3'>
                      <Button
                        className='text-white rounded-md text-xs cursor-pointer font-semibold'
                        label='Mark Attendance'
                        onClick={() => setShowAttendance(true)}
                      />
                    </div>
                  </div>
                </div>
              )}
              {classTeacherStatus.attendanceTakenToday && (
                <div className='px-3 pb-3'>
                  <div className='bg-green-600/90 text-white rounded-md py-2 text-center shadow-sm'>
                    <div className='flex items-center justify-center px-3'>
                      <Label className='text-white text-xs font-semibold'>
                        All set for today! 🎉
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Your Classes */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <SectionTitle
                text='Your Classes:'
                level={3}
                className='text-sm font-semibold text-gray-700'
              />
              <Link href='/dashboard/teacher/academics/classes'>
                <Label className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'>
                  View All
                </Label>
              </Link>
            </div>
            {classesLoading ? (
              <div className='animate-pulse'>
                <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3'>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className='h-16 bg-gray-200 rounded-lg'></div>
                  ))}
                </div>
              </div>
            ) : classes.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3'>
                {classes.slice(0, 8).map(classItem => (
                  <div
                    key={classItem.class.id}
                    onClick={() => handleClassClick(classItem.class.id)}
                    className='bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group p-3'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700'>
                        {classItem.class.currentEnrollment
                          ? `${classItem.class.currentEnrollment}/${classItem.class.capacity || 30}`
                          : '0/30'}
                      </div>
                      <ChevronRight className='w-3 h-3 text-gray-400 group-hover:text-blue-600 transition-colors' />
                    </div>

                    <div className='space-y-1'>
                      <h3 className='text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors'>
                        Grade {classItem.class.grade}-{classItem.class.section}
                      </h3>
                      <p className='text-xs text-gray-600'>Class Teacher</p>
                    </div>

                    <div className='mt-2 flex items-center gap-1'>
                      <Users className='w-3 h-3 text-gray-400' />
                      <span className='text-xs text-gray-600'>
                        {classItem.class.currentEnrollment || 0} students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-6 bg-gray-50 rounded-lg'>
                <p className='text-sm text-gray-500'>No classes assigned yet</p>
              </div>
            )}
          </div>

          {/* Assignments to grade */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <SectionTitle
                text='Assignments to grade'
                level={3}
                className='text-sm font-semibold text-gray-700'
              />
              <Label className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'>
                View All
              </Label>
            </div>
            {assignmentsLoading ? (
              <div className='animate-pulse'>
                <div className='grid grid-cols-2 lg:grid-cols-2 gap-3'>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className='h-16 bg-gray-200 rounded-lg'></div>
                  ))}
                </div>
              </div>
            ) : assignments.length > 0 ? (
              <Statsgrid
                variant='assignments'
                items={assignments}
                actionLabel='Learn More'
              />
            ) : (
              <div className='text-center py-6 bg-gray-50 rounded-lg'>
                <p className='text-sm text-gray-500'>No assignments to grade</p>
              </div>
            )}
          </div>

          {/* Events and My Subjects */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            <div className='lg:col-span-8'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <SectionTitle
                    text='Upcoming Events'
                    level={3}
                    className='text-sm font-semibold text-gray-700'
                  />
                  <Label className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'>
                    View All
                  </Label>
                </div>
                {mappedEvents.length > 0 ? (
                  <Panel
                    variant='list-cards'
                    title=''
                    maxEvents={3}
                    className='!bg-transparent !border-0 [&>div:first-child]:hidden p-6'
                    events={mappedEvents}
                  />
                ) : (
                  <div className='text-center py-6'>
                    <p className='text-sm text-gray-500'>No events to show</p>
                  </div>
                )}
              </div>
            </div>
            <div className='lg:col-span-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <SectionTitle
                    text='My Subjects'
                    level={3}
                    className='text-sm font-semibold text-gray-700'
                  />
                  <Label className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'>
                    View All
                  </Label>
                </div>
                {subjectsLoading ? (
                  <div className='animate-pulse'>
                    <div className='h-32 bg-gray-200 rounded-lg'></div>
                  </div>
                ) : assignedSubjects.length > 0 ? (
                  <Panel
                    variant='subjects'
                    title=''
                    className='!bg-transparent !border-0 [&>div:first-child]:hidden p-6'
                    subjects={assignedSubjects}
                  />
                ) : (
                  <div className='text-center py-6'>
                    <p className='text-sm text-gray-500'>
                      No subjects assigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MarkAttendanceModal
        isOpen={showAttendance}
        onClose={() => setShowAttendance(false)}
        selectedClass={
          classTeacherStatus?.classDetails
            ? {
                id: classTeacherStatus.classDetails.id,
                grade: `${classTeacherStatus.classDetails.grade}`,
                section: classTeacherStatus.classDetails.section,
                students: classTeacherStatus.classDetails.currentEnrollment,
              }
            : undefined
        }
        onSuccess={() => {
          // Refresh class teacher status after successful attendance marking
          loadClassTeacherStatus();
        }}
        restrictToToday={true}
      />
    </div>
  );
}
