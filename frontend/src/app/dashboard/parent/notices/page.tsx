'use client';
import { FiSearch } from 'react-icons/fi';
import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import StudentNoticesTab from '@/components/organisms/tabs/StudentNoticesTab';

export default function ParentNoticesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  return (
    <div className='p-6'>
      <SectionTitle text='School Notices' className='mb-2 text-2xl font-bold' />
      {/* Ensure all notice titles are bold in the tab component */}
      <p className='text-gray-500 mb-6'>
        View all important notices for parents and children
      </p>
      <div className='flex items-center gap-4 mb-6 mt-8'>
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
              placeholder='Search notices...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='min-w-[180px] bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm'
              onBlur={() => setShowSearch(false)}
            />
          )}
        </div>
        {/* Desktop search input - hidden on mobile */}
      </div>
      <StudentNoticesTab
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}
