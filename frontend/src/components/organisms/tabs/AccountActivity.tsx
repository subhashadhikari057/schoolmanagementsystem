import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Icon from '@/components/atoms/display/Icon';
import { profileApi, AccountActivity } from '@/api/services/profile';

const getActivityIcon = (action: string, status: string) => {
  const isSuccess = status === 'SUCCESS';

  if (action.includes('UPDATE') || action.includes('CREATE')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M10 2v16M2 10h16'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    );
  }

  if (action.includes('PASSWORD')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}
      >
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
    );
  }

  if (action.includes('DELETE')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-red-100 text-red-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M3 6h14M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2m-6 0v10m-4-10v10'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    );
  }

  if (action.includes('EXPORT') || action.includes('DOWNLOAD')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M12 3v13m0 0l-4-4m4 4l4-4M3 21h18'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    );
  }

  return (
    <Icon
      className={`p-2 mr-3 ${isSuccess ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}
    >
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
  );
};

const formatActivityTitle = (action: string) => {
  return action
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const formatActivityDescription = (activity: AccountActivity) => {
  const date = new Date(activity.createdAt).toLocaleDateString();
  const time = new Date(activity.createdAt).toLocaleTimeString();
  const device = activity.userAgent ? 'Web Browser' : 'Unknown Device';
  const ip = activity.ipAddress || 'Unknown IP';

  return `${date} at ${time} - ${device} (${ip})`;
};

export default function AccountActivityComponent() {
  // Demo summary and metrics for design match
  const summary = {
    total: 24,
    logins: 3,
    updates: 12,
    reports: 5,
    settings: 4,
  };
  const metrics = [
    { value: '98.5%', label: 'System Uptime', color: 'text-blue-600' },
    { value: '156ms', label: 'Avg Response', color: 'text-green-600' },
    { value: '7.2GB', label: 'Data Usage', color: 'text-purple-600' },
    { value: '2.4K', label: 'API Calls', color: 'text-orange-600' },
  ];
  const activities = [
    {
      icon: (
        <svg
          width='20'
          height='20'
          fill='none'
          viewBox='0 0 20 20'
          className='text-green-600'
        >
          <path
            d='M10 13a2 2 0 100-4 2 2 0 000 4z'
            stroke='currentColor'
            strokeWidth='1.5'
          />
          <rect
            x='4'
            y='7'
            width='12'
            height='9'
            rx='2'
            stroke='currentColor'
            strokeWidth='1.5'
          />
          <path
            d='M7 7V5a3 3 0 016 0v2'
            stroke='currentColor'
            strokeWidth='1.5'
          />
        </svg>
      ),
      title: 'Successfully logged in',
      desc: 'Today at 9:30 AM from Desktop (192.168.1.101)',
      badge: 'Login',
      badgeClass: 'bg-gray-100 text-gray-600',
    },
    {
      icon: (
        <svg
          width='20'
          height='20'
          fill='none'
          viewBox='0 0 20 20'
          className='text-blue-600'
        >
          <path
            d='M10 2v16M2 10h16'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      ),
      title: 'Updated student record',
      desc: 'Yesterday at 3:45 PM - Modified Emily Johnson’s profile',
      badge: 'Activity',
      badgeClass: 'bg-gray-100 text-gray-600',
    },
    {
      icon: (
        <svg
          width='20'
          height='20'
          fill='none'
          viewBox='0 0 20 20'
          className='text-purple-600'
        >
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
      ),
      title: 'Changed notification settings',
      desc: 'January 26 at 11:20 AM - Disabled SMS notifications',
      badge: 'Settings',
      badgeClass: 'bg-gray-100 text-gray-600',
    },
    {
      icon: (
        <svg
          width='20'
          height='20'
          fill='none'
          viewBox='0 0 20 20'
          className='text-yellow-500'
        >
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
      ),
      title: 'Failed login attempt',
      desc: 'January 25 at 2:15 PM - Invalid password from Mobile device',
      badge: 'Warning',
      badgeClass: 'bg-yellow-100 text-yellow-700',
    },
    {
      icon: (
        <svg
          width='20'
          height='20'
          fill='none'
          viewBox='0 0 20 20'
          className='text-blue-600'
        >
          <path
            d='M10 2v16M2 10h16'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      ),
      title: 'Profile information updated',
      desc: 'January 24 at 4:30 PM - Changed phone number',
      badge: 'Update',
      badgeClass: 'bg-gray-100 text-gray-600',
    },
  ];

  return (
    <div className='w-full max-w-full mx-auto'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {/* Recent Activity */}
        <Card
          className='p-8 rounded-3xl bg-white border border-gray-100 shadow-lg col-span-2 flex flex-col'
          style={{ minHeight: 340, maxHeight: 340 }}
        >
          <div className='mb-4 flex items-center gap-3'>
            <svg
              width='28'
              height='28'
              fill='none'
              viewBox='0 0 20 20'
              className='text-blue-500'
            >
              <path
                d='M10 2v16M2 10h16'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
              />
            </svg>
            <span className='font-bold text-2xl tracking-tight'>
              Recent Activity
            </span>
          </div>
          <Label className='text-base text-gray-400 mb-4 block'>
            Your latest actions and system events
          </Label>
          <div
            className='flex-1 overflow-y-auto space-y-4 pr-2'
            style={{ maxHeight: 232, minHeight: 232 }}
          >
            {activities.map((item, i) => (
              <div
                key={i}
                className='flex items-center justify-between py-3 px-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-blue-50 transition-colors shadow-sm group'
              >
                <div className='flex items-center gap-4'>
                  <span className='rounded-full p-3 bg-white shadow group-hover:bg-blue-100 transition-colors'>
                    {item.icon}
                  </span>
                  <div>
                    <div className='font-bold text-lg text-gray-800 group-hover:text-blue-700 transition-colors'>
                      {item.title}
                    </div>
                    <div className='text-sm text-gray-500 mt-1 group-hover:text-gray-700 transition-colors'>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <span
                  className={`ml-4 px-4 py-1 rounded-full text-sm font-semibold shadow-sm ${item.badgeClass} group-hover:scale-105 transition-transform`}
                >
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Summary Card */}
        <Card className='p-8 rounded-3xl bg-white border border-gray-100 shadow-lg flex flex-col items-center justify-center min-h-[220px] max-h-[340px] max-w-[340px] mx-auto'>
          <div className='flex flex-col items-center justify-center w-full'>
            <div className='flex items-center gap-3 mb-3'>
              <svg
                width='28'
                height='28'
                fill='none'
                viewBox='0 0 20 20'
                className='text-blue-500'
              >
                <path
                  d='M3 17V7a2 2 0 012-2h10a2 2 0 012 2v10'
                  stroke='currentColor'
                  strokeWidth='1.5'
                />
                <path d='M7 3h6' stroke='currentColor' strokeWidth='1.5' />
              </svg>
              <span className='font-bold text-2xl tracking-tight'>Summary</span>
            </div>
            <div className='text-5xl font-extrabold text-blue-600 mb-2 tracking-tight'>
              {summary.total}
            </div>
            <div className='text-lg text-gray-400 mb-6'>Today's Actions</div>
            <div className='grid grid-cols-2 gap-x-10 gap-y-3 text-lg w-full mt-2'>
              <div className='flex justify-between'>
                <span>Logins</span>
                <span className='font-bold'>{summary.logins}</span>
              </div>
              <div className='flex justify-between'>
                <span>Updates</span>
                <span className='font-bold'>{summary.updates}</span>
              </div>
              <div className='flex justify-between'>
                <span>Reports</span>
                <span className='font-bold'>{summary.reports}</span>
              </div>
              <div className='flex justify-between'>
                <span>Settings</span>
                <span className='font-bold'>{summary.settings}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Performance & Usage */}
      <Card className='p-8 rounded-3xl bg-white border border-gray-100 shadow-lg mt-8'>
        <div className='mb-2 flex items-center gap-2'>
          <svg
            width='20'
            height='20'
            fill='none'
            viewBox='0 0 20 20'
            className='text-gray-500'
          >
            <rect
              x='3'
              y='5'
              width='14'
              height='10'
              rx='2'
              stroke='currentColor'
              strokeWidth='1.5'
            />
            <path d='M7 17h6' stroke='currentColor' strokeWidth='1.5' />
          </svg>
          <span className='font-semibold text-lg'>
            System Performance & Usage
          </span>
        </div>
        <Label className='text-sm text-muted-foreground block mb-4'>
          Your usage patterns and system metrics
        </Label>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {metrics.map((m, i) => (
            <div
              key={i}
              className='flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 border border-gray-100'
            >
              <span className={`text-xl font-bold ${m.color}`}>{m.value}</span>
              <span className='text-xs text-muted-foreground mt-1'>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
