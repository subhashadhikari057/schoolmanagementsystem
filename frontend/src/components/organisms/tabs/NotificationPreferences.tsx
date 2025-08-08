import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Icon from '@/components/atoms/display/Icon';
import { Card } from '@/components/ui/card';
import ReusableButton from '@/components/atoms/form-controls/Button';
import React, { useState } from 'react';

const notificationOptions = [
  {
    label: 'Email Notifications',
    description: 'Receive notifications via email',
    checked: true,
  },
  {
    label: 'SMS Notifications',
    description: 'Receive SMS alerts for critical updates',
    checked: false,
  },
  {
    label: 'System Alerts',
    description: 'Get notified about system maintenance and updates',
    checked: true,
  },
  {
    label: 'Student Updates',
    description: 'Notifications about student activities',
    checked: true,
  },
  {
    label: 'Fee Alerts',
    description: 'Payment and due date reminders',
    checked: true,
  },
  {
    label: 'Academic Updates',
    description: 'Exam schedules and academic announcements',
    checked: true,
  },
];

const digestOptions = [
  'Daily digest',
  'Weekly digest',
  'Monthly digest',
  'Never',
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border border-gray-300 ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function NotificationPreferences() {
  const [digest, setDigest] = useState('Daily digest');
  const [prefs, setPrefs] = useState(notificationOptions);

  return (
    <div className='w-full max-w-full mx-auto'>
      <div className='mb-6'>
        <SectionTitle
          text='Notification Preferences'
          className='text-lg font-semibold'
          level={2}
        />
        <Label className='mt-1'>
          Customize how and when you receive notifications
        </Label>
      </div>
      <div className='space-y-3'>
        {prefs.map((opt, idx) => (
          <Card
            key={opt.label}
            className='flex items-center p-4 rounded-xl bg-white border border-gray-100 justify-between'
          >
            <div className='flex items-center gap-3'>
              <Icon className='text-gray-400'>
                <svg width='20' height='20' fill='none' viewBox='0 0 24 24'>
                  <path
                    d='M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z'
                    stroke='currentColor'
                    strokeWidth='2'
                  />
                </svg>
              </Icon>
              <div>
                <div className='font-medium text-gray-900'>{opt.label}</div>
                <Label>{opt.description}</Label>
              </div>
            </div>
            <Toggle
              checked={opt.checked}
              onChange={() => {
                setPrefs(prefs =>
                  prefs.map((p, i) =>
                    i === idx ? { ...p, checked: !p.checked } : p,
                  ),
                );
              }}
            />
          </Card>
        ))}
      </div>
      <div className='mt-10 bg-gray-50 rounded-xl p-6'>
        <SectionTitle text='Email Digest' className='mb-1' level={3} />
        <Label className='mb-6 block'>
          Choose how often you receive email summaries
        </Label>
        <div className='flex flex-col gap-2'>
          {digestOptions.map(option => (
            <Card
              key={option}
              className={`flex items-center p-3 rounded-lg border cursor-pointer ${digest === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
              onClick={() => setDigest(option)}
            >
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${digest === option ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}
              >
                {digest === option && (
                  <span className='h-2 w-2 rounded-full bg-white block' />
                )}
              </span>
              <span className='text-gray-700'>{option}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
