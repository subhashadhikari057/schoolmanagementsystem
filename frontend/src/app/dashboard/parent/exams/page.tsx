'use client';
import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import StudentExamsTab from '@/components/organisms/tabs/StudentExamsTab';

const childrenList = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Doe' },
];

export default function ParentExamsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedChild, setSelectedChild] = useState(childrenList[0].id);

  return (
    <div className='p-6'>
      <SectionTitle text='Children Exams' className='mb-2 text-2xl font-bold' />
      <p className='text-gray-500 mb-6'>
        View, download, and track your children's exam results and grading
        reports.
      </p>
      {/* Filter Controls: Two-row layout for better alignment */}
      <div className='flex flex-col gap-4 mb-6 mt-8'>
        <div className='flex flex-row gap-4 w-full'>
          <Dropdown
            options={childrenList.map(c => ({ label: c.name, value: c.id }))}
            selectedValue={selectedChild}
            onSelect={setSelectedChild}
            className='min-w-[180px] rounded-lg px-4 py-2'
            title='Select Child'
            type='filter'
          />
        </div>
        {/* The search bar and status filter from StudentExamsTab will appear below, left-aligned */}
      </div>
      <StudentExamsTab
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        selectedChild={selectedChild}
      />
    </div>
  );
}
