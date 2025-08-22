'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  ChangePasswordFormData,
} from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';

// Password validation function
const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  return {
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    isValid:
      hasMinLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar,
  };
};

// Validation item renderer
const renderValidationItem = (isValid: boolean, text: string) => (
  <li className='flex items-center gap-2 text-sm'>
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
        isValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}
    >
      {isValid ? (
        <svg width='12' height='12' fill='none' viewBox='0 0 12 12'>
          <path
            d='M2 6L5 9L10 3'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ) : (
        <svg width='12' height='12' fill='none' viewBox='0 0 12 12'>
          <path
            d='M3 3L9 9M9 3L3 9'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
          />
        </svg>
      )}
    </span>
    {text}
  </li>
);

// Local Button component
const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'solid' | 'outline';
    leftIcon?: React.ReactNode;
    loading?: boolean;
  }
> = ({
  variant = 'solid',
  className = '',
  leftIcon,
  loading,
  children,
  ...rest
}) => {
  const base =
    'px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const solid = 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
  const outline =
    'border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 focus:ring-gray-400';
  const style = variant === 'solid' ? solid : outline;

  return (
    <button
      {...rest}
      className={`${base} ${style} ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={loading || rest.disabled}
    >
      <span className='inline-flex items-center gap-2'>
        {leftIcon ? <span className='inline-flex'>{leftIcon}</span> : null}
        {loading ? 'Please wait…' : children}
      </span>
    </button>
  );
};

// Local Input (label + input)
const LabeledInput: React.FC<
  {
    label: string;
    name: string;
    type?: string;
    error?: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    isPassword?: boolean;
  } & React.InputHTMLAttributes<HTMLInputElement>
> = ({
  label,
  name,
  type = 'text',
  error,
  icon: Icon,
  isPassword,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputType = isPassword
    ? isPasswordVisible
      ? 'text'
      : 'password'
    : type;

  return (
    <div>
      <label className='text-sm font-medium leading-none mb-2 block'>
        {label} {props.required && <span className='text-red-500'>*</span>}
      </label>
      <div className='relative'>
        {Icon && (
          <Icon
            size={16}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
          />
        )}
        <input
          name={name}
          type={inputType}
          {...props}
          className={`border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md w-full focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'} py-2 px-3 ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''}`}
          autoComplete='off'
        />
        {isPassword && (
          <button
            type='button'
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
          >
            {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}
    </div>
  );
};

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const { changePassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState(
    validatePassword(''),
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch('new_password');

  // Update password validation when newPassword changes
  useEffect(() => {
    setPasswordValidation(validatePassword(newPassword || ''));
  }, [newPassword]);

  const onSubmit: SubmitHandler<ChangePasswordFormData> = async data => {
    setError(null);
    try {
      await changePassword(data);
      toast.success('Password changed successfully!');
      reset();
      setPasswordValidation(validatePassword(''));
      onClose();
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const apiMsg =
        errorObj?.response?.data?.message ||
        errorObj.message ||
        'An unexpected error occurred.';
      setError(apiMsg);
      toast.error('Failed to change password', {
        description: apiMsg,
      });
    }
  };

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isSubmitting, onClose]);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isSubmitting) onClose();
    },
    [isSubmitting, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      onMouseDown={onBackdropClick}
    >
      <div
        className='bg-white rounded-2xl w-full max-w-md sm:max-w-md my-8 shadow-2xl animate-in slide-in-from-bottom-4'
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 sm:p-6 border-b border-gray-100'>
          <div className='relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
            <div className='flex items-center space-x-3 w-full'>
              <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg'>
                <Key size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-lg sm:text-xl font-bold text-gray-900'>
                  Change Password
                </h2>
                <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                  Update your password for better security.
                </p>
              </div>
            </div>
            <button
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50 self-end sm:self-auto'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 sm:space-y-6'
          >
            <LabeledInput
              label='Current Password'
              type='password'
              isPassword
              {...register('current_password')}
              placeholder='Enter your current password'
              error={errors.current_password?.message}
              required
              icon={Key}
            />
            <LabeledInput
              label='New Password'
              type='password'
              isPassword
              {...register('new_password')}
              placeholder='Enter your new password'
              error={errors.new_password?.message}
              required
              icon={Key}
            />
            <LabeledInput
              label='Confirm New Password'
              type='password'
              isPassword
              {...register('confirm_password')}
              placeholder='Confirm your new password'
              error={errors.confirm_password?.message}
              required
              icon={Key}
            />

            {/* Live Password Validation */}
            <div
              className={`mt-4 p-3 sm:p-4 rounded-md border ${
                passwordValidation.isValid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <p
                className={`text-xs sm:text-sm font-medium mb-2 sm:mb-3 ${
                  passwordValidation.isValid
                    ? 'text-green-800'
                    : 'text-blue-800'
                }`}
              >
                {passwordValidation.isValid
                  ? '✅ Password meets all requirements'
                  : 'Password Requirements:'}
              </p>
              <ul className='list-none space-y-1 sm:space-y-2 text-xs sm:text-sm'>
                {renderValidationItem(
                  passwordValidation.hasMinLength,
                  'At least 8 characters long',
                )}
                {renderValidationItem(
                  passwordValidation.hasUpperCase,
                  'Contains uppercase letters',
                )}
                {renderValidationItem(
                  passwordValidation.hasLowerCase,
                  'Contains lowercase letters',
                )}
                {renderValidationItem(
                  passwordValidation.hasNumber,
                  'Includes at least one number',
                )}
                {renderValidationItem(
                  passwordValidation.hasSpecialChar,
                  'Includes one special character',
                )}
              </ul>
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm rounded-lg p-2 sm:p-3 text-center'>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200'>
              <Btn
                type='button'
                variant='outline'
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
              >
                Cancel
              </Btn>
              <Btn
                type='submit'
                loading={isSubmitting}
                disabled={!passwordValidation.isValid}
                className={
                  !passwordValidation.isValid
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }
              >
                Update Password
              </Btn>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
