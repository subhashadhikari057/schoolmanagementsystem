'use client';

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Teacher,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Users, GraduationCap, Calendar, BookOpen } from 'lucide-react';

const TeachersPage = () => {
  // Teacher-specific stats data
  const teacherStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '45',
      label: 'Total Teachers',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '42',
      label: 'Active Teachers',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: Calendar,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '2',
      label: 'On Leave',
      change: '5.2%',
      isPositive: false,
    },
    {
      icon: BookOpen,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      value: '1',
      label: 'New Hires',
      change: '15.3%',
      isPositive: true,
    },
  ];

  // Sample teacher data
  const teachersData: Teacher[] = [
    {
      id: 1,
      name: 'Dr. Sarah Mitchell',
      faculty: 'Mathematics',
      subjects: ['Advanced Mathematics', 'Statistics'],
      status: 'Active',
      avatar: undefined,
      teacherId: 'EMP001',
      email: 'sarah.mitchell@school.edu',
      phone: '+1 (555) 123-4567',
      address: '123 Teacher Lane',
      designation: 'Senior Teacher',
      department: 'Mathematics',
      experience: '15 years',
      joinedDate: '2015-08-15',
      salary: 75000,
      classTeacher: 'Grade 10A',
      subjects_detailed: [
        { name: 'Advanced Mathematics', grade: 'Grade 10A' },
        { name: 'Statistics', grade: 'Grade 11' },
      ],
    },
    {
      id: 2,
      name: 'Prof. Michael Chen',
      faculty: 'Science',
      subjects: ['Physics', 'Chemistry'],
      status: 'Active',
      avatar: undefined,
      teacherId: 'EMP002',
      email: 'michael.chen@school.edu',
      phone: '+1 (555) 234-5678',
      address: '456 Science Street',
      designation: 'Teacher',
      department: 'Science',
      experience: '8 years',
      joinedDate: '2018-06-20',
      salary: 68000,
      subjects_detailed: [
        { name: 'Physics', grade: 'Grade 11' },
        { name: 'Chemistry', grade: 'Grade 10' },
      ],
    },
    {
      id: 3,
      name: 'Ms. Emma Thompson',
      faculty: 'English',
      subjects: ['English Literature', 'Creative Writing'],
      status: 'Active',
      avatar: undefined,
      teacherId: 'EMP003',
      email: 'emma.thompson@school.edu',
      phone: '+1 (555) 345-6789',
      address: '789 Literature Ave',
      designation: 'Assistant Teacher',
      department: 'English',
      experience: '5 years',
      joinedDate: '2020-03-10',
      salary: 58000,
      classTeacher: 'Grade 9B',
      subjects_detailed: [
        { name: 'English Literature', grade: 'Grade 9B' },
        { name: 'Creative Writing', grade: 'Grade 8' },
      ],
    },
    {
      id: 4,
      name: 'Mr. David Rodriguez',
      faculty: 'Social Studies',
      subjects: ['History', 'Geography'],
      status: 'On Leave',
      avatar: undefined,
      teacherId: 'EMP004',
      email: 'david.rodriguez@school.edu',
      phone: '+1 (555) 456-7890',
      address: '321 History Blvd',
      designation: 'Teacher',
      department: 'Social Studies',
      experience: '12 years',
      joinedDate: '2016-01-15',
      salary: 72000,
      subjects_detailed: [
        { name: 'History', grade: 'Grade 10' },
        { name: 'Geography', grade: 'Grade 9' },
      ],
    },
    {
      id: 5,
      name: 'Dr. Lisa Patel',
      faculty: 'Science',
      subjects: ['Biology', 'Environmental Science'],
      status: 'Active',
      avatar: undefined,
      teacherId: 'EMP005',
      email: 'lisa.patel@school.edu',
      phone: '+1 (555) 567-8901',
      address: '654 Biology Drive',
      designation: 'Senior Teacher',
      department: 'Science',
      experience: '20 years',
      joinedDate: '2010-09-01',
      salary: 82000,
      classTeacher: 'Grade 12A',
      subjects_detailed: [
        { name: 'Biology', grade: 'Grade 12A' },
        { name: 'Environmental Science', grade: 'Grade 11' },
      ],
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Teacher Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Teacher Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={teacherStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Teacher List - Now using Generic List */}
          <GenericList<Teacher>
            config={getListConfig('teachers')}
            data={teachersData}
            currentPage={1}
            totalPages={10}
            totalItems={45}
            itemsPerPage={5}
            customActions={<ActionButtons pageType='teachers' />}
          />
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;
