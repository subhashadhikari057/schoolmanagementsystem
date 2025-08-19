'use client';

/**
 * =============================================================================
 * Class Selection Page Organism
 * =============================================================================
 * Shows classes where teacher is assigned as class teacher
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Class } from '@/types/attendance';
import { useRouter } from 'next/navigation';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';

// Sample class data - replace with API call
const SAMPLE_CLASSES: Class[] = [
  {
    id: '1',
    name: 'Class 8A',
    grade: 8,
    section: 'A',
    capacity: 35,
    currentEnrollment: 32,
    shift: 'MORNING',
    status: 'active',
  },
  {
    id: '2',
    name: 'Class 9B',
    grade: 9,
    section: 'B',
    capacity: 40,
    currentEnrollment: 38,
    shift: 'MORNING',
    status: 'active',
  },
  {
    id: '3',
    name: 'Class 10A',
    grade: 10,
    section: 'A',
    capacity: 35,
    currentEnrollment: 30,
    shift: 'DAY',
    status: 'active',
  },
  {
    id: '4',
    name: 'Class 8B',
    grade: 8,
    section: 'B',
    capacity: 35,
    currentEnrollment: 28,
    shift: 'MORNING',
    status: 'active',
  },
  {
    id: '5',
    name: 'Class 9A',
    grade: 9,
    section: 'A',
    capacity: 40,
    currentEnrollment: 35,
    shift: 'DAY',
    status: 'active',
  },
  {
    id: '6',
    name: 'Class 10B',
    grade: 10,
    section: 'B',
    capacity: 35,
    currentEnrollment: 33,
    shift: 'DAY',
    status: 'active',
  },
];

export const ClassSelectionPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await teacherService.getMyClasses();

        // Transform the API response to match our Class interface
        const transformedClasses: Class[] = response.data.map((item: any) => ({
          id: item.class.id,
          name:
            item.class.name || `Class ${item.class.grade}${item.class.section}`,
          grade: item.class.grade,
          section: item.class.section,
          capacity: item.class.capacity || 35,
          currentEnrollment: item.class.currentEnrollment || 0,
          shift: item.class.shift || 'MORNING',
          status: item.class.status || 'active',
        }));

        setClasses(transformedClasses);
      } catch (err: any) {
        console.error('Failed to load classes:', err);
        setError(err.message || 'Failed to load classes');

        // Fallback to sample data for development
        setClasses(SAMPLE_CLASSES);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [user?.id]);

  const handleClassClick = (classId: string) => {
    console.log('Navigating to class:', classId);
    console.log('Available classes:', classes);
    router.push(`/dashboard/teacher/academics/attendance/${classId}`);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>⚠️</div>
        <h3 className='text-xl font-semibold text-gray-900 mb-2'>
          Error Loading Classes
        </h3>
        <p className='text-gray-600 mb-4'>{error}</p>
        <p className='text-sm text-gray-500'>
          Showing sample data for development purposes.
        </p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>📚</div>
        <h3 className='text-xl font-semibold text-gray-900 mb-2'>
          No Classes Assigned
        </h3>
        <p className='text-gray-600'>
          You are not assigned as a class teacher for any classes yet.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          Select a Class for Attendance
        </h2>
        <p className='text-gray-600'>
          Choose a class to take attendance or view attendance history
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {classes.map(classItem => (
          <Card
            key={classItem.id}
            className='cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300 hover:scale-[1.02] active:scale-[0.98]'
            onClick={() => handleClassClick(classItem.id)}
          >
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex items-center justify-between'>
                <span>{classItem.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    classItem.shift === 'MORNING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {classItem.shift}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='space-y-3'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Grade:</span>
                  <span className='font-medium'>{classItem.grade}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Section:</span>
                  <span className='font-medium'>{classItem.section}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Students:</span>
                  <span className='font-medium'>
                    {classItem.currentEnrollment}/{classItem.capacity}
                  </span>
                </div>
                <div className='pt-2'>
                  <Button
                    className='w-full'
                    size='sm'
                    onClick={e => {
                      e.stopPropagation();
                      handleClassClick(classItem.id);
                    }}
                  >
                    📝 Take Attendance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
