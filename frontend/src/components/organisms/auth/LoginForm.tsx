'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

// UI Components
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import RememberAndForgotRow from '@/components/molecules/forms/RememberAndForgotRow';
import ReusableButton from '@/components/atoms/form-controls/Button';
import LoginFooterSupportLink from '@/components/molecules/forms/LoginFooterSupportLink';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import IconContainer from '@/components/molecules/interactive/IconContainer';
import Label from '@/components/atoms/display/Label';

// Icons
import { GraduationCap, LucideIcon, ChevronLeft } from 'lucide-react';

// Auth Store and Hooks
import { useAuthStore } from '@/stores/auth.store';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';

// Zod Schema for Login Validation
const LoginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone is required')
    .refine(value => {
      // Check if it's a valid email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    }, 'Must be a valid email address or phone number'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
});

type LoginFormData = {
  identifier: string;
  password: string;
  rememberMe: boolean;
};

interface LoginFormProps {
  // Content props
  description?: string;
  title?: string;
  subtitle?: string;
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  emailLabel?: string;
  passwordLabel?: string;

  // Back button props
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  backButtonClassName?: string;

  // Styling props
  titleClassName?: string;
  subtitleClassName?: string;
  descriptionClassName?: string;

  // Icon customization
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;

  // Form behavior props
  buttonLabel?: string;
  buttonClassName?: string;
  showRememberMe?: boolean;
  showSupportLink?: boolean;
}

export default function LoginForm({
  description,
  title = 'SMS',
  subtitle = 'Welcome,',
  showBackButton = false,
  backButtonText = 'Back to login',
  backButtonHref = '/auth/login',
  backButtonClassName = 'text-sm text-gray-600 hover:text-gray-800 flex items-center font-medium',
  titleClassName = 'text-[2.7rem] font-semibold leading-[1.3]',
  subtitleClassName = 'text-[2.5rem] font-normal leading-[34px] lining-nums proportional-numstext-[#313131]',
  descriptionClassName = 'mt-5 text-[21px] leading-[34px] lining-nums proportional-numstext',
  icon = GraduationCap,
  iconBgColor = 'bg-green-50',
  iconColor = 'text-foreground',
  iconSize = 'xl',
  buttonLabel = 'Login',
  buttonClassName = 'rounded-md w-full h-10 mt-4 bg-[#515DEF] text-background cursor-pointer hover:bg-[#4141D9] transition-colors duration-200 ease-in-out hover:scale-101',
  showRememberMe = true,
  showSupportLink = true,
  emailPlaceholder = 'Enter your email or phone',
  passwordPlaceholder = 'Enter your password',
  emailLabel = 'Email or Phone',
  passwordLabel = 'Password',
}: LoginFormProps) {
  const { login, isLoading, error } = useAuthStore();

  // React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
  });

  // Professional auth redirect hook - handles post-login redirects properly
  const { isRedirecting } = useAuthRedirect({
    redirectOnAuth: true,
    immediate: true, // Use immediate redirect for post-login
  });

  const onSubmit = async (data: {
    identifier: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    // Immediate client-side validation for better UX
    if (!data.identifier?.trim()) {
      setError('identifier', {
        type: 'manual',
        message: 'Email address is required',
      });
      return;
    }

    if (!data.password?.trim()) {
      setError('password', {
        type: 'manual',
        message: 'Password is required',
      });
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.identifier)) {
      setError('identifier', {
        type: 'manual',
        message: 'Please enter a valid email address',
      });
      return;
    }

    try {
      console.log('Form submitted with data:', {
        identifier: data.identifier,
        hasPassword: !!data.password,
      });

      // Use centralized auth store login - map identifier to email for compatibility
      await login({
        email: data.identifier, // Backend expects 'identifier' but auth store expects 'email'
        password: data.password,
        rememberMe: data.rememberMe || false,
      });

      console.log('Login successful');
      // Login successful - auth store handles role-based redirect
    } catch (error: unknown) {
      console.error('Login failed:', error);

      // Set user-friendly error messages
      let errorMessage =
        'Login failed. Please check your credentials and try again.';

      if (error instanceof Error) {
        // Handle specific error messages with user-friendly alternatives
        if (error.message.includes('Invalid credentials')) {
          errorMessage =
            'Invalid email or password. Please check your credentials and try again.';
        } else if (
          error.message.includes('Account disabled') ||
          error.message.includes('Account locked')
        ) {
          errorMessage =
            'Your account has been disabled. Please contact support for assistance.';
        } else if (error.message.includes('Validation failed')) {
          errorMessage = 'Please enter a valid email address and password.';
        } else if (error.message.includes('Must be a valid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password is required')) {
          errorMessage = 'Password is required.';
        } else if (error.message.includes('Email or phone is required')) {
          errorMessage = 'Email address is required.';
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as {
          response?: { data?: { message?: string } };
          message?: string;
          error?: string;
        };

        // Check various possible error structures and make them user-friendly
        let rawMessage = '';
        if (apiError.response?.data?.message) {
          rawMessage = apiError.response.data.message;
        } else if (apiError.message) {
          rawMessage = apiError.message;
        } else if (apiError.error) {
          rawMessage = apiError.error;
        }

        // Convert technical messages to user-friendly ones
        if (rawMessage.includes('Invalid credentials')) {
          errorMessage =
            'Invalid email or password. Please check your credentials and try again.';
        } else if (rawMessage.includes('Validation failed')) {
          errorMessage = 'Please enter a valid email address and password.';
        } else if (rawMessage.includes('Must be a valid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (
          rawMessage.includes('Account disabled') ||
          rawMessage.includes('Account locked')
        ) {
          errorMessage =
            'Your account has been disabled. Please contact support for assistance.';
        } else if (rawMessage) {
          errorMessage = rawMessage;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setError('root', {
        type: 'manual',
        message: errorMessage,
      });
    }
  };

  // Show redirecting state if user is being redirected after successful login
  if (isRedirecting) {
    return (
      <div className='w-full max-w-md'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center space-y-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
            <p className='text-sm text-gray-600'>
              Login successful! Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md'>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        {/* Header with Icon and Title */}
        <div className='space-y-10'>
          <div className='flex items-center justify-start space-x-2'>
            <IconContainer
              icon={icon}
              bgColor={iconBgColor}
              iconColor={iconColor}
              size={iconSize}
            />
            <SectionTitle
              level={1}
              text={title}
              className={`${titleClassName}`}
            />
          </div>

          {/* Back Button - conditionally rendered below title */}
          {showBackButton && (
            <div className='my-8 flex justify-start'>
              <Link
                href={backButtonHref}
                className={backButtonClassName}
                style={{
                  fontSize: '14px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: 'normal',
                }}
              >
                <ChevronLeft className='w-4 h-4' />
                <span>{backButtonText}</span>
              </Link>
            </div>
          )}

          {/* Subtitle and Description */}
          <div>
            <SectionTitle
              level={1}
              text={subtitle}
              className={subtitleClassName}
            />
            {description && (
              <Label className={descriptionClassName}>{description}</Label>
            )}
          </div>
        </div>

        {/* Email/Phone Field */}
        <div>
          <Controller
            name='identifier'
            control={control}
            render={({ field }) => (
              <LabeledInputField
                label={emailLabel}
                type='text'
                placeholder={emailPlaceholder}
                className='bg-white'
                value={field.value}
                onChange={field.onChange}
                name={field.name}
                autoComplete='username'
              />
            )}
          />
          {errors.identifier && (
            <p className='text-red-600 text-sm mt-1'>
              {errors.identifier.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <Controller
            name='password'
            control={control}
            render={({ field }) => (
              <LabeledInputField
                label={passwordLabel}
                type='password'
                placeholder={passwordPlaceholder}
                className='bg-white'
                value={field.value}
                onChange={field.onChange}
                name={field.name}
                autoComplete='current-password'
              />
            )}
          />
          {errors.password && (
            <p className='text-red-600 text-sm mt-1'>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Row */}
        {showRememberMe && (
          <Controller
            name='rememberMe'
            control={control}
            render={({ field }) => (
              <RememberAndForgotRow
                remember={field.value}
                onRememberChange={field.onChange}
              />
            )}
          />
        )}

        {/* Error Display */}
        {(error || errors.root) && (
          <div className='text-red-600 text-sm text-center p-2 bg-red-50 rounded-md'>
            {error || errors.root?.message}
          </div>
        )}

        {/* Submit Button */}
        <ReusableButton
          type='submit'
          onClick={() => {}} // onClick is required but form submission is handled by onSubmit
          label={isLoading || isSubmitting ? 'Signing in...' : buttonLabel}
          className={`${buttonClassName} ${isLoading || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading || isSubmitting}
        />

        {/* Support Link */}
        {showSupportLink && <LoginFooterSupportLink />}
      </form>
    </div>
  );
}
