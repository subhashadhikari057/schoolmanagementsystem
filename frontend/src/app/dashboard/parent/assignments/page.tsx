'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ParentAssignmentsTab from '@/components/organisms/tabs/ParentAssignmentsTab';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { PageLoader } from '@/components/atoms/loading';

export default function ParentAssignmentsPage() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filter = searchParams.get('filter');
    setStatusFilter(filter ? filter : 'all');
  }, [searchParams]);

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
      <SectionTitle text='Assignments' className='mb-2 text-2xl font-bold' />
      <p className='text-gray-500 mb-6'>
        Track and manage your child\'s assignments
      </p>

      <ParentAssignmentsTab
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}
