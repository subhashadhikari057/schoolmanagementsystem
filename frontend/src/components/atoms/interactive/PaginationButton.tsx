import { Button } from '@headlessui/react';
import React from 'react';

interface PaginationButtonProps {
  children: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function PaginationButton({
  children,
  isActive = false,
  isDisabled = false,
  onClick,
  className = '',
}: PaginationButtonProps) {
  const baseClasses =
    'relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md transition-colors duration-200 mx-1';

  const activeClasses = isActive
    ? 'z-10 bg-blue-600 border-blue-600 text-white'
    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50';

  const disabledClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <Button
      className={`${baseClasses} ${activeClasses} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      {children}
    </Button>
  );
}
