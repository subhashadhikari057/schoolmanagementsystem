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
import { GraduationCap, ArrowLeft, Mail, Phone } from 'lucide-react';

// API
import { apiClient } from '@/lib/api-client';
import { authCarouselBanners } from '@/constants/carouselData';

// Zod Schema for Request Password Reset
const RequestPasswordResetSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone is required')
    .refine(value => {
      // Check if it's a valid email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    }, 'Must be a valid email address or phone number'),
});

type RequestPasswordResetFormData = z.infer<typeof RequestPasswordResetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>(
    'info',
  );
  const [requiresAdminContact, setRequiresAdminContact] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetFormData>({
    resolver: zodResolver(RequestPasswordResetSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const onSubmit = async (data: RequestPasswordResetFormData) => {
    setIsLoading(true);
    setMessage('');
    setRequiresAdminContact(false);

    try {
      const response = await apiClient.post(
        '/auth/request-password-reset',
        data,
      );

      if (
        (response.data as { success: boolean; data: { message: string } })
          .success
      ) {
        setMessage(
          (response.data as { success: boolean; data: { message: string } })
            .data.message,
        );
        setMessageType('success');

        // If it's a successful OTP request, redirect to reset page after a delay
        setTimeout(() => {
          router.push('/auth/reset-password');
        }, 3000);
      }
    } catch (error: unknown) {
      console.error('Password reset request failed:', error);
      const apiError = error as {
        response?: { data?: { code?: string; message?: string } };
      };

      if (apiError.response?.data?.code === 'CONTACT_ADMIN_REQUIRED') {
        setMessage(
          apiError.response.data.message || 'Please contact your administrator',
        );
        setMessageType('info');
        setRequiresAdminContact(true);
      } else {
        setMessage(
          apiError.response?.data?.message ||
            'Failed to send reset instructions',
        );
        setMessageType('error');
      }
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
              icon={GraduationCap}
              bgColor='bg-blue-100'
              iconColor='text-blue-600'
              className='mx-auto mb-4'
              size='lg'
            />
            <SectionTitle
              text='Reset Password'
              className='text-2xl font-bold text-gray-900 mb-2'
            />
            <p className='text-gray-600'>
              Enter your email or phone number to receive reset instructions
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : messageType === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              <p className='text-sm'>{message}</p>

              {requiresAdminContact && (
                <div className='mt-3 text-sm'>
                  <p className='font-medium'>Contact Information:</p>
                  <p>📧 admin@school.com</p>
                  <p>📞 +1234567891</p>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Email/Phone Field */}
            <div>
              <Controller
                name='identifier'
                control={control}
                render={({ field }) => (
                  <LabeledInputField
                    label='Email or Phone Number'
                    type='text'
                    placeholder='Enter your email or phone number'
                    className='bg-white'
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.identifier && (
                <p className='text-red-600 text-sm mt-1'>
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <ReusableButton
              onClick={() => {}}
              label={
                isLoading || isSubmitting
                  ? 'Sending...'
                  : 'Send Reset Instructions'
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
            <div className='flex items-center justify-center space-x-4'>
              <div className='flex items-center'>
                <Mail className='h-4 w-4 mr-1' />
                <span>Email supported</span>
              </div>
              <div className='flex items-center'>
                <Phone className='h-4 w-4 mr-1' />
                <span>Phone supported</span>
              </div>
            </div>
            <p>
              <span className='font-medium'>Note:</span> Students and Parents
              must contact school admin for password reset
            </p>
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
