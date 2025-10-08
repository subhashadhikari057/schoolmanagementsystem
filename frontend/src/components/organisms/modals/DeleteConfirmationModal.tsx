'use client';

import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      onClick={handleClose}
    >
      <div
        className='bg-white rounded-lg sm:rounded-xl w-full max-w-xs sm:max-w-md shadow-2xl animate-in fade-in duration-300 mx-2 sm:mx-0'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-red-50 to-orange-50 p-4 sm:p-6 rounded-t-lg sm:rounded-t-xl border-b border-gray-100 relative'>
          <button
            onClick={handleClose}
            className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/50'
            }`}
            disabled={isLoading}
          >
            <X className='h-4 w-4 sm:h-5 sm:w-5 text-gray-500' />
          </button>

          <div className='flex items-center gap-2 sm:gap-3 pr-8 sm:pr-12'>
            <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0' />
            <h2 className='text-lg sm:text-xl font-bold text-gray-800 leading-tight'>
              {title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>
            {message}
            {itemName && (
              <span className='font-semibold text-gray-900'> {itemName}</span>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className='flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t bg-gray-50 rounded-b-lg sm:rounded-b-xl'>
          <Button
            onClick={handleClose}
            disabled={isLoading}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm sm:text-base font-medium ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50 active:bg-gray-100'
            } transition-colors`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-md flex items-center justify-center gap-2 text-sm sm:text-base font-medium ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-red-700 active:bg-red-800'
            } transition-colors`}
          >
            {isLoading ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Deleting...</span>
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
