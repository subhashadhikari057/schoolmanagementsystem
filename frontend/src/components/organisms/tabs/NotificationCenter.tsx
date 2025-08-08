'use client';

import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Icon from '@/components/atoms/display/Icon';
import { Card } from '@/components/ui/card';
import ReusableButton from '@/components/atoms/form-controls/Button';
import NotificationPanel from '@/components/organisms/dashboard/NotificationPanel';

// Demo data for the notification summary cards
const summary = [
  {
    label: 'Total Notifications',
    value: 156,
    icon: (
      <path
        d='M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z'
        stroke='currentColor'
        strokeWidth='2'
      />
    ),
    color: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Unread',
    value: 23,
    icon: (
      <path
        d='M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z'
        stroke='currentColor'
        strokeWidth='2'
      />
    ),
    color: 'bg-blue-50 text-blue-500',
  },
  {
    label: 'Critical Alerts',
    value: 5,
    icon: (
      <path
        d='M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z'
        stroke='currentColor'
        strokeWidth='2'
      />
    ),
    color: 'bg-orange-100 text-orange-600',
  },
  {
    label: 'System Messages',
    value: 12,
    icon: (
      <path
        d='M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z'
        stroke='currentColor'
        strokeWidth='2'
      />
    ),
    color: 'bg-green-100 text-green-600',
  },
];

export default function NotificationCenterPage() {
  return (
    <div className='w-full max-w-full mx-auto space-y-8'>
      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {summary.map(({ label, value, icon, color }) => (
          <Card
            key={label}
            className='flex flex-col items-center py-6 px-2 rounded-xl border-0 bg-white shadow-sm'
          >
            <Icon
              className={`mb-2 w-8 h-8 rounded-full flex items-center justify-center ${color}`}
            >
              <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
                {icon}
              </svg>
            </Icon>
            <div className='text-2xl font-bold mb-1'>{value}</div>
            <Label className='text-xs text-gray-600'>{label}</Label>
          </Card>
        ))}
      </div>

      {/* Notification Center */}
      <Card className='p-6 rounded-xl bg-white border border-gray-100'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2'>
          <div>
            <SectionTitle
              text='Notification Center'
              className='text-lg font-semibold'
              level={2}
            />
            <Label className='text-gray-500'>
              System alerts and important messages
            </Label>
          </div>
          <div className='flex gap-2'>
            <ReusableButton
              label='Mark All Read'
              className='bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md'
            />
            <ReusableButton
              label='+ Create Alert'
              className='bg-blue-600 text-white px-3 py-1.5 rounded-md'
            />
          </div>
        </div>
        <NotificationPanel hideHeading />
      </Card>
    </div>
  );
}
