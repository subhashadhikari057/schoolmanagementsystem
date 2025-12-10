'use client';

import React from 'react';
import { X, Shield, Cloud, CheckCircle, AlertTriangle } from 'lucide-react';

interface SaveSettingsConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  encryptionEnabled: boolean;
  offsiteEnabled: boolean;
  backupLocation: 'local' | 'offsite' | 'both';
  remoteHost?: string;
  remotePath?: string;
}

const SaveSettingsConfirmationModal: React.FC<
  SaveSettingsConfirmationModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  encryptionEnabled,
  offsiteEnabled,
  backupLocation,
  remoteHost,
  remotePath,
}) => {
  if (!isOpen) return null;

  const getLocationDescription = () => {
    if (!offsiteEnabled) {
      return 'Local server only';
    }
    switch (backupLocation) {
      case 'local':
        return 'Local server only';
      case 'offsite':
        return `Remote server only (${remoteHost})`;
      case 'both':
        return `Both local and remote server (${remoteHost})`;
      default:
        return 'Local server only';
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden'>
        {/* Header */}
        <div className='px-6 py-4 bg-blue-50 border-b border-blue-100'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <CheckCircle className='h-5 w-5 text-blue-600' />
              <h3 className='font-semibold text-blue-900'>
                Confirm Backup Settings
              </h3>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='px-6 py-5 space-y-4'>
          <p className='text-sm text-gray-600'>
            Please review your backup configuration before saving:
          </p>

          {/* Settings Summary */}
          <div className='space-y-3'>
            {/* Encryption */}
            <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200'>
              <Shield
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${encryptionEnabled ? 'text-green-600' : 'text-gray-400'}`}
              />
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-900'>
                  Backup Encryption
                </p>
                <p
                  className={`text-xs mt-1 ${encryptionEnabled ? 'text-green-700' : 'text-gray-600'}`}
                >
                  {encryptionEnabled
                    ? '✓ Enabled - Backups will be encrypted'
                    : '✗ Disabled - Backups will NOT be encrypted'}
                </p>
              </div>
            </div>

            {/* Offsite Backup */}
            <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200'>
              <Cloud
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${offsiteEnabled ? 'text-green-600' : 'text-gray-400'}`}
              />
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-900'>
                  Offsite Backup
                </p>
                <p
                  className={`text-xs mt-1 ${offsiteEnabled ? 'text-green-700' : 'text-gray-600'}`}
                >
                  {offsiteEnabled ? '✓ Enabled' : '✗ Disabled'}
                </p>
                {offsiteEnabled && (
                  <div className='mt-2 space-y-1 text-xs text-gray-600'>
                    <p>
                      <strong>Server:</strong> {remoteHost}
                    </p>
                    <p>
                      <strong>Path:</strong>{' '}
                      <code className='bg-gray-100 px-1 rounded'>
                        {remotePath}
                      </code>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Backup Location */}
            <div className='flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
              <CheckCircle className='h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600' />
              <div className='flex-1'>
                <p className='text-sm font-medium text-blue-900'>
                  Backup Storage Location
                </p>
                <p className='text-xs mt-1 text-blue-700'>
                  {getLocationDescription()}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for no encryption */}
          {!encryptionEnabled && (
            <div className='flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <AlertTriangle className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='text-sm font-medium text-yellow-900'>
                  Security Notice
                </p>
                <p className='text-xs text-yellow-800 mt-1'>
                  Backups will NOT be encrypted. Consider enabling encryption
                  for sensitive data.
                </p>
              </div>
            </div>
          )}

          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <p className='text-xs text-gray-600'>
              <strong>Note:</strong> These settings will be applied to all
              future backups (database, files, and full system backups).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm'
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm'
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSettingsConfirmationModal;
