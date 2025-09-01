'use client';
import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import { FiSearch } from 'react-icons/fi';
import { PageLoader } from '@/components/atoms/loading';

const assignmentStatuses = [
  { label: 'All Status', value: 'All Status' },
  { label: 'Missed', value: 'Missed' },
  { label: 'Submitted', value: 'Submitted' },
  { label: 'Pending', value: 'Pending' },
];

const childrenList = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Doe' },
];

const assignmentsData = [
  {
    id: 1,
    title: 'Math Homework',
    status: 'Missed',
    teacherReview: 'Needs improvement.',
    message: 'Your child has missed this assignment.',
    childId: '1',
  },
  {
    id: 2,
    title: 'Science Project',
    status: 'Submitted',
    teacherReview: 'Excellent work!',
    message: 'Your child has submitted this assignment.',
    childId: '1',
  },
  {
    id: 3,
    title: 'History Essay',
    status: 'Pending',
    teacherReview: 'Awaiting review.',
    message: 'Your child has not submitted this assignment yet.',
    childId: '2',
  },
];

export default function ParentAssignmentsPage() {
  const [selectedStatus, setSelectedStatus] = useState(
    assignmentStatuses[0].value,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChild, setSelectedChild] = useState(childrenList[0].id);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const filteredAssignments = assignmentsData.filter(
    assignment =>
      assignment.childId === selectedChild &&
      (selectedStatus === 'All Status' ||
        assignment.status === selectedStatus) &&
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='w-full p-6'>
      <div className='flex items-center justify-between mb-6'>
        <SectionTitle text='Assignments' level={2} />
        <div className='flex gap-2'></div>
      </div>
      <div className='flex items-center gap-4 mb-6'>
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
            <LabeledInputField
              placeholder='Search assignments...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='min-w-[180px] bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm'
              // autoFocus
              // onBlur={() => setShowSearch(false)}
            />
          )}
        </div>
        {/* Desktop search input */}
        <div className='hidden md:block'>
          <LabeledInputField
            placeholder='Search assignments...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='min-w-[300px] bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm'
          />
        </div>
        <Dropdown
          options={assignmentStatuses}
          selectedValue={selectedStatus}
          onSelect={setSelectedStatus}
          className='min-w-[150px]  rounded-lg px-4 py-2'
          type='filter'
        />
        <Dropdown
          options={childrenList.map(c => ({ label: c.name, value: c.id }))}
          selectedValue={selectedChild}
          onSelect={setSelectedChild}
          className='min-w-[150px] rounded-lg px-4 py-2'
          title='Select Child'
          type='filter'
        />
      </div>
      <div className='space-y-4'>
        {filteredAssignments.length === 0 ? (
          <div className='text-gray-500 py-8 text-center'>
            No assignments found for this status.
          </div>
        ) : (
          filteredAssignments.map(a => (
            <div
              key={a.id}
              className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
            >
              <div className='flex items-center justify-between mb-2'>
                <div>
                  <h3 className='text-lg font-bold text-gray-900 mb-1'>
                    {a.title}
                  </h3>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    a.status === 'Missed'
                      ? 'bg-red-100 text-red-700'
                      : a.status === 'Submitted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {a.message}
                </span>
              </div>
              <div className='mt-2 text-sm text-gray-700'>
                <strong>Status Message:</strong> {a.message}
              </div>
              <div className='mt-2 text-sm text-gray-700'>
                <strong>Teacher&apos;s Review:</strong> {a.teacherReview}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
