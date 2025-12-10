'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Copy, AlertTriangle, Check, Key } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { backupSettingsService } from '@/api/services/backup-settings.service';

interface EncryptionKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyGenerated: (keyData: {
    key: string;
    keyId?: string;
    algorithm?: string;
  }) => void;
  currentKey?: string;
  mode: 'generate' | 'rotate' | 'view';
}

export default function EncryptionKeyModal({
  isOpen,
  onClose,
  onKeyGenerated,
  currentKey,
  mode,
}: EncryptionKeyModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [keyData, setKeyData] = useState<{
    key: string;
    keyId: string;
    algorithm: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && mode === 'generate' && !keyData) {
      generateKey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  const generateKey = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await backupSettingsService.generateEncryptionKey();

      // The API service returns response.data directly, so the response here
      // is already the key data object, not wrapped in { success, data }
      const keyData = (response as any).key ? (response as any) : null;

      if (keyData && keyData.key) {
        // Convert createdAt to ISO string if it's a Date object
        const createdAtValue = keyData.createdAt
          ? keyData.createdAt instanceof Date
            ? keyData.createdAt.toISOString()
            : keyData.createdAt
          : new Date().toISOString();

        const generatedKey = {
          key: keyData.key,
          keyId: keyData.keyId || 'unknown',
          algorithm: keyData.algorithm || 'AES-256-GCM',
          createdAt: createdAtValue,
        };

        setKeyData(generatedKey);
        onKeyGenerated({
          key: generatedKey.key,
          keyId: generatedKey.keyId,
          algorithm: generatedKey.algorithm,
        });
      } else {
        const errorMsg = 'Failed to generate encryption key';
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to generate encryption key';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!keyData) return;
    try {
      await navigator.clipboard.writeText(keyData.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    if (!keyData) return;

    const downloadData = {
      key: keyData.key,
      keyId: keyData.keyId,
      algorithm: keyData.algorithm,
      createdAt: keyData.createdAt,
      warning: 'STORE THIS KEY SECURELY. IT CANNOT BE RECOVERED IF LOST.',
      note: 'This key uses AES-256-GCM encryption with authenticated integrity verification.',
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-encryption-key-${keyData.keyId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
  };

  const canClose = downloaded;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <Card className='w-full max-w-2xl p-6 m-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Key className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                {!keyData && loading
                  ? 'Generating Encryption Key...'
                  : 'Encryption Key Generated'}
              </h2>
              <p className='text-sm text-gray-600'>
                {!keyData && loading
                  ? 'Please wait while we generate your encryption key'
                  : "Save this key securely - you'll need it to restore encrypted backups"}
              </p>
            </div>
          </div>
          {canClose && keyData && (
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
              title='Close'
            >
              <X className='w-5 h-5' />
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-gray-600'>
              Generating encryption key...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && !keyData && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-red-800'>
                  Error Generating Key
                </p>
                <p className='text-sm text-red-700 mt-1'>{error}</p>
                <ReusableButton
                  onClick={generateKey}
                  className='mt-3 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm'
                >
                  Retry
                </ReusableButton>
              </div>
            </div>
          </div>
        )}

        {/* Key Data */}
        {keyData && !loading && (
          <>
            {/* Warning Banner - Previous Key Needed */}
            {currentKey && (
              <div className='mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <h3 className='text-sm font-semibold text-yellow-800 mb-1'>
                      Important: Previous Key Still Required
                    </h3>
                    <p className='text-sm text-yellow-700'>
                      Your previous encryption key is still needed to restore
                      old encrypted backups. This new key will only be used for
                      future backups.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Banner */}
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div>
                  <h3 className='text-sm font-semibold text-red-800 mb-1'>
                    Critical: Store This Key Securely
                  </h3>
                  <ul className='text-sm text-red-700 space-y-1'>
                    <li>• This key will NOT be shown again</li>
                    <li>• You MUST download it before closing this modal</li>
                    <li>
                      • Without this key, you cannot restore encrypted backups
                    </li>
                    <li>
                      • Store it in a secure password manager or encrypted vault
                    </li>
                    <li>
                      • Uses AES-256-GCM encryption with authenticated integrity
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Info */}
            <div className='mb-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Key ID
                </label>
                <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-mono'>
                  {keyData.keyId}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Encryption Key
                </label>
                <div className='relative'>
                  <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 break-all'>
                    {keyData.key}
                  </div>
                  <button
                    onClick={handleCopy}
                    className='absolute top-2 right-2 p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors'
                    title='Copy to clipboard'
                  >
                    {copied ? (
                      <Check className='w-4 h-4 text-green-600' />
                    ) : (
                      <Copy className='w-4 h-4 text-gray-600' />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className='text-sm text-green-600 mt-1'>
                    Copied to clipboard!
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Created At
                </label>
                <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800'>
                  {new Date(keyData.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3'>
              <ReusableButton
                onClick={handleDownload}
                className={`flex-1 flex items-center justify-center gap-2 ${
                  downloaded
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {downloaded ? (
                  <>
                    <Check className='w-4 h-4' />
                    Downloaded
                  </>
                ) : (
                  <>
                    <Download className='w-4 h-4' />
                    Download Key File
                  </>
                )}
              </ReusableButton>

              {canClose && (
                <ReusableButton
                  onClick={onClose}
                  className='flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800'
                >
                  Close
                </ReusableButton>
              )}
            </div>

            {!downloaded && (
              <div className='mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg animate-pulse'>
                <p className='text-sm text-red-800 text-center font-bold'>
                  ⚠️ IMPORTANT: You must download the key file before closing
                  this modal!
                </p>
                <p className='text-xs text-red-700 text-center mt-1'>
                  This key cannot be recovered later. Download it now.
                </p>
              </div>
            )}

            {downloaded && (
              <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                <p className='text-sm text-green-800 text-center font-medium'>
                  ✅ Key downloaded! You can now close this modal safely.
                </p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
