'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName: string;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div
        className='bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in duration-300'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative bg-red-50 p-6 rounded-t-xl border-b border-gray-100'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <div className='flex items-center gap-3'>
            <div className='p-2 bg-red-100 rounded-full'>
              <AlertTriangle className='h-6 w-6 text-red-600' />
            </div>
            <h2 className='text-xl font-bold text-gray-900'>{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          <p className='text-gray-700 mb-2'>{message}</p>
          <p className='text-gray-700 font-semibold'>"{itemName}"</p>

          <div className='mt-6 text-sm text-gray-500'>
            <p>This action cannot be undone.</p>
          </div>
        </div>

        {/* Footer */}
        <div className='bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50'
          >
            {isLoading ? (
              <>
                <svg
                  className='animate-spin h-4 w-4 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
