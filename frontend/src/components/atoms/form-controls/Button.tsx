import { Button as HeadlessButton } from '@headlessui/react';

import { Button } from '@headlessui/react';

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface Props {
  onClick?: () => void;
  className?: string;
  label?: string;
  as?: 'button' | 'div';
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export default function ReusableButton({
  onClick,
  label,
  className,
  as = 'button',
  children,
  type,
  disabled,
  size = 'md',
  variant = 'primary',
}: Props) {
  // Responsive sizing classes
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm',
    md: 'px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base',
    lg: 'px-4 py-2.5 text-base sm:px-6 sm:py-3 sm:text-lg',
    xl: 'px-5 py-3 text-lg sm:px-8 sm:py-4 sm:text-xl',
  };

  // Variant classes with responsive considerations
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline:
      'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
  };

  const baseClasses = `
    inline-flex items-center justify-center
    rounded-md font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95 transform
    min-w-0 max-w-full
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  if (as === 'div') {
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={`${baseClasses} ${disabled ? '' : 'cursor-pointer'} ${className || ''}`}
        role='button'
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            onClick?.();
          }
        }}
      >
        <span className='truncate'>{children ? children : label}</span>
      </div>
    );
  }

  return (
    <Button
      onClick={onClick}
      className={`${baseClasses} ${className || ''}`}
      type={type}
      disabled={disabled}
    >
      <span className='truncate'>{children ? children : label}</span>
    </Button>
  );
}
