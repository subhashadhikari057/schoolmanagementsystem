'use client';

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Student,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Users, UserCheck, AlertCircle, GraduationCap } from 'lucide-react';

const StudentsPage = () => {
  // Student-specific stats data
  const studentStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '156',
      label: 'Total Students',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '152',
      label: 'Active Students',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '3',
      label: 'Students on Warning',
      change: '5.2%',
      isPositive: false,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: '1',
      label: 'Suspended Students',
      change: '2.1%',
      isPositive: false,
    },
  ];

  // Sample student data
  const studentsData: Student[] = [
    {
      id: 1,
      name: 'Emily Johnson',
      rollNo: '2024001',
      class: 'Grade 10 Section A',
      parent: 'Robert Johnson',
      status: 'Active',
      avatar: undefined,
      studentId: '2024001',
      email: 'emily.johnson@student.edu',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street',
      grade: 'Grade 10',
      section: 'A',
      feeStatus: 'Partial',
      feeAmount: {
        paid: 8500,
        total: 10000,
      },
      attendance: {
        percentage: 90.6,
        present: 145,
        total: 160,
      },
    },
    {
      id: 2,
      name: 'James Smith',
      rollNo: '2023156',
      class: 'Grade 11 Section B',
      parent: 'Michael Smith',
      status: 'Active',
      avatar: undefined,
      studentId: '2023156',
      email: 'james.smith@student.edu',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Avenue',
      grade: 'Grade 11',
      section: 'B',
      feeStatus: 'Paid',
      feeAmount: {
        paid: 12000,
        total: 12000,
      },
      attendance: {
        percentage: 95.0,
        present: 152,
        total: 160,
      },
    },
    {
      id: 3,
      name: 'Sophia Brown',
      rollNo: '2024089',
      class: 'Grade 9 Section C',
      parent: 'David Brown',
      status: 'Active',
      avatar: undefined,
      studentId: '2024089',
      email: 'sophia.brown@student.edu',
      phone: '+1 (555) 345-6789',
      address: '789 Pine Street',
      grade: 'Grade 9',
      section: 'C',
      feeStatus: 'Pending',
      feeAmount: {
        paid: 0,
        total: 8500,
      },
      attendance: {
        percentage: 92.3,
        present: 48,
        total: 52,
      },
    },
    {
      id: 4,
      name: 'Alex Wilson',
      rollNo: '2023087',
      class: 'Grade 12 Section A',
      parent: 'Jennifer Wilson',
      status: 'Active',
      avatar: undefined,
      studentId: '2023087',
      email: 'alex.wilson@student.edu',
      phone: '+1 (555) 456-7890',
      address: '321 Elm Street',
      grade: 'Grade 12',
      section: 'A',
      feeStatus: 'Paid',
      feeAmount: {
        paid: 15000,
        total: 15000,
      },
      attendance: {
        percentage: 88.7,
        present: 142,
        total: 160,
      },
    },
    {
      id: 5,
      name: 'Emma Davis',
      rollNo: '2024156',
      class: 'Grade 8 Section B',
      parent: 'Robert Davis',
      status: 'Warning',
      avatar: undefined,
      studentId: '2024156',
      email: 'emma.davis@student.edu',
      phone: '+1 (555) 567-8901',
      address: '654 Maple Drive',
      grade: 'Grade 8',
      section: 'B',
      feeStatus: 'Partial',
      feeAmount: {
        paid: 4000,
        total: 7500,
      },
      attendance: {
        percentage: 72.5,
        present: 116,
        total: 160,
      },
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Student Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Student Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={studentStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Student List - Now using Generic List */}
          <GenericList<Student>
            config={getListConfig('students')}
            data={studentsData}
            currentPage={1}
            totalPages={32}
            totalItems={156}
            itemsPerPage={5}
            customActions={<ActionButtons pageType='students' />}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;
