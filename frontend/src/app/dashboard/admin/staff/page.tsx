'use client';

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Staff,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Users, UserCheck, Clock, Building } from 'lucide-react';

const StaffPage = () => {
  // Staff-specific stats data
  const staffStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '32',
      label: 'Total Staff',
      change: '1.5%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '30',
      label: 'Active Staff',
      change: '2.1%',
      isPositive: true,
    },
    {
      icon: Clock,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '1',
      label: 'On Leave',
      change: '0.5%',
      isPositive: false,
    },
    {
      icon: Building,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      value: '1',
      label: 'Inactive',
      change: '0.3%',
      isPositive: false,
    },
  ];

  // Sample staff data
  const staffData: Staff[] = [
    {
      id: 1,
      name: 'John Wilson',
      department: 'Administration',
      position: 'Principal',
      status: 'Active',
      email: 'john.wilson@school.edu',
    },
    {
      id: 2,
      name: 'Maria Garcia',
      department: 'Administration',
      position: 'Vice Principal',
      status: 'Active',
      email: 'maria.garcia@school.edu',
    },
    {
      id: 3,
      name: 'Robert Chen',
      department: 'IT',
      position: 'IT Administrator',
      status: 'Active',
      email: 'robert.chen@school.edu',
    },
    {
      id: 4,
      name: 'Jennifer Brown',
      department: 'Finance',
      position: 'Finance Manager',
      status: 'Active',
      email: 'jennifer.brown@school.edu',
    },
    {
      id: 5,
      name: 'Michael Davis',
      department: 'Academic',
      position: 'Academic Coordinator',
      status: 'On Leave',
      email: 'michael.davis@school.edu',
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Staff Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Staff Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={staffStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Staff List - Now using Generic List */}
          <GenericList<Staff>
            config={getListConfig('staff')}
            data={staffData}
            currentPage={1}
            totalPages={7}
            totalItems={32}
            itemsPerPage={5}
            customActions={<ActionButtons pageType='staff' />}
          />
        </div>
      </div>
    </div>
  );
};

export default StaffPage;
