'use client';

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Subject,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Users, UserCheck, AlertCircle, GraduationCap } from 'lucide-react';

const SubjectsPage = () => {
  // Subject-specific stats data
  const subjectStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '156',
      label: 'Total Subjects',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '152',
      label: 'Active Subjects',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '15',
      label: 'Teachers Assigned',
      change: '5.2%',
      isPositive: true,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: '890',
      label: 'Total Students',
      change: '2.1%',
      isPositive: true,
    },
  ];

  // Sample subjects data
  const subjectsData: Subject[] = [
    {
      id: 1,
      name: 'Advanced Mathematics',
      code: 'MATH101',
      faculty: 'Mathematics',
      credits: 4,
      status: 'Active',
      gradeClasses: ['Grade 10-12', '10A', '10B', '11A', '+2'],
      teachers: ['Dr. Sarah Mitchell', 'Prof. John Stevens'],
      scheduleInfo: '6h/week, 5 classes',
      studentsCount: 175,
      examConfig: '100 marks, Pass: 35 | Theory + Practical',
    },
    {
      id: 2,
      name: 'Physics',
      code: 'PHY101',
      faculty: 'Science',
      credits: 4,
      status: 'Active',
      gradeClasses: ['Grade 11-12', '11A', '11B', '12A', '+1'],
      teachers: ['Prof. Michael Chen'],
      scheduleInfo: '5h/week, 4 classes',
      studentsCount: 142,
      examConfig: '100 marks, Pass: 35 | Theory + Lab',
    },
    {
      id: 3,
      name: 'English Literature',
      code: 'ENG101',
      faculty: 'Language',
      credits: 3,
      status: 'Active',
      gradeClasses: ['Grade 9-12', '9A', '9B', '10A', '+5'],
      teachers: ['Ms. Emma Thompson', 'Mr. David Wilson'],
      scheduleInfo: '4h/week, 8 classes',
      studentsCount: 280,
      examConfig: '100 marks, Pass: 33 | Theory + Oral',
    },
    {
      id: 4,
      name: 'Computer Science',
      code: 'CS101',
      faculty: 'Technology',
      credits: 4,
      status: 'Active',
      gradeClasses: ['Grade 9-12', '9C', '10A', '11A', '+1'],
      teachers: ['Mr. David Lee'],
      scheduleInfo: '4h/week, 4 classes',
      studentsCount: 95,
      examConfig: '100 marks, Pass: 35 | Theory + Practical',
    },
    {
      id: 5,
      name: 'Art & Design',
      code: 'ART101',
      faculty: 'Arts',
      credits: 2,
      status: 'Active',
      gradeClasses: ['Grade 9-10', '9A', '9B', '10B'],
      teachers: ['Ms. Lisa Park'],
      scheduleInfo: '3h/week, 3 classes',
      studentsCount: 78,
      examConfig: '100 marks, Pass: 40 | Practical + Portfolio',
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Subject Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Subject Related Info Here
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
          {/* Subject List - Now using Generic List */}
          <GenericList<Subject>
            config={getListConfig('subjects')}
            data={subjectsData}
            currentPage={1}
            totalPages={12}
            totalItems={156}
            itemsPerPage={5}
            customActions={<ActionButtons pageType='subjects' />}
          />
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
