'use client';

/**
 * =============================================================================
 * Attendance Edit Modal Molecule
 * =============================================================================
 * Modal for editing individual attendance records with remarks
 * =============================================================================
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AttendanceStatusButton } from '@/components/atoms/interactive/AttendanceStatusButton';
import { Student } from '@/types/attendance';

export interface AttendanceEditModalProps {
  isOpen: boolean;
  student: Student | null;
  currentStatus: 'present' | 'absent';
  currentRemark?: string;
  onSave: (status: 'present' | 'absent', remark: string) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export const AttendanceEditModal: React.FC<AttendanceEditModalProps> = ({
  isOpen,
  student,
  currentStatus,
  currentRemark = '',
  onSave,
  onClose,
  loading = false,
}) => {
  const [status, setStatus] = useState<'present' | 'absent'>(currentStatus);
  const [remark, setRemark] = useState(currentRemark);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!remark.trim()) {
      setError('Remark is required when updating attendance');
      return;
    }
    setError('');
    onSave(status, remark.trim());
    onClose();
  };

  const handleClose = () => {
    setStatus(currentStatus);
    setRemark(currentRemark);
    setError('');
    onClose();
  };

  if (!isOpen || !student) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-2'>
            Edit Attendance - {student.name}
          </h3>
          <p className='text-sm text-gray-600'>Roll: {student.rollNumber}</p>
        </div>

        <div className='space-y-6'>
          {/* Status Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Attendance Status
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <AttendanceStatusButton
                status='present'
                isSelected={status === 'present'}
                onClick={() => setStatus('present')}
                size='md'
              />
              <AttendanceStatusButton
                status='absent'
                isSelected={status === 'absent'}
                onClick={() => setStatus('absent')}
                size='md'
              />
            </div>
          </div>

          {/* Remark Input */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Remark <span className='text-red-500'>*</span>
            </label>
            <textarea
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder='Enter reason for attendance change (required)...'
              className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-none'
              maxLength={200}
            />
            <div className='flex justify-between items-center mt-1'>
              <p className='text-xs text-gray-500'>
                {remark.length}/200 characters
              </p>
              {error && <p className='text-xs text-red-500'>{error}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3'>
            <Button
              onClick={handleSave}
              disabled={!remark.trim() || loading}
              className='flex-1'
              size='lg'
            >
              {loading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Saving...
                </>
              ) : (
                '💾 Save Changes'
              )}
            </Button>
            <Button
              variant='outline'
              onClick={handleClose}
              className='flex-1'
              size='lg'
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
