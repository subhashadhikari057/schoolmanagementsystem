import { Button as HeadlessButton } from '@headlessui/react';
import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
  ...props
}: Props) {
  if (as === 'div') {
    return (
      <div
        onClick={onClick}
        className={`${className} cursor-pointer`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick?.();
          }
        }}
      >
        {children ?? label}
      </div>
    );
  }

  return (
    <HeadlessButton {...props} onClick={onClick} className={`${className}`}>
      {children ?? label}
    </HeadlessButton>
  );
}
