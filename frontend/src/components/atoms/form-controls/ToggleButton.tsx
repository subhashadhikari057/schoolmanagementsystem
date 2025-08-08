import { Button } from '@headlessui/react';
import React from 'react';

interface ToggleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function ToggleButton({
  children,
  className,
  onClick,
}: ToggleButtonProps) {
  return (
    <Button
      className={`text-sm text-gray-500 border px-2 py-1 rounded ${className}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
