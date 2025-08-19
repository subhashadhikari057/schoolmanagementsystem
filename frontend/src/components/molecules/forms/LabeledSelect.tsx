import { useState, ReactNode, forwardRef } from 'react';
import Label from '@/components/atoms/display/Label';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  value?: string;
  onChange?: (name: string, value: string) => void;
  placeholder?: string;
  name?: string;
  options: Option[];
  className?: string;
  error?: string;
  disabled?: boolean;
}

const LabeledSelect = forwardRef<HTMLSelectElement, Props>(
  (
    {
      label,
      value,
      onChange,
      placeholder,
      name,
      options,
      className = '',
      error,
      disabled,
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange && name) {
        onChange(name, e.target.value);
      }
    };

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
          <select
            ref={ref}
            name={name}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className={`w-full pr-10 pl-6 py-4 text-base border rounded-lg bg-white ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors duration-200 ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
          >
            {placeholder && (
              <option value='' disabled>
                {placeholder}
              </option>
            )}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <div className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
            <ChevronDown size={18} />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className='mt-1 text-sm text-red-600 font-medium'>{error}</p>
        )}
      </div>
    );
  },
);

LabeledSelect.displayName = 'LabeledSelect';

export default LabeledSelect;
