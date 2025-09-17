'use client';

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Shield,
  Cloud,
  Settings2,
  Key,
  TestTube,
  Copy,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  Info,
} from 'lucide-react';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  backupService,
  BackupSettings,
  EncryptionKeyData,
  ConnectionTestResult,
  SettingsValidation,
} from '@/api/services/backup.service';
import EncryptionKeyGenerationModal from '@/components/organisms/modals/EncryptionKeyGenerationModal';
import SSHConfigurationModal from '@/components/organisms/modals/SSHConfigurationModal';
import OffsiteConnectionTestModal from '@/components/organisms/modals/OffsiteConnectionTestModal';

interface BackupSettingsTabProps {
  isEditing: boolean;
}

export interface BackupSettingsTabRef {
  saveSettings: () => Promise<void>;
}

const BackupSettingsTab = forwardRef<
  BackupSettingsTabRef,
  BackupSettingsTabProps
>(({ isEditing }, ref) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [validation, setValidation] = useState<SettingsValidation | null>(null);
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);
  const [connectionTest, setConnectionTest] =
    useState<ConnectionTestResult | null>(null);
  const [showKeyGenerationModal, setShowKeyGenerationModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [showSSHModal, setShowSSHModal] = useState(false);
  const [sshConfig, setSSHConfig] = useState<any>(null);
  const [savingSSH, setSavingSSH] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Expose saveSettings method to parent
  useImperativeHandle(ref, () => ({
    saveSettings: handleSaveSettings,
  }));

  // Load settings on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      loadSettings();
    }
  }, [isSuperAdmin]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load settings first
      try {
        const settingsResponse = await backupService.getBackupSettings();
        console.log('Settings response:', settingsResponse); // Debug log

        // Handle both wrapped and unwrapped responses
        if (settingsResponse.success !== undefined) {
          // Response is wrapped with success/data structure
          if (settingsResponse.success && settingsResponse.data) {
            setSettings(settingsResponse.data);
          } else {
            console.error('Settings response failed:', settingsResponse);
            toast.error(
              `Failed to load settings: ${settingsResponse.error || 'Unknown error'}`,
            );
          }
        } else {
          // Response is unwrapped, check if it has settings structure
          if (
            settingsResponse &&
            typeof settingsResponse === 'object' &&
            'encryption' in settingsResponse
          ) {
            setSettings(settingsResponse as unknown as BackupSettings);
            console.log('Settings loaded successfully (unwrapped)');
          } else {
            console.error(
              'Invalid settings response format:',
              settingsResponse,
            );
            toast.error('Invalid settings data format');
          }
        }
      } catch (settingsError) {
        console.error('Error loading settings:', settingsError);
        toast.error(
          'Failed to load backup settings. Please check your permissions and try again.',
        );
      }

      // Load validation separately to avoid blocking settings if validation fails
      try {
        const validationResponse = await backupService.validateBackupSettings();
        console.log('Validation response:', validationResponse); // Debug log

        // Handle both wrapped and unwrapped validation responses
        if (validationResponse.success !== undefined) {
          // Response is wrapped with success/data structure
          if (validationResponse.success && validationResponse.data) {
            setValidation(validationResponse.data);
          } else {
            console.warn('Validation failed:', validationResponse);
            // Don't show error toast for validation failure - it's not critical
          }
        } else {
          // Response is unwrapped, check if it has validation structure
          if (
            validationResponse &&
            typeof validationResponse === 'object' &&
            'valid' in validationResponse
          ) {
            setValidation(validationResponse as unknown as SettingsValidation);
            console.log('Validation loaded successfully (unwrapped)');
          } else {
            console.warn(
              'Invalid validation response format:',
              validationResponse,
            );
            // Don't show error toast for validation failure - it's not critical
          }
        }
      } catch (validationError) {
        console.warn('Validation error (non-critical):', validationError);
        // Validation failure is not critical, just log it
      }
    } catch (error) {
      console.error('Unexpected error in loadSettings:', error);
      toast.error('An unexpected error occurred while loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) {
      throw new Error('No settings to save');
    }

    try {
      setSaving(true);
      const response = await backupService.updateBackupSettings(settings);

      // Handle both wrapped and unwrapped responses
      if (response.success !== undefined) {
        // Response is wrapped with success/data structure
        if (response.success) {
          // Don't show toast here - parent will handle it
          await loadSettings(); // Reload to get updated validation
        } else {
          throw new Error(response.error || 'Failed to save settings');
        }
      } else {
        // Response is unwrapped, check if it has settings data structure
        if (
          response &&
          typeof response === 'object' &&
          'encryption' in response
        ) {
          // Settings were saved successfully (unwrapped response)
          await loadSettings(); // Reload to get updated validation
        } else {
          console.error('Invalid settings response format:', response);
          throw new Error('Invalid response format from server');
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error; // Re-throw so parent can handle the error
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (
      !confirm(
        'Are you sure you want to reset all settings to defaults? This cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await backupService.resetSettingsToDefaults();

      if (response.success && response.data) {
        setSettings(response.data);
        toast.success('Settings reset to defaults');
        await loadSettings();
      } else {
        toast.error(response.error || 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setIsGeneratingKey(true);
      const response = await backupService.generateEncryptionKey();

      // Handle both wrapped and unwrapped responses
      let keyData: EncryptionKeyData;

      if (response.success !== undefined) {
        // Wrapped response
        if (response.success && response.data) {
          keyData = response.data;
        } else {
          throw new Error(response.error || 'Failed to generate key');
        }
      } else {
        // Unwrapped response - check if it has the expected structure
        if (response && typeof response === 'object' && 'key' in response) {
          keyData = response as unknown as EncryptionKeyData;
        } else {
          throw new Error('Invalid response format');
        }
      }

      // Store the generated key for the modal
      setGeneratedKey(keyData.key);

      // Update settings with new key
      if (settings) {
        setSettings({
          ...settings,
          encryption: {
            ...settings.encryption,
            clientEncryptionKey: keyData.key,
            keyCreatedAt: keyData.createdAt,
            keyUpdatedAt: keyData.createdAt,
          },
        });
      }

      toast.success(
        '🔑 New encryption key generated successfully! Please save it securely.',
      );
    } catch (error) {
      console.error('Error generating key:', error);
      toast.error(
        `Failed to generate encryption key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      setShowKeyGenerationModal(false);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleOpenKeyGenerationModal = () => {
    // Check if there's already an existing key
    const hasExistingKey = settings?.encryption.clientEncryptionKey;

    if (hasExistingKey) {
      const confirmRegenerate = confirm(
        '⚠️ WARNING: Generating a new encryption key will make ALL existing encrypted backups unrecoverable!\n\n' +
          'This means:\n' +
          '• All previously encrypted backups will become useless\n' +
          '• You will NOT be able to restore from old backups\n' +
          '• This action CANNOT be undone\n\n' +
          'Are you absolutely sure you want to generate a new key?',
      );

      if (!confirmRegenerate) {
        return;
      }
    }

    setGeneratedKey('');
    setShowKeyGenerationModal(true);
  };

  const handleCloseKeyGenerationModal = () => {
    setShowKeyGenerationModal(false);
    setGeneratedKey('');
  };

  const handleCopyKey = async () => {
    if (!settings?.encryption.clientEncryptionKey) return;

    try {
      await navigator.clipboard.writeText(
        settings.encryption.clientEncryptionKey,
      );
      toast.success('Encryption key copied to clipboard');
    } catch (error) {
      console.error('Error copying key:', error);
      toast.error('Failed to copy key to clipboard');
    }
  };

  const handleTestConnection = async () => {
    if (!settings?.offsite.remoteHost || !settings.offsite.username) {
      toast.error('Please configure host and username first');
      return;
    }

    if (!sshConfig) {
      toast.error('Please configure SSH authentication first');
      return;
    }

    setShowTestModal(true);
  };

  const handleRunConnectionTest = async () => {
    try {
      const response = await backupService.testOffsiteBackupConnection();

      if (response.success && response.data) {
        setConnectionTest(response.data);

        // Show success/error toast based on result
        if (response.data.connected) {
          toast.success('SSH connection test passed successfully!');
        } else {
          toast.error(
            `SSH connection failed: ${response.data.error || 'Authentication or network error'}`,
          );
        }

        // Convert to the expected format for the modal
        return {
          connected: response.data.connected,
          message: response.data.connected
            ? 'Connection successful'
            : response.data.error || 'Connection failed',
          details: {
            latency: response.data.responseTime || 0,
            authentication: response.data.details?.authentication === 'success',
            pathAccess: response.data.details?.path_accessible || false,
            writePermission:
              response.data.details?.permissions === 'read_write' ||
              response.data.details?.permissions === 'write',
            diskSpace: response.data.details?.diskSpace || 'Unknown',
            serverInfo: `${response.data.details?.host}:${response.data.details?.port || 22}`,
          },
          error: response.data.error,
        };
      } else {
        const errorMsg = response.error || 'Failed to test connection';
        toast.error(`Connection test failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        'Connection test failed';
      toast.error(`Connection test failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  };

  const handleConfigureSSHKey = async () => {
    setShowSSHModal(true);
  };

  const handleSaveSSHConfig = async (config: any) => {
    try {
      setSavingSSH(true);

      // In a real implementation, this would call the backend API
      // For now, we'll simulate saving the SSH configuration
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSSHConfig(config);
      setShowSSHModal(false);
      toast.success('SSH configuration saved successfully');

      // Update the settings to reflect SSH is configured
      if (settings) {
        // Note: SSH configuration status would be stored in the backend
        // For now, we just show success feedback
        console.log('SSH configuration saved:', config);
      }
    } catch (error) {
      console.error('Error saving SSH config:', error);
      toast.error('Failed to save SSH configuration');
    } finally {
      setSavingSSH(false);
    }
  };

  const updateSettings = (path: string, value: unknown) => {
    if (!settings) return;

    const pathParts = path.split('.');
    const newSettings = { ...settings };
    let current: Record<string, unknown> = newSettings as Record<
      string,
      unknown
    >;

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]] as Record<string, unknown>;
    }
    current[pathParts[pathParts.length - 1]] = value;

    setSettings(newSettings);
  };

  // Show access denied if not SUPER_ADMIN
  if (!isSuperAdmin) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='text-red-500 text-6xl mb-4'>🔒</div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Access Denied
          </h3>
          <p className='text-gray-600'>
            Only Super Administrators can manage backup settings.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !settings) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 text-blue-500 animate-spin mx-auto mb-4' />
          <p className='text-gray-600'>Loading backup settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <AlertTriangle className='h-8 w-8 text-red-500 mx-auto mb-4' />
          <p className='text-gray-600'>Failed to load backup settings</p>
          <ReusableButton
            onClick={loadSettings}
            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Retry
          </ReusableButton>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>
            Backup Settings
          </h2>
          <p className='text-sm text-gray-600'>
            Configure encryption, offsite storage, and advanced options
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <ReusableButton
            onClick={handleResetToDefaults}
            disabled={loading || saving || !isEditing}
            className='flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg'
          >
            <RotateCcw className='h-4 w-4' />
            Reset Defaults
          </ReusableButton>
        </div>
      </div>

      {/* Validation Status */}
      {validation && (
        <Card className='p-4'>
          <div className='flex items-start gap-3'>
            {validation.valid ? (
              <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0 mt-0.5' />
            ) : (
              <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
            )}
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <h4 className='font-medium text-gray-900'>
                  Settings {validation.valid ? 'Valid' : 'Invalid'}
                </h4>
              </div>

              {validation.errors.length > 0 && (
                <div className='mb-2'>
                  <p className='text-sm font-medium text-red-800 mb-1'>
                    Errors:
                  </p>
                  <ul className='text-sm text-red-700 space-y-1'>
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className='mb-2'>
                  <p className='text-sm font-medium text-yellow-800 mb-1'>
                    Warnings:
                  </p>
                  <ul className='text-sm text-yellow-700 space-y-1'>
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.recommendations.length > 0 && (
                <div>
                  <p className='text-sm font-medium text-blue-800 mb-1'>
                    Recommendations:
                  </p>
                  <ul className='text-sm text-blue-700 space-y-1'>
                    {validation.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
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
              checked={settings.encryption.enableEncryption}
              onChange={e =>
                updateSettings('encryption.enableEncryption', e.target.checked)
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

          {settings.encryption.enableEncryption && (
            <>
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Client Encryption Key
                </Label>
                <div className='flex items-center gap-2'>
                  <div className='relative flex-1'>
                    <Input
                      type={showEncryptionKey ? 'text' : 'password'}
                      value={settings.encryption.clientEncryptionKey || ''}
                      onChange={e =>
                        updateSettings(
                          'encryption.clientEncryptionKey',
                          e.target.value,
                        )
                      }
                      disabled={!isEditing}
                      className='pr-10'
                      placeholder='Enter encryption key or generate a new one'
                    />
                    <button
                      type='button'
                      onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    >
                      {showEncryptionKey ? (
                        <EyeOff className='h-4 w-4 text-gray-400' />
                      ) : (
                        <Eye className='h-4 w-4 text-gray-400' />
                      )}
                    </button>
                  </div>
                  <ReusableButton
                    onClick={handleOpenKeyGenerationModal}
                    className='flex items-center gap-2 px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors text-sm'
                    disabled={!isEditing || loading}
                  >
                    <Key className='h-4 w-4' />
                    Generate
                  </ReusableButton>
                  <ReusableButton
                    onClick={handleCopyKey}
                    className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                    disabled={!settings.encryption.clientEncryptionKey}
                  >
                    <Copy className='h-4 w-4' />
                  </ReusableButton>
                </div>
                <p className='text-xs text-gray-500 mt-1'>
                  Keep this key safe. It's required to decrypt and restore
                  backups.
                </p>
                {settings.encryption.keyCreatedAt && (
                  <p className='text-xs text-gray-400 mt-1'>
                    Key created:{' '}
                    {new Date(
                      settings.encryption.keyCreatedAt,
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </>
          )}

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <Shield className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-yellow-800'>
                  Security Warning:
                </p>
                <p className='text-sm text-yellow-700'>
                  Store your encryption key securely. Without it, encrypted
                  backups cannot be restored. Consider using a password manager
                  or secure key vault.
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
              Configure remote backup storage and synchronization
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              id='enableOffsiteBackup'
              checked={settings.offsite.enableOffsiteBackup}
              onChange={e =>
                updateSettings('offsite.enableOffsiteBackup', e.target.checked)
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

          {settings.offsite.enableOffsiteBackup && (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Provider
                  </Label>
                  <select
                    value={settings.offsite.provider}
                    onChange={e =>
                      updateSettings('offsite.provider', e.target.value)
                    }
                    disabled={!isEditing}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
                  >
                    <option value='ssh'>SSH/SFTP</option>
                    <option value='s3'>Amazon S3</option>
                    <option value='azure'>Azure Blob</option>
                    <option value='gcp'>Google Cloud</option>
                  </select>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Sync Frequency
                  </Label>
                  <select
                    value={settings.offsite.syncFrequency}
                    onChange={e =>
                      updateSettings('offsite.syncFrequency', e.target.value)
                    }
                    disabled={!isEditing}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
                  >
                    <option value='immediate'>Immediate</option>
                    <option value='hourly'>Hourly</option>
                    <option value='daily'>Daily</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Remote Host
                  </Label>
                  <Input
                    value={settings.offsite.remoteHost || ''}
                    onChange={e =>
                      updateSettings('offsite.remoteHost', e.target.value)
                    }
                    disabled={!isEditing}
                    className='w-full'
                    placeholder='backup.yourschool.edu'
                  />
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Username
                  </Label>
                  <Input
                    value={settings.offsite.username || ''}
                    onChange={e =>
                      updateSettings('offsite.username', e.target.value)
                    }
                    disabled={!isEditing}
                    className='w-full'
                    placeholder='backup_user'
                  />
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Remote Path
                </Label>
                <Input
                  value={settings.offsite.remotePath || ''}
                  onChange={e =>
                    updateSettings('offsite.remotePath', e.target.value)
                  }
                  disabled={!isEditing}
                  className='w-full'
                  placeholder='/backups/school-data'
                />
              </div>

              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  id='encryptInTransit'
                  checked={settings.offsite.encryptInTransit}
                  onChange={e =>
                    updateSettings('offsite.encryptInTransit', e.target.checked)
                  }
                  disabled={!isEditing}
                  className='h-4 w-4 text-blue-600 rounded border-gray-300'
                />
                <label
                  htmlFor='encryptInTransit'
                  className='text-sm font-medium text-gray-700'
                >
                  Encrypt data in transit
                </label>
                <span className='text-sm text-gray-500'>
                  Use TLS/SSL for secure transmission
                </span>
              </div>

              <div className='flex gap-2'>
                <ReusableButton
                  onClick={handleTestConnection}
                  disabled={
                    !isEditing || !settings?.offsite.enableOffsiteBackup
                  }
                  className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm disabled:bg-gray-400'
                >
                  <TestTube className='h-4 w-4' />
                  Test Connection
                </ReusableButton>
                <ReusableButton
                  onClick={handleConfigureSSHKey}
                  disabled={!isEditing}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm ${
                    sshConfig
                      ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Key className='h-4 w-4' />
                  {sshConfig
                    ? `${sshConfig.keyType === 'password' ? 'Password' : 'SSH Key'} Configured`
                    : 'Configure SSH Authentication'}
                </ReusableButton>
              </div>

              {connectionTest && (
                <div
                  className={`p-3 rounded-lg border ${
                    connectionTest.connected
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    {connectionTest.connected ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <AlertTriangle className='h-4 w-4 text-red-600' />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        connectionTest.connected
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      Connection{' '}
                      {connectionTest.connected ? 'Successful' : 'Failed'}
                    </span>
                  </div>
                  <div className='text-xs space-y-1'>
                    <div>Host: {connectionTest.details.host}</div>
                    <div>
                      Authentication: {connectionTest.details.authentication}
                    </div>
                    <div>
                      Path Accessible:{' '}
                      {connectionTest.details.path_accessible ? 'Yes' : 'No'}
                    </div>
                    <div>Permissions: {connectionTest.details.permissions}</div>
                    {connectionTest.responseTime && (
                      <div>Response Time: {connectionTest.responseTime}ms</div>
                    )}
                    {connectionTest.error && (
                      <div className='text-red-700 mt-2'>
                        {connectionTest.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
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
              Performance, notifications, and safety features
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
                value={settings.advanced.compressionLevel}
                onChange={e =>
                  updateSettings('advanced.compressionLevel', e.target.value)
                }
                disabled={!isEditing}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
              >
                <option value='none'>None (Fastest)</option>
                <option value='low'>Low (Good speed)</option>
                <option value='medium'>Medium (Balanced)</option>
                <option value='high'>High (Best compression)</option>
              </select>
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Parallel Operations
              </Label>
              <select
                value={settings.advanced.parallelOperations}
                onChange={e =>
                  updateSettings(
                    'advanced.parallelOperations',
                    parseInt(e.target.value),
                  )
                }
                disabled={!isEditing}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
              >
                <option value={1}>1 Thread</option>
                <option value={2}>2 Threads</option>
                <option value={4}>4 Threads</option>
                <option value={8}>8 Threads</option>
                <option value={16}>16 Threads</option>
              </select>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Max Retry Attempts
              </Label>
              <Input
                type='number'
                min='0'
                max='10'
                value={settings.advanced.maxRetryAttempts}
                onChange={e =>
                  updateSettings(
                    'advanced.maxRetryAttempts',
                    parseInt(e.target.value),
                  )
                }
                disabled={!isEditing}
                className='w-full'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Backup Timeout (minutes)
              </Label>
              <Input
                type='number'
                min='1'
                max='1440'
                value={Math.round(settings.advanced.backupTimeout / 60)}
                onChange={e =>
                  updateSettings(
                    'advanced.backupTimeout',
                    parseInt(e.target.value) * 60,
                  )
                }
                disabled={!isEditing}
                className='w-full'
              />
            </div>
          </div>

          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Notification Emails
            </Label>
            <Input
              value={settings.advanced.backupNotifications.join(', ')}
              onChange={e =>
                updateSettings(
                  'advanced.backupNotifications',
                  e.target.value
                    .split(',')
                    .map(email => email.trim())
                    .filter(Boolean),
                )
              }
              disabled={!isEditing}
              className='w-full'
              placeholder='admin@school.edu, backup@school.edu'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Comma-separated email addresses for backup notifications
            </p>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id='progressTracking'
                checked={settings.advanced.enableProgressTracking}
                onChange={e =>
                  updateSettings(
                    'advanced.enableProgressTracking',
                    e.target.checked,
                  )
                }
                disabled={!isEditing}
                className='h-4 w-4 text-blue-600 rounded border-gray-300'
              />
              <label
                htmlFor='progressTracking'
                className='text-sm font-medium text-gray-700'
              >
                Enable Progress Tracking
              </label>
              <span className='text-sm text-gray-500'>
                Show detailed progress during backups
              </span>
            </div>

            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id='preRestoreSnapshot'
                checked={settings.advanced.enablePreRestoreSnapshot}
                onChange={e =>
                  updateSettings(
                    'advanced.enablePreRestoreSnapshot',
                    e.target.checked,
                  )
                }
                disabled={!isEditing}
                className='h-4 w-4 text-blue-600 rounded border-gray-300'
              />
              <label
                htmlFor='preRestoreSnapshot'
                className='text-sm font-medium text-gray-700'
              >
                Pre-restore Snapshot
              </label>
              <span className='text-sm text-gray-500'>
                Create snapshot before restore operations
              </span>
            </div>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <Info className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-blue-800'>
                  Performance Tips:
                </p>
                <ul className='text-sm text-blue-700 mt-1 space-y-1'>
                  <li>
                    • Higher compression reduces storage but increases CPU usage
                  </li>
                  <li>• More parallel operations can speed up large backups</li>
                  <li>
                    • Pre-restore snapshots provide safety but require extra
                    storage
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Encryption Key Generation Modal */}
      <EncryptionKeyGenerationModal
        isOpen={showKeyGenerationModal}
        onClose={handleCloseKeyGenerationModal}
        onGenerate={handleGenerateKey}
        generatedKey={generatedKey}
        isGenerating={isGeneratingKey}
      />

      {/* SSH Configuration Modal */}
      <SSHConfigurationModal
        isOpen={showSSHModal}
        onClose={() => setShowSSHModal(false)}
        onSave={handleSaveSSHConfig}
        currentConfig={sshConfig}
        isSaving={savingSSH}
      />

      {/* Offsite Connection Test Modal */}
      {settings && (
        <OffsiteConnectionTestModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          onTest={handleRunConnectionTest}
          settings={{
            remoteHost: settings.offsite.remoteHost || '',
            username: settings.offsite.username || '',
            remotePath: settings.offsite.remotePath || '',
            provider: settings.offsite.provider || 'ssh',
          }}
        />
      )}
    </div>
  );
});

BackupSettingsTab.displayName = 'BackupSettingsTab';

export default BackupSettingsTab;
