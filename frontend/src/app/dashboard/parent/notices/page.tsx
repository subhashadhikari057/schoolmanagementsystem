'use client';

import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import StudentNoticesTab from '@/components/organisms/tabs/StudentNoticesTab';

export default function ParentNoticesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  return (
    <div className='p-6'>
      <SectionTitle text='School Notices' className='mb-2 text-2xl font-bold' />
      <p className='text-gray-500 mb-6'>
        View all important notices for parents and children
      </p>
      <div className='flex items-center justify-between mb-6 mt-8'></div>
      <StudentNoticesTab
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}
