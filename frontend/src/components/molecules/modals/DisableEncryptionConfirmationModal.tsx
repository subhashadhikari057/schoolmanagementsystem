'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldOff } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import { Card } from '@/components/ui/card';

interface DisableEncryptionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DisableEncryptionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: DisableEncryptionConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const REQUIRED_TEXT = 'disable encryption';
  const isValid = confirmText.toLowerCase() === REQUIRED_TEXT;

  const handleConfirm = () => {
    if (isValid) {
      setConfirmText('');
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <Card className='w-full max-w-lg p-6 m-4 bg-white rounded-lg shadow-xl'>
        {/* Header */}
        <div className='flex items-start justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-red-100 rounded-lg'>
              <ShieldOff className='w-6 h-6 text-red-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Disable Backup Encryption?
              </h2>
              <p className='text-sm text-gray-600'>
                Future backups will not be encrypted
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Warning Banner */}
        <div className='mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div>
              <h3 className='text-sm font-semibold text-red-800 mb-2'>
                Security Warning
              </h3>
              <ul className='text-sm text-red-700 space-y-2'>
                <li>
                  •{' '}
                  <strong>
                    All future backups will be stored WITHOUT encryption
                  </strong>
                </li>
                <li>
                  •{' '}
                  <strong>
                    Existing encrypted backups will remain encrypted
                  </strong>{' '}
                  (you still need the key to restore them)
                </li>
                <li>
                  •{' '}
                  <strong>
                    Sensitive data in new backups will be unprotected
                  </strong>
                </li>
                <li>
                  • <strong>This may violate security policies</strong> for
                  sensitive data
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className='mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded'>
          <p className='text-sm text-yellow-800'>
            <strong>Note:</strong> Your encryption key will be kept in settings.
            You can re-enable encryption at any time without generating a new
            key.
          </p>
        </div>

        {/* Confirmation Input */}
        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            To confirm, type{' '}
            <span className='font-mono font-bold text-red-600'>
              {REQUIRED_TEXT}
            </span>{' '}
            below:
          </label>
          <Input
            type='text'
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={REQUIRED_TEXT}
            className='w-full'
            autoComplete='off'
          />
          {confirmText && !isValid && (
            <p className='text-sm text-red-600 mt-1'>
              Text doesn't match. Please type "{REQUIRED_TEXT}" exactly.
            </p>
          )}
          {isValid && (
            <p className='text-sm text-green-600 mt-1'>✓ Confirmed</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 justify-end'>
          <ReusableButton
            onClick={handleClose}
            className='px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors'
          >
            Cancel
          </ReusableButton>
          <ReusableButton
            onClick={handleConfirm}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isValid
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Disable Encryption
          </ReusableButton>
        </div>
      </Card>
    </div>
  );
}
