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
      avatar: undefined,
      staffId: '001',
      email: 'john.wilson@school.edu',
      phone: '+1 (555) 111-0001',
      salary: 85000,
      lastActivity: '2025-01-28 09:30 AM',
      isOnline: true,
    },
    {
      id: 2,
      name: 'Maria Garcia',
      department: 'Administration',
      position: 'Vice Principal',
      status: 'Active',
      avatar: undefined,
      staffId: '002',
      email: 'maria.garcia@school.edu',
      phone: '+1 (555) 222-0001',
      salary: 72000,
      lastActivity: '2025-01-28 08:45 AM',
      isOnline: true,
    },
    {
      id: 3,
      name: 'Robert Chen',
      department: 'IT',
      position: 'IT Administrator',
      status: 'Active',
      avatar: undefined,
      staffId: '003',
      email: 'robert.chen@school.edu',
      phone: '+1 (555) 333-0001',
      salary: 68000,
      lastActivity: '2025-01-27 06:15 PM',
      isOnline: false,
    },
    {
      id: 4,
      name: 'Jennifer Brown',
      department: 'Finance',
      position: 'Finance Manager',
      status: 'Active',
      avatar: undefined,
      staffId: '004',
      email: 'jennifer.brown@school.edu',
      phone: '+1 (555) 444-0001',
      salary: 65000,
      lastActivity: '2025-01-28 09:00 AM',
      isOnline: true,
    },
    {
      id: 5,
      name: 'Michael Davis',
      department: 'Academic',
      position: 'Academic Coordinator',
      status: 'On Leave',
      avatar: undefined,
      staffId: '005',
      email: 'michael.davis@school.edu',
      phone: '+1 (555) 555-0001',
      salary: 58000,
      lastActivity: '2025-01-20 05:30 PM',
      isOnline: false,
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
