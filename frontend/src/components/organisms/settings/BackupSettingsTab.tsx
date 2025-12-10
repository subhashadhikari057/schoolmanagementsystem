'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Cloud,
  Key,
  Copy,
  AlertTriangle,
  Loader2,
  CheckCircle,
  FolderPlus,
} from 'lucide-react';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import {
  backupSettingsService,
  BackupSettings,
} from '@/api/services/backup-settings.service';
import EncryptionKeyModal from '@/components/molecules/modals/EncryptionKeyModal';
import SettingsValidationModal from '@/components/molecules/modals/SettingsValidationModal';
import ConfirmationModal from '@/components/molecules/modals/ConfirmationModal';
import RegenerateKeyConfirmationModal from '@/components/molecules/modals/RegenerateKeyConfirmationModal';
import DisableEncryptionConfirmationModal from '@/components/molecules/modals/DisableEncryptionConfirmationModal';
import ConnectionTestModal from '@/components/molecules/modals/ConnectionTestModal';
import FolderCreationModal from '@/components/molecules/modals/FolderCreationModal';
import SaveSettingsConfirmationModal from '@/components/molecules/modals/SaveSettingsConfirmationModal';
import DisableOffsiteConfirmationModal from '@/components/molecules/modals/DisableOffsiteConfirmationModal';
import { useBackupContext } from '@/context/BackupContext';

interface BackupSettingsTabProps {
  isEditing: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function BackupSettingsTab({
  isEditing,
  onSave,
  onCancel,
}: BackupSettingsTabProps) {
  const { toast } = useBackupContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationModal, setValidationModal] = useState(false);
  const [encryptionModal, setEncryptionModal] = useState({
    isOpen: false,
    mode: 'generate' as 'generate' | 'rotate' | 'view',
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'enableEncryption' | 'disableEncryption' | null;
  }>({ isOpen: false, type: null });

  const [regenerateKeyModal, setRegenerateKeyModal] = useState(false);

  const [connectionTestModal, setConnectionTestModal] = useState<{
    isOpen: boolean;
    status: 'testing' | 'success' | 'failed';
    error?: string;
    details?: {
      host: string;
      authentication?: 'success' | 'failed' | 'not_tested';
      responseTime?: number;
    };
  }>({
    isOpen: false,
    status: 'testing',
  });

  const [folderCreationModal, setFolderCreationModal] = useState<{
    isOpen: boolean;
    status: 'creating' | 'success' | 'failed';
    error?: string;
    folderPath?: string;
    serverHost?: string;
  }>({
    isOpen: false,
    status: 'creating',
  });

  const [saveConfirmationModal, setSaveConfirmationModal] = useState(false);
  const [disableOffsiteModal, setDisableOffsiteModal] = useState(false);

  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [encryptionSettings, setEncryptionSettings] = useState({
    enableEncryption: false,
    clientEncryptionKey: '',
    keyRotationEnabled: false,
    keyRotationDays: 90,
  });

  const [offsiteSettings, setOffsiteSettings] = useState({
    enableOffsiteBackup: false,
    provider: 'ssh' as 'ssh' | 's3' | 'azure' | 'gcp',
    remoteHost: '',
    username: '',
    remotePath: '/backups',
    sshConfig: {
      keyType: 'password' as 'password' | 'privateKey',
      password: '',
    },
    encryptInTransit: true,
    syncFrequency: 'daily' as 'immediate' | 'hourly' | 'daily',
    connectionStatus: 'disconnected' as 'connected' | 'disconnected' | 'error',
    backupLocation: 'both' as 'local' | 'offsite' | 'both',
  });

  // Load settings function
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await backupSettingsService.getSettings();

      if (response.success && response.data) {
        const data = response.data;

        setSettings(data);
        // Completely replace settings, don't merge
        setEncryptionSettings({
          enableEncryption: data.encryption.enableEncryption,
          clientEncryptionKey: data.encryption.clientEncryptionKey || '',
          keyRotationEnabled: data.encryption.keyRotationEnabled,
          keyRotationDays: data.encryption.keyRotationDays,
        });

        setOffsiteSettings({
          enableOffsiteBackup: data.offsite.enableOffsiteBackup,
          provider: data.offsite.provider,
          remoteHost: data.offsite.remoteHost || '',
          username: data.offsite.username || '',
          remotePath: data.offsite.remotePath || '/backups',
          sshConfig: {
            keyType: 'password',
            password: data.offsite.sshConfig?.password || '',
          },
          encryptInTransit: data.offsite.encryptInTransit,
          syncFrequency: data.offsite.syncFrequency,
          connectionStatus: data.offsite.connectionStatus,
          backupLocation:
            (data.offsite.backupLocation as 'local' | 'offsite' | 'both') ||
            'both',
        });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to load settings';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    let isMounted = true;

    const loadSettingsData = async () => {
      try {
        setLoading(true);
        const response = await backupSettingsService.getSettings();

        if (!isMounted) return; // Prevent state updates if unmounted

        if (response.success && response.data) {
          const data = response.data;
          setSettings(data);
          setEncryptionSettings(prev => ({ ...prev, ...data.encryption }));
          setOffsiteSettings({
            enableOffsiteBackup: data.offsite.enableOffsiteBackup,
            provider: data.offsite.provider,
            remoteHost: data.offsite.remoteHost || '',
            username: data.offsite.username || '',
            remotePath: data.offsite.remotePath || '/backups',
            sshConfig: {
              keyType: 'password',
              password: data.offsite.sshConfig?.password || '',
            },
            encryptInTransit: data.offsite.encryptInTransit,
            syncFrequency: data.offsite.syncFrequency,
            connectionStatus: data.offsite.connectionStatus,
            backupLocation:
              (data.offsite.backupLocation as 'local' | 'offsite' | 'both') ||
              'both',
          });
          // Only show toast if settings were actually loaded from server
          // toast.info('Settings Loaded', 'Using default backup settings.');
        } else {
          // Silently use defaults - no need to show toast for default settings
          // toast.info('Settings Loaded', 'Using default backup settings.');
        }
      } catch (error) {
        if (!isMounted) return;
        const errorMsg =
          error instanceof Error ? error.message : 'Failed to load settings';
        setError(errorMsg);
        // Only show error toast for actual errors, not for missing settings
        if (error instanceof Error && !error.message.includes('default')) {
          toast.error('Settings Error', errorMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettingsData();

    return () => {
      isMounted = false; // Cleanup to prevent memory leaks
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const [disableEncryptionModal, setDisableEncryptionModal] = useState(false);

  const handleEncryptionChange = (field: string, value: string | boolean) => {
    if (field === 'enableEncryption') {
      if (value === true && !encryptionSettings.clientEncryptionKey) {
        // Show confirmation modal for enabling encryption
        setConfirmModal({ isOpen: true, type: 'enableEncryption' });
        return;
      } else if (value === false && encryptionSettings.enableEncryption) {
        // Show GitHub-style confirmation for disabling encryption
        setDisableEncryptionModal(true);
        return;
      }
    }
    setEncryptionSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleOffsiteChange = (field: string, value: string | boolean) => {
    if (
      field === 'enableOffsiteBackup' &&
      value === false &&
      offsiteSettings.enableOffsiteBackup
    ) {
      // Show confirmation modal for disabling offsite backup
      setDisableOffsiteModal(true);
      return;
    }

    if (field === 'password') {
      // Store password in sshConfig
      setOffsiteSettings(prev => ({
        ...prev,
        sshConfig: {
          ...prev.sshConfig,
          keyType: 'password',
          password: value as string,
        },
      }));
    } else {
      setOffsiteSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveSettings = () => {
    // Validate offsite settings if enabled
    if (offsiteSettings.enableOffsiteBackup) {
      const missingFields = [];
      if (!offsiteSettings.remoteHost?.trim())
        missingFields.push('Server IP/Hostname');
      if (!offsiteSettings.username?.trim()) missingFields.push('Username');
      if (!offsiteSettings.sshConfig?.password?.trim())
        missingFields.push('Password');
      if (!offsiteSettings.remotePath?.trim())
        missingFields.push('Remote Path');

      if (missingFields.length > 0) {
        const errorMsg = `Please fill in required fields: ${missingFields.join(', ')}`;
        toast.error('Validation Error', errorMsg);
        setError(errorMsg);
        return;
      }
    }

    // Show confirmation modal
    setSaveConfirmationModal(true);
  };

  const confirmSaveSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const updatedSettings = {
        encryption: encryptionSettings,
        offsite: offsiteSettings,
      };

      const response =
        await backupSettingsService.updateSettings(updatedSettings);

      if (response.success) {
        toast.success(
          'Settings Saved',
          'Backup settings updated successfully and will be applied to all future backups.',
        );
        setSettings(response.data || null);
        // Call parent's onSave callback to exit edit mode
        onSave?.();
      } else {
        const errorMsg =
          response.error || response.message || 'Failed to save settings';
        setError(errorMsg);
        toast.error('Save Failed', errorMsg);
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save settings';
      setError(errorMsg);
      toast.error('Save Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = () => {
    // Check if there's an existing key - show regenerate confirmation modal
    if (encryptionSettings.clientEncryptionKey) {
      setRegenerateKeyModal(true);
    } else {
      // No existing key, proceed directly
      setEncryptionModal({ isOpen: true, mode: 'generate' });
    }
  };

  const handleCopyKey = async () => {
    if (encryptionSettings.clientEncryptionKey) {
      try {
        await navigator.clipboard.writeText(
          encryptionSettings.clientEncryptionKey,
        );
        toast.success('Key Copied', 'Encryption key copied to clipboard.');
      } catch {
        toast.error('Copy Failed', 'Failed to copy encryption key.');
      }
    } else {
      toast.error('No Key', 'No encryption key available to copy.');
    }
  };

  const handleTestConnection = async () => {
    // Open modal in testing state
    setConnectionTestModal({
      isOpen: true,
      status: 'testing',
      details: {
        host: offsiteSettings.remoteHost,
      },
    });

    try {
      const response =
        await backupSettingsService.testOffsiteConnection(offsiteSettings);

      // Handle both wrapped and unwrapped responses
      const testResult = (response as any).data || response;
      const isConnected = (testResult as any).connected === true;

      if (isConnected) {
        // Success!
        setConnectionTestModal({
          isOpen: true,
          status: 'success',
          details: {
            host: offsiteSettings.remoteHost,
            authentication: (testResult as any).details?.authentication,
            responseTime: (testResult as any).responseTime,
          },
        });
        setOffsiteSettings(prev => ({
          ...prev,
          connectionStatus: 'connected',
        }));
      } else {
        // Failed
        const errorMsg =
          (testResult as any).error ||
          (response as any).error ||
          'Connection test failed';
        setConnectionTestModal({
          isOpen: true,
          status: 'failed',
          error: errorMsg,
          details: {
            host: offsiteSettings.remoteHost,
            authentication: (testResult as any).details?.authentication,
          },
        });
        setOffsiteSettings(prev => ({ ...prev, connectionStatus: 'error' }));
      }
    } catch (error: any) {
      const err = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMsg =
        err?.response?.data?.error || err?.message || 'Connection test failed';

      setConnectionTestModal({
        isOpen: true,
        status: 'failed',
        error: errorMsg,
        details: {
          host: offsiteSettings.remoteHost,
        },
      });
      setOffsiteSettings(prev => ({ ...prev, connectionStatus: 'error' }));
    }
  };

  const handleCreateRemoteFolder = async () => {
    if (
      !offsiteSettings.remoteHost ||
      !offsiteSettings.username ||
      !offsiteSettings.sshConfig?.password ||
      !offsiteSettings.remotePath
    ) {
      toast.error(
        'Missing Information',
        'Please ensure server connection is tested and remote path is specified.',
      );
      return;
    }

    // Open modal in creating state
    setFolderCreationModal({
      isOpen: true,
      status: 'creating',
      folderPath: offsiteSettings.remotePath,
      serverHost: offsiteSettings.remoteHost,
    });

    try {
      const response = await backupSettingsService.createRemoteFolder(
        offsiteSettings.remoteHost,
        offsiteSettings.username,
        offsiteSettings.sshConfig.password,
        offsiteSettings.remotePath,
      );

      if (response.success && response.data?.created) {
        // Success!
        setFolderCreationModal({
          isOpen: true,
          status: 'success',
          folderPath: offsiteSettings.remotePath,
          serverHost: offsiteSettings.remoteHost,
        });
      } else if (response.success && !response.data?.created) {
        // Folder already exists or ready
        setFolderCreationModal({
          isOpen: true,
          status: 'success',
          folderPath: offsiteSettings.remotePath,
          serverHost: offsiteSettings.remoteHost,
        });
      } else {
        // Failed
        const errorMsg =
          response.data?.message || response.error || 'Failed to create folder';
        setFolderCreationModal({
          isOpen: true,
          status: 'failed',
          error: errorMsg,
          folderPath: offsiteSettings.remotePath,
          serverHost: offsiteSettings.remoteHost,
        });
      }
    } catch (error: any) {
      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create remote folder';

      setFolderCreationModal({
        isOpen: true,
        status: 'failed',
        error: errorMsg,
        folderPath: offsiteSettings.remotePath,
        serverHost: offsiteSettings.remoteHost,
      });
    }
  };

  const handleKeyGenerated = (keyData: {
    key: string;
    keyId?: string;
    algorithm?: string;
  }) => {
    setEncryptionSettings(prev => ({
      ...prev,
      clientEncryptionKey: keyData.key,
      enableEncryption: true,
    }));
    toast.success(
      'Key Generated',
      'New encryption key generated successfully.',
    );
  };

  const handleConfirmEncryptionChange = () => {
    if (confirmModal.type === 'enableEncryption') {
      setEncryptionSettings(prev => ({ ...prev, enableEncryption: true }));
      setConfirmModal({ isOpen: false, type: null });
      // Show encryption key modal
      setTimeout(() => {
        setEncryptionModal({ isOpen: true, mode: 'generate' });
      }, 100);
    }
  };

  const handleConfirmDisableEncryption = () => {
    setDisableEncryptionModal(false);
    setEncryptionSettings(prev => ({ ...prev, enableEncryption: false }));
    toast.warning(
      'Encryption Disabled',
      'Future backups will NOT be encrypted. Remember to save changes.',
    );
  };

  const handleConfirmRegenerateKey = () => {
    setRegenerateKeyModal(false);
    // Proceed to generate new key
    setTimeout(() => {
      setEncryptionModal({ isOpen: true, mode: 'generate' });
    }, 100);
  };

  const handleConfirmDisableOffsite = () => {
    setDisableOffsiteModal(false);
    setOffsiteSettings(prev => ({
      ...prev,
      enableOffsiteBackup: false,
      connectionStatus: 'disconnected',
    }));
    toast.warning(
      'Offsite Backup Disabled',
      'Future backups will only be saved locally. Remember to save changes.',
    );
  };

  // Loading state
  if (loading && !settings) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
          <span className='ml-3 text-gray-600'>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-red-800'>Error</p>
              <p className='text-sm text-red-700 mt-1'>{error}</p>
            </div>
          </div>
        </div>
      )}

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
                className='flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow'
                disabled={!isEditing || !encryptionSettings.enableEncryption}
              >
                <Key className='h-4 w-4' />
                Generate
              </ReusableButton>
              <ReusableButton
                onClick={handleCopyKey}
                className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                disabled={!encryptionSettings.clientEncryptionKey}
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
              Configure remote backup storage via SSH
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
              Copy backups to remote server via SSH
            </span>
          </div>

          {offsiteSettings.enableOffsiteBackup && (
            <>
              {/* Step 1: Server Connection */}
              <div className='border-l-4 border-blue-500 bg-blue-50 p-4 rounded'>
                <h4 className='font-medium text-blue-900 mb-3'>
                  Step 1: Configure Remote Server
                </h4>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-3'>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                      Server IP/Hostname *
                    </Label>
                    <Input
                      value={offsiteSettings.remoteHost}
                      onChange={e =>
                        handleOffsiteChange('remoteHost', e.target.value)
                      }
                      disabled={!isEditing}
                      className='w-full'
                      placeholder='192.168.1.100'
                    />
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                      Username *
                    </Label>
                    <Input
                      value={offsiteSettings.username}
                      onChange={e =>
                        handleOffsiteChange('username', e.target.value)
                      }
                      disabled={!isEditing}
                      className='w-full'
                      placeholder='root'
                    />
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                      Password *
                    </Label>
                    <Input
                      type='password'
                      value={offsiteSettings.sshConfig?.password || ''}
                      onChange={e =>
                        handleOffsiteChange('password', e.target.value)
                      }
                      disabled={!isEditing}
                      className='w-full'
                      placeholder='Enter SSH password'
                    />
                  </div>
                </div>

                <ReusableButton
                  onClick={handleTestConnection}
                  disabled={
                    !isEditing ||
                    !offsiteSettings.remoteHost ||
                    !offsiteSettings.username
                  }
                  className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow'
                >
                  <CheckCircle className='h-4 w-4' />
                  Test Connection
                </ReusableButton>
              </div>

              {/* Step 2: Backup Path */}
              <div className='border-l-4 border-green-500 bg-green-50 p-4 rounded'>
                <h4 className='font-medium text-green-900 mb-3'>
                  Step 2: Configure Backup Path
                </h4>

                {offsiteSettings.connectionStatus !== 'connected' && (
                  <div className='mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800'>
                      ⚠️ Please complete Step 1 (Test Connection) first before
                      configuring the backup path.
                    </p>
                  </div>
                )}

                <div className='mb-3'>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Remote Backup Path *
                  </Label>
                  <Input
                    value={offsiteSettings.remotePath}
                    onChange={e =>
                      handleOffsiteChange('remotePath', e.target.value)
                    }
                    disabled={
                      !isEditing ||
                      offsiteSettings.connectionStatus !== 'connected'
                    }
                    className='w-full'
                    placeholder='/home/backups/school-system'
                  />
                  <div className='mt-2 space-y-1'>
                    <p className='text-xs text-gray-600 font-medium'>
                      💡 Common backup locations on Linux servers:
                    </p>
                    <ul className='text-xs text-gray-500 ml-4 space-y-0.5'>
                      <li>
                        •{' '}
                        <code className='bg-gray-100 px-1 rounded'>
                          /home/backups/school-system
                        </code>{' '}
                        - Recommended for most users
                      </li>
                      <li>
                        •{' '}
                        <code className='bg-gray-100 px-1 rounded'>
                          /var/backups/school-system
                        </code>{' '}
                        - System backup directory
                      </li>
                      <li>
                        •{' '}
                        <code className='bg-gray-100 px-1 rounded'>
                          /opt/backups/school-system
                        </code>{' '}
                        - Optional software directory
                      </li>
                    </ul>
                    <p className='text-xs text-gray-500 mt-2'>
                      ℹ️ Avoid using{' '}
                      <code className='bg-gray-100 px-1 rounded'>/var/www</code>{' '}
                      (web directories) or{' '}
                      <code className='bg-gray-100 px-1 rounded'>/tmp</code>{' '}
                      (temporary files).
                    </p>
                  </div>
                </div>

                <ReusableButton
                  onClick={handleCreateRemoteFolder}
                  disabled={
                    !isEditing ||
                    !offsiteSettings.remotePath ||
                    offsiteSettings.connectionStatus !== 'connected'
                  }
                  className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <FolderPlus className='h-4 w-4' />
                  Create Folder on Server
                </ReusableButton>
              </div>

              {/* Step 3: Backup Location */}
              <div className='border-l-4 border-purple-500 bg-purple-50 p-4 rounded'>
                <h4 className='font-medium text-purple-900 mb-3'>
                  Step 3: Choose Backup Storage
                </h4>

                <div className='space-y-2'>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='backupLocation'
                      value='local'
                      checked={offsiteSettings.backupLocation === 'local'}
                      onChange={() =>
                        handleOffsiteChange('backupLocation', 'local')
                      }
                      disabled={!isEditing}
                      className='h-4 w-4 text-purple-600'
                    />
                    <span className='text-sm font-medium text-gray-700'>
                      Local Only
                    </span>
                    <span className='text-xs text-gray-500'>
                      (Save backups only on this server)
                    </span>
                  </label>

                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='backupLocation'
                      value='offsite'
                      checked={offsiteSettings.backupLocation === 'offsite'}
                      onChange={() =>
                        handleOffsiteChange('backupLocation', 'offsite')
                      }
                      disabled={!isEditing}
                      className='h-4 w-4 text-purple-600'
                    />
                    <span className='text-sm font-medium text-gray-700'>
                      Offsite Only
                    </span>
                    <span className='text-xs text-gray-500'>
                      (Save backups only on remote server)
                    </span>
                  </label>

                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='backupLocation'
                      value='both'
                      checked={offsiteSettings.backupLocation === 'both'}
                      onChange={() =>
                        handleOffsiteChange('backupLocation', 'both')
                      }
                      disabled={!isEditing}
                      className='h-4 w-4 text-purple-600'
                    />
                    <span className='text-sm font-medium text-gray-700'>
                      Both Local & Offsite
                    </span>
                    <span className='text-xs text-gray-500'>
                      (Recommended - Save on both locations)
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Modals */}
      <EncryptionKeyModal
        isOpen={encryptionModal.isOpen}
        onClose={() => {
          setEncryptionModal({ isOpen: false, mode: 'generate' });
          loadSettings();
        }}
        onKeyGenerated={handleKeyGenerated}
        currentKey={encryptionSettings.clientEncryptionKey}
        mode={encryptionModal.mode}
      />

      <RegenerateKeyConfirmationModal
        isOpen={regenerateKeyModal}
        onClose={() => setRegenerateKeyModal(false)}
        onConfirm={handleConfirmRegenerateKey}
      />

      <DisableEncryptionConfirmationModal
        isOpen={disableEncryptionModal}
        onClose={() => setDisableEncryptionModal(false)}
        onConfirm={handleConfirmDisableEncryption}
      />

      {/* Save/Cancel Buttons - only show when editing */}
      {isEditing && (
        <div className='flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200'>
          <ReusableButton
            onClick={() => {
              // Reset to original settings
              onCancel?.();
            }}
            className='px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors'
          >
            Cancel
          </ReusableButton>
          <ReusableButton
            onClick={handleSaveSettings}
            disabled={loading}
            className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2'
          >
            {loading && <Loader2 className='h-4 w-4 animate-spin' />}
            {loading ? 'Saving...' : 'Save Changes'}
          </ReusableButton>
        </div>
      )}

      <SettingsValidationModal
        isOpen={validationModal}
        onClose={() => setValidationModal(false)}
        settings={{ encryption: encryptionSettings, offsite: offsiteSettings }}
        onValidationComplete={result => {
          if (result.isValid) {
            toast.success(
              'Validation Passed',
              'Settings configuration is valid.',
            );
          } else {
            toast.warning(
              'Validation Issues',
              `Found ${result.errors.length} errors and ${result.warnings.length} warnings.`,
            );
          }
        }}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={handleConfirmEncryptionChange}
        title={
          confirmModal.type === 'enableEncryption'
            ? 'Enable Encryption'
            : 'Disable Encryption'
        }
        message={
          confirmModal.type === 'enableEncryption'
            ? 'Encryption is enabled but no encryption key exists. Would you like to generate one now?'
            : 'Are you sure you want to disable encryption? Future backups will NOT be encrypted.'
        }
        details={
          confirmModal.type === 'enableEncryption'
            ? [
                'All future backups will be encrypted with a secure key',
                "You must keep this key safe - it's required to restore backups",
                'Losing the key means losing access to encrypted backups',
              ]
            : [
                'Existing encrypted backups will remain encrypted',
                'New backups will be stored without encryption',
                'This may reduce security for sensitive data',
              ]
        }
        type={confirmModal.type === 'enableEncryption' ? 'info' : 'warning'}
        confirmText={
          confirmModal.type === 'enableEncryption'
            ? 'Generate Key'
            : 'Disable Encryption'
        }
      />

      <ConnectionTestModal
        isOpen={connectionTestModal.isOpen}
        onClose={() =>
          setConnectionTestModal(prev => ({ ...prev, isOpen: false }))
        }
        status={connectionTestModal.status}
        error={connectionTestModal.error}
        details={connectionTestModal.details}
      />

      <FolderCreationModal
        isOpen={folderCreationModal.isOpen}
        onClose={() =>
          setFolderCreationModal(prev => ({ ...prev, isOpen: false }))
        }
        status={folderCreationModal.status}
        error={folderCreationModal.error}
        folderPath={folderCreationModal.folderPath}
        serverHost={folderCreationModal.serverHost}
      />

      <SaveSettingsConfirmationModal
        isOpen={saveConfirmationModal}
        onClose={() => setSaveConfirmationModal(false)}
        onConfirm={confirmSaveSettings}
        encryptionEnabled={encryptionSettings.enableEncryption}
        offsiteEnabled={offsiteSettings.enableOffsiteBackup}
        backupLocation={offsiteSettings.backupLocation}
        remoteHost={offsiteSettings.remoteHost}
        remotePath={offsiteSettings.remotePath}
      />

      <DisableOffsiteConfirmationModal
        isOpen={disableOffsiteModal}
        onClose={() => setDisableOffsiteModal(false)}
        onConfirm={handleConfirmDisableOffsite}
      />
    </div>
  );
}
