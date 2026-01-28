'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/atoms/display/Icon';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import {
  Clock,
  Settings,
  Mail,
  MessageSquare,
  Shield,
  Database,
  Bell,
  Globe2,
} from 'lucide-react';

interface SystemPreferencesTabProps {
  isEditing?: boolean;
}

export default function SystemPreferencesTab({
  isEditing = false,
}: SystemPreferencesTabProps) {
  const [preferences, setPreferences] = useState({
    automaticBackups: true,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    autoUpdates: true,
    dataRetention: true,
    timezone: 'Eastern Time (ET)',
    timeFormat: '12-hour (AM/PM)',
    dateFormat: 'MM/DD/YYYY (US)',
    currency: 'US Dollar ($)',
  });

  const handleToggle = (field: string) => {
    if (!isEditing) return;
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      disabled={!isEditing}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
        checked ? 'bg-blue-600 shadow-lg' : 'bg-gray-200'
      } ${!isEditing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SettingItem = ({
    icon,
    iconBg,
    title,
    description,
    children,
  }: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div
      className={`flex items-center justify-between py-4 group rounded-lg px-3 -mx-3 transition-colors ${
        isEditing ? 'hover:bg-gray-50/50' : ''
      }`}
    >
      <div className='flex items-center gap-4'>
        <div
          className={`p-2.5 rounded-lg ${iconBg} transition-transform ${
            isEditing ? 'group-hover:scale-105' : ''
          }`}
        >
          {icon}
        </div>
        <div>
          <p className='font-semibold text-gray-900 text-sm'>{title}</p>
          <p className='text-sm text-gray-500 mt-0.5'>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  const timezoneOptions = [
    { value: 'Eastern Time (ET)', label: 'Eastern Time (ET)' },
    { value: 'Central Time (CT)', label: 'Central Time (CT)' },
    { value: 'Mountain Time (MT)', label: 'Mountain Time (MT)' },
    { value: 'Pacific Time (PT)', label: 'Pacific Time (PT)' },
  ];

  const timeFormatOptions = [
    { value: '12-hour (AM/PM)', label: '12-hour (AM/PM)' },
    { value: '24-hour', label: '24-hour' },
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY (US)', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY (UK)', label: 'DD/MM/YYYY (UK)' },
    { value: 'YYYY-MM-DD (ISO)', label: 'YYYY-MM-DD (ISO)' },
  ];

  const currencyOptions = [
    { value: 'US Dollar ($)', label: 'US Dollar ($)' },
    { value: 'Euro (€)', label: 'Euro (€)' },
    { value: 'British Pound (£)', label: 'British Pound (£)' },
    { value: 'Indian Rupee (रु )', label: 'Indian Rupee (रु )' },
  ];

  const DropdownGroup = ({
    icon,
    label,
    options,
    value,
    field,
  }: {
    icon: React.ReactNode;
    label: string;
    options: { value: string; label: string }[];
    value: string;
    field: string;
  }) => (
    <div className='space-y-3'>
      <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
        {icon}
        {label}
      </label>
      {isEditing ? (
        <Dropdown
          type='filter'
          options={options}
          selectedValue={value}
          onSelect={newValue => handleSelectChange(field, newValue)}
          placeholder={`Select ${label.toLowerCase()}`}
          className='w-full'
        />
      ) : (
        <div className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700'>
          {value}
        </div>
      )}
    </div>
  );

  return (
    <div className='space-y-8'>
      {/* Regional & Time Settings */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-8'>
          <div className='p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl'>
            <Clock className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              Regional & Time Settings
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              Configure timezone, date format, and regional preferences
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <DropdownGroup
            icon={<Globe2 className='h-4 w-4 text-blue-500' />}
            label='Timezone'
            options={timezoneOptions}
            value={preferences.timezone}
            field='timezone'
          />

          <DropdownGroup
            icon={<Clock className='h-4 w-4 text-green-500' />}
            label='Time Format'
            options={timeFormatOptions}
            value={preferences.timeFormat}
            field='timeFormat'
          />

          <DropdownGroup
            icon={<Clock className='h-4 w-4 text-purple-500' />}
            label='Date Format'
            options={dateFormatOptions}
            value={preferences.dateFormat}
            field='dateFormat'
          />

          <DropdownGroup
            icon={<Settings className='h-4 w-4 text-orange-500' />}
            label='Currency'
            options={currencyOptions}
            value={preferences.currency}
            field='currency'
          />
        </div>
      </Card>

      {/* System Behavior */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl'>
            <Settings className='h-6 w-6 text-purple-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>System Behavior</h3>
            <p className='text-gray-600 text-sm mt-1'>
              Configure automated system features and maintenance settings
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <SettingItem
            icon={<Database className='h-5 w-5 text-green-600' />}
            iconBg='bg-green-50'
            title='Automatic Backups'
            description='Schedule daily system backups to secure your data'
          >
            <ToggleSwitch
              checked={preferences.automaticBackups}
              onChange={() => handleToggle('automaticBackups')}
            />
          </SettingItem>

          <SettingItem
            icon={<Shield className='h-5 w-5 text-blue-600' />}
            iconBg='bg-blue-50'
            title='Automatic Updates'
            description='Install security updates and patches automatically'
          >
            <ToggleSwitch
              checked={preferences.autoUpdates}
              onChange={() => handleToggle('autoUpdates')}
            />
          </SettingItem>

          <SettingItem
            icon={<Database className='h-5 w-5 text-orange-600' />}
            iconBg='bg-orange-50'
            title='Data Retention Policy'
            description='Automatically archive old records per regulations'
          >
            <ToggleSwitch
              checked={preferences.dataRetention}
              onChange={() => handleToggle('dataRetention')}
            />
          </SettingItem>

          <SettingItem
            icon={<Settings className='h-5 w-5 text-red-600' />}
            iconBg='bg-red-50'
            title='Maintenance Mode'
            description='Enable system maintenance mode for updates'
          >
            <ToggleSwitch
              checked={preferences.maintenanceMode}
              onChange={() => handleToggle('maintenanceMode')}
            />
          </SettingItem>
        </div>
      </Card>

      {/* Communication Settings */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl'>
            <Bell className='h-6 w-6 text-cyan-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              Communication Settings
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              Configure notification delivery methods and preferences
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <SettingItem
            icon={<Mail className='h-5 w-5 text-blue-600' />}
            iconBg='bg-blue-50'
            title='Email Notifications'
            description='Send system alerts and updates via email'
          >
            <ToggleSwitch
              checked={preferences.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
          </SettingItem>

          <SettingItem
            icon={<MessageSquare className='h-5 w-5 text-green-600' />}
            iconBg='bg-green-50'
            title='SMS Notifications'
            description='Send urgent alerts via SMS messages'
          >
            <ToggleSwitch
              checked={preferences.smsNotifications}
              onChange={() => handleToggle('smsNotifications')}
            />
          </SettingItem>
        </div>
      </Card>
    </div>
  );
}
