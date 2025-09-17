import { Button } from '@headlessui/react';
import React from 'react';

interface ToggleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function ToggleButton({
  children,
  className,
  onClick,
  disabled,
}: ToggleButtonProps) {
  return (
    <Button
      className={`text-xs sm:text-sm text-gray-500 border px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 min-h-[40px] sm:min-h-[36px] ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
