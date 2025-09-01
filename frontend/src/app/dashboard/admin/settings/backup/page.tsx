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
  ArrowLeft,
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
    <div className='min-h-screen'>
      {/* Use SettingsNavigation only if not embedded */}
      {!isEmbedded && (
        <SettingsNavigation
          breadcrumbs={breadcrumbs}
          title='Backup & Recovery'
          description='Manage system backups, restoration, and data protection'
          showBackButton={true}
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

      {/* Action Buttons - show in normal page view */}
      {!isEmbedded && (
        <div className='px-4 sm:px-6 lg:px-8 mt-6 mb-6'>
          <div className='flex justify-end'>
            <div className='flex space-x-3'>
              {!isEditing ? (
                <>
                  <ReusableButton
                    onClick={() => {}}
                    className='text-sm px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md'
                  >
                    <HardDrive className='h-4 w-4' />
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
      )}

      {/* Back Button for Embedded View */}
      {isEmbedded && (
        <div className='px-4 sm:px-6 lg:px-8 pt-6 mb-6'>
          <div className='flex justify-between items-center'>
            <button
              onClick={() => window.history.back()}
              className='flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 transition-all duration-200 group border border-gray-200 shadow-md hover:shadow-lg'
            >
              <ArrowLeft className='h-4 w-4 text-gray-600 group-hover:text-gray-800 transition-colors duration-200' />
            </button>
            <div className='flex space-x-3'>
              {!isEditing ? (
                <>
                  <ReusableButton
                    onClick={() => {}}
                    className='text-sm px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md'
                  >
                    <HardDrive className='h-4 w-4' />
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
      )}

      {/* Main Content with GenericTabs */}
      <div className='px-4 sm:px-6 lg:px-8 pb-8'>
        <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
          <GenericTabs tabs={tabs} defaultIndex={0} />
        </div>
      </div>
    </div>
  );
}
