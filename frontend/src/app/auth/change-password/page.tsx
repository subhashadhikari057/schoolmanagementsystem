'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { authService } from '@/api/services/auth.service';

import LabeledInputField from '@/components/molecules/forms/LabeledInputField';

import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { z } from 'zod';

// Validation schema for password change
const changePasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character',
      ),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<ChangePasswordForm>({
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<ChangePasswordForm>>({});
  const [userInfo, setUserInfo] = useState<{
    fullName: string;
    email: string;
  } | null>(null);
  const [tempToken, setTempToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get temp token and user info from sessionStorage (secure storage)
  useEffect(() => {
    // Check sessionStorage for temp data (more secure than URL params)
    const storedToken = sessionStorage.getItem('temp_password_change_token');
    const storedUserInfo = sessionStorage.getItem('temp_password_change_user');

    if (storedToken) {
      setTempToken(storedToken);
    }

    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (error) {
        console.error('Failed to parse stored user info:', error);
      }
    }

    // If no token found, redirect to login
    if (!storedToken) {
      toast.error('Invalid or expired password change session');
      router.push('/auth/login');
    }
  }, [router]);

  const validateForm = (): boolean => {
    try {
      changePasswordSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<ChangePasswordForm> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ChangePasswordForm] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleInputChange = (
    field: keyof ChangePasswordForm,
    value: string,
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!tempToken) {
      toast.error('Invalid session. Please login again.');
      router.push('/auth/login');
      return;
    }

    try {
      setIsLoading(true);

      // Call the backend directly without auto-login
      await authService.forceChangePassword({
        temp_token: tempToken,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      // Clear temp data from sessionStorage
      sessionStorage.removeItem('temp_password_change_token');
      sessionStorage.removeItem('temp_password_change_user');

      toast.success('Password changed successfully!');

      // Show redirecting state
      setIsRedirecting(true);

      // Redirect to login page after a short delay so user can see the success message
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500); // 1.5 second delay
    } catch (error) {
      console.error('Password change failed:', error);
      // Error is handled by auth service and displayed via toast
      const apiError = error as { message?: string };
      toast.error(
        apiError.message || 'Failed to change password. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!tempToken && !sessionStorage.getItem('temp_password_change_token')) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-600'>Invalid password change session</p>
          <p className='text-sm text-gray-500 mt-2'>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 min-h-screen h-screen w-full overflow-hidden'>
      {/* Left side - Illustration */}
      <div className='hidden lg:flex bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-8'>
        <div className='max-w-md text-center'>
          <div className='w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6'>
            <Lock className='w-16 h-16 text-white' />
          </div>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>
            Secure Your Account
          </h2>
          <p className='text-gray-600 leading-relaxed'>
            Create a strong password to protect your account. This is a one-time
            setup for your new account.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className='flex items-center justify-center p-8 bg-white'>
        <div className='w-full max-w-md'>
          {/* Custom Header */}
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Change Password
            </h1>
            <p className='text-lg text-gray-600 mb-1'>Set Your Password</p>
            <p className='text-sm text-gray-500'>
              Create a new password for your account
            </p>
          </div>

          <div className='space-y-6'>
            {/* User Info Display */}
            {userInfo && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                <div className='flex items-center gap-3'>
                  <User className='w-5 h-5 text-blue-600' />
                  <div>
                    <p className='font-medium text-gray-900'>
                      {userInfo.fullName}
                    </p>
                    <p className='text-sm text-gray-600'>{userInfo.email}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* New Password */}
              <div>
                <LabeledInputField
                  label='New Password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your new password'
                  value={formData.new_password}
                  onChange={e =>
                    handleInputChange('new_password', e.target.value)
                  }
                  error={errors.new_password}
                  icon={
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='text-gray-400 hover:text-gray-600'
                    >
                      {showPassword ? (
                        <EyeOff className='w-4 h-4' />
                      ) : (
                        <Eye className='w-4 h-4' />
                      )}
                    </button>
                  }
                />
                <div className='mt-2 text-xs text-gray-500'>
                  Password must contain:
                  <ul className='list-disc list-inside mt-1 space-y-1'>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter (A-Z)</li>
                    <li>One lowercase letter (a-z)</li>
                    <li>One number (0-9)</li>
                    <li>One special character (!@#$%^&*)</li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <LabeledInputField
                  label='Confirm Password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm your new password'
                  value={formData.confirm_password}
                  onChange={e =>
                    handleInputChange('confirm_password', e.target.value)
                  }
                  error={errors.confirm_password}
                  icon={
                    <button
                      type='button'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className='text-gray-400 hover:text-gray-600'
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='w-4 h-4' />
                      ) : (
                        <Eye className='w-4 h-4' />
                      )}
                    </button>
                  }
                />
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={isLoading || isRedirecting}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors ${
                  isLoading || isRedirecting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-700'
                }`}
              >
                {isLoading
                  ? 'Changing Password...'
                  : isRedirecting
                    ? 'Redirecting to Login...'
                    : 'Change Password'}
              </button>
            </form>

            {/* Security Note */}
            <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-800'>
                <strong>Security Note:</strong> This is a one-time password
                setup. After changing your password, you'll be redirected to the
                login page to sign in with your new credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
