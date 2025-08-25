'use client';

import SectionTitle from '@/components/atoms/display/SectionTitle';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Users, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CardGridLoader } from '@/components/atoms/loading';

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

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainLoading, setMainLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Main page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainLoading(false);
    }, 1300);

    return () => clearTimeout(timer);
  }, []);

  const loadClasses = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await teacherService.getMyClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/teacher/academics/classes/${classId}`);
  };

  if (mainLoading) {
    return (
      <div className='space-y-6'>
        <CardGridLoader
          cards={6}
          columns='grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          cardHeight='h-32'
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className='space-y-6'>
        <SectionTitle
          text='My Classes'
          level={1}
          className='mb-4 text-xl font-semibold text-foreground'
        />
        <div className='animate-pulse space-y-4'>
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='h-32 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <SectionTitle
          text='My Classes'
          level={1}
          className='mb-4 text-xl font-bold text-foreground'
        />
        <div className='text-center py-8'>
          <p className='text-red-600 mb-4'>{error}</p>
          <button
            onClick={loadClasses}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <SectionTitle
          text='My Classes'
          level={1}
          className='mb-4 text-3xl font-bold text-foreground'
        />
      </div>

      {/* Classes Grid */}
      {classes.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {classes.map(classItem => (
            <div
              key={classItem.class.id}
              onClick={() => handleClassClick(classItem.class.id)}
              className='bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group p-6'
            >
              <div className='flex items-center justify-between mb-4'>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}
                >
                  {classItem.class.currentEnrollment
                    ? `${classItem.class.currentEnrollment}/${classItem.class.capacity || 30} Students`
                    : 'No Students'}
                </div>
                <ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors' />
              </div>

              <div className='space-y-2'>
                <h3 className='text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors'>
                  Grade {classItem.class.grade} - Section{' '}
                  {classItem.class.section}
                </h3>
                <p className='text-sm text-gray-600'>Class Teacher</p>
              </div>

              <div className='mt-4 flex items-center gap-2'>
                <Users className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-gray-600'>
                  {classItem.class.currentEnrollment || 0} Students enrolled
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <GraduationCap className='mx-auto h-12 w-12 text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Classes Assigned
          </h3>
          <p className='text-gray-500'>
            You haven't been assigned as a class teacher for any classes yet.
          </p>
        </div>
      )}
    </div>
  );
}
