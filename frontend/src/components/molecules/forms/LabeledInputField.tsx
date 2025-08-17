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
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className='relative w-full group'>
        {label && (
          <Label
            className={`absolute border-4 border-t border-l border-r border-b-0 ${error ? 'border-red-500 group-focus-within:border-red-500' : 'border-gray-300 group-focus-within:border-primary'} h-2.25 left-3 rounded-t-sm bg-white px-1 text-sm -top-2 z-5 text-gray-600 font-medium transition-colors duration-200`}
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
            className={`pr-10 pl-6 py-4 text-base ${error ? 'border-red-500 focus:border-red-500' : ''} ${className} ${type === 'date' || type === 'time' ? '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden' : ''}`}
            {...props}
          />

          {/* Right-side icon */}
          {isPassword ? (
            <button
              type='button'
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-30'
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : icon ? (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-30 pointer-events-none'>
              {icon}
            </div>
          ) : null}
        </div>

        {/* Error message */}
        {error && (
          <p className='mt-1 text-sm text-red-600 font-medium'>{error}</p>
        )}
      </div>
    );
  },
);

LabeledInputField.displayName = 'LabeledInputField';

export default LabeledInputField;
