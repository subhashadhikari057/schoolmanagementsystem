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
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
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
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      onClick={handleClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in duration-300'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-t-xl border-b border-gray-100'>
          <button
            onClick={handleClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/50'
            }`}
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <div className='flex items-center gap-3'>
            <AlertTriangle className='w-6 h-6 text-red-500' />
            <h2 className='text-xl font-bold text-gray-800'>{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          <p className='text-gray-600'>{message}</p>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl'>
          <Button
            onClick={handleClose}
            className={`px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className={`px-4 py-2 bg-red-600 text-white rounded-md flex items-center gap-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Deleting...
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
