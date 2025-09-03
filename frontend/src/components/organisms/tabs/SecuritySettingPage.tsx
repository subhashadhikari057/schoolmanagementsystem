'use client';

import React, { useState, useEffect } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import {
  profileApi,
  ChangePasswordDto,
  AccountActivity,
} from '@/api/services/profile';
import Icon from '@/components/atoms/display/Icon';

const getActivityIcon = (action: string, status: string) => {
  const isSuccess = status === 'SUCCESS';

  if (action.includes('LOGIN')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
      >
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

// Password validation functions
const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  return {
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    isValid:
      hasMinLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar,
  };
};

export default function SecuritySettings() {
  // Two-factor state for design toggle
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Demo values for design match
  const passwordStrength = 'Strong';
  const passwordStrengthValue = 90;
  const passwordLastChanged = 'Last changed 30 days ago';
  const sessionCount = 3;
  const securityScore = 94;
  const sessions = [
    {
      device: 'Current Session',
      status: 'Active',
      icon: 'wifi',
      color: 'text-green-600',
    },
    {
      device: 'Desktop',
      status: 'Active',
      icon: 'desktop',
      color: 'text-blue-600',
    },
    {
      device: 'Mobile',
      status: '2h ago',
      icon: 'mobile',
      color: 'text-orange-500',
    },
  ];
  const securityChecks = [
    { label: '2FA Enabled', passed: true },
    { label: 'Strong Password', passed: true },
    { label: 'Recent Login', passed: true },
  ];
  const loginHistory = [
    {
      device: 'Desktop',
      ip: '192.168.1.101',
      date: '2025-01-28',
      time: '09:30 AM',
      status: 'Success',
      color: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-600',
    },
    {
      device: 'Desktop',
      ip: '192.168.1.101',
      date: '2025-01-27',
      time: '08:45 AM',
      status: 'Success',
      color: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-600',
    },
    {
      device: 'Mobile',
      ip: '192.168.1.205',
      date: '2025-01-26',
      time: '09:15 AM',
      status: 'Success',
      color: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-600',
    },
    {
      device: 'Desktop',
      ip: '192.168.1.101',
      date: '2025-01-25',
      time: '10:30 AM',
      status: 'Success',
      color: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-600',
    },
    {
      device: 'Tablet',
      ip: '192.168.1.156',
      date: '2025-01-24',
      time: '11:45 AM',
      status: 'Failed',
      color: 'text-red-500',
      badge: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <div className='w-full max-w-full mx-auto space-y-8'>
      {/* Top dashboard cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Password & Authentication Card */}
        <Card className='p-6 rounded-xl bg-white border border-gray-200 flex flex-col justify-between min-h-[320px]'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <span className='font-semibold text-lg flex items-center gap-2'>
                <svg
                  width='20'
                  height='20'
                  fill='none'
                  viewBox='0 0 20 20'
                  className='mr-1 text-gray-500'
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
                Password & Authentication
              </span>
            </div>
            <Label className='text-sm text-muted-foreground mb-2 block'>
              Manage your account security settings
            </Label>
            <div className='flex items-center gap-2 mt-2'>
              <span className='font-medium text-sm'>
                Two-Factor Authentication
              </span>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={twoFactorEnabled}
                  onChange={e => setTwoFactorEnabled(e.target.checked)}
                  className='sr-only peer'
                />
                <div className='w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-500 transition-all'></div>
                <div className='absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5'></div>
              </label>
            </div>
            <Label className='text-xs text-muted-foreground mt-1 block'>
              Extra security layer for your account
            </Label>
            <div className='mt-4'>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-sm'>Password Strength</span>
                <span className='px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold'>
                  {passwordStrength}
                </span>
              </div>
              <div className='w-full h-2 bg-gray-200 rounded mt-2'>
                <div
                  className='h-2 rounded bg-blue-500'
                  style={{ width: `${passwordStrengthValue}%` }}
                ></div>
              </div>
              <Label className='text-xs text-muted-foreground mt-1 block'>
                {passwordLastChanged}
              </Label>
            </div>
          </div>
          <div className='mt-6 flex flex-col gap-3'>
            <ReusableButton
              label='Change Password'
              onClick={() => {}}
              className='w-full py-2 rounded-lg bg-blue-500 text-white font-semibold'
            />
            <ReusableButton
              label='Download Backup Codes'
              onClick={() => {}}
              className='w-full py-2 rounded-lg border border-gray-300 font-semibold'
            />
            <ReusableButton
              label='Manage Trusted Devices'
              onClick={() => {}}
              className='w-full py-2 rounded-lg border border-gray-300 font-semibold'
            />
          </div>
        </Card>

        {/* Sessions Card */}
        <Card className='p-6 rounded-xl bg-white border border-gray-200 min-h-[320px] flex flex-col justify-between'>
          <div>
            <span className='font-semibold text-lg flex items-center gap-2'>
              <svg
                width='20'
                height='20'
                fill='none'
                viewBox='0 0 20 20'
                className='mr-1 text-gray-500'
              >
                <path
                  d='M4 6h12v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z'
                  stroke='currentColor'
                  strokeWidth='1.5'
                />
                <path d='M8 16h4' stroke='currentColor' strokeWidth='1.5' />
              </svg>
              Sessions
            </span>
            <Label className='text-sm text-muted-foreground mb-2 block'>
              {sessionCount} Active Sessions
            </Label>
            <div className='mt-4 space-y-2'>
              {sessions.map((s, i) => (
                <div key={i} className='flex items-center gap-2'>
                  <span
                    className={`w-5 h-5 flex items-center justify-center ${s.color}`}
                  >
                    {s.icon === 'wifi' ? (
                      <svg
                        width='18'
                        height='18'
                        fill='none'
                        viewBox='0 0 18 18'
                      >
                        <path
                          d='M9 15.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-3.5-3.5a5 5 0 017 0'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                        <path
                          d='M3 9a9 9 0 0112 0'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                      </svg>
                    ) : s.icon === 'desktop' ? (
                      <svg
                        width='18'
                        height='18'
                        fill='none'
                        viewBox='0 0 18 18'
                      >
                        <rect
                          x='3'
                          y='5'
                          width='12'
                          height='7'
                          rx='2'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                        <path
                          d='M6 15h6'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                      </svg>
                    ) : (
                      <svg
                        width='18'
                        height='18'
                        fill='none'
                        viewBox='0 0 18 18'
                      >
                        <rect
                          x='5'
                          y='3'
                          width='8'
                          height='12'
                          rx='2'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                      </svg>
                    )}
                  </span>
                  <span className='text-sm font-medium'>{s.device}</span>
                  <span className='text-xs text-muted-foreground ml-2'>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Security Score Card */}
        <Card className='p-6 rounded-xl bg-white border border-gray-200 min-h-[320px] flex flex-col justify-between'>
          <div>
            <span className='font-semibold text-lg flex items-center gap-2'>
              <svg
                width='20'
                height='20'
                fill='none'
                viewBox='0 0 20 20'
                className='mr-1 text-gray-500'
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
              Security
            </span>
            <div className='flex items-center gap-2 mt-2'>
              <span className='text-3xl font-bold text-green-600'>
                {securityScore}%
              </span>
              <span className='text-xs text-muted-foreground'>
                Security Score
              </span>
            </div>
            <div className='mt-4 space-y-2'>
              {securityChecks.map((c, i) => (
                <div key={i} className='flex items-center gap-2'>
                  <svg width='16' height='16' fill='none' viewBox='0 0 16 16'>
                    <path
                      d='M3 8l3 3 7-7'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <span className='text-sm font-medium text-green-700'>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Login History */}
      <Card className='p-6 rounded-xl bg-white border border-gray-200'>
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
          <span className='font-semibold text-lg'>Recent Login History</span>
        </div>
        <Label className='text-sm text-muted-foreground block'>
          Your recent login attempts and device information
        </Label>
        <div className='mt-4 space-y-2'>
          {loginHistory.map((item, i) => (
            <div
              key={i}
              className='flex items-center p-4 rounded-xl border border-gray-100'
            >
              <span
                className={`w-10 h-10 flex items-center justify-center ${item.color}`}
              >
                {item.device === 'Desktop' ? (
                  <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
                    <rect
                      x='4'
                      y='7'
                      width='16'
                      height='10'
                      rx='2'
                      stroke='currentColor'
                      strokeWidth='1.5'
                    />
                    <path d='M8 21h8' stroke='currentColor' strokeWidth='1.5' />
                  </svg>
                ) : item.device === 'Mobile' ? (
                  <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
                    <rect
                      x='7'
                      y='4'
                      width='10'
                      height='16'
                      rx='2'
                      stroke='currentColor'
                      strokeWidth='1.5'
                    />
                  </svg>
                ) : (
                  <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
                    <rect
                      x='6'
                      y='5'
                      width='12'
                      height='14'
                      rx='2'
                      stroke='currentColor'
                      strokeWidth='1.5'
                    />
                  </svg>
                )}
              </span>
              <div className='flex-1 ml-3'>
                <div className='font-medium text-gray-800'>{item.device}</div>
                <div className='text-xs text-gray-500'>{item.ip}</div>
              </div>
              <div className='flex flex-col items-end'>
                <span className='text-xs text-gray-500'>{item.date}</span>
                <span className='text-xs text-gray-500'>{item.time}</span>
                <span
                  className={`mt-1 px-2 py-0.5 rounded text-xs font-semibold ${item.badge}`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
