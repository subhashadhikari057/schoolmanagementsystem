'use client';

import React, { useState } from 'react';
import {
  Key,
  Upload,
  Download,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SSHConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SSHConfig) => Promise<void>;
  currentConfig?: SSHConfig;
  isSaving: boolean;
}

interface SSHConfig {
  keyType: 'password' | 'privateKey';
  privateKey?: string;
  passphrase?: string;
  keyName?: string;
  keyFingerprint?: string;
  createdAt?: string;
  // Password authentication fields
  password?: string;
}

export default function SSHConfigurationModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  isSaving,
}: SSHConfigurationModalProps) {
  const [config, setConfig] = useState<SSHConfig>(
    currentConfig || {
      keyType: 'password',
      privateKey: '',
      passphrase: '',
      keyName: '',
      password: '',
    },
  );
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      if (content) {
        setConfig(prev => ({
          ...prev,
          privateKey: content,
          keyName: file.name,
          createdAt: new Date().toISOString(),
        }));
        toast.success('SSH private key loaded successfully');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const keyFile = files.find(
      file =>
        file.name.includes('id_rsa') ||
        file.name.includes('id_ed25519') ||
        file.name.includes('.pem') ||
        file.type === 'application/x-openssh-key',
    );

    if (keyFile) {
      handleFileUpload(keyFile);
    } else {
      toast.error('Please upload a valid SSH private key file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const generateKeyFingerprint = (key: string): string => {
    // Simple fingerprint generation for demo - in production, use proper crypto
    const hash = btoa(key).slice(0, 16);
    return hash.match(/.{2}/g)?.join(':') || '';
  };

  const handleSave = async () => {
    if (config.keyType === 'privateKey' && !config.privateKey) {
      toast.error('Please provide a private key');
      return;
    }

    if (config.keyType === 'password' && !config.password) {
      toast.error('Please provide a password');
      return;
    }

    // Generate fingerprint if private key is provided
    if (config.privateKey && !config.keyFingerprint) {
      config.keyFingerprint = generateKeyFingerprint(config.privateKey);
    }

    await onSave(config);
  };

  const downloadSampleKey = () => {
    const sampleKey = `-----BEGIN OPENSSH PRIVATE KEY-----
# This is a sample SSH private key format
# Replace this with your actual private key
# Generated with: ssh-keygen -t ed25519 -C "backup@yourschool.edu"
-----END OPENSSH PRIVATE KEY-----`;

    const blob = new Blob([sampleKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-ssh-key-format.txt';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    toast.success('Sample key format downloaded');
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <Key className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                SSH Configuration
              </h2>
              <p className='text-sm text-gray-600'>
                Configure SSH authentication for offsite backups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          {/* Authentication Method */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-3 block'>
              Authentication Method
            </Label>
            <div className='grid grid-cols-2 gap-4'>
              <Card
                className={`p-4 cursor-pointer border-2 transition-colors ${
                  config.keyType === 'password'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() =>
                  setConfig(prev => ({ ...prev, keyType: 'password' }))
                }
              >
                <div className='flex items-center gap-3'>
                  <input
                    type='radio'
                    checked={config.keyType === 'password'}
                    onChange={() =>
                      setConfig(prev => ({ ...prev, keyType: 'password' }))
                    }
                    className='h-4 w-4 text-blue-600'
                  />
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      Password Authentication
                    </h3>
                    <p className='text-sm text-gray-600'>
                      Use username and password
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer border-2 transition-colors ${
                  config.keyType === 'privateKey'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() =>
                  setConfig(prev => ({ ...prev, keyType: 'privateKey' }))
                }
              >
                <div className='flex items-center gap-3'>
                  <input
                    type='radio'
                    checked={config.keyType === 'privateKey'}
                    onChange={() =>
                      setConfig(prev => ({ ...prev, keyType: 'privateKey' }))
                    }
                    className='h-4 w-4 text-blue-600'
                  />
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      SSH Key Authentication
                    </h3>
                    <p className='text-sm text-gray-600'>
                      Use private key (recommended)
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Password Authentication Configuration */}
          {config.keyType === 'password' && (
            <div className='space-y-4'>
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  SSH Password
                </Label>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={config.password || ''}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, password: e.target.value }))
                    }
                    placeholder='Enter your SSH password'
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </button>
                </div>
                <p className='text-xs text-gray-500 mt-1'>
                  The password for your SSH user account on the remote server
                </p>
              </div>

              {/* Password Security Info */}
              <Card className='p-4 bg-amber-50 border-amber-200'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold text-amber-900 mb-2'>
                      Password Authentication Security
                    </h3>
                    <div className='space-y-1 text-sm text-amber-800'>
                      <p>• Password will be stored encrypted in the database</p>
                      <p>• Consider using SSH keys for better security</p>
                      <p>
                        • Ensure your SSH server allows password authentication
                      </p>
                      <p>• Use a strong, unique password for this connection</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* SSH Key Configuration */}
          {config.keyType === 'privateKey' && (
            <div className='space-y-4'>
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  SSH Private Key
                </Label>

                {!config.privateKey ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={e => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className='h-8 w-8 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-600 mb-2'>
                      Drag and drop your SSH private key file here, or
                    </p>
                    <label className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors'>
                      <Upload className='h-4 w-4' />
                      Browse Files
                      <input
                        type='file'
                        accept='.pem,.key,id_rsa,id_ed25519'
                        onChange={handleFileInputChange}
                        className='hidden'
                      />
                    </label>
                    <p className='text-xs text-gray-500 mt-2'>
                      Supported formats: id_rsa, id_ed25519, .pem files
                    </p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='relative'>
                      <textarea
                        value={config.privateKey}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            privateKey: e.target.value,
                          }))
                        }
                        placeholder='-----BEGIN OPENSSH PRIVATE KEY-----'
                        className={`w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none ${
                          showPrivateKey ? '' : 'filter blur-sm'
                        }`}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className='absolute top-3 right-3 p-1 hover:bg-gray-200 rounded transition-colors'
                        title={showPrivateKey ? 'Hide key' : 'Show key'}
                      >
                        {showPrivateKey ? (
                          <EyeOff className='h-4 w-4 text-gray-500' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500' />
                        )}
                      </button>
                    </div>

                    {config.keyName && (
                      <div className='flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded'>
                        <CheckCircle className='h-4 w-4' />
                        Key loaded: {config.keyName}
                        {config.keyFingerprint && (
                          <span className='text-xs text-gray-600 ml-2'>
                            ({config.keyFingerprint})
                          </span>
                        )}
                      </div>
                    )}

                    <div className='flex gap-2'>
                      <ReusableButton
                        onClick={() =>
                          setConfig(prev => ({
                            ...prev,
                            privateKey: '',
                            keyName: '',
                            keyFingerprint: '',
                          }))
                        }
                        className='text-sm border border-gray-300 text-gray-700 hover:bg-gray-50'
                      >
                        Clear Key
                      </ReusableButton>
                      <ReusableButton
                        onClick={downloadSampleKey}
                        className='text-sm border border-gray-300 text-gray-700 hover:bg-gray-50'
                      >
                        <Download className='h-4 w-4 mr-1' />
                        Sample Format
                      </ReusableButton>
                    </div>
                  </div>
                )}
              </div>

              {/* Passphrase */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Passphrase (Optional)
                </Label>
                <div className='relative'>
                  <Input
                    type={showPassphrase ? 'text' : 'password'}
                    value={config.passphrase || ''}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        passphrase: e.target.value,
                      }))
                    }
                    placeholder='Enter passphrase if your key is encrypted'
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  >
                    {showPassphrase ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </button>
                </div>
                <p className='text-xs text-gray-500 mt-1'>
                  Only required if your private key is password-protected
                </p>
              </div>
            </div>
          )}

          {/* Security Information */}
          <Card className='p-4 bg-blue-50 border-blue-200'>
            <div className='flex items-start gap-3'>
              <Info className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-blue-900 mb-2'>
                  Security Best Practices
                </h3>
                <div className='space-y-2 text-sm text-blue-800'>
                  <div>
                    <p className='font-medium'>
                      For SSH Key Authentication (Recommended):
                    </p>
                    <ul className='list-disc list-inside ml-2 space-y-1'>
                      <li>
                        Generate keys with:{' '}
                        <code className='bg-blue-100 px-1 rounded'>
                          ssh-keygen -t ed25519 -C "backup@yourschool.edu"
                        </code>
                      </li>
                      <li>
                        Add the public key to your server's{' '}
                        <code className='bg-blue-100 px-1 rounded'>
                          ~/.ssh/authorized_keys
                        </code>
                      </li>
                      <li>Keep your private key secure and never share it</li>
                      <li>Use a passphrase for additional security</li>
                    </ul>
                  </div>
                  <div>
                    <p className='font-medium'>For Password Authentication:</p>
                    <ul className='list-disc list-inside ml-2 space-y-1'>
                      <li>Use a strong, unique password</li>
                      <li>Ensure SSH server allows password authentication</li>
                      <li>
                        Consider enabling two-factor authentication on the
                        server
                      </li>
                      <li>Regularly rotate passwords for security</li>
                    </ul>
                  </div>
                  <div className='mt-2'>
                    <p>
                      • Test the connection manually before using it for backups
                    </p>
                    <p>• Monitor failed login attempts on your server</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
            <ReusableButton
              onClick={onClose}
              disabled={isSaving}
              className='border border-gray-300 text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </ReusableButton>
            <ReusableButton
              onClick={handleSave}
              disabled={isSaving}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isSaving ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                  Saving...
                </>
              ) : (
                <>
                  <Key className='h-4 w-4 mr-2' />
                  Save SSH Configuration
                </>
              )}
            </ReusableButton>
          </div>
        </div>
      </div>
    </div>
  );
}
