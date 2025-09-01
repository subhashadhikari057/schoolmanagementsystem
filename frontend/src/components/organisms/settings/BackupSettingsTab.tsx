'use client';

import React, { useState } from 'react';
import { Shield, Cloud, Settings2, Key, TestTube, Copy } from 'lucide-react';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';

interface BackupSettingsTabProps {
  isEditing: boolean;
}

export default function BackupSettingsTab({
  isEditing,
}: BackupSettingsTabProps) {
  const [encryptionSettings, setEncryptionSettings] = useState({
    enableEncryption: true,
    clientEncryptionKey: '••••••••••••••••',
  });

  const [offsiteSettings, setOffsiteSettings] = useState({
    enableOffsiteBackup: true,
    remoteHost: 'backup.yourschool.edu',
    username: 'backup_user',
    remotePath: '/backups/school-data',
  });

  const [advancedSettings, setAdvancedSettings] = useState({
    compressionLevel: 'Select compression level',
    parallelOperations: 'Select parallel operations',
    backupNotifications: 'Enter email addresses separated by commas...',
  });

  const handleEncryptionChange = (field: string, value: string | boolean) => {
    setEncryptionSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleOffsiteChange = (field: string, value: string | boolean) => {
    setOffsiteSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAdvancedChange = (field: string, value: string) => {
    setAdvancedSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateKey = () => {
    console.log('Generating new encryption key...');
  };

  const handleCopyKey = () => {
    console.log('Copying encryption key...');
  };

  const handleTestConnection = () => {
    console.log('Testing offsite connection...');
  };

  const handleConfigureSSHKey = () => {
    console.log('Configuring SSH key...');
  };

  return (
    <div className='space-y-6'>
      {/* Encryption Settings */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-red-50 rounded-lg'>
            <Shield className='h-5 w-5 text-red-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Encryption Settings
            </h3>
            <p className='text-sm text-gray-600'>
              Configure backup encryption and security
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              id='enableEncryption'
              checked={encryptionSettings.enableEncryption}
              onChange={e =>
                handleEncryptionChange('enableEncryption', e.target.checked)
              }
              disabled={!isEditing}
              className='h-4 w-4 text-blue-600 rounded border-gray-300'
            />
            <label
              htmlFor='enableEncryption'
              className='text-sm font-medium text-gray-700'
            >
              Enable Backup Encryption
            </label>
            <span className='text-sm text-gray-500'>
              Encrypt backups with per-client key
            </span>
          </div>

          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Client Encryption Key
            </Label>
            <div className='flex items-center gap-2'>
              <Input
                type='password'
                value={encryptionSettings.clientEncryptionKey}
                onChange={e =>
                  handleEncryptionChange('clientEncryptionKey', e.target.value)
                }
                disabled={!isEditing || !encryptionSettings.enableEncryption}
                className='flex-1'
                placeholder="Keep this key safe, it's required to decrypt and restore backups"
              />
              <ReusableButton
                onClick={handleGenerateKey}
                className='flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm'
                disabled={!isEditing || !encryptionSettings.enableEncryption}
              >
                <Key className='h-4 w-4' />
                Generate
              </ReusableButton>
              <ReusableButton
                onClick={handleCopyKey}
                className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                disabled={!isEditing || !encryptionSettings.enableEncryption}
              >
                <Copy className='h-4 w-4' />
              </ReusableButton>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Keep this key safe. It's required to decrypt and restore backups.
            </p>
          </div>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <Shield className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-yellow-800'>
                  Important:
                </p>
                <p className='text-sm text-yellow-700'>
                  Store your encryption key securely. Without it, encrypted
                  backups cannot be restored.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Offsite Backup Settings */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-orange-50 rounded-lg'>
            <Cloud className='h-5 w-5 text-orange-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Offsite Backup Settings
            </h3>
            <p className='text-sm text-gray-600'>
              Configure remote backup storage
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              id='enableOffsiteBackup'
              checked={offsiteSettings.enableOffsiteBackup}
              onChange={e =>
                handleOffsiteChange('enableOffsiteBackup', e.target.checked)
              }
              disabled={!isEditing}
              className='h-4 w-4 text-blue-600 rounded border-gray-300'
            />
            <label
              htmlFor='enableOffsiteBackup'
              className='text-sm font-medium text-gray-700'
            >
              Enable Offsite Backup
            </label>
            <span className='text-sm text-gray-500'>
              Copy backups to remote server
            </span>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Remote Host
              </Label>
              <Input
                value={offsiteSettings.remoteHost}
                onChange={e =>
                  handleOffsiteChange('remoteHost', e.target.value)
                }
                disabled={!isEditing || !offsiteSettings.enableOffsiteBackup}
                className='w-full'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Username
              </Label>
              <Input
                value={offsiteSettings.username}
                onChange={e => handleOffsiteChange('username', e.target.value)}
                disabled={!isEditing || !offsiteSettings.enableOffsiteBackup}
                className='w-full'
              />
            </div>
          </div>

          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Remote Path
            </Label>
            <Input
              value={offsiteSettings.remotePath}
              onChange={e => handleOffsiteChange('remotePath', e.target.value)}
              disabled={!isEditing || !offsiteSettings.enableOffsiteBackup}
              className='w-full'
            />
          </div>

          <div className='flex gap-2'>
            <ReusableButton
              onClick={handleTestConnection}
              className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm'
              disabled={!isEditing || !offsiteSettings.enableOffsiteBackup}
            >
              <TestTube className='h-4 w-4' />
              Test Connection
            </ReusableButton>
            <ReusableButton
              onClick={handleConfigureSSHKey}
              className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm'
              disabled={!isEditing || !offsiteSettings.enableOffsiteBackup}
            >
              <Key className='h-4 w-4' />
              Configure SSH Key
            </ReusableButton>
          </div>
        </div>
      </Card>

      {/* Advanced Settings */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-purple-50 rounded-lg'>
            <Settings2 className='h-5 w-5 text-purple-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Advanced Settings
            </h3>
            <p className='text-sm text-gray-600'>
              Advanced backup configuration options
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Compression Level
              </Label>
              <select
                value={advancedSettings.compressionLevel}
                onChange={e =>
                  handleAdvancedChange('compressionLevel', e.target.value)
                }
                disabled={!isEditing}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
              >
                <option value='Select compression level'>
                  Select compression level
                </option>
                <option value='none'>None</option>
                <option value='low'>Low</option>
                <option value='medium'>Medium</option>
                <option value='high'>High</option>
              </select>
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Parallel Operations
              </Label>
              <select
                value={advancedSettings.parallelOperations}
                onChange={e =>
                  handleAdvancedChange('parallelOperations', e.target.value)
                }
                disabled={!isEditing}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
              >
                <option value='Select parallel operations'>
                  Select parallel operations
                </option>
                <option value='1'>1 Thread</option>
                <option value='2'>2 Threads</option>
                <option value='4'>4 Threads</option>
                <option value='8'>8 Threads</option>
              </select>
            </div>
          </div>

          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Backup Notifications
            </Label>
            <Input
              value={advancedSettings.backupNotifications}
              onChange={e =>
                handleAdvancedChange('backupNotifications', e.target.value)
              }
              disabled={!isEditing}
              className='w-full'
              placeholder='Enter email addresses separated by commas...'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Notify these email addresses about backup status
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
