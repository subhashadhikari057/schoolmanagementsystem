'use client';

import React, { useState } from 'react';
import { X, Key, AlertTriangle, Upload } from 'lucide-react';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';

interface DecryptionKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (key: string) => void;
  backupName: string;
}

export default function DecryptionKeyModal({
  isOpen,
  onClose,
  onSubmit,
  backupName,
}: DecryptionKeyModalProps) {
  const [decryptionKey, setDecryptionKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.key) {
            setDecryptionKey(json.key);
            setError('');
          } else {
            setError('Invalid key file format');
          }
        } catch (err) {
          setError('Failed to parse key file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!decryptionKey.trim()) {
      setError('Please enter or upload a decryption key');
      return;
    }

    if (decryptionKey.length < 32) {
      setError('Decryption key must be at least 32 characters');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(decryptionKey);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid decryption key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDecryptionKey('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <Card className='w-full max-w-lg p-6 m-4 bg-white rounded-lg shadow-xl'>
        {/* Header */}
        <div className='flex items-start justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Key className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Enter Decryption Key
              </h2>
              <p className='text-sm text-gray-600'>
                This backup is encrypted and requires a key to restore
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            disabled={isLoading}
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Backup Info */}
        <div className='mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
          <p className='text-sm text-gray-700'>
            <span className='font-medium'>Backup:</span> {backupName}
          </p>
        </div>

        {/* Warning */}
        <div className='mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm text-yellow-800'>
                Enter the encryption key that was generated when this backup was
                created. Without the correct key, the backup cannot be restored.
              </p>
            </div>
          </div>
        </div>

        {/* Key Input Methods */}
        <div className='space-y-4 mb-6'>
          {/* Manual Input */}
          <div>
            <Label htmlFor='decryption-key'>Decryption Key</Label>
            <Input
              id='decryption-key'
              type='password'
              value={decryptionKey}
              onChange={e => {
                setDecryptionKey(e.target.value);
                setError('');
              }}
              placeholder='Enter your encryption key...'
              className='font-mono'
              disabled={isLoading}
            />
          </div>

          {/* Or Divider */}
          <div className='flex items-center gap-3'>
            <div className='flex-1 border-t border-gray-300'></div>
            <span className='text-sm text-gray-500 font-medium'>OR</span>
            <div className='flex-1 border-t border-gray-300'></div>
          </div>

          {/* File Upload */}
          <div>
            <label
              htmlFor='key-file'
              className='flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors'
            >
              <Upload className='w-5 h-5 text-gray-600' />
              <span className='text-sm font-medium text-gray-700'>
                Upload Key File
              </span>
              <input
                id='key-file'
                type='file'
                accept='.json'
                onChange={handleFileUpload}
                className='hidden'
                disabled={isLoading}
              />
            </label>
            <p className='text-xs text-gray-500 mt-1 text-center'>
              Select the JSON key file you downloaded when encryption was
              enabled
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-sm text-red-700'>{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <ReusableButton
            onClick={handleClose}
            variant='outline'
            className='flex-1'
            disabled={isLoading}
          >
            Cancel
          </ReusableButton>
          <ReusableButton
            onClick={handleSubmit}
            variant='primary'
            className='flex-1'
            disabled={!decryptionKey.trim() || isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Validating...' : 'Restore'}
          </ReusableButton>
        </div>
      </Card>
    </div>
  );
}
