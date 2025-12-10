'use client';

import React, { useState } from 'react';
import {
  X,
  Key,
  Upload,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import { backupSettingsService } from '@/api/services/backup-settings.service';

interface SSHConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: any) => void;
  currentConfig?: any;
}

export default function SSHConfigModal({
  isOpen,
  onClose,
  onConfigSaved,
  currentConfig,
}: SSHConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const [config, setConfig] = useState({
    keyType:
      currentConfig?.keyType || ('privateKey' as 'password' | 'privateKey'),
    privateKey: currentConfig?.privateKey || '',
    passphrase: currentConfig?.passphrase || '',
    password: currentConfig?.password || '',
    keyName: currentConfig?.keyName || '',
    keyFingerprint: currentConfig?.keyFingerprint || '',
  });

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        setConfig(prev => ({ ...prev, privateKey: content }));
        setTestResult(null);
        setError('');
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateKey = async () => {
    if (!config.keyName) {
      setError('Please provide a key name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await backupSettingsService.generateSSHKey(
        config.keyName,
        config.passphrase || undefined,
      );

      if (response.success && response.data) {
        setConfig(prev => ({
          ...prev,
          privateKey: response.data.privateKey,
          keyFingerprint: response.data.fingerprint,
        }));
      } else {
        setError(response.error || 'Failed to generate SSH key');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate SSH key',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      const response = await backupSettingsService.testOffsiteConnection({
        sshConfig: config,
      });

      if (response.success && response.data) {
        setTestResult(response.data);
      } else {
        setError(response.error || 'Connection test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await backupSettingsService.configureSSHKey(config);

      if (response.success) {
        onConfigSaved?.(config);
        onClose();
      } else {
        setError(response.error || 'Failed to save SSH configuration');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save SSH configuration',
      );
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    if (config.keyType === 'password') {
      return config.password.length > 0;
    } else {
      return config.privateKey.length > 0;
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-green-50 rounded-lg'>
              <Key className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                SSH Key Configuration
              </h2>
              <p className='text-sm text-gray-600'>
                Configure SSH authentication for offsite backups
              </p>
            </div>
          </div>
          <ReusableButton
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5' />
          </ReusableButton>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
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

          {testResult && (
            <div
              className={`border rounded-lg p-4 ${
                testResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className='flex items-start gap-3'>
                {testResult.success ? (
                  <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0 mt-0.5' />
                ) : (
                  <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {testResult.success
                      ? 'Connection Successful'
                      : 'Connection Failed'}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {testResult.details}
                  </p>
                  {testResult.connectionTime && (
                    <p className='text-xs text-gray-500 mt-1'>
                      Connection time: {testResult.connectionTime}ms
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Authentication Method */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-3 block'>
              Authentication Method
            </Label>
            <div className='flex gap-4'>
              <label className='flex items-center gap-2'>
                <input
                  type='radio'
                  name='keyType'
                  value='privateKey'
                  checked={config.keyType === 'privateKey'}
                  onChange={e => handleInputChange('keyType', e.target.value)}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                />
                <span className='text-sm text-gray-700'>Private Key</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='radio'
                  name='keyType'
                  value='password'
                  checked={config.keyType === 'password'}
                  onChange={e => handleInputChange('keyType', e.target.value)}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                />
                <span className='text-sm text-gray-700'>Password</span>
              </label>
            </div>
          </div>

          {/* Key Name */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Key Name
            </Label>
            <Input
              type='text'
              value={config.keyName}
              onChange={e => handleInputChange('keyName', e.target.value)}
              placeholder='e.g., backup-server-key'
              className='w-full'
            />
          </div>

          {/* Private Key Configuration */}
          {config.keyType === 'privateKey' && (
            <div className='space-y-4'>
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Private Key
                </Label>
                <div className='space-y-3'>
                  <textarea
                    value={config.privateKey}
                    onChange={e =>
                      handleInputChange('privateKey', e.target.value)
                    }
                    placeholder='-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----'
                    className='w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm'
                  />

                  <div className='flex gap-3'>
                    <label className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors'>
                      <Upload className='h-4 w-4' />
                      Upload Key File
                      <input
                        type='file'
                        accept='.pem,.key,.pub'
                        onChange={handleFileUpload}
                        className='hidden'
                      />
                    </label>

                    <ReusableButton
                      onClick={handleGenerateKey}
                      disabled={loading || !config.keyName}
                      className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:bg-blue-400 flex items-center gap-2'
                    >
                      <Key className='h-4 w-4' />
                      {loading ? 'Generating...' : 'Generate New Key'}
                    </ReusableButton>
                  </div>
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Passphrase (optional)
                </Label>
                <div className='relative'>
                  <Input
                    type={showPassphrase ? 'text' : 'password'}
                    value={config.passphrase}
                    onChange={e =>
                      handleInputChange('passphrase', e.target.value)
                    }
                    placeholder='Enter passphrase if key is encrypted'
                    className='w-full pr-10'
                  />
                  <ReusableButton
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className='absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600'
                  >
                    {showPassphrase ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </ReusableButton>
                </div>
              </div>
            </div>
          )}

          {/* Password Configuration */}
          {config.keyType === 'password' && (
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Password
              </Label>
              <div className='relative'>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  placeholder='Enter SSH password'
                  className='w-full pr-10'
                />
                <ReusableButton
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </ReusableButton>
              </div>
            </div>
          )}

          {/* Key Fingerprint */}
          {config.keyFingerprint && (
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Key Fingerprint
              </Label>
              <Input
                type='text'
                value={config.keyFingerprint}
                readOnly
                className='w-full font-mono text-sm bg-gray-50'
              />
            </div>
          )}

          {/* Security Notice */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-yellow-800'>
                  Security Best Practices
                </p>
                <ul className='text-sm text-yellow-700 mt-1 space-y-1'>
                  <li>
                    • Use key-based authentication instead of passwords when
                    possible
                  </li>
                  <li>• Generate dedicated keys for backup operations</li>
                  <li>• Regularly rotate your SSH keys</li>
                  <li>• Store private keys securely and never share them</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
          <ReusableButton
            onClick={handleTestConnection}
            disabled={testing || !isValid()}
            className='px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:bg-green-400 flex items-center gap-2'
          >
            <TestTube className='h-4 w-4' />
            {testing ? 'Testing...' : 'Test Connection'}
          </ReusableButton>

          <div className='flex items-center gap-3'>
            <ReusableButton
              onClick={onClose}
              className='px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
            >
              Cancel
            </ReusableButton>
            <ReusableButton
              onClick={handleSave}
              disabled={loading || !isValid()}
              className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:bg-blue-400'
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </ReusableButton>
          </div>
        </div>
      </div>
    </div>
  );
}
