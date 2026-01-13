'use client';

import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import StudentExamsTab from '@/components/organisms/tabs/StudentExamsTab';

export default function StudentExamsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className='w-full p-6'>
      <SectionTitle text='My Exams' className='mb-2 text-2xl font-bold' />
      <p className='text-gray-500 mb-6'>Track and manage your exams</p>
      <div className='flex items-center justify-between mb-6 mt-8'></div>
      <StudentExamsTab
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}
