import React from 'react';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';

interface LabeledNepaliDatePickerProps {
  label: string;
  name: string;
  value: string; // BS date string: YYYY-MM-DD
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
}

// Nepali date picker with calendar popup
const LabeledNepaliDatePicker: React.FC<LabeledNepaliDatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  icon,
  disabled,
  error,
}) => {
  return (
    <NepaliDatePicker
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      error={error}
      className='w-full'
    />
  );
};

export default LabeledNepaliDatePicker;
