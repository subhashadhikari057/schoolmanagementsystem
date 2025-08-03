'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// UI Components
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import IconContainer from '@/components/molecules/interactive/IconContainer';
import BannerSlider from '@/components/organisms/content/BannerSlider';

// Icons
import { ArrowLeft, Key, Eye, EyeOff } from 'lucide-react';

// API
import { apiClient } from '@/lib/api-client';
import { authCarouselBanners } from '@/constants/carouselData';

// Zod Schema for Reset Password
const ResetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(1, 'Reset code is required')
      .length(6, 'Reset code must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token: data.token,
        newPassword: data.newPassword,
      });

      if (
        (response.data as { success: boolean; data: { message: string } })
          .success
      ) {
        setMessage(
          (response.data as { success: boolean; data: { message: string } })
            .data.message,
        );
        setMessageType('success');

        // Redirect to login after successful reset
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (error: unknown) {
      console.error('Password reset failed:', error);
      const apiError = error as { response?: { data?: { message?: string } } };
      setMessage(
        apiError.response?.data?.message || 'Failed to reset password',
      );
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex'>
      {/* Left side - Form */}
      <div className='flex-1 flex items-center justify-center p-8'>
        <div className='w-full max-w-md space-y-8'>
          {/* Header */}
          <div className='text-center'>
            <IconContainer
              icon={Key}
              bgColor='bg-blue-100'
              iconColor='text-blue-600'
              className='mx-auto mb-4'
              size='lg'
            />
            <SectionTitle
              text='Set New Password'
              className='text-2xl font-bold text-gray-900 mb-2'
            />
            <p className='text-gray-600'>
              Enter the 6-digit code sent to you and your new password
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p className='text-sm'>{message}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Reset Code Field */}
            <div>
              <Controller
                name='token'
                control={control}
                render={({ field }) => (
                  <LabeledInputField
                    label='Reset Code'
                    type='text'
                    placeholder='Enter 6-digit code'
                    className='bg-white text-center text-2xl tracking-widest'
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.token && (
                <p className='text-red-600 text-sm mt-1'>
                  {errors.token.message}
                </p>
              )}
            </div>

            {/* New Password Field */}
            <div>
              <div className='relative'>
                <Controller
                  name='newPassword'
                  control={control}
                  render={({ field }) => (
                    <LabeledInputField
                      label='New Password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter new password'
                      className='bg-white pr-10'
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 top-6 pr-3 flex items-center'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 text-gray-400' />
                  ) : (
                    <Eye className='h-4 w-4 text-gray-400' />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className='text-red-600 text-sm mt-1'>
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className='relative'>
                <Controller
                  name='confirmPassword'
                  control={control}
                  render={({ field }) => (
                    <LabeledInputField
                      label='Confirm Password'
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='Confirm new password'
                      className='bg-white pr-10'
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 top-6 pr-3 flex items-center'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-4 w-4 text-gray-400' />
                  ) : (
                    <Eye className='h-4 w-4 text-gray-400' />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='text-red-600 text-sm mt-1'>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <ReusableButton
              onClick={() => {}}
              label={
                isLoading || isSubmitting ? 'Resetting...' : 'Reset Password'
              }
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 ${
                isLoading || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />

            {/* Back to Login */}
            <div className='text-center'>
              <Link
                href='/auth/login'
                className='inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition duration-200'
              >
                <ArrowLeft className='h-4 w-4 mr-1' />
                Back to Login
              </Link>
            </div>
          </form>

          {/* Help Text */}
          <div className='text-center text-sm text-gray-500 space-y-2'>
            <p>
              <span className='font-medium'>Did not receive the code?</span>{' '}
              <Link
                href='/auth/forgot-password'
                className='text-blue-600 hover:text-blue-500'
              >
                Request again
              </Link>
            </p>
            <div className='text-xs space-y-1'>
              <p className='font-medium'>Password requirements:</p>
              <ul className='text-left max-w-xs mx-auto space-y-1'>
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
                <li>• Contains at least one special character</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Banner */}
      <div className='hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-blue-600 to-indigo-700'>
        <div className='w-full max-w-lg px-8'>
          <BannerSlider banners={authCarouselBanners} />
        </div>
      </div>
    </div>
  );
}
