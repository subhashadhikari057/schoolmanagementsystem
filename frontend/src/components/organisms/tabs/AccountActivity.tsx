import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Icon from '@/components/atoms/display/Icon';

const activityData = [
  {
    icon: (
      <Icon className='bg-green-100 text-green-600 p-2 mr-3'>
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M16.7 6.7l-6.4 6.6-3-3'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </Icon>
    ),
    title: 'Successfully logged in',
    desc: 'Today at 9:30 AM from Desktop (192.168.1.101)',
  },
  {
    icon: (
      <Icon className='bg-blue-100 text-blue-600 p-2 mr-3'>
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M10 2v16M2 10h16'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    ),
    title: 'Updated student record',
    desc: "Yesterday at 3:45 PM - Modified Emily Johnson's profile",
  },
  {
    icon: (
      <Icon className='bg-purple-100 text-purple-600 p-2 mr-3'>
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <circle
            cx='10'
            cy='10'
            r='8'
            stroke='currentColor'
            strokeWidth='1.5'
          />
          <path
            d='M10 6v4l2 2'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    ),
    title: 'Changed notification settings',
    desc: 'January 26 at 11:20 AM - Disabled SMS notifications',
  },
  {
    icon: (
      <Icon className='bg-yellow-100 text-yellow-600 p-2 mr-3'>
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M10 14h.01M10 6v4'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
          <circle
            cx='10'
            cy='10'
            r='8'
            stroke='currentColor'
            strokeWidth='1.5'
          />
        </svg>
      </Icon>
    ),
    title: 'Failed login attempt',
    desc: 'January 25 at 2:15 PM - Invalid password from Mobile device',
  },
  {
    icon: (
      <Icon className='bg-blue-100 text-blue-600 p-2 mr-3'>
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M10 2a8 8 0 100 16 8 8 0 000-16z'
            stroke='currentColor'
            strokeWidth='1.5'
          />
          <path
            d='M10 6v4l2 2'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    ),
    title: 'Profile information updated',
    desc: 'January 24 at 4:30 PM - Changed phone number',
  },
];

export default function AccountActivity() {
  return (
    <div className='w-full max-w-full mx-auto'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <SectionTitle
            text='Account Activity'
            className='text-lg font-semibold'
            level={2}
          />
          <Label className='mt-1'>
            Your recent account activity and system interactions
          </Label>
        </div>
        <ReusableButton
          label='Export Activity'
          className='bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center'
        >
          <svg
            className='mr-1'
            width='16'
            height='16'
            fill='none'
            viewBox='0 0 16 16'
          >
            <path
              d='M8 3v10M3 8h10'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
            />
          </svg>
          Export Activity
        </ReusableButton>
      </div>
      <div className='space-y-3'>
        {activityData.map((item, idx) => (
          <Card
            key={idx}
            className='flex items-center p-4 rounded-xl bg-white border border-gray-100'
          >
            {item.icon}
            <div>
              <div className='font-medium text-gray-800'>{item.title}</div>
              <div className='text-xs text-gray-500 mt-1'>{item.desc}</div>
            </div>
          </Card>
        ))}
      </div>
      <div className='flex justify-center mt-6'>
        <ReusableButton
          label='Load More Activity'
          className='bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center'
        >
          <svg
            className='mr-1'
            width='16'
            height='16'
            fill='none'
            viewBox='0 0 16 16'
          >
            <path
              d='M8 3v10M3 8h10'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
            />
          </svg>
          Load More Activity
        </ReusableButton>
      </div>
    </div>
  );
}
