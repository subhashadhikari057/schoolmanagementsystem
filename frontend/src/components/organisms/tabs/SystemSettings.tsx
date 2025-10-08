'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/atoms/display/Icon';
import ReusableButton from '@/components/atoms/form-controls/Button';
import {
  Monitor,
  Database,
  AlertTriangle,
  CheckCircle,
  Settings,
  Bell,
  HardDrive,
  Zap,
  Download,
  HelpCircle,
  BookOpen,
  Phone,
  BarChart3,
} from 'lucide-react';

// Status badge component
const StatusBadge = ({
  status,
  text,
}: {
  status: 'excellent' | 'good' | 'warning' | 'error';
  text: string;
}) => {
  const variants = {
    excellent: 'bg-green-50 text-green-700 border border-green-200',
    good: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${variants[status]}`}
    >
      {text}
    </span>
  );
};

// Setting item component
const SettingItem = ({
  icon,
  title,
  description,
  status,
  statusText,
  configOptions = [],
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'excellent' | 'good' | 'warning' | 'error';
  statusText: string;
  configOptions?: string[];
  onClick?: () => void;
}) => (
  <Card className='bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group h-full flex flex-col'>
    <div className='flex items-start justify-between mb-4'>
      <div className='flex items-start gap-3 sm:gap-4 flex-1 min-w-0'>
        <Icon className='bg-blue-50 text-blue-600 p-2 sm:p-3 rounded-lg flex-shrink-0 group-hover:bg-blue-100 transition-colors'>
          {icon}
        </Icon>
        <div className='min-w-0 flex-1'>
          <h3 className='font-semibold text-gray-900 text-base sm:text-lg mb-1 truncate'>
            {title}
          </h3>
          <p className='text-gray-600 text-sm leading-relaxed'>{description}</p>
        </div>
      </div>
      <div className='flex flex-col items-end gap-2 flex-shrink-0 ml-2'>
        <StatusBadge status={status} text={statusText} />
      </div>
    </div>

    <div className='flex-1'>
      {configOptions.length > 0 && (
        <>
          <div className='text-sm text-gray-600 mb-3'>
            Configuration Options:
          </div>
          <div className='flex flex-wrap gap-2 mb-4'>
            {configOptions.map((option, index) => (
              <span
                key={index}
                className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs whitespace-nowrap'
              >
                {option}
              </span>
            ))}
          </div>
        </>
      )}
    </div>

    <div className='pt-2 border-t border-gray-100 mt-auto'>
      <ReusableButton
        className='w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 !text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-sm group-hover:bg-gray-100 cursor-pointer'
        onClick={onClick}
      >
        <Settings size={14} />
        Configure Settings
      </ReusableButton>
    </div>
  </Card>
);

// Quick action item component
const QuickActionItem = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}) => (
  <Card
    className='bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group'
    onClick={onClick}
  >
    <div className='flex items-center gap-3 sm:gap-4'>
      <Icon className='bg-blue-50 text-blue-600 p-2 sm:p-3 rounded-lg flex-shrink-0 group-hover:bg-blue-100 transition-colors'>
        {icon}
      </Icon>
      <div className='min-w-0 flex-1'>
        <h4 className='font-medium text-gray-900 text-sm sm:text-base mb-1 truncate'>
          {title}
        </h4>
        <p className='text-gray-600 text-xs sm:text-sm leading-relaxed'>
          {description}
        </p>
      </div>
    </div>
  </Card>
);

export default function SystemSettings() {
  const handleConfigureSettings = (settingType: string) => {
    console.log(`Configure ${settingType} settings`);
    // Handle navigation to specific settings
    if (settingType === 'system') {
      window.location.href = '/dashboard/admin/settings/system';
    }
    if (settingType === 'notifications') {
      window.location.href = '/dashboard/admin/settings/notifications';
    }
    if (settingType === 'backup') {
      window.location.href = '/dashboard/admin/settings/backup';
    }
  };

  const handleQuickAction = (actionType: string) => {
    console.log(`Execute ${actionType} action`);
    // Handle quick actions
    if (actionType === 'backup') {
      window.location.href = '/dashboard/admin/settings/backup?embedded=true';
    }
  };

  const handleContactSupport = () => {
    console.log('Contact support');
    // Handle support contact
  };

  const handleViewDocumentation = () => {
    console.log('View documentation');
    // Handle documentation viewing
  };

  return (
    <div className='w-full min-h-screen p-4 sm:p-6'>
      <div className='w-full max-w-none space-y-6'>
        {/* System Status Section */}
        <Card className='bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm'>
          <div className='flex items-center gap-3 mb-6'>
            <Icon className='bg-blue-50 text-blue-600 p-2 rounded-lg flex-shrink-0'>
              <Monitor size={20} />
            </Icon>
            <div className='min-w-0'>
              <h2 className='text-lg sm:text-xl font-semibold text-gray-900 truncate'>
                System Status
              </h2>
              <p className='text-gray-600 text-sm'>
                Current system health and performance metrics
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <CheckCircle className='text-green-500 flex-shrink-0' size={20} />
              <div className='min-w-0'>
                <p className='font-medium text-gray-900 text-sm'>
                  System Health
                </p>
                <StatusBadge status='excellent' text='Excellent' />
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <Database className='text-emerald-500 flex-shrink-0' size={20} />
              <div className='min-w-0'>
                <p className='font-medium text-gray-900 text-sm'>Database</p>
                <StatusBadge status='good' text='Good' />
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <HardDrive className='text-yellow-500 flex-shrink-0' size={20} />
              <div className='min-w-0'>
                <p className='font-medium text-gray-900 text-sm'>
                  Backup Status
                </p>
                <StatusBadge status='warning' text='Warning' />
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <AlertTriangle className='text-red-500 flex-shrink-0' size={20} />
              <div className='min-w-0'>
                <p className='font-medium text-gray-900 text-sm'>Security</p>
                <StatusBadge status='error' text='Needs Attention' />
              </div>
            </div>
          </div>
        </Card>

        {/* Configuration Categories Section */}
        <div>
          <h2 className='text-xl sm:text-2xl font-semibold text-gray-900 mb-2'>
            Configuration Categories
          </h2>
          <p className='text-gray-600 mb-6 text-sm sm:text-base'>
            Choose a category to configure your system settings
          </p>

          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
            <SettingItem
              icon={<Settings size={24} />}
              title='School Information'
              description="Configure your school's basic information and settings"
              status='excellent'
              statusText='Configured'
              configOptions={[
                'School Name',
                'School Code',
                'Establishment Year',
                'Address',
              ]}
              onClick={() => handleConfigureSettings('system')}
            />

            <SettingItem
              icon={<Bell size={24} />}
              title='Notifications Settings'
              description='Set up email, SMS, and push notification preferences'
              status='excellent'
              statusText='Configured'
              configOptions={[
                'Email Settings',
                'SMS Configuration',
                'Push Notifications',
                'Alert Thresholds',
              ]}
              onClick={() => handleConfigureSettings('notifications')}
            />

            <SettingItem
              icon={<HardDrive size={24} />}
              title='Backup & Recovery'
              description='Configure data backup, recovery, and archival policies'
              status='excellent'
              statusText='Configured'
              configOptions={[
                'Backup Schedule',
                'Recovery Plans',
                'Data Archival',
                'Export Tools',
              ]}
              onClick={() => handleConfigureSettings('backup')}
            />
          </div>
        </div>

        {/* Quick Actions Section */}
        <Card className='bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm'>
          <div className='flex items-center gap-3 mb-6'>
            <Icon className='bg-green-50 text-green-600 p-2 rounded-lg flex-shrink-0'>
              <Zap size={20} />
            </Icon>
            <div className='min-w-0'>
              <h2 className='text-lg sm:text-xl font-semibold text-gray-900 truncate'>
                Quick Actions
              </h2>
              <p className='text-gray-600 text-sm'>
                Frequently used administrative tools and shortcuts
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            <QuickActionItem
              icon={<Download size={20} />}
              title='Export Settings'
              description='Download configuration backup'
              onClick={() => handleQuickAction('export')}
            />

            <QuickActionItem
              icon={<HardDrive size={20} />}
              title='System Backup'
              description='Create full system backup'
              onClick={() => handleQuickAction('backup')}
            />

            <QuickActionItem
              icon={<BarChart3 size={20} />}
              title='System Logs'
              description='View system activity logs'
              onClick={() => handleQuickAction('logs')}
            />
          </div>
        </Card>

        {/* Need Help Section */}
        <Card className='bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-200'>
          <div className='flex flex-col sm:flex-row items-start gap-4'>
            <Icon className='bg-blue-100 text-blue-600 p-2 rounded-lg flex-shrink-0'>
              <HelpCircle size={20} />
            </Icon>
            <div className='flex-1 min-w-0'>
              <h3 className='text-base sm:text-lg font-semibold text-blue-900 mb-2'>
                Need Help?
              </h3>
              <p className='text-blue-700 mb-4 text-sm sm:text-base'>
                Check our documentation or contact support for assistance with
                system configuration.
              </p>
              <div className='flex flex-col sm:flex-row gap-3'>
                <ReusableButton
                  className='flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm'
                  onClick={handleViewDocumentation}
                >
                  <BookOpen size={16} />
                  View Documentation
                </ReusableButton>
                <ReusableButton
                  className='flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm'
                  onClick={handleContactSupport}
                >
                  <Phone size={16} />
                  Contact Support
                </ReusableButton>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
