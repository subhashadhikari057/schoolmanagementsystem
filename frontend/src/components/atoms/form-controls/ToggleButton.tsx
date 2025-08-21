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
      className={`text-sm text-gray-500 border px-2 py-1 rounded ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
