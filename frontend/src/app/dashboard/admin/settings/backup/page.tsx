'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HardDrive,
  Edit2,
  Save,
  X,
  BarChart3,
  Download,
  Upload,
  Calendar,
  Settings,
} from 'lucide-react';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import BackupOverviewTab from '@/components/organisms/settings/BackupOverviewTab';
import ManualBackupTab from '@/components/organisms/settings/ManualBackupTab';
import RestoreTab from '@/components/organisms/settings/RestoreTab';
import BackupScheduleTab from '@/components/organisms/settings/BackupScheduleTab';
import BackupSettingsTab from '@/components/organisms/settings/BackupSettingsTab';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import SettingsNavigation from '@/components/molecules/SettingsNavigation';

export default function BackupRecoveryPage() {
  const [isEditing, setIsEditing] = useState(false);
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';

  const breadcrumbs = [
    { label: 'Settings', href: '/dashboard/admin/settings' },
    { label: 'Backup & Recovery' },
  ];

  // Custom backup stats with the specific design
  const backupStats = [
    {
      label: 'Last Backup Size',
      value: '2.4 GB',
      icon: HardDrive,
      iconBg: 'bg-blue-600',
    },
    {
      label: 'Storage Used',
      value: '75 GB',
      icon: BarChart3,
      iconBg: 'bg-green-600',
    },
    {
      label: 'Last Backup',
      value: '2 hrs ago',
      icon: Calendar,
      iconBg: 'bg-purple-600',
    },
    {
      label: 'Backup Service',
      value: 'Running',
      icon: Settings,
      iconBg: 'bg-red-600',
    },
  ];

  // Tab configuration for GenericTabs
  const tabs = [
    {
      name: 'Overview',
      content: <BackupOverviewTab isEditing={isEditing} />,
    },
    {
      name: 'Manual Backup',
      content: <ManualBackupTab isEditing={isEditing} />,
    },
    {
      name: 'Restore',
      content: <RestoreTab isEditing={isEditing} />,
    },
    {
      name: 'Schedule',
      content: <BackupScheduleTab isEditing={isEditing} />,
    },
    {
      name: 'Settings',
      content: <BackupSettingsTab isEditing={isEditing} />,
    },
  ];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would typically save the data
    console.log('Saving backup changes...');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Here you would typically reset any unsaved changes
    console.log('Cancelling backup changes...');
    setIsEditing(false);
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Use SettingsNavigation only if not embedded */}
      {!isEmbedded && (
        <SettingsNavigation
          breadcrumbs={breadcrumbs}
          title='Backup & Recovery'
          description='Manage system backups, restoration, and data protection'
          showBackButton={true}
          backLabel='Back to Settings'
        />
      )}

      {/* Stats - only show if not embedded */}
      {!isEmbedded && (
        <div className='px-3 sm:px-4 lg:px-6 mt-3 sm:mt-4 lg:mt-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {backupStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-500 mb-1'>{stat.label}</p>
                      <p className='text-2xl font-bold text-gray-900'>
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center`}
                    >
                      <IconComponent className='w-6 h-6 text-white' />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Controls for Embedded View */}
      {isEmbedded && (
        <div className='px-3 sm:px-4 lg:px-6 mt-4'>
          <div className='flex justify-end'>
            <div className='flex space-x-3'>
              {!isEditing ? (
                <>
                  <ReusableButton
                    onClick={() => {}}
                    className='text-sm px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2'
                  >
                    <HardDrive className='h-4 w-4' />
                    Reset to Defaults
                  </ReusableButton>
                  <ReusableButton
                    onClick={handleEdit}
                    className='text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2'
                  >
                    <Edit2 className='h-4 w-4' />
                    Edit Settings
                  </ReusableButton>
                </>
              ) : (
                <>
                  <ReusableButton
                    onClick={handleCancel}
                    className='text-sm px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2'
                  >
                    <X className='h-4 w-4' />
                    Cancel
                  </ReusableButton>
                  <ReusableButton
                    onClick={handleSave}
                    className='text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2'
                  >
                    <Save className='h-4 w-4' />
                    Save Changes
                  </ReusableButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content with GenericTabs */}
      <div className='px-3 sm:px-4 lg:px-6 mt-4 sm:mt-5 lg:mt-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <GenericTabs tabs={tabs} defaultIndex={0} />
        </div>
      </div>
    </div>
  );
}
