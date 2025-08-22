'use client';

import React, { useState } from 'react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import StatusBadge from '@/components/atoms/data/StatusBadge';
import Panel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import { useRouter } from 'next/navigation';

// Mock data for complaints
const mockComplaints = [
  {
    id: '1',
    title: 'Difficulty understanding Science concepts',
    date: '2023-08-15',
    time: 'N/A',
    location: 'Class 8-A',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Lab equipment safety concerns',
    date: '2023-08-14',
    time: 'N/A',
    location: 'Class 7-B',
    status: 'pending',
  },
];

// Mock data for leave requests
const mockLeaveRequests = [
  {
    id: '1',
    title: 'Annual Leave',
    date: '2023-08-20',
    time: '3 days',
    location: 'Family wedding celebration',
    status: 'approved',
  },
  {
    id: '2',
    title: 'Sick Leave',
    date: '2023-08-15',
    time: '1 day',
    location: 'Doctor appointment for routine checkup',
    status: 'pending',
  },
];

export const ComplaintsAndLeavePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  const tabs = [
    {
      name: 'Complaints',
      content: (
        <>
          <div className='mb-2 flex justify-between items-center'>
            <span className='text-sm text-gray-500'>Total: 6</span>
            <span className='bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded'>
              4 pending
            </span>
          </div>
          <Panel
            variant='list-cards'
            title='Complaints'
            events={mockComplaints}
            maxEvents={5}
            itemActionLabel='View Details'
            className='!bg-transparent !border-0 !p-0 !rounded-none !shadow-none'
          />
        </>
      ),
    },
    {
      name: 'Leave Requests',
      content: (
        <>
          <div className='mb-2 flex justify-between items-center'>
            <span className='text-sm text-gray-500'>Total: 5</span>
            <span className='bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded'>
              2 pending
            </span>
          </div>
          <Panel
            variant='list-cards'
            title='Leave Requests'
            events={mockLeaveRequests}
            maxEvents={5}
            itemActionLabel='View Details'
            className='!bg-transparent !border-0 !p-0 !rounded-none !shadow-none'
          />
        </>
      ),
    },
  ];

  return (
    <div className='p-4 sm:p-6'>
      <div className='mb-6'>
        <SectionTitle text='Requests' className='mb-1 text-3xl font-bold' />
        <p className='text-gray-500'>Manage complaints and leave requests</p>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='bg-blue-500 rounded-lg p-4 text-white text-center'>
          <h3 className='text-2xl font-bold'>4</h3>
          <p className='text-sm'>Pending Complaints</p>
        </div>
        <div className='bg-blue-500 rounded-lg p-4 text-white text-center'>
          <h3 className='text-2xl font-bold'>2</h3>
          <p className='text-sm'>Pending Leave</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mb-6'>
        <h2 className='text-2xl font-bold mb-4'>Quick Actions</h2>
        <div className='rounded-lg p-4 w-full'>
          <button
            type='button'
            onClick={() =>
              router.push(
                '/dashboard/teacher/communication/complaints&leave/leave-request',
              )
            }
            className='flex w-full items-center gap-4 rounded-lg bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            {/* Icon */}
            <div className='rounded-full bg-blue-100 p-3'>
              <CalendarDays className='h-6 w-6 text-blue-600' />
            </div>

            {/* Text Content */}
            <div>
              <h3 className='font-medium'>Request Leave</h3>
              <p className='text-sm text-gray-500'>Apply for personal leave</p>
            </div>
          </button>
        </div>

        {/* Overview */}
        <div className='mb-6'>
          <h2 className='text-xl font-semibold mb-4'>Overview</h2>
          <Tabs tabs={tabs} defaultIndex={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default ComplaintsAndLeavePage;
