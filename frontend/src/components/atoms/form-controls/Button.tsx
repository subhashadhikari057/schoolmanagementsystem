import { Button as HeadlessButton } from '@headlessui/react';

import { Button } from '@headlessui/react';

interface Props {
  onClick?: () => void;
  className?: string;
  label?: string;
  as?: 'button' | 'div';
  children?: React.ReactNode;
}

export default function ReusableButton({
  onClick,
  label,
  className,
  as = 'button',
  children,
}: Props) {
  if (as === 'div') {
    return (
      <div
        onClick={onClick}
        className={`${className} cursor-pointer`}
        role='button'
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick?.();
          }
        }}
      >
        {children ? children : label}
      </div>
    );
  }

  return (
    <Button onClick={onClick} className={`${className}`}>
      {children ? children : label}
    </Button>
  );
}
