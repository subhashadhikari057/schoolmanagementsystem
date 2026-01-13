'use client';
import { FiSearch } from 'react-icons/fi';
import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import StudentExamsTab from '@/components/organisms/tabs/StudentExamsTab';
import { PageLoader } from '@/components/atoms/loading';
import { parentService } from '@/api/services/parent.service';

export default function ParentExamsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<
    Array<{
      id: string;
      studentId: string;
      fullName: string;
      className?: string;
      classId?: string;
    }>
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoading(true);
        const response = await parentService.getMyProfile();
        const childList = response.data?.children || [];
        setChildren(childList);
        if (childList.length > 0) {
          setSelectedChild(childList[0].studentId || childList[0].id);
        }
      } catch (error) {
        console.error('Failed to load children:', error);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='w-full p-6'>
      <SectionTitle text='Children Exams' className='mb-2 text-2xl font-bold' />
      {/* Ensure all exam titles are bold in the tab component */}
      <p className='text-gray-500 mb-6'>
        View, download, and track your children&apos;s exam results and grading
        reports.
      </p>
      {/* Filter Controls: Two-row layout for better alignment */}
      <div className='flex flex-col gap-4 mb-6 mt-8'>
        <div className='flex flex-row gap-4 w-full'>
          <Dropdown
            options={children.map(child => ({
              label: child.className
                ? `${child.fullName} (${child.className})`
                : child.fullName,
              value: child.studentId || child.id,
            }))}
            selectedValue={selectedChild}
            onSelect={setSelectedChild}
            className='min-w-[180px] rounded-lg px-4 py-2'
            title='Select Child'
            type='filter'
          />
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
                placeholder='Search exams...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='min-w-[180px] bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm'
                onBlur={() => setShowSearch(false)}
              />
            )}
          </div>
          {/* Desktop search input */}
          <div className='hidden md:block'>
            <input
              type='text'
              placeholder='Search exams...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='min-w-[300px] bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm'
            />
          </div>
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
