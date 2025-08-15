'use client';

import SectionTitle from '@/components/atoms/display/SectionTitle';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap } from 'lucide-react';

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
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Transform classes data for Statsgrid
  const classItems = classes.map(classItem => ({
    status: classItem.class.currentEnrollment
      ? `${classItem.class.currentEnrollment}/${classItem.class.capacity || 30} Students`
      : 'No Students',
    title: `Grade ${classItem.class.grade} - Section ${classItem.class.section}`,
    subtitle: 'Class Teacher',
    tone: 'blue' as const,
  }));

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
          className='mb-4 text-xl font-semibold text-foreground'
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
          className='mb-4 text-xl font-semibold text-foreground'
        />
      </div>

      {/* Classes Grid */}
      {classes.length > 0 ? (
        <Statsgrid
          variant='classes'
          items={classItems}
          classesSize='lg'
          className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4'
        />
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
