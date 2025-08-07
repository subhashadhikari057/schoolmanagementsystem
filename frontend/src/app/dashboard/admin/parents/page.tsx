'use client';

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Parent,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Users, UserCheck, Phone, Mail } from 'lucide-react';

const ParentsPage = () => {
  // Parent-specific stats data
  const parentStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '120',
      label: 'Total Parents',
      change: '2.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '115',
      label: 'Active Parents',
      change: '1.5%',
      isPositive: true,
    },
    {
      icon: Phone,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '3',
      label: 'Pending Verification',
      change: '8.2%',
      isPositive: false,
    },
    {
      icon: Mail,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      value: '2',
      label: 'Inactive',
      change: '0.5%',
      isPositive: false,
    },
  ];

  // Sample parent data
  const parentsData: Parent[] = [
    {
      id: 1,
      name: 'Michael Johnson',
      accountStatus: 'Active',
      email: 'michael.johnson@email.com',
      linkedStudents: ['1'],
      contact: '',
    },
    {
      id: 2,
      name: 'Michael Smith',
      accountStatus: 'Active',
      email: 'michael.smith@email.com',
      linkedStudents: ['2'],
      contact: '',
    },
    {
      id: 3,
      name: 'David Brown',
      accountStatus: 'Active',
      email: 'david.brown@email.com',
      linkedStudents: ['3'],
      contact: '',
    },
    {
      id: 4,
      name: 'Jennifer Wilson',
      accountStatus: 'Active',
      email: 'jennifer.wilson@email.com',
      linkedStudents: ['4'],
      contact: '',
    },
    {
      id: 5,
      name: 'Robert Davis',
      accountStatus: 'Active',
      email: 'robert.davis@email.com',
      linkedStudents: ['5'],
      contact: '',
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Parent Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Parent Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={parentStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Parent List - Now using Generic List */}
          <GenericList<Parent>
            config={getListConfig('parents')}
            data={parentsData}
            currentPage={1}
            totalPages={12}
            totalItems={120}
            itemsPerPage={10}
            customActions={<ActionButtons pageType='parents' />}
          />
        </div>
      </div>
    </div>
  );
};

export default ParentsPage;
