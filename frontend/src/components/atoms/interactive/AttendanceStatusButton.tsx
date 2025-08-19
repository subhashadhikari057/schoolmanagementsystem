/**
 * =============================================================================
 * Attendance Status Button Atom
 * =============================================================================
 * Interactive button for selecting attendance status
 * =============================================================================
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

export interface AttendanceStatusButtonProps {
  status: 'present' | 'absent';
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  present: {
    label: 'Present',
    icon: '✓',
    selectedClass: 'bg-green-600 text-white border-green-600',
    unselectedClass: 'border-green-300 text-green-700 hover:bg-green-50',
  },
  absent: {
    label: 'Absent',
    icon: '✗',
    selectedClass: 'bg-red-600 text-white border-red-600',
    unselectedClass: 'border-red-300 text-red-700 hover:bg-red-50',
  },
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs min-w-[80px]',
  md: 'px-4 py-2 text-sm min-w-[100px]',
  lg: 'px-6 py-3 text-base min-w-[120px]',
};

export const AttendanceStatusButton: React.FC<AttendanceStatusButtonProps> = ({
  status,
  isSelected,
  onClick,
  disabled = false,
  size = 'md',
  className,
}) => {
  const config = statusConfig[status];

  return (
    <Button
      variant='outline'
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        sizeClasses[size],
        'border-2 font-medium transition-all duration-200',
        isSelected ? config.selectedClass : config.unselectedClass,
        className,
      )}
    >
      <span className='mr-1'>{config.icon}</span>
      {config.label}
    </Button>
  );
};
