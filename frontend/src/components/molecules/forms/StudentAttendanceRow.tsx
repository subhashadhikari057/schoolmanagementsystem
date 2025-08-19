'use client';

/**
 * =============================================================================
 * Student Attendance Row Molecule
 * =============================================================================
 * Individual student row for attendance marking
 * =============================================================================
 */

import React from 'react';
import { cn } from '@/utils';
import { AttendanceStatusButton } from '@/components/atoms/interactive/AttendanceStatusButton';
import { AttendanceStatusBadge } from '@/components/atoms/display/AttendanceStatusBadge';
import { Button } from '@/components/ui/button';
import { Student, AttendanceRecord } from '@/types/attendance';

export interface StudentAttendanceRowProps {
  student: Student;
  currentStatus: 'present' | 'absent';
  isLocked: boolean;
  hasRemark?: boolean;
  remark?: string;
  onStatusChange: (status: 'present' | 'absent') => void;
  onEdit?: () => void;
  className?: string;
}

export const StudentAttendanceRow: React.FC<StudentAttendanceRowProps> = ({
  student,
  currentStatus,
  isLocked,
  hasRemark = false,
  remark,
  onStatusChange,
  onEdit,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors',
        className,
      )}
    >
      {/* Student Info */}
      <div className='flex-1'>
        <div className='flex items-center space-x-3'>
          <div>
            <p className='font-medium text-base'>{student.name}</p>
            <p className='text-sm text-gray-600'>Roll: {student.rollNumber}</p>
          </div>
          {hasRemark && (
            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200'>
              📝 Has Remark
            </span>
          )}
        </div>
        {remark && (
          <div className='mt-2 p-2 bg-gray-100 rounded text-sm'>
            <span className='font-medium text-gray-600'>Remark: </span>
            <span className='italic'>"{remark}"</span>
          </div>
        )}
      </div>

      {/* Attendance Controls */}
      <div className='flex items-center space-x-3'>
        {!isLocked ? (
          <div className='flex space-x-2'>
            <AttendanceStatusButton
              status='present'
              isSelected={currentStatus === 'present'}
              onClick={() => onStatusChange('present')}
              size='sm'
            />
            <AttendanceStatusButton
              status='absent'
              isSelected={currentStatus === 'absent'}
              onClick={() => onStatusChange('absent')}
              size='sm'
            />
          </div>
        ) : (
          <div className='flex items-center space-x-3'>
            <AttendanceStatusBadge status={currentStatus} size='md' />
            {onEdit && (
              <Button
                variant='outline'
                size='sm'
                onClick={onEdit}
                className='hover:bg-blue-50 hover:border-blue-300'
              >
                ✏️ Edit
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
