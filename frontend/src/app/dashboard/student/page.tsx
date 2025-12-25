'use client';

interface StudentSubject {
  subject: {
    id: string;
    name: string;
    code: string;
    description?: string;
    maxMarks?: number;
    passMarks?: number;
  };
}
// Simple mock for today's classes: subject and teacher only
interface SubjectTeacher {
  subject: string;
  teacher: string;
}

import React, { useState, useEffect } from 'react';
import { PageLoader } from '@/components/atoms/loading';
import { useRouter } from 'next/navigation';
import Panel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import { useCalendarEvents } from '@/components/organisms/calendar/hooks/useCalendarEvents';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import Button from '@/components/atoms/form-controls/Button';
import MarkAttendanceModal from '@/components/organisms/modals/MarkAttendanceModal';
import ViewAssignmentModal from '@/components/organisms/modals/ViewAssignmentModal';
import {
  BookOpen,
  FlaskConical,
  Calculator,
  Users,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
  User,
  Info,
} from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/api/services/student.service';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService } from '@/api/services/submission.service';
import { TodaysClasses } from '@/components/dashboard/TodaysClasses';

// Mock data for demonstration (keeping only what's still needed)
const subjects: StudentSubject[] = [
  {
    subject: {
      id: '1',
      name: 'Mathematics',
      code: 'MATH',
      maxMarks: 100,
      passMarks: 40,
    },
  },
  {
    subject: {
      id: '2',
      name: 'Science',
      code: 'SCI',
      maxMarks: 100,
      passMarks: 40,
    },
  },
  {
    subject: {
      id: '3',
      name: 'English',
      code: 'ENG',
      maxMarks: 100,
      passMarks: 40,
    },
  },
  {
    subject: {
      id: '4',
      name: 'Social Studies',
      code: 'SOC',
      maxMarks: 100,
      passMarks: 40,
    },
  },
  {
    subject: {
      id: '5',
      name: 'Nepali',
      code: 'NEP',
      maxMarks: 100,
      passMarks: 40,
    },
  },
];

// Example events and notices (for further UI expansion)
const assignments = [
  {
    title: 'An essay about Railway in Nepal (minimum 300 words)',
    subject: 'Science',
    className: 'Class 10 - A',
    submissions: '28/30 Submissions',
    status: 'submitted',
  },
  {
    title: 'Mathematics Problem Set Chapter 5',
    subject: 'Mathematics',
    className: 'Class 10 - A',
    submissions: '25/30 Submissions',
    status: 'unsubmitted',
  },
  {
    title: 'English Essay - My Future Goals',
    subject: 'English',
    className: 'Class 10 - A',
    submissions: '27/30 Submissions',
    status: 'submitted',
  },
];
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
export default function Page() {
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [unsubmittedAssignments, setUnsubmittedAssignments] = useState<any[]>(
    [],
  );
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [showColorLegend, setShowColorLegend] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

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

  // Check if we have cached student profile in localStorage
  const getCachedStudentProfile = () => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(`student_profile_${user?.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Check if data is less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      } catch (error) {
        localStorage.removeItem(`student_profile_${user?.id}`);
      }
    }
    return null;
  };

  // Cache student profile in localStorage
  const setCachedStudentProfile = (data: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      `student_profile_${user?.id}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  };

  // Fetch student profile data only if not cached
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // First check cached data
      const cached = getCachedStudentProfile();
      if (cached) {
        setStudentProfile(cached);
        setLoading(false);
        return;
      }

      // If no cache, fetch from API
      try {
        setLoading(true);
        const response = await studentService.getStudentByUserId(user.id);
        if (response.success && response.data) {
          setStudentProfile(response.data);
          setCachedStudentProfile(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch student profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [user?.id]);

  // Fetch unsubmitted assignments
  useEffect(() => {
    const fetchUnsubmittedAssignments = async () => {
      if (!studentProfile?.id || !studentProfile?.classId) {
        return;
      }

      try {
        setAssignmentsLoading(true);

        // Get all assignments for the student's class
        const assignmentsResponse =
          await assignmentService.getAssignmentsByClass(studentProfile.classId);
        if (!assignmentsResponse.success || !assignmentsResponse.data) {
          setUnsubmittedAssignments([]);
          return;
        }

        // Get all submissions for this student
        const submissionsResponse =
          await submissionService.getSubmissionsByStudent(studentProfile.id);
        const studentSubmissions = submissionsResponse.success
          ? submissionsResponse.data
          : [];

        // Find assignments without submissions
        const submittedAssignmentIds = new Set(
          studentSubmissions.map((submission: any) => submission.assignmentId),
        );

        const unsubmitted = assignmentsResponse.data
          .filter(
            (assignment: any) => !submittedAssignmentIds.has(assignment.id),
          )
          .filter((assignment: any) => {
            // Only show non-overdue assignments or assignments overdue by max 1 day
            if (!assignment.dueDate) return true;
            const dueDate = new Date(assignment.dueDate);
            const now = new Date();
            const daysDiff = Math.floor(
              (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            return daysDiff <= 7; // Show assignments due within next 7 days or overdue by max 1 day only
          })
          .sort((a: any, b: any) => {
            // Sort by due date (upcoming first, then overdue by 1 day)
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return (
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
          })
          .slice(0, 5); // Show max 5 assignments

        setUnsubmittedAssignments(unsubmitted);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        setUnsubmittedAssignments([]);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchUnsubmittedAssignments();
  }, [studentProfile?.id, studentProfile?.classId]);

  // Student info - prioritize cached/fetched profile, fallback to auth user
  let formattedClass = 'Class 10 A';
  if (studentProfile) {
    if (studentProfile.class && studentProfile.class.grade) {
      formattedClass =
        `Grade ${studentProfile.class.grade} ${studentProfile.class.section || ''}`.trim();
    } else if (studentProfile.className && studentProfile.className !== '') {
      formattedClass = studentProfile.className;
    }
  }
  const student = studentProfile
    ? {
        name:
          studentProfile.fullName ||
          `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.trim() ||
          user?.full_name ||
          'Student',
        className: formattedClass,
        rollNumber: studentProfile.rollNumber || 'N/A',
      }
    : {
        name: user?.full_name || 'Student',
        className: formattedClass,
        rollNumber: 'N/A',
      };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <SectionTitle
          text='Student Dashboard'
          level={1}
          className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'
        />
        <div className='mb-2'>
          <h1 className='text-xl sm:text-2xl font-bold text-gray-900'>
            Hello, {student.name} 👋
          </h1>
          <p className='text-gray-700 text-base'>
            {student.className} • Roll No: {student.rollNumber}
          </p>
        </div>
        <Label className='text-xs cursor-pointer sm:text-sm lg:text-base text-gray-600 mt-1'>
          Welcome back, view your classes, assignments, and school info.
        </Label>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='w-full space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Top metrics via Statsgrid solid variant */}
          {/* Top metrics section removed for cleanup. Add back if needed. */}

          {/* Assignment Reminder CTA */}
          {(() => {
            // Only count non-overdue pending assignments
            const pendingAssignments = unsubmittedAssignments.filter(
              (assignment: any) =>
                !assignment.dueDate ||
                new Date(assignment.dueDate) >= new Date(),
            );

            if (pendingAssignments.length > 0) {
              // Show pending assignments
              return (
                <div className='rounded-xl border border-blue-200 bg-blue-50/60'>
                  <div className='px-4 py-2 space-y-1 flex flex-col items-start justify-start'>
                    <Label className='!text-[11px] text-gray-600'>
                      Don't forget!
                    </Label>
                    <Label className='!text-[12px] sm:!text-sm !text-foreground'>
                      Complete your pending assignment
                      {pendingAssignments.length > 1 ? 's' : ''}
                    </Label>
                  </div>
                  <div className='px-3 pb-3'>
                    <div
                      className='bg-blue-600/90 text-white rounded-md py-2 text-center shadow-sm hover:bg-blue-400 cursor-pointer flex items-center justify-center px-3'
                      onClick={() =>
                        router.push(
                          '/dashboard/student/assignments?filter=pending',
                        )
                      }
                    >
                      <span className='w-full font-semibold text-white text-xs'>
                        View Task{pendingAssignments.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            } else {
              // All assignments submitted
              return (
                <div className='rounded-xl border border-green-200 bg-green-50/60'>
                  <div className='px-4 py-3 flex flex-col items-center justify-center text-center'>
                    <Label className='!text-[11px] text-green-600 font-medium'>
                      Great job!
                    </Label>
                    <Label className='!text-[12px] sm:!text-sm !text-foreground'>
                      All assignments submitted !
                    </Label>
                  </div>
                </div>
              );
            }
          })()}

          {/* Today Classes - Real Data */}
          <TodaysClasses
            classId={studentProfile?.classId || ''}
            className={student.className}
          />
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <SectionTitle
                text='My Assignments'
                level={3}
                className='text-sm font-semibold text-gray-700'
              />
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => setShowColorLegend(!showColorLegend)}
                  className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
                  title='Color Legend'
                >
                  <Info className='w-4 h-4' />
                </button>
                <span
                  className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'
                  onClick={() => router.push('/dashboard/student/assignments')}
                >
                  View All
                </span>
              </div>
            </div>

            {/* Color Legend - Collapsible */}
            {showColorLegend && (
              <div className='flex items-center gap-4 text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200'>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 rounded-full bg-blue-200 border border-blue-300'></div>
                  <span>Normal</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 rounded-full bg-yellow-200 border border-yellow-300'></div>
                  <span>Urgent (1-2 days)</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 rounded-full bg-red-200 border border-red-300'></div>
                  <span>Overdue (1 day)</span>
                </div>
              </div>
            )}

            {assignmentsLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                <span className='ml-2 text-sm text-gray-600'>
                  Loading assignments...
                </span>
              </div>
            ) : unsubmittedAssignments.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 bg-green-50 rounded-lg border border-green-200'>
                <div className='text-green-600 mb-2'>
                  <CheckCircle className='w-12 h-12' />
                </div>
                <h3 className='text-lg font-semibold text-green-800 mb-1'>
                  All caught up!{' '}
                </h3>
                <p className='text-sm text-green-600 text-center'>
                  No pending assignments. Great work keeping up with your
                  studies!
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                {unsubmittedAssignments.map((assignment: any) => {
                  const isOverdue =
                    assignment.dueDate &&
                    new Date(assignment.dueDate) < new Date();
                  const daysUntilDue = assignment.dueDate
                    ? Math.ceil(
                        (new Date(assignment.dueDate).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : null;

                  const dueDateDisplay = assignment.dueDate
                    ? new Date(assignment.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year:
                          new Date(assignment.dueDate).getFullYear() !==
                          new Date().getFullYear()
                            ? 'numeric'
                            : undefined,
                      })
                    : 'No due date';

                  const statusText = isOverdue
                    ? 'Overdue'
                    : daysUntilDue !== null && daysUntilDue === 0
                      ? 'Due Today'
                      : daysUntilDue !== null && daysUntilDue === 1
                        ? 'Due Tomorrow'
                        : daysUntilDue !== null && daysUntilDue > 1
                          ? `Due in ${daysUntilDue} days`
                          : 'Pending';

                  // Determine colors and icons based on status
                  let statusColor = 'bg-blue-100 text-blue-700 border-blue-200';
                  let iconColor = 'text-blue-600';
                  let bgGradient = 'from-blue-50 to-blue-100';
                  let borderColor = 'border-blue-200';
                  let UrgencyIcon = Clock;

                  if (isOverdue) {
                    statusColor = 'bg-red-100 text-red-700 border-red-200';
                    iconColor = 'text-red-600';
                    bgGradient = 'from-red-50 to-red-100';
                    borderColor = 'border-red-200';
                    UrgencyIcon = AlertCircle;
                  } else if (daysUntilDue !== null && daysUntilDue <= 2) {
                    statusColor =
                      'bg-yellow-100 text-yellow-700 border-yellow-200';
                    iconColor = 'text-yellow-600';
                    bgGradient = 'from-yellow-50 to-yellow-100';
                    borderColor = 'border-yellow-200';
                    UrgencyIcon = AlertCircle;
                  }

                  return (
                    <div
                      key={assignment.id}
                      className={`relative overflow-hidden rounded-xl border ${borderColor} bg-gradient-to-br ${bgGradient} p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setIsAssignmentModalOpen(true);
                      }}
                    >
                      {/* Status Badge */}
                      <div className='absolute top-2 right-2'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}
                        >
                          <UrgencyIcon className='w-3 h-3 mr-0.5' />
                          <span className='hidden sm:inline'>{statusText}</span>
                          <span className='sm:hidden'>
                            {isOverdue
                              ? '!'
                              : daysUntilDue !== null && daysUntilDue <= 2
                                ? '!'
                                : '•'}
                          </span>
                        </span>
                      </div>

                      {/* Assignment Icon */}
                      <div className='flex items-start space-x-2 mb-3'>
                        <div
                          className={`p-1.5 rounded-lg bg-white/80 ${iconColor} flex-shrink-0`}
                        >
                          <FileText className='w-4 h-4' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors'>
                            {assignment.title || 'Untitled Assignment'}
                          </h3>
                        </div>
                      </div>

                      {/* Subject and Class Info */}
                      <div className='mb-3 space-y-1.5'>
                        <div className='flex items-center text-xs text-gray-600'>
                          <BookOpen className='w-3 h-3 mr-1' />
                          <span className='font-medium truncate'>
                            {assignment.subject?.name || 'Unknown Subject'}
                          </span>
                          <span className='mx-1'>•</span>
                          <span className='truncate'>
                            {assignment.class?.grade || ''}
                            {assignment.class?.section || ''}
                          </span>
                        </div>

                        <div className='flex items-center text-xs text-gray-600'>
                          <User className='w-3 h-3 mr-1' />
                          <span className='truncate'>
                            {assignment.teacher?.user?.fullName ||
                              'Unknown Teacher'}
                          </span>
                        </div>
                      </div>

                      {/* Due Date and Action */}
                      <div className='flex items-center justify-between pt-2 border-t border-white/50'>
                        <div className='flex items-center text-xs text-gray-600'>
                          <Calendar className='w-3 h-3 mr-1' />
                          <span className='font-medium truncate'>
                            Due: {dueDateDisplay}
                          </span>
                        </div>

                        <button
                          className='px-2 py-1 text-xs font-medium rounded-md bg-white/80 text-gray-700 hover:bg-white transition-colors border border-white/60 group-hover:border-blue-300 group-hover:text-blue-700 flex-shrink-0 cursor-pointer'
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedAssignment(assignment);
                            setIsAssignmentModalOpen(true);
                          }}
                        >
                          View
                        </button>
                      </div>

                      {/* Progress indicator for overdue assignments */}
                      {isOverdue && (
                        <div className='absolute bottom-0 left-0 right-0 h-1 bg-red-200'>
                          <div className='h-full bg-red-500 animate-pulse'></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Events and My Subjects */}
          <div className='grid grid-cols-1 lg:grid-cols-1 gap-6'>
            <div className='lg:col-span-8'>
              <Panel
                variant='list-cards'
                title='Upcoming Events'
                maxEvents={3}
                className='!bg-transparent !border-0 !p-0 !rounded-none !shadow-none'
                events={mappedEvents}
                viewAllHref={'/dashboard/student/academics/calendar'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedAssignment && (
        <ViewAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => {
            setIsAssignmentModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          userRole={user?.role}
        />
      )}
    </div>
  );
}
