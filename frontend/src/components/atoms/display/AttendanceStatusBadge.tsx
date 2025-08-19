/**
 * =============================================================================
 * Attendance Status Badge Atom
 * =============================================================================
 * Displays attendance status with appropriate styling
 * =============================================================================
 */

import React from 'react';
import { cn } from '@/utils';

export interface AttendanceStatusBadgeProps {
  status: 'present' | 'absent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  present: {
    label: 'Present',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: '✓',
  },
  absent: {
    label: 'Absent',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: '✗',
  },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        sizeClasses[size],
        config.className,
        className,
      )}
    >
      <span className='mr-1'>{config.icon}</span>
      {config.label}
    </span>
  );
};
