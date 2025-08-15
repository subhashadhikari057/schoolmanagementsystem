'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Panel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import Button from '@/components/atoms/form-controls/Button';
import MarkAttendanceModal from '@/components/organisms/modals/MarkAttendanceModal';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
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
import { useRouter } from 'next/navigation';

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

const dummyStatsData = [
  {
    value: '6',
    label: "Today's Classes",
    change: '2 completed, 4 upcoming',
    color: 'bg-blue-600',
  },
  {
    value: '158',
    label: 'Total Students',
    change: 'Across all classes',
    color: 'bg-green-600',
  },
  {
    value: '12',
    label: 'Pending Reviews',
    change: 'Assignments to grade',
    color: 'bg-orange-600',
  },
  {
    value: '89%',
    label: 'Monthly Average',
    change: '2% from last month',
    color: 'bg-purple-600',
  },
];

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
  const router = useRouter();
  const [showAttendance, setShowAttendance] = useState(false);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

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

  useEffect(() => {
    loadSubjects();
    loadClasses();
  }, [loadSubjects, loadClasses]);

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/teacher/academics/classes/${classId}`);
  };

  const assignments = [
    {
      title: 'An essay about Railway in Nepal (minimum 300 words)',
      subject: 'Science',
      className: 'Class 8 - A',
      submissions: '0/50 Submissions',
    },
    {
      title: 'An essay about Railway in Nepal (minimum 300 words)',
      subject: 'Science',
      className: 'Class 8 - A',
      submissions: '0/50 Submissions',
    },
  ];

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
        <div className='max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
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
                icon: () => null as any,
                bgColor: s.color,
                iconColor: '',
                value: s.value,
                label: s.label,
                change: s.change,
                isPositive: true,
              }))}
            />
          )}

          {/* Attendance CTA */}
          <div className='rounded-xl border border-blue-200 bg-blue-50/60'>
            <div className='px-4 py-2 space-y-1 flex flex-col items-start justify-start'>
              <Label className='!text-[11px] text-gray-600'>
                Hey its the first class!
              </Label>
              <Label className='!text-[12px] sm:!text-sm !text-foreground'>
                Lets track Your students Attendance
              </Label>
            </div>
            <div className='px-3 pb-3'>
              <div className='bg-blue-600/90 text-white rounded-md py-2 text-center shadow-sm hover:bg-blue-400'>
                <div className='flex items-center justify-center px-3'>
                  <Button
                    className=' text-white  rounded-md text-xs cursor-pointer font-semibold'
                    label='Track Now'
                    onClick={() => setShowAttendance(true)}
                  />
                </div>
              </div>
            </div>
          </div>

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
            <Statsgrid
              variant='assignments'
              items={assignments}
              actionLabel='Learn More'
            />
          </div>

          {/* Events and My Subjects */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            <div className='lg:col-span-8'>
              <Panel
                variant='list-cards'
                title='Upcoming Events'
                maxEvents={3}
                className='!bg-transparent !border-0 !p-0 !rounded-none !shadow-none'
              />
            </div>
            <div className='lg:col-span-4'>
              {subjectsLoading ? (
                <div className='animate-pulse'>
                  <div className='h-32 bg-gray-200 rounded-lg'></div>
                </div>
              ) : (
                <Panel
                  variant='subjects'
                  title='My Subjects'
                  className='!bg-transparent !border-0 !p-0 !rounded-none !shadow-none'
                  subjects={assignedSubjects}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <MarkAttendanceModal
        isOpen={showAttendance}
        onClose={() => setShowAttendance(false)}
      />
    </div>
  );
}
