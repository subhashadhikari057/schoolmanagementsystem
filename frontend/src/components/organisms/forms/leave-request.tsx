'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';

const LeaveRequestPage: React.FC = () => {
  // Form state
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const router = useRouter();

  const leaveOptions = [
    { value: '', label: 'Select leave type' },
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
  ];

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      {/* Header */}
      <div className='bg-blue-600 rounded-t-xl px-8 py-6 mb-0 flex items-center gap-4'>
        <button
          className='text-white text-2xl mr-4'
          aria-label='Back'
          onClick={() => router.back()}
        >
          &#8592;
        </button>
        <div>
          <SectionTitle
            text='Request Leave'
            className='text-white text-2xl font-semibold mb-1'
            level={1}
          />
          <p className='text-blue-100 text-sm'>Submit your leave application</p>
        </div>
      </div>
      {/* Form Card */}
      <div className='bg-white rounded-b-xl shadow-lg w-full p-10 mt-0'>
        <div className='flex items-center gap-2 mb-8'>
          <span className='bg-blue-100 p-2 rounded-full'>
            <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
              <circle cx='12' cy='12' r='10' fill='#2563eb' opacity='0.2' />
              <path
                d='M7 17V9.5l5-3 5 3V17'
                stroke='#2563eb'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M9 17V12h6v5'
                stroke='#2563eb'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </span>
          <SectionTitle
            text='Leave Application Form'
            className='font-semibold text-gray-800 text-lg'
            level={2}
          />
        </div>
        <form className='space-y-8 w-full'>
          <div className='w-full'>
            <Label className='mb-2'>
              Leave Type <span className='text-red-500'>*</span>
            </Label>
            <Dropdown
              type='filter'
              options={leaveOptions}
              selectedValue={leaveType}
              onSelect={setLeaveType}
              placeholder='Select leave type'
              title='Leave Type'
              className='w-full'
            />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 w-full'>
            <div className='w-full'>
              <Label className='mb-2'>
                Start Date <span className='text-red-500'>*</span>
              </Label>
              <Input
                type='date'
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                name='startDate'
                className='bg-gray-100 py-4 px-4 text-base w-full'
              />
            </div>
            <div className='w-full'>
              <Label className='mb-2'>
                End Date <span className='text-red-500'>*</span>
              </Label>
              <Input
                type='date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                name='endDate'
                className='bg-gray-100 py-4 px-4 text-base w-full'
              />
            </div>
          </div>
          <div className='w-full'>
            <Label className='mb-2'>
              Reason for Leave <span className='text-red-500'>*</span>
            </Label>
            <Input
              type='text'
              value={reason}
              onChange={e => setReason(e.target.value)}
              name='reason'
              placeholder='Please provide a detailed reason for your leave request...'
              className='bg-gray-100 py-4 px-4 text-base w-full'
            />
          </div>
          <div className='w-full'>
            <Label className='mb-2'>Emergency Contact (Optional)</Label>
            <Input
              type='text'
              value={emergencyContact}
              onChange={e => setEmergencyContact(e.target.value)}
              name='emergencyContact'
              placeholder='Contact number in case of emergency'
              className='bg-gray-100 py-4 px-4 text-base w-full'
            />
          </div>
          {/* Notes */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-900 text-sm flex gap-2 mb-2 w-full'>
            <span className='mt-1'>
              <svg width='20' height='20' fill='none' viewBox='0 0 24 24'>
                <path
                  d='M12 9v2m0 4h.01'
                  stroke='#eab308'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <circle
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='#eab308'
                  strokeWidth='2'
                />
              </svg>
            </span>
            <ul className='list-disc pl-4'>
              <li>Submit leave requests at least 3 days in advance</li>
              <li>
                Medical certificate required for sick leave exceeding 2 days
              </li>
              <li>Approval is subject to class schedule and availability</li>
            </ul>
          </div>
          {/* Buttons */}
          <div className='flex flex-col md:flex-row justify-between items-center mt-8 w-full gap-4'>
            <button
              type='button'
              className='px-4 py-3 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 w-full md:w-1/3'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 w-full md:w-1/3 flex items-center justify-center gap-2'
            >
              <svg width='18' height='18' fill='none' viewBox='0 0 24 24'>
                <path
                  d='M5 12h14M12 5l7 7-7 7'
                  stroke='#fff'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              Submit Request
            </button>
          </div>
        </form>
      </div>
      {/* Leave Balance */}
      <div className='bg-blue-50 rounded-xl shadow mx-auto w-full max-w-6xl mt-8 p-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
        <div>
          <div className='text-3xl font-bold text-blue-700'>22</div>
          <div className='text-sm text-blue-900 mt-1'>Annual Leave</div>
        </div>
        <div>
          <div className='text-3xl font-bold text-blue-700'>7</div>
          <div className='text-sm text-blue-900 mt-1'>Casual Leave</div>
        </div>
        <div>
          <div className='text-3xl font-bold text-blue-700'>12</div>
          <div className='text-sm text-blue-900 mt-1'>Sick Leave</div>
        </div>
        <div>
          <div className='text-3xl font-bold text-blue-700'>4</div>
          <div className='text-sm text-blue-900 mt-1'>Emergency Leave</div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestPage;
