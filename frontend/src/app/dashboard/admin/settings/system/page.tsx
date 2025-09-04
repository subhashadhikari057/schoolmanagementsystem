'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  Globe,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import SchoolInformationTab from '@/components/organisms/settings/SchoolInformationTab';
import AcademicYearTab from '@/components/organisms/settings/AcademicYearTab';
import SystemPreferencesTab from '@/components/organisms/settings/SystemPreferencesTab';
import LocalizationTab from '@/components/organisms/settings/LocalizationTab';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import SettingsNavigation from '@/components/molecules/SettingsNavigation';
import { Building2, Calendar, Cog } from 'lucide-react';

export default function SystemSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);

  const breadcrumbs = [
    { label: 'Settings', href: '/dashboard/admin/settings' },
    { label: 'System Settings' },
  ];

  // Stats for system settings overview
  const settingsStats = [
    {
      icon: Building2,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      value: '95%',
      label: 'Configuration Complete',
      change: '5%',
      isPositive: true,
    },
    {
      icon: Calendar,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      value: '2024-25',
      label: 'Grading and attendance',
      change: 'Current',
      isPositive: true,
    },
    {
      icon: Globe,
      bgColor: 'bg-purple-600',
      iconColor: 'text-white',
      value: '3',
      label: 'Languages Supported',
      change: '2 new',
      isPositive: true,
    },
    {
      icon: Shield,
      bgColor: 'bg-orange-600',
      iconColor: 'text-white',
      value: 'Secure',
      label: 'System Status',
      change: '99.9%',
      isPositive: true,
    },
  ];

  // Tab configuration for GenericTabs
  const tabs = [
    {
      name: 'School Information',
      content: <SchoolInformationTab isEditing={isEditing} />,
    },
    {
      name: 'Academic Year',
      content: <AcademicYearTab isEditing={isEditing} />,
    },
    {
      name: 'System Preferences',
      content: <SystemPreferencesTab isEditing={isEditing} />,
    },
    {
      name: 'Localization',
      content: <LocalizationTab isEditing={isEditing} />,
    },
  ];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would typically save the data
    console.log('Saving changes...');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Here you would typically reset any unsaved changes
    console.log('Cancelling changes...');
    setIsEditing(false);
  };

  return (
    <div className='min-h-screen'>
      <SettingsNavigation
        breadcrumbs={breadcrumbs}
        title='System Settings'
        description="Configure your school's core system settings and preferences"
        showBackButton={true}
      />

      {/* Action Buttons */}
      <div className='px-4 sm:px-6 lg:px-8 mb-6'>
        <div className='flex justify-end'>
          <div className='flex space-x-3'>
            {!isEditing ? (
              <>
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
        <Statsgrid stats={settingsStats} />
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
