import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Icon from '@/components/atoms/display/Icon';
import ToggleSwitch from '@/components/atoms/form-controls/ToggleSwitch';

// --- Data ---
const systemPreferences = [
  {
    label: 'Email Notifications',
    description: 'Receive email alerts for important events',
    checked: true,
  },
  {
    label: 'Auto Backup',
    description: 'Automatically backup data daily',
    checked: true,
  },
  {
    label: 'Two-Factor Authentication',
    description: 'Enhanced security for admin accounts',
    checked: false,
  },
  {
    label: 'Maintenance Mode',
    description: 'Temporarily disable system access',
    checked: false,
  },
];

const topCardItems = [
  {
    label: 'General Settings',
    desc: 'Configure general settings',
    iconColor: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900',
    icon: (
      <path
        d='M12 4v16m8-8H4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    ),
  },
  {
    label: 'User Management',
    desc: 'Configure user management',
    iconColor: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-900',
    icon: (
      <path
        d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
        stroke='currentColor'
        strokeWidth='2'
      />
    ),
  },
  {
    label: 'Security',
    desc: 'Configure security',
    iconColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-900',
    icon: (
      <>
        <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
        <path
          d='M12 8v4'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <circle cx='12' cy='16' r='1' fill='currentColor' />
      </>
    ),
  },
  {
    label: 'Notifications',
    desc: 'Configure notifications',
    iconColor: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-900',
    icon: (
      <path
        d='M12 4v16m8-8H4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    ),
  },
  {
    label: 'Data & Backup',
    desc: 'Configure data & backup',
    iconColor: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900',
    icon: (
      <rect
        x='4'
        y='4'
        width='16'
        height='16'
        rx='4'
        stroke='currentColor'
        strokeWidth='2'
      />
    ),
  },
  {
    label: 'Appearance',
    desc: 'Configure appearance',
    iconColor: 'bg-pink-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-900',
    icon: (
      <>
        <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
        <path
          d='M8 12h8'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </>
    ),
  },
];

const systemInfo = [
  { label: 'System Version', value: 'EduAdmin v2.4.1' },
  { label: 'Last Update', value: 'July 15, 2025' },
  { label: 'Database Size', value: '2.3 GB' },
  { label: 'Server Status', value: 'Online' },
  { label: 'Uptime', value: '99.8%' },
  { label: 'Active Users', value: '847 online' },
];

const generalSettings = [
  { label: 'School Name', value: 'Greenwood International School' },
  { label: 'Academic Year', value: '2024-2025' },
  { label: 'Timezone', value: 'Eastern Standard Time' },
  { label: 'Default Language', value: 'English' },
];

// --- Reusable Components ---
type SettingCardProps = {
  bgColor: string;
  iconColor: string;
  textColor: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
};
const SettingCard: React.FC<SettingCardProps> = ({
  bgColor,
  iconColor,
  textColor,
  icon,
  label,
  desc,
}) => (
  <Card className={`flex items-center gap-4 p-5 ${bgColor} border-0`}>
    <Icon className={`${iconColor} text-white p-2 rounded-lg`}>
      <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
        {icon}
      </svg>
    </Icon>
    <div>
      <div className={`font-semibold ${textColor}`}>{label}</div>
      <Label>{desc}</Label>
    </div>
  </Card>
);

type InfoBlockProps = {
  label: string;
  value: string;
};
const InfoBlock: React.FC<InfoBlockProps> = ({ label, value }) => (
  <div>
    <Label className='-mb-2 ml-2 bg-white px-1 text-xs'>{label}</Label>
    <SectionTitle
      text={value}
      className='text-base font-medium px-3 py-2 border rounded-md border-gray-200 bg-white'
      level={3}
    />
  </div>
);

// --- Main Component ---
export default function SystemSettings() {
  const [prefs, setPrefs] = useState(systemPreferences);

  return (
    <div className='w-full max-w-full mx-auto space-y-8'>
      {/* Top Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
        {topCardItems.map(item => (
          <SettingCard key={item.label} {...item} />
        ))}
      </div>

      {/* General Settings */}
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-6'>
        <SectionTitle
          text='General Settings'
          className='text-lg font-semibold mb-2'
          level={2}
        />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {generalSettings.map(({ label, value }) => (
            <InfoBlock key={label} label={label} value={value} />
          ))}
        </div>
      </Card>

      {/* System Preferences */}
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-2'>
        <SectionTitle
          text='System Preferences'
          className='text-lg font-semibold mb-2'
          level={2}
        />
        <div className='divide-y'>
          {prefs.map((opt, idx) => (
            <div
              key={opt.label}
              className='flex items-center justify-between py-4'
            >
              <div>
                <div className='font-medium text-gray-900'>{opt.label}</div>
                <Label>{opt.description}</Label>
              </div>
              <ToggleSwitch
                checked={opt.checked}
                onChange={() =>
                  setPrefs(prev =>
                    prev.map((p, i) =>
                      i === idx ? { ...p, checked: !p.checked } : p,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* System Info */}
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-6'>
        <SectionTitle
          text='System Information'
          className='text-lg font-semibold mb-2'
          level={2}
        />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {Array.from({ length: 2 }).map((_, i) => (
            <div className='space-y-4' key={i}>
              {systemInfo.slice(i * 3, i * 3 + 3).map(info => (
                <InfoBlock key={info.label} {...info} />
              ))}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-3 mt-6'>
          {[
            { label: 'Save Changes', className: 'bg-blue-600 text-white' },
            {
              label: 'Reset to Defaults',
              className: 'bg-white border border-gray-300 text-gray-700',
            },
            {
              label: 'Export Configuration',
              className: 'bg-white border border-gray-300 text-gray-700',
            },
          ].map(btn => (
            <ReusableButton
              key={btn.label}
              label={btn.label}
              className={`${btn.className} px-4 py-2 rounded-md`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
