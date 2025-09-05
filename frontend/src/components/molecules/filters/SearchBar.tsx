'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
  iconSize?: number;
  disabled?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  className = '',
  inputClassName = '',
  iconSize = 18,
  disabled = false,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className={`relative ${className}`}>
      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
        <Search size={iconSize} className='text-gray-400' />
      </div>

      <input
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        className={`block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${inputClassName}`}
      />

      {value && !disabled && (
        <button
          type='button'
          onClick={handleClear}
          className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none'
          aria-label='Clear search'
        >
          <X size={iconSize} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
