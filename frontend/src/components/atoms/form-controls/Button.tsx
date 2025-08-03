// molecules/LoginFormButton.tsx

import { Button } from '@headlessui/react';

interface Props {
  onClick?: () => void;
  className?: string;
  label?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function ReusableButton({
  onClick,
  label,
  className,
  type = 'button',
  disabled = false,
}: Props) {
  return (
    <Button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {label}
    </Button>
  );
}
