'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { teacherService } from '@/api/services/teacher.service';
import { classService } from '@/api/services/class.service';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import OverviewTab from './components/OverviewTab';
import StudentsTab from './components/StudentsTab';
import AssignmentsTab from './components/AssignmentsTab';

interface ClassDetails {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  currentEnrollment: number;
  shift: 'morning' | 'day';
  roomId: string;
  classTeacherId: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
  room?: {
    roomNo: string;
    name?: string;
    floor: number;
    building?: string;
  };
  classTeacher?: {
    id: string;
    user?: {
      fullName: string;
      email: string;
    };
    employeeId?: string;
  };
  students?: Array<{
    id: string;
    rollNumber: string;
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    user: {
      fullName: string;
      email?: string;
      phone?: string;
    };
    parents?: Array<{
      id: string;
      parent: {
        id: string;
        user: {
          fullName: string;
          email: string;
          phone?: string;
        };
      };
      relationship: string;
      isPrimary: boolean;
    }>;
    guardians?: Array<{
      id: string;
      fullName: string;
      phone: string;
      email: string;
      relation: string;
    }>;
  }>;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const classId = params.classId as string;

  const loadClassDetails = useCallback(async () => {
    if (!user?.id || !classId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First verify the teacher has access to this class
      const teacherClassesResponse = await teacherService.getMyClasses();
      const hasAccess = teacherClassesResponse.data.some(
        (tc: {
          class: {
            id: string;
            grade: number;
            section: string;
            currentEnrollment?: number;
          };
        }) => tc.class.id === classId,
      );

      if (!hasAccess) {
        setError('Class not found or you do not have access to this class');
        return;
      }

      // Get full class details including students, parents, and guardians
      const classResponse = await classService.getClassWithStudents(classId);
      setClassDetails(classResponse.data);
    } catch (error) {
      console.error('Failed to load class details:', error);
      setError('Failed to load class details');
    } finally {
      setLoading(false);
    }
  }, [user, classId]);

  useEffect(() => {
    loadClassDetails();
  }, [loadClassDetails]);

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 bg-gray-200 rounded w-64'></div>
            <div className='h-4 bg-gray-200 rounded w-48'></div>
            <div className='h-12 bg-gray-200 rounded w-full'></div>
            <div className='h-96 bg-gray-200 rounded w-full'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
          <div className='text-center py-12'>
            <div className='text-red-500 text-lg font-medium mb-2'>{error}</div>
            <Button
              label='Go Back'
              onClick={() => router.back()}
              className='mt-4'
            />
          </div>
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return null;
  }

  const tabs = [
    {
      name: 'Overview',
      content: <OverviewTab classDetails={classDetails} />,
    },
    {
      name: 'Students',
      content: <StudentsTab classDetails={classDetails} />,
    },
    {
      name: 'Assignments',
      content: <AssignmentsTab classDetails={classDetails} />,
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Blue Header Section */}
      <div className='bg-blue-600 text-white'>
        <div className='px-3 sm:px-4 lg:px-6 pt-4 pb-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Button
              onClick={() => router.back()}
              className='p-2 hover:bg-blue-700 rounded-lg border-none bg-transparent text-white'
            >
              <ArrowLeft className='w-5 h-5 text-white' />
            </Button>
            <div>
              <SectionTitle
                text={`Class ${classDetails.grade}-${classDetails.section}`}
                level={1}
                className='text-lg sm:text-xl lg:text-2xl font-bold text-white'
              />
              <Label className='text-xs sm:text-sm lg:text-base text-white/80 mt-1'>
                {classDetails.name || 'Science Class'}
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-10'>
        <div className='max-w-7xl mx-auto'>
          <GenericTabs tabs={tabs} className='bg-transparent' />
        </div>
      </div>
    </div>
  );
}
