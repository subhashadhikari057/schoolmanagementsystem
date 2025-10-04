'use client';

import React from 'react';
import { X, Loader2, CheckCircle, XCircle, FolderPlus } from 'lucide-react';

interface FolderCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'creating' | 'success' | 'failed';
  error?: string;
  folderPath?: string;
  serverHost?: string;
}

const FolderCreationModal: React.FC<FolderCreationModalProps> = ({
  isOpen,
  onClose,
  status,
  error,
  folderPath,
  serverHost,
}) => {
  if (!isOpen) return null;

  const canClose = status !== 'creating';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden'>
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            status === 'creating'
              ? 'bg-blue-50 border-b border-blue-100'
              : status === 'success'
                ? 'bg-green-50 border-b border-green-100'
                : 'bg-red-50 border-b border-red-100'
          }`}
        >
          <div className='flex items-center gap-3'>
            {status === 'creating' && (
              <Loader2 className='h-5 w-5 text-blue-600 animate-spin' />
            )}
            {status === 'success' && (
              <CheckCircle className='h-5 w-5 text-green-600' />
            )}
            {status === 'failed' && (
              <XCircle className='h-5 w-5 text-red-600' />
            )}
            <h3
              className={`font-semibold ${
                status === 'creating'
                  ? 'text-blue-900'
                  : status === 'success'
                    ? 'text-green-900'
                    : 'text-red-900'
              }`}
            >
              {status === 'creating'
                ? 'Creating Folder...'
                : status === 'success'
                  ? 'Folder Created!'
                  : 'Creation Failed'}
            </h3>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='h-5 w-5' />
            </button>
          )}
        </div>

        {/* Content */}
        <div className='px-6 py-5'>
          {status === 'creating' && (
            <div className='space-y-4'>
              <p className='text-gray-600 text-sm'>
                Please wait while we create the backup folder on your server...
              </p>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                  <span>Connecting to {serverHost}...</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                  <span>Creating directory: {folderPath}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-400'>
                  <div className='w-2 h-2 bg-gray-300 rounded-full' />
                  <span>Setting permissions...</span>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className='space-y-4'>
              <div className='flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg'>
                <FolderPlus className='h-5 w-5 text-green-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-green-900'>
                    Backup folder created successfully!
                  </p>
                  <div className='mt-2 space-y-1 text-xs text-green-700'>
                    <p>
                      <strong>Server:</strong> {serverHost}
                    </p>
                    <p>
                      <strong>Path:</strong>{' '}
                      <code className='bg-green-100 px-1 rounded'>
                        {folderPath}
                      </code>
                    </p>
                    <p>
                      <strong>Permissions:</strong> Read/Write (755)
                    </p>
                  </div>
                </div>
              </div>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <p className='text-sm text-blue-900 font-medium mb-2'>
                  ✅ What's Next?
                </p>
                <ol className='text-xs text-blue-800 space-y-1 ml-4 list-decimal'>
                  <li>
                    Proceed to <strong>Step 3</strong> to choose backup storage
                    location
                  </li>
                  <li>
                    Select "Offsite Only" or "Both Local & Offsite"
                    (recommended)
                  </li>
                  <li>Click "Save Changes" to apply your settings</li>
                </ol>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className='space-y-4'>
              <div className='flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <XCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-red-900'>
                    Failed to create backup folder
                  </p>
                  {error && (
                    <p className='text-xs text-red-700 mt-1'>{error}</p>
                  )}
                </div>
              </div>

              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                <p className='text-sm text-yellow-900 font-medium mb-2'>
                  💡 Common Issues:
                </p>
                <ul className='text-xs text-yellow-800 space-y-1.5'>
                  <li className='flex items-start gap-2'>
                    <span className='text-yellow-600 flex-shrink-0'>•</span>
                    <span>
                      User doesn't have permission to create folders in this
                      location
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-yellow-600 flex-shrink-0'>•</span>
                    <span>
                      Parent directory doesn't exist (try /home/backups instead)
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-yellow-600 flex-shrink-0'>•</span>
                    <span>Path contains invalid characters</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-yellow-600 flex-shrink-0'>•</span>
                    <span>Disk is full or read-only</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {canClose && (
          <div className='px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end'>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                status === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {status === 'success' ? 'Continue' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderCreationModal;
