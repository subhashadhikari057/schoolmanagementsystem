'use client';

import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import StudentExamsTab from '@/components/organisms/tabs/StudentExamsTab';
import { PageLoader } from '@/components/atoms/loading';

export default function StudentExamsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <PageLoader />;
  }

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
