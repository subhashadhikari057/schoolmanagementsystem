'use client';

/**
 * =============================================================================
 * Class-Specific Attendance Page
 * =============================================================================
 * Attendance management page for a specific class
 * =============================================================================
 */

import { AttendanceManager } from '@/components/organisms/attendance/AttendanceManager';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { use } from 'react';

interface ClassAttendancePageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default function ClassAttendancePage({
  params,
}: ClassAttendancePageProps) {
  const resolvedParams = use(params) as { classId: string };
  const { classId } = resolvedParams;
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState({
    name: 'Loading...',
    grade: 0,
    section: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClassInfo = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await teacherService.getMyClasses();
        const classData = response.data.find(
          (item: any) => item.class.id === classId,
        );

        if (classData) {
          setClassInfo({
            name: `Class ${classData.class.grade}${classData.class.section}`,
            grade: classData.class.grade,
            section: classData.class.section,
          });
        } else {
          // Fallback to sample data
          const sampleClasses = {
            '1': { name: 'Class 8A', grade: 8, section: 'A' },
            '2': { name: 'Class 9B', grade: 9, section: 'B' },
            '3': { name: 'Class 10A', grade: 10, section: 'A' },
            '4': { name: 'Class 8B', grade: 8, section: 'B' },
            '5': { name: 'Class 9A', grade: 9, section: 'A' },
            '6': { name: 'Class 10B', grade: 10, section: 'B' },
          };
          setClassInfo(
            sampleClasses[classId as keyof typeof sampleClasses] || {
              name: 'Unknown Class',
              grade: 0,
              section: '',
            },
          );
        }
      } catch (error) {
        console.error('Failed to load class info:', error);
        // Fallback to sample data
        const sampleClasses = {
          '1': { name: 'Class 8A', grade: 8, section: 'A' },
          '2': { name: 'Class 9B', grade: 9, section: 'B' },
          '3': { name: 'Class 10A', grade: 10, section: 'A' },
          '4': { name: 'Class 8B', grade: 8, section: 'B' },
          '5': { name: 'Class 9A', grade: 9, section: 'A' },
          '6': { name: 'Class 10B', grade: 10, section: 'B' },
        };
        setClassInfo(
          sampleClasses[classId as keyof typeof sampleClasses] || {
            name: 'Unknown Class',
            grade: 0,
            section: '',
          },
        );
      } finally {
        setLoading(false);
      }
    };

    loadClassInfo();
  }, [classId, user?.id]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading class information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link href='/dashboard/teacher/academics/attendance'>
            <Button variant='outline' size='sm'>
              ← Back to Classes
            </Button>
          </Link>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              {classInfo.name} - Attendance
            </h1>
            <p className='text-gray-600 mt-1'>
              Grade {classInfo.grade} Section {classInfo.section}
            </p>
          </div>
        </div>
      </div>

      <AttendanceManager classId={classId} />
    </div>
  );
}
