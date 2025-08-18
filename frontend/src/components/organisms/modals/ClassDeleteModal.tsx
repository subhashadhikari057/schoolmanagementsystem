'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
interface ClassData {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  roomId: string;
  classTeacherId?: string;
  shift?: 'morning' | 'day';
  room?: {
    roomNo: string;
    name?: string;
    floor: number;
    building?: string;
  };
  classTeacher?: {
    id: string;
    fullName: string;
    email: string;
    employeeId?: string;
  };
  studentCount?: number;
  status: 'Active' | 'Inactive';
}

interface ClassDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  classData: ClassData | null;
  isLoading?: boolean;
}

const ClassDeleteModal: React.FC<ClassDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  classData,
  isLoading = false,
}) => {
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Generate the required confirmation phrase
  const requiredPhrase = classData
    ? `delete ${classData.name || `Grade ${classData.grade} Section ${classData.section}`}`
    : '';

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationPhrase('');
      setError(null);
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, onClose]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (confirmationPhrase !== requiredPhrase) {
      setError(
        'The confirmation phrase does not match. Please type it exactly as shown.',
      );
      return;
    }

    if (!isLoading) {
      onConfirm();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationPhrase(e.target.value);
    if (error) setError(null);
  };

  const isConfirmDisabled = confirmationPhrase !== requiredPhrase || isLoading;

  if (!isOpen || !classData) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      onClick={handleClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-3xl shadow-2xl animate-in fade-in duration-300'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-t-xl border-b border-gray-100'>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/50'
            }`}
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <div className='flex items-center gap-3'>
            <div className='p-2 bg-red-100 rounded-full'>
              <AlertTriangle className='w-6 h-6 text-red-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Delete Class</h2>
              <p className='text-sm text-gray-600 mt-1'>
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-4'>
          {/* Warning Message */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-start'>
              <AlertTriangle className='w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0' />
              <div>
                <h3 className='text-sm font-semibold text-yellow-800 mb-1'>
                  Sensitive Operation Warning
                </h3>
                <p className='text-sm text-yellow-700'>
                  This will unassign all students and make the room/teacher
                  available for other classes.
                </p>
              </div>
            </div>
          </div>

          {/* Class Summary - Compact */}
          <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
            <h3 className='text-md font-semibold text-gray-800 mb-3'>
              Class to be deleted:
            </h3>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-gray-600'>Name:</span>{' '}
                <span className='font-medium'>
                  {classData.name ||
                    `Grade ${classData.grade} Section ${classData.section}`}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Students:</span>{' '}
                <span className='font-medium'>
                  {classData.studentCount || 0}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Teacher:</span>{' '}
                <span className='font-medium'>
                  {classData.classTeacher?.fullName || 'Not assigned'}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Room:</span>{' '}
                <span className='font-medium'>
                  {classData.room?.roomNo || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              To confirm deletion, type the following phrase exactly:
            </label>
            <div className='bg-gray-100 rounded-md p-3 border border-gray-300 mb-3'>
              <code className='text-sm font-mono text-gray-800 select-all'>
                {requiredPhrase}
              </code>
            </div>
            <input
              type='text'
              value={confirmationPhrase}
              onChange={handleInputChange}
              placeholder='Type the confirmation phrase here...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
              disabled={isLoading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-md p-3'>
              <div className='flex items-center'>
                <AlertTriangle className='h-4 w-4 text-red-400 mr-2' />
                <p className='text-sm text-red-700'>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl'>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              isConfirmDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Deleting...
              </>
            ) : (
              'Delete Class'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDeleteModal;
