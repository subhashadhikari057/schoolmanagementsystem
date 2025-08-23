import { Button as HeadlessButton } from '@headlessui/react';

import { Button } from '@headlessui/react';

interface Props {
  onClick?: () => void;
  className?: string;
  label?: string;
  as?: 'button' | 'div';
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function ReusableButton({
  onClick,
  label,
  className,
  as = 'button',
  children,
  type,
  disabled,
}: Props) {
  if (as === 'div') {
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        role='button'
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            onClick?.();
          }
        }}
      >
        {children ? children : label}
      </div>
    );
  }

  return (
    <Button
      onClick={onClick}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      type={type}
      disabled={disabled}
    >
      {children ? children : label}
    </Button>
  );
}
