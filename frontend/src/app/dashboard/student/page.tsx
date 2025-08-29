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
import {
  BookOpen,
  FlaskConical,
  Calculator,
  Users,
  ChevronRight,
} from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/api/services/student.service';

// Mock data for demonstration
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
const subjectsLoading = false;
// Add status/info for color logic
const classes: Array<
  SubjectTeacher & {
    status: 'completed' | 'upcoming' | 'pending';
    info?: string;
  }
> = [
  {
    subject: 'Mathematics',
    teacher: 'Ram Bahadur',
    status: 'completed',
  },
  {
    subject: 'Science',
    teacher: 'Hari Prasang',
    status: 'completed',
  },
  {
    subject: 'English',
    teacher: 'Sita Devi',
    status: 'upcoming',
  },
  { subject: 'Social Studies', teacher: 'Krishna Sharma', status: 'pending' },
  { subject: 'Nepali', teacher: 'Maya Gurung', status: 'pending' },
];
const classesLoading = false;
const handleClassClick = (classId: string) => {
  alert(`Go to class ${classId}`);
};

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
  const { user } = useAuth();
  const router = useRouter();

  // Fetch all calendar events (exams, holidays, events)
  const { events: calendarEvents } = useCalendarEvents({ page: 1, limit: 50 });

  // Map backend events to UpcomingEventsPanel's Event type
  const mappedEvents = calendarEvents.map(ev => ({
    id: ev.id,
    title: ev.title || ev.name || 'Untitled Event',
    date: ev.date,
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

  // Student info - prioritize cached/fetched profile, fallback to auth user
  const student = studentProfile
    ? {
        name:
          studentProfile.fullName ||
          `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.trim() ||
          user?.full_name ||
          'Student',
        class: studentProfile.className?.split(' ')[1] || '10',
        section: studentProfile.className?.split(' ')[2] || 'A',
        rollNumber: studentProfile.rollNumber || 'N/A',
      }
    : {
        name: user?.full_name || 'Student', // Use already stored auth data
        class: '10',
        section: 'A',
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
            Class {student.class}
            {student.section} • Roll No: {student.rollNumber}
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

          {/* Attendance CTA */}
          <div className='rounded-xl border border-blue-200 bg-blue-50/60'>
            <div className='px-4 py-2 space-y-1 flex flex-col items-start justify-start'>
              <Label className='!text-[11px] text-gray-600'>
                Don't forget!
              </Label>
              <Label className='!text-[12px] sm:!text-sm !text-foreground'>
                Complete your pending assignment
              </Label>
            </div>
            <div className='px-3 pb-3'>
              <div
                className='bg-blue-600/90 text-white rounded-md py-2 text-center shadow-sm hover:bg-blue-400 cursor-pointer flex items-center justify-center px-3'
                onClick={() =>
                  router.push('/dashboard/student/assignments?filter=pending')
                }
              >
                <span className='w-full font-semibold text-white text-xs'>
                  View Task
                </span>
              </div>
            </div>
          </div>

          {/* Today Classes */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <SectionTitle
                text='Todays Classes'
                level={3}
                className='text-sm font-semibold text-gray-700'
              />
              <span
                className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'
                onClick={() => router.push('/dashboard/student/subjects')}
              >
                View All
              </span>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3'>
              {classes.map(item => {
                let cardColor = 'bg-white';
                let textColor = 'text-gray-900';
                let infoColor = 'text-gray-600';
                if (item.status === 'completed') {
                  cardColor = 'bg-green-500';
                  textColor = 'text-white';
                  infoColor = 'text-white';
                } else if (item.info === 'in 10 min') {
                  cardColor = 'bg-blue-600';
                  textColor = 'text-white';
                  infoColor = 'text-white';
                }
                return (
                  <div
                    key={item.subject + item.teacher}
                    className={`${cardColor} rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group p-6 min-h-[120px] flex flex-col justify-between`}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      {item.info && (
                        <span className={`text-xs font-medium ${infoColor}`}>
                          {item.info}
                        </span>
                      )}
                    </div>
                    <div className='space-y-1'>
                      <h3
                        className={`text-lg font-semibold ${textColor} group-hover:text-blue-200 transition-colors`}
                      >
                        {item.subject}
                      </h3>
                      <p className={`text-sm ${infoColor}`}>
                        Teacher:{' '}
                        <span className='font-medium'>{item.teacher}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <SectionTitle
                text='My Assignments'
                level={3}
                className='text-sm font-semibold text-gray-700'
              />
              <span
                className='text-xs cursor-pointer !text-blue-600 hover:text-blue-800'
                onClick={() => router.push('/dashboard/student/assignments')}
              >
                View All
              </span>
            </div>
            <Statsgrid
              variant='assignments'
              items={assignments.map(a => ({
                ...a,
                actionLabel: a.status === 'submitted' ? 'View' : 'Submit',
                statusBadge: (
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${a.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {a.status === 'submitted' ? 'Submitted' : 'Unsubmitted'}
                  </span>
                ),
              }))}
            />
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
    </div>
  );
}
