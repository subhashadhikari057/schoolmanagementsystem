'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HardDrive, Edit2, ArrowLeft } from 'lucide-react';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import BackupOverviewTab from '@/components/organisms/settings/BackupOverviewTab';
import ManualBackupTab from '@/components/organisms/settings/ManualBackupTab';
import RestoreTab from '@/components/organisms/settings/RestoreTab';
import BackupScheduleTab from '@/components/organisms/settings/BackupScheduleTab';
import BackupSettingsTab from '@/components/organisms/settings/BackupSettingsTab';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SettingsNavigation from '@/components/molecules/SettingsNavigation';
import ConfirmationModal from '@/components/molecules/modals/ConfirmationModal';
import { backupSettingsService } from '@/api/services/backup-settings.service';
import { useBackupContext } from '@/context/BackupContext';

export default function BackupRecoveryPage() {
  const { toast } = useBackupContext();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [key, setKey] = useState(0); // Force re-render of tabs
  const [resetModal, setResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';

  const breadcrumbs = [
    { label: 'Settings', href: '/dashboard/admin/settings' },
    { label: 'Backup & Recovery' },
  ];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // This will be called by the Settings tab after successful save
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setKey(prev => prev + 1); // Force re-render to reset any unsaved changes
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    // If switching away from Settings tab, exit edit mode
    if (tabIndex !== 4) {
      setIsEditing(false);
    }
  };

  const handleNavigateToManualBackup = () => {
    setActiveTab(1); // Navigate to Manual Backup tab (index 1)
    setKey(prev => prev + 1); // Force re-render
  };

  const handleResetToDefaults = () => {
    setResetModal(true);
  };

  const confirmReset = async () => {
    try {
      setResetting(true);
      const response = await backupSettingsService.resetToDefaults();

      if (response.success) {
        toast.success(
          'Settings Reset',
          'Backup settings have been reset to defaults successfully.',
        );
        setResetModal(false);
        // Force re-render to reload default settings
        setKey(prev => prev + 1);
      } else {
        toast.error(
          'Reset Failed',
          response.error || 'Failed to reset settings',
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to reset settings';
      toast.error('Reset Error', errorMsg);
    } finally {
      setResetting(false);
    }
  };

  // Tab configuration for GenericTabs
  const tabs = [
    {
      name: 'Overview',
      content: (
        <BackupOverviewTab
          onNavigateToManualBackup={handleNavigateToManualBackup}
        />
      ),
    },
    {
      name: 'Manual Backup',
      content: <ManualBackupTab key={`manual-${key}`} />,
    },
    {
      name: 'Restore',
      content: <RestoreTab key={`restore-${key}`} />,
    },
    {
      name: 'Schedule',
      content: <BackupScheduleTab key={`schedule-${key}`} />,
    },
    {
      name: 'Settings',
      content: (
        <BackupSettingsTab
          isEditing={isEditing}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ),
    },
  ];

  // Only show edit controls for Settings tab (index 4)
  const showEditControls = activeTab === 4;

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

      {/* Action Buttons - show only Edit button for Settings tab */}
      {!isEmbedded && showEditControls && (
        <div className='px-4 sm:px-6 lg:px-8 mt-6 mb-6'>
          <div className='flex justify-end'>
            <div className='flex flex-wrap items-center gap-3'>
              {!isEditing && (
                <>
                  <ReusableButton
                    onClick={handleEdit}
                    className='text-sm px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow font-medium'
                  >
                    <Edit2 className='h-4 w-4 flex-shrink-0' />
                    <span className='whitespace-nowrap'>Edit Settings</span>
                  </ReusableButton>
                  <ReusableButton
                    onClick={handleResetToDefaults}
                    className='text-sm px-5 py-2.5 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow font-medium'
                  >
                    <HardDrive className='h-4 w-4 flex-shrink-0' />
                    <span className='whitespace-nowrap'>Reset to Defaults</span>
                  </ReusableButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back Button for Embedded View - show edit controls only for Settings tab */}
      {isEmbedded && (
        <div className='px-4 sm:px-6 lg:px-8 pt-6 mb-6'>
          <div className='flex flex-wrap justify-between items-center gap-4'>
            <button
              onClick={() => window.history.back()}
              className='flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 transition-all duration-200 group border border-gray-200 shadow-md hover:shadow-lg'
            >
              <ArrowLeft className='h-4 w-4 text-gray-600 group-hover:text-gray-800 transition-colors duration-200' />
            </button>
            {showEditControls && !isEditing && (
              <div className='flex flex-wrap items-center gap-3'>
                <ReusableButton
                  onClick={handleEdit}
                  className='text-sm px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow font-medium'
                >
                  <Edit2 className='h-4 w-4 flex-shrink-0' />
                  <span className='whitespace-nowrap'>Edit Settings</span>
                </ReusableButton>
                <ReusableButton
                  onClick={handleResetToDefaults}
                  className='text-sm px-5 py-2.5 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow font-medium'
                >
                  <HardDrive className='h-4 w-4 flex-shrink-0' />
                  <span className='whitespace-nowrap'>Reset to Defaults</span>
                </ReusableButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content with GenericTabs */}
      <div className='px-4 sm:px-6 lg:px-8 pb-8'>
        <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
          <GenericTabs
            tabs={tabs}
            defaultIndex={0}
            selectedIndex={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </div>

      {/* Reset to Defaults Confirmation Modal */}
      <ConfirmationModal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        onConfirm={confirmReset}
        title='Reset to Defaults'
        message='Are you sure you want to reset all backup settings to their default values?'
        details={[
          'All encryption settings will be reset',
          'All offsite backup configurations will be cleared',
          'Custom backup locations will be reset',
          'This action cannot be undone',
        ]}
        type='warning'
        confirmText='Reset Settings'
        isLoading={resetting}
      />
    </div>
  );
}
