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
      linkedStudents: ['Emily Johnson', 'David Johnson'],
      contact: '+1 (555) 123-4567',
      accountStatus: 'Active',
      avatar: undefined,
      parentId: '001',
      email: 'michael.johnson@email.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St',
      lastActivity: '2025-01-27',
      preferredContact: 'Email',
      relation: 'Father',
      job: 'Software Engineer',
      children: [
        { name: 'Emily Johnson', grade: 'Grade 10A', studentId: 'STU001' },
        { name: 'David Johnson', grade: 'Grade 8B', studentId: 'STU024' },
      ],
    },
    {
      id: 2,
      name: 'Sarah Smith',
      linkedStudents: ['James Smith'],
      contact: '+1 (555) 234-5678',
      accountStatus: 'Active',
      avatar: undefined,
      parentId: '002',
      email: 'sarah.smith@email.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Ave',
      lastActivity: '2025-01-26',
      preferredContact: 'SMS',
      relation: 'Mother',
      job: 'Doctor',
      children: [
        { name: 'James Smith', grade: 'Grade 11B', studentId: 'STU002' },
      ],
    },
    {
      id: 3,
      name: 'David Brown',
      linkedStudents: ['Sophia Brown'],
      contact: '+1 (555) 345-6789',
      accountStatus: 'Pending',
      avatar: undefined,
      parentId: '003',
      email: 'david.brown@email.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine St',
      lastActivity: 'Never',
      preferredContact: 'Email',
      relation: 'Father',
      job: 'Business Owner',
      children: [
        { name: 'Sophia Brown', grade: 'Grade 9C', studentId: 'STU003' },
      ],
    },
    {
      id: 4,
      name: 'Jennifer Wilson',
      linkedStudents: ['Alex Wilson', 'Emma Wilson'],
      contact: '+1 (555) 456-7890',
      accountStatus: 'Active',
      avatar: undefined,
      parentId: '004',
      email: 'jennifer.wilson@email.com',
      phone: '+1 (555) 456-7890',
      address: '321 Elm Street',
      lastActivity: '2025-01-28',
      preferredContact: 'Email',
      relation: 'Mother',
      job: 'Teacher',
      children: [
        { name: 'Alex Wilson', grade: 'Grade 12A', studentId: 'STU004' },
        { name: 'Emma Wilson', grade: 'Grade 7B', studentId: 'STU025' },
      ],
    },
    {
      id: 5,
      name: 'Robert Davis',
      linkedStudents: ['Olivia Davis'],
      contact: '+1 (555) 567-8901',
      accountStatus: 'Inactive',
      avatar: undefined,
      parentId: '005',
      email: 'robert.davis@email.com',
      phone: '+1 (555) 567-8901',
      address: '654 Maple Dr',
      lastActivity: '2025-01-15',
      preferredContact: 'SMS',
      relation: 'Guardian',
      job: 'Retired',
      children: [
        { name: 'Olivia Davis', grade: 'Grade 6A', studentId: 'STU005' },
      ],
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
