'use client';

import React, { useState } from 'react';
import AssignmentDashboard from '@/components/organisms/AssignmentDashboard';
import StudentAssignmentsTab from '@/components/organisms/tabs/StudentAssignmentsTab';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import SectionTitle from '@/components/atoms/display/SectionTitle';

export default function StudentAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  return (
    <div className='p-6'>
      <SectionTitle text='My Assignments' className='mb-2 text-2xl font-bold' />
      <p className='text-gray-500 mb-6'>Track and manage your assignments</p>
      <div className='flex items-center justify-between mb-6 mt-8'></div>
      <StudentAssignmentsTab
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}
