'use client';
import React, { useState } from 'react';
import StudentAssignmentsTab from '@/components/organisms/tabs/StudentAssignmentsTab';
import SectionTitle from '@/components/atoms/display/SectionTitle';

import { FiSearch } from 'react-icons/fi';

export default function StudentAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  return (
    <div className='p-6'>
      <SectionTitle text='My Assignments' className='mb-2 text-2xl font-bold' />
      <p className='text-gray-500 mb-6'>Track and manage your assignments</p>
      <div className='flex items-center justify-between mb-6 mt-8'>
        {/* Mobile search icon and input */}
        <div className='block md:hidden'>
          {!showSearch ? (
            <button
              aria-label='Open search'
              className='p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              onClick={() => setShowSearch(true)}
            >
              <FiSearch size={24} />
            </button>
          ) : (
            <input
              type='text'
              placeholder='Search assignments...'
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className='border rounded px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500'
              autoFocus
              onBlur={() => setShowSearch(false)}
            />
          )}
        </div>
        {/* Desktop: keep space for filters */}
        {/* <div className='hidden md:flex items-center gap-4'>
          ...existing filter dropdowns or controls...
        </div> */}
      </div>
      <StudentAssignmentsTab
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}
