// molecules/LabeledInputField.tsx
import { useState, ReactNode, forwardRef } from 'react';
import Label from '@/components/atoms/display/Label';
import Input from '@/components/atoms/form-controls/Input';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'date' | 'time';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  icon?: ReactNode; // custom icon on right
  className?: string;
  error?: string; // Add error prop for validation messages
  maxLength?: number; // Add maxLength prop
  readOnly?: boolean; // Add readOnly prop
  required?: boolean; // Add required prop
  size?: 'sm' | 'md' | 'lg';
}

const LabeledInputField = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      type = 'text',
      value,
      onChange,
      placeholder,
      name,
      icon,
      className = '',
      error,
      readOnly,
      size = 'md',
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === 'password';

    // Responsive sizing classes for the container
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base sm:text-lg',
      lg: 'text-lg sm:text-xl',
    };

    // Responsive padding classes for input
    const paddingClasses = {
      sm: 'px-3 py-2 sm:px-4 sm:py-3',
      md: 'px-4 py-3 sm:px-6 sm:py-4',
      lg: 'px-5 py-4 sm:px-8 sm:py-5',
    };

    return (
      <div className={`relative w-full group ${sizeClasses[size]}`}>
        {label && (
          <Label
            className={`absolute border-4 border-t border-l border-r border-b-0 ${error ? 'border-red-500 group-focus-within:border-red-500' : 'border-gray-300 group-focus-within:border-primary'} h-2.25 left-3 rounded-t-sm bg-white px-1 text-xs sm:text-sm -top-2 z-5 text-gray-600 font-medium transition-colors duration-200`}
          >
            {label}
          </Label>
        )}
        <div className='relative'>
          <Input
            ref={ref}
            name={name}
            type={isPassword ? (isPasswordVisible ? 'text' : 'password') : type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`pr-8 sm:pr-10 ${paddingClasses[size]} ${className} ${type === 'date' || type === 'time' ? '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden' : ''}`}
            {...props}
          />

          {/* Right-side icon */}
          {isPassword ? (
            <button
              type='button'
              className='absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-30 p-1 rounded-md hover:bg-gray-100 transition-colors'
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? (
                <EyeOff size={16} className='sm:w-[18px] sm:h-[18px]' />
              ) : (
                <Eye size={16} className='sm:w-[18px] sm:h-[18px]' />
              )}
            </button>
          ) : icon ? (
            <div className='absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-30 pointer-events-none'>
              {icon}
            </div>
          ) : null}
        </div>

        {/* Error message */}
        {error && (
          <p className='mt-1 text-xs sm:text-sm text-red-600 font-medium break-words'>
            {error}
          </p>
        )}
      </div>
    );
  },
);

LabeledInputField.displayName = 'LabeledInputField';

export default LabeledInputField;
