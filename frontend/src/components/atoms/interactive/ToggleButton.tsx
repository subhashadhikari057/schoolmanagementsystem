import React from 'react';

export default function ToggleButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type='button'
      className={`transition-all focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
