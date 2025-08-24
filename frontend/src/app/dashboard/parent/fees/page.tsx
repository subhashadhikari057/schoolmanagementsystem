'use client';
import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { PageLoader } from '@/components/atoms/loading';

// Demo children data
const children = [
  { id: '1', name: 'Aarav Sharma', class: '10', section: 'A' },
  { id: '2', name: 'Priya Sharma', class: '7', section: 'B' },
];

// Demo fee data per child
const feeData: Record<
  string,
  Array<{ month: string; amount: string; status: string; dueDate: string }>
> = {
  '1': [
    {
      month: 'August 2025',
      amount: '₹2,500',
      status: 'Paid',
      dueDate: '2025-08-05',
    },
    {
      month: 'September 2025',
      amount: '₹2,500',
      status: 'Due',
      dueDate: '2025-09-05',
    },
  ],
  '2': [
    {
      month: 'August 2025',
      amount: '₹2,000',
      status: 'Paid',
      dueDate: '2025-08-05',
    },
    {
      month: 'September 2025',
      amount: '₹2,000',
      status: 'Due',
      dueDate: '2025-09-05',
    },
  ],
};

export default function ParentFeesPage() {
  const [selectedChild, setSelectedChild] = useState(children[0].id);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1100);

    return () => clearTimeout(timer);
  }, []);
  const childOptions = children.map(child => ({
    value: child.id,
    label: `${child.name} (Class ${child.class}${child.section})`,
  }));
  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Due', label: 'Due' },
  ];
  const feesRaw = feeData[selectedChild] || [];
  const fees =
    statusFilter === 'All'
      ? feesRaw
      : feesRaw.filter(fee => fee.status === statusFilter);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 lg:px-8 pt-8 pb-12'>
      <div className='max-w-8xl mx-auto'>
        <div className='flex flex-col sm:flex-row items-center justify-between mb-6 gap-4'>
          <SectionTitle
            text="My Child's Fees"
            className='text-xl font-bold text-gray-900'
          />
          <div className='flex gap-3 items-center'>
            <Dropdown
              type='filter'
              options={childOptions}
              selectedValue={selectedChild}
              onSelect={setSelectedChild}
              className='min-w-[220px]'
              placeholder='Select Child'
            />
            <Dropdown
              type='filter'
              options={statusOptions}
              selectedValue={statusFilter}
              onSelect={setStatusFilter}
              className='min-w-[120px]'
              placeholder='Status'
            />
          </div>
        </div>
        <div className='bg-white rounded-xl shadow-sm p-4'>
          <h3 className='font-semibold text-gray-800 mb-4'>Fee Notices</h3>
          <div className='space-y-3'>
            {fees.length === 0 ? (
              <div className='text-gray-500'>No fee data found.</div>
            ) : (
              fees.map((fee, idx) => (
                <div
                  key={idx}
                  className='border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 hover:bg-blue-50 transition-all'
                >
                  <div>
                    <div className='font-medium text-gray-900'>{fee.month}</div>
                    <div className='text-xs text-gray-500'>
                      Due Date: {fee.dueDate}
                    </div>
                  </div>
                  <div className='flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0'>
                    <span className='text-base font-bold text-blue-700'>
                      {fee.amount}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {fee.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
