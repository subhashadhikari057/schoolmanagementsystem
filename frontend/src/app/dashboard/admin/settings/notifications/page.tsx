'use client';

import React, { useState } from 'react';
import {
  Bell,
  Edit2,
  Save,
  X,
  Mail,
  MessageSquare,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import EmailSettingsTab from '@/components/organisms/settings/EmailSettingsTab';
import SMSConfigurationTab from '@/components/organisms/settings/SMSConfigurationTab';
import PushNotificationsTab from '@/components/organisms/settings/PushNotificationsTab';
import AlertThresholdsTab from '@/components/organisms/settings/AlertThresholdsTab';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import SettingsNavigation from '@/components/molecules/SettingsNavigation';

export default function NotificationSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);

  const breadcrumbs = [
    { label: 'Settings', href: '/dashboard/admin/settings' },
    { label: 'Notifications' },
  ];

  // Stats for notification settings overview
  const notificationStats = [
    {
      icon: Mail,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      value: '2,847',
      label: 'Emails Sent This Month',
      change: '5%',
      isPositive: true,
    },
    {
      icon: MessageSquare,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      value: '1,247',
      label: 'SMS Sent This Month',
      change: '12%',
      isPositive: true,
    },
    {
      icon: Smartphone,
      bgColor: 'bg-purple-600',
      iconColor: 'text-white',
      value: '8,542',
      label: 'Push Notifications Sent',
      change: '8%',
      isPositive: true,
    },
    {
      icon: AlertTriangle,
      bgColor: 'bg-orange-600',
      iconColor: 'text-white',
      value: '24',
      label: 'Active Alert Rules',
      change: '3 new',
      isPositive: true,
    },
  ];

  // Tab configuration for GenericTabs
  const tabs = [
    {
      name: 'Email Settings',
      content: <EmailSettingsTab isEditing={isEditing} />,
    },
    {
      name: 'SMS Configuration',
      content: <SMSConfigurationTab isEditing={isEditing} />,
    },
    {
      name: 'Push Notifications',
      content: <PushNotificationsTab isEditing={isEditing} />,
    },
    {
      name: 'Alert Thresholds',
      content: <AlertThresholdsTab isEditing={isEditing} />,
    },
  ];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would typically save the data
    console.log('Saving notification changes...');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Here you would typically reset any unsaved changes
    console.log('Cancelling notification changes...');
    setIsEditing(false);
  };

  return (
    <div className='min-h-screen'>
      <SettingsNavigation
        breadcrumbs={breadcrumbs}
        title='Notification Settings'
        description='Configure email, SMS, push notifications and alert thresholds'
        showBackButton={true}
      />

      {/* Action Buttons */}
      <div className='px-4 sm:px-6 lg:px-8 mb-6'>
        <div className='flex justify-end'>
          <div className='flex space-x-3'>
            {!isEditing ? (
              <>
                <ReusableButton
                  onClick={() => {}}
                  className='text-sm px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md'
                >
                  <Bell className='h-4 w-4' />
                  Reset to Defaults
                </ReusableButton>
                <ReusableButton
                  onClick={handleEdit}
                  className='text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md'
                >
                  <Edit2 className='h-4 w-4' />
                  Edit Settings
                </ReusableButton>
              </>
            ) : (
              <>
                <ReusableButton
                  onClick={handleCancel}
                  className='text-sm px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md'
                >
                  <X className='h-4 w-4' />
                  Cancel
                </ReusableButton>
                <ReusableButton
                  onClick={handleSave}
                  className='text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md'
                >
                  <Save className='h-4 w-4' />
                  Save Changes
                </ReusableButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='px-4 sm:px-6 lg:px-8 mb-6'>
        <Statsgrid stats={notificationStats} />
      </div>

      {/* Main Content with GenericTabs */}
      <div className='px-4 sm:px-6 lg:px-8 pb-8'>
        <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
          <GenericTabs tabs={tabs} defaultIndex={0} />
        </div>
      </div>
    </div>
  );
}
