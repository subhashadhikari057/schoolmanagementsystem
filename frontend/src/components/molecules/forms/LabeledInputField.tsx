// molecules/LabeledInputField.tsx
import { useState, ReactNode } from 'react';
import Label from '@/components/atoms/display/Label';
import Input from '@/components/atoms/form-controls/Input';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  icon?: ReactNode; // custom icon on right
  className?: string;
  autoComplete?: string; // HTML autocomplete attribute
}

export default function LabeledInputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  name,
  icon,
  className = '',
  autoComplete,
}: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className='relative w-full'>
      {label && (
        <Label className='absolute -top-2 left-3 bg-white px-1 text-sm text-gray-600 font-medium z-10'>
          {label}
        </Label>
      )}
      <Input
        name={name}
        type={isPassword ? (isPasswordVisible ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pr-10 pl-4 py-3 ${className}`}
        autoComplete={autoComplete}
      />

      {/* Right-side icon */}
      {isPassword ? (
        <button
          type='button'
          className='absolute right-3 top-9 text-gray-500'
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
    </div>
  );
}
