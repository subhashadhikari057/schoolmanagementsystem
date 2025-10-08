// atoms/Input.tsx (updated)
import { forwardRef } from 'react';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'error' | 'success';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  size?: InputSize;
  variant?: InputVariant;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = 'md', variant = 'default', ...rest }, ref) => {
    // Responsive sizing classes
    const sizeClasses: Record<InputSize, string> = {
      sm: 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm',
      md: 'px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base',
      lg: 'px-4 py-2.5 text-base sm:px-5 sm:py-3 sm:text-lg',
    };

    // Variant classes
    const variantClasses: Record<InputVariant, string> = {
      default: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
      error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
      success: 'border-green-300 focus:ring-green-500 focus:border-green-500',
    };

    const baseClasses = `
      w-full border rounded-md transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-opacity-50
      placeholder:text-gray-500 
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
      ${sizeClasses[size as InputSize]}
      ${variantClasses[variant as InputVariant]}
    `;

    return (
      <input
        ref={ref}
        className={`${baseClasses} ${className || ''}`}
        {...rest}
      />
    );
  },
);

Input.displayName = 'Input';

export default Input;
