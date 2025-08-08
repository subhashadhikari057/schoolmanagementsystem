import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({
  checked,
  onChange,
  className = '',
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border focus:outline-none ${
        checked ? 'bg-blue-500 border-blue-500' : 'bg-gray-200 border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
