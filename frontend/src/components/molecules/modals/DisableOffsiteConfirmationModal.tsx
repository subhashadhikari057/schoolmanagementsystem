'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DisableOffsiteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DisableOffsiteConfirmationModal: React.FC<
  DisableOffsiteConfirmationModalProps
> = ({ isOpen, onClose, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmValid = confirmText === 'disable offsite';

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
      onClose();
      setConfirmText('');
    }
  };

  const handleClose = () => {
    onClose();
    setConfirmText('');
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden'>
        {/* Header */}
        <div className='px-6 py-4 bg-red-50 border-b border-red-100'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <AlertTriangle className='h-5 w-5 text-red-600' />
              <h3 className='font-semibold text-red-900'>
                Disable Offsite Backup
              </h3>
            </div>
            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='px-6 py-5 space-y-4'>
          <div className='flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-red-900'>
                This will disable offsite backup functionality
              </p>
              <p className='text-xs text-red-700 mt-1'>
                Future backups will only be saved locally on this server.
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <p className='text-sm font-medium text-gray-900'>
              What will happen:
            </p>
            <ul className='text-sm text-gray-600 space-y-2'>
              <li className='flex items-start gap-2'>
                <span className='text-red-500 flex-shrink-0'>•</span>
                <span>
                  Backups will no longer be copied to the remote server
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-red-500 flex-shrink-0'>•</span>
                <span>
                  All backups will be stored only on this local server
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-red-500 flex-shrink-0'>•</span>
                <span>
                  Existing offsite backups will remain on the remote server
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-orange-500 flex-shrink-0'>•</span>
                <span>
                  You lose redundancy and disaster recovery protection
                </span>
              </li>
            </ul>
          </div>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <p className='text-sm font-medium text-yellow-900 mb-2'>
              ⚠️ Important
            </p>
            <p className='text-xs text-yellow-800'>
              Without offsite backups, if this server fails or data is lost, you
              won't have an external copy to restore from.
            </p>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Type{' '}
              <code className='bg-gray-100 px-2 py-0.5 rounded text-sm'>
                disable offsite
              </code>{' '}
              to confirm:
            </label>
            <input
              type='text'
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
              placeholder='Type here...'
              autoComplete='off'
            />
          </div>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3'>
          <button
            onClick={handleClose}
            className='px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm'
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmValid}
            className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
              isConfirmValid
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Disable Offsite Backup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisableOffsiteConfirmationModal;
