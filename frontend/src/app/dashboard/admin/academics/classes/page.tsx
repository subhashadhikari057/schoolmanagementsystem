'use client';

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Class,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import {
  Users,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Calendar,
} from 'lucide-react';

interface ActionButtonsProps {
  pageType:
    | 'students'
    | 'teachers'
    | 'parents'
    | 'staff'
    | 'subjects'
    | 'id-cards'
    | 'classes';
}

const ClassesPage = () => {
  // Subject-specific stats data
  const subjectStats = [
    {
      icon: BookOpen,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '156',
      label: 'Total Classes',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: Calendar,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '152',
      label: 'Active Schedules',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: Users,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: '890',
      label: 'Total Students',
      change: '2.1%',
      isPositive: true,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: '890',
      label: 'Total Teachers',
      change: '2.1%',
      isPositive: true,
    },
  ];

  // Static data for the list
  const classesData: Class[] = [
    {
      id: 1,
      name: 'Grade 10',
      section: 'Section A',
      room: '106',
      subjectsCount: 8,
      classTeacher: 'Ms. Emma Thompson',
      lastUpdated: '2025-01-28',
    },
    {
      id: 2,
      name: 'Grade 10',
      section: 'Section B',
      room: '107',
      subjectsCount: 8,
      classTeacher: 'Mr. David Lee',
      lastUpdated: '2025-01-27',
    },
    {
      id: 3,
      name: 'Grade 10',
      section: 'Section C',
      room: '108',
      subjectsCount: 7,
      classTeacher: 'Ms. Sarah Wilson',
      lastUpdated: '2025-01-28',
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Class Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Class Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={subjectStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          <GenericList<Class>
            config={getListConfig('classes')}
            data={classesData}
            currentPage={1}
            totalPages={1}
            totalItems={classesData.length}
            itemsPerPage={10}
            customActions={<ActionButtons pageType='classes' />}
          />
        </div>
      </div>
    </div>
  );
};

export default ClassesPage;
