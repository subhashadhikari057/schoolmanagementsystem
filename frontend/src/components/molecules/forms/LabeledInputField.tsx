// molecules/LabeledInputField.tsx
import { useState, ReactNode, forwardRef } from 'react';
import Label from '@/components/atoms/display/Label';
import Input from '@/components/atoms/form-controls/Input';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  icon?: ReactNode; // custom icon on right
  className?: string;
  error?: string; // Add error prop for validation messages
  maxLength?: number; // Add maxLength prop
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
            className={`absolute border-4 border-t border-l border-r border-b-0 ${error ? 'border-red-500 group-focus-within:border-red-500' : 'border-gray-300 group-focus-within:border-primary'} -top-2 h-2.25 left-3 rounded-t-sm bg-white px-1 text-sm text-gray-600 font-medium z-10 transition-colors duration-200`}
          >
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          name={name}
          type={isPassword ? (isPasswordVisible ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`pr-10 pl-6 py-4 text-base ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        />

        {/* Right-side icon */}
        {isPassword ? (
          <button
            type='button'
            className='absolute right-3 top-4.5 text-gray-500'
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <div className='cursor-pointer'>
              {' '}
              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </button>
        ) : icon ? (
          <div className='absolute right-3 inset-y-0 flex items-center'>
            {icon}
          </div>
        ) : null}

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
