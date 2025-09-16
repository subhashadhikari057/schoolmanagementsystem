import React from 'react';

export default function ToggleButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type='button'
      className={`transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:scale-105 active:scale-95 min-h-[44px] sm:min-h-[40px] touch-manipulation ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
