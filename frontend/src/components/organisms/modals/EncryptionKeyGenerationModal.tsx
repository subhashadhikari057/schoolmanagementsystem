'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Copy,
  Download,
  Eye,
  EyeOff,
  Key,
  Shield,
  X,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface EncryptionKeyGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void>;
  generatedKey?: string;
  isGenerating: boolean;
}

export default function EncryptionKeyGenerationModal({
  isOpen,
  onClose,
  onGenerate,
  generatedKey,
  isGenerating,
}: EncryptionKeyGenerationModalProps) {
  const [showKey, setShowKey] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleCopyKey = async () => {
    if (!generatedKey) return;

    try {
      await navigator.clipboard.writeText(generatedKey);
      toast.success('Encryption key copied to clipboard');
    } catch (error) {
      console.error('Error copying key:', error);
      toast.error('Failed to copy key to clipboard');
    }
  };

  const handleDownloadKey = () => {
    if (!generatedKey) return;

    const keyData = {
      encryptionKey: generatedKey,
      generatedAt: new Date().toISOString(),
      schoolSystem: 'School Management System',
      warning:
        'CRITICAL: Store this key securely. Without it, encrypted backups cannot be restored.',
    };

    const blob = new Blob([JSON.stringify(keyData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-encryption-key-${new Date().toISOString().split('T')[0]}.json`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    setHasDownloaded(true);
    toast.success('Encryption key downloaded successfully');
  };

  const handleClose = () => {
    if (generatedKey && !hasDownloaded) {
      if (
        !confirm(
          'You have not downloaded your encryption key yet. Are you sure you want to close this modal?',
        )
      ) {
        return;
      }
    }
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-red-50 rounded-lg'>
              <Key className='h-5 w-5 text-red-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                Generate Encryption Key
              </h2>
              <p className='text-sm text-gray-600'>
                Create a secure key for backup encryption
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          {!generatedKey ? (
            <>
              {/* Warning Section */}
              <Card className='p-4 bg-red-50 border-red-200'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold text-red-900 mb-2'>
                      Critical Security Information
                    </h3>
                    <div className='space-y-2 text-sm text-red-800'>
                      <p>
                        <strong>
                          ⚠️ This encryption key is IRREPLACEABLE:
                        </strong>
                      </p>
                      <ul className='list-disc list-inside space-y-1 ml-4'>
                        <li>
                          Without this key, encrypted backups{' '}
                          <strong>cannot be restored</strong>
                        </li>
                        <li>We cannot recover or reset your encryption key</li>
                        <li>
                          Losing this key means losing access to all encrypted
                          backups
                        </li>
                        <li>
                          Store it in multiple secure locations (password
                          manager, secure vault, etc.)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Best Practices */}
              <Card className='p-4 bg-blue-50 border-blue-200'>
                <div className='flex items-start gap-3'>
                  <Shield className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold text-blue-900 mb-2'>
                      Security Best Practices
                    </h3>
                    <div className='space-y-2 text-sm text-blue-800'>
                      <p>
                        <strong>✅ Recommended storage methods:</strong>
                      </p>
                      <ul className='list-disc list-inside space-y-1 ml-4'>
                        <li>
                          Password manager (1Password, Bitwarden, LastPass)
                        </li>
                        <li>Encrypted USB drive stored in a safe</li>
                        <li>Physical printout in a secure location</li>
                        <li>Cloud storage with additional encryption</li>
                      </ul>
                      <p className='mt-3'>
                        <strong>❌ Never store in:</strong>
                      </p>
                      <ul className='list-disc list-inside space-y-1 ml-4'>
                        <li>Plain text files on your computer</li>
                        <li>Unencrypted email or messaging apps</li>
                        <li>Sticky notes or unsecured documents</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Acknowledgment */}
              <div className='flex items-start gap-3 p-4 bg-gray-50 rounded-lg'>
                <input
                  type='checkbox'
                  id='acknowledge'
                  checked={hasAcknowledged}
                  onChange={e => setHasAcknowledged(e.target.checked)}
                  className='h-4 w-4 text-red-600 rounded border-gray-300 mt-1'
                />
                <label
                  htmlFor='acknowledge'
                  className='text-sm text-gray-700 cursor-pointer'
                >
                  <strong>
                    I understand that this encryption key is critical for backup
                    recovery.
                  </strong>{' '}
                  I acknowledge that losing this key will make my encrypted
                  backups unrecoverable, and I will store it securely in
                  multiple locations.
                </label>
              </div>

              {/* Generate Button */}
              <div className='flex justify-end gap-3'>
                <ReusableButton
                  onClick={onClose}
                  variant='outline'
                  disabled={isGenerating}
                >
                  Cancel
                </ReusableButton>
                <ReusableButton
                  onClick={onGenerate}
                  disabled={!hasAcknowledged || isGenerating}
                  className='bg-red-600 hover:bg-red-700 text-white'
                >
                  {isGenerating ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className='h-4 w-4 mr-2' />
                      Generate Encryption Key
                    </>
                  )}
                </ReusableButton>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <Card className='p-4 bg-green-50 border-green-200'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-green-100 rounded-full'>
                    <Key className='h-4 w-4 text-green-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-green-900'>
                      Encryption Key Generated Successfully
                    </h3>
                    <p className='text-sm text-green-800'>
                      Your new encryption key is ready. Please save it
                      immediately.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Generated Key Display */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Your Encryption Key
                </label>
                <div className='relative'>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={generatedKey}
                    readOnly
                    className='w-full p-3 pr-20 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm'
                  />
                  <div className='absolute inset-y-0 right-0 flex items-center gap-1 pr-3'>
                    <button
                      type='button'
                      onClick={() => setShowKey(!showKey)}
                      className='p-1 hover:bg-gray-200 rounded transition-colors'
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? (
                        <EyeOff className='h-4 w-4 text-gray-500' />
                      ) : (
                        <Eye className='h-4 w-4 text-gray-500' />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3'>
                <ReusableButton
                  onClick={handleCopyKey}
                  variant='outline'
                  className='flex-1'
                >
                  <Copy className='h-4 w-4 mr-2' />
                  Copy to Clipboard
                </ReusableButton>
                <ReusableButton
                  onClick={handleDownloadKey}
                  variant='outline'
                  className='flex-1'
                >
                  <Download className='h-4 w-4 mr-2' />
                  Download Key File
                </ReusableButton>
              </div>

              {/* Final Warning */}
              <Card className='p-4 bg-yellow-50 border-yellow-200'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold text-yellow-900 mb-1'>
                      Final Reminder
                    </h3>
                    <p className='text-sm text-yellow-800'>
                      Make sure you have saved this key in a secure location
                      before closing this modal. This is your only opportunity
                      to access the key in plain text.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Close Button */}
              <div className='flex justify-end'>
                <ReusableButton
                  onClick={handleClose}
                  className={`${hasDownloaded ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
                >
                  {hasDownloaded
                    ? 'Key Saved - Close'
                    : 'Close (Key Not Downloaded)'}
                </ReusableButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
