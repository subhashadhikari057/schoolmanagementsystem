'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Key } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import { Card } from '@/components/ui/card';

interface RegenerateKeyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RegenerateKeyConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: RegenerateKeyConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const REQUIRED_TEXT = 'regenerate key';
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
            <div className='p-2 bg-yellow-100 rounded-lg'>
              <AlertTriangle className='w-6 h-6 text-yellow-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Regenerate Encryption Key?
              </h2>
              <p className='text-sm text-gray-600'>
                This action will create a new encryption key
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
            <Key className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div>
              <h3 className='text-sm font-semibold text-red-800 mb-2'>
                Important Information
              </h3>
              <ul className='text-sm text-red-700 space-y-2'>
                <li>
                  • <strong>A new encryption key will be generated</strong> for
                  future backups
                </li>
                <li>
                  •{' '}
                  <strong>
                    Your old encryption key will still be required
                  </strong>{' '}
                  to restore existing encrypted backups
                </li>
                <li>
                  • <strong>Keep both keys safe</strong> - you'll need the old
                  key for old backups and the new key for new backups
                </li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>
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
            Regenerate Key
          </ReusableButton>
        </div>
      </Card>
    </div>
  );
}
