'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HardDrive,
  Edit2,
  Save,
  X,
  BarChart3,
  Calendar,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import ManualBackupTab from '@/components/organisms/settings/ManualBackupTab';
import RestoreTab from '@/components/organisms/settings/RestoreTab';
import BackupScheduleTab from '@/components/organisms/settings/BackupScheduleTab';
import BackupDashboardTab from '@/components/organisms/settings/BackupDashboardTab';
import BackupSettingsTab from '@/components/organisms/settings/BackupSettingsTab';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SettingsNavigation from '@/components/molecules/SettingsNavigation';
import {
  backupService,
  BackupDashboardData,
} from '@/api/services/backup.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function BackupRecoveryPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [dashboardData, setDashboardData] =
    useState<BackupDashboardData | null>(null);
  const [, setIsLoadingStats] = useState(true);
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';
  const { user } = useAuth();
  const backupSettingsRef = useRef<{ saveSettings: () => Promise<void> }>(null);

  const breadcrumbs = [
    { label: 'Settings', href: '/dashboard/admin/settings' },
    { label: 'Backup & Recovery' },
  ];

  // Load dashboard data for stats
  useEffect(() => {
    const loadDashboardData = async () => {
      if (user?.role !== 'SUPER_ADMIN') {
        setIsLoadingStats(false);
        return;
      }

      try {
        setIsLoadingStats(true);
        const response = await backupService.getDashboard();

        // Handle both wrapped and unwrapped responses
        if (response.success !== undefined) {
          if (response.success && response.data) {
            setDashboardData(response.data);
          }
        } else if (
          response &&
          typeof response === 'object' &&
          'stats' in response
        ) {
          setDashboardData(response as unknown as BackupDashboardData);
        }
      } catch (error) {
        console.error('Error loading dashboard data for stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Helper functions
  const formatBytes = (bytes: string | number): string => {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return `${parseFloat((size / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hrs ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Generate real backup stats
  const backupStats = dashboardData
    ? [
        {
          label: 'Last Backup Size',
          value:
            dashboardData.recentBackups.length > 0
              ? formatBytes(dashboardData.recentBackups[0].size.toString())
              : '0 B',
          icon: HardDrive,
          iconBg: 'bg-blue-600',
        },
        {
          label: 'Storage Used',
          value: formatBytes(dashboardData.stats.totalSize),
          icon: BarChart3,
          iconBg: 'bg-green-600',
        },
        {
          label: 'Last Backup',
          value:
            dashboardData.recentBackups.length > 0
              ? formatTimestamp(dashboardData.recentBackups[0].startedAt)
              : 'Never',
          icon: Calendar,
          iconBg: 'bg-purple-600',
        },
        {
          label: 'Backup Service',
          value:
            dashboardData.serviceStatus.status.charAt(0).toUpperCase() +
            dashboardData.serviceStatus.status.slice(1),
          icon: Settings,
          iconBg:
            dashboardData.serviceStatus.status === 'running'
              ? 'bg-green-600'
              : 'bg-red-600',
        },
      ]
    : [
        {
          label: 'Last Backup Size',
          value: 'Loading...',
          icon: HardDrive,
          iconBg: 'bg-gray-400',
        },
        {
          label: 'Storage Used',
          value: 'Loading...',
          icon: BarChart3,
          iconBg: 'bg-gray-400',
        },
        {
          label: 'Last Backup',
          value: 'Loading...',
          icon: Calendar,
          iconBg: 'bg-gray-400',
        },
        {
          label: 'Backup Service',
          value: 'Loading...',
          icon: Settings,
          iconBg: 'bg-gray-400',
        },
      ];

  // Tab names for navigation
  const tabNames = [
    'Dashboard',
    'Overview',
    'Manual Backup',
    'Schedule',
    'Restore',
    'Settings',
  ];

  // Tab navigation handler
  const handleTabNavigation = (tabName: string) => {
    const tabIndex = tabNames.findIndex(name => name === tabName);
    if (tabIndex !== -1) {
      // This would trigger tab change in GenericTabs - for now just show toast
      console.log(`Navigate to tab: ${tabName} (index: ${tabIndex})`);
      // TODO: Implement actual tab switching when GenericTabs supports it
    }
  };

  // Tab configuration for GenericTabs
  const tabs = [
    {
      name: 'Dashboard',
      content: <BackupDashboardTab onNavigateToTab={handleTabNavigation} />,
    },
    {
      name: 'Manual Backup',
      content: <ManualBackupTab isEditing={isEditing} />,
    },
    {
      name: 'Schedule',
      content: <BackupScheduleTab isEditing={isEditing} />,
    },
    {
      name: 'Restore',
      content: <RestoreTab isEditing={isEditing} />,
    },
    {
      name: 'Settings',
      content: (
        <BackupSettingsTab ref={backupSettingsRef} isEditing={isEditing} />
      ),
    },
  ];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Call the settings save function if available
      if (backupSettingsRef.current) {
        await backupSettingsRef.current.saveSettings();
        toast.success(
          '✅ Backup settings saved successfully! Your encryption, offsite, and advanced settings have been updated.',
        );
      } else {
        toast.info('No settings to save');
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving backup settings:', error);

      // Provide more specific error information
      let errorMessage = 'Failed to save backup settings. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Failed to save backup settings: ${error.message}`;
      }

      toast.error(errorMessage);
      // Don't exit editing mode if save failed
    } finally {
      setSaving(false);
    }
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
                    disabled={saving}
                    className='text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:bg-gray-400'
                  >
                    {saving ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className='h-4 w-4' />
                        Save Changes
                      </>
                    )}
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
                    disabled={saving}
                    className='text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:bg-gray-400'
                  >
                    {saving ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className='h-4 w-4' />
                        Save Changes
                      </>
                    )}
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
