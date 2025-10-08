import React from 'react';

export default function StatusBadge({
  status,
  className,
  size = 'md',
}: {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const statusStyles = {
    Active: { backgroundColor: '#EAF7F0', color: '#16A34A' },
    Inactive: { backgroundColor: '#FEEFEF', color: '#DC2626' },
    Scheduled: { backgroundColor: '#FEFAEE', color: '#D97706' },
    'On Leave': { backgroundColor: '#FEF3C7', color: '#B45309' },
  } as const;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs sm:px-2.5 sm:text-sm',
    lg: 'px-3 py-1 text-sm sm:px-4 sm:text-base',
  };

  const getStatusStyle = (status: string) => {
    const normalizedStatus = status as keyof typeof statusStyles;
    return (
      statusStyles[normalizedStatus] || {
        backgroundColor: '#F3F4F6',
        color: '#374151',
      }
    );
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${sizeClasses[size]} ${className || ''}`}
      style={getStatusStyle(status)}
    >
      {status}
    </span>
  );
}
