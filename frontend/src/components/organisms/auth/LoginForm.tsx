'use client';
import { useForm, SubmitHandler } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlexibleFormData } from '@/lib/validations/auth';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import RememberAndForgotRow from '@/components/molecules/forms/RememberAndForgotRow';
import LoginFooterSupportLink from '@/components/molecules/forms/LoginFooterSupportLink';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import IconContainer from '@/components/molecules/interactive/IconContainer';
import { GraduationCap, LucideIcon, ChevronLeft } from 'lucide-react';
import Label from '@/components/atoms/display/Label';

interface FormProps {
  // Content props - UPDATED for clarity
  description?: string; // Previously 'label'
  title?: string; // Previously 'heading'
  subtitle?: string; // Previously 'subheading'
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  confirmPasswordPlaceholder?: string; // NEW
  emailLabel?: string; // NEW - separate email field label
  passwordLabel?: string; // NEW - separate password field label
  confirmPasswordLabel?: string; // NEW - separate confirm password field label
  otpLabel?: string; // NEW - OTP field label
  otpPlaceholder?: string; // NEW - OTP field placeholder

  // Back button props
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  backButtonClassName?: string;

  // Styling props for flexibility - UPDATED names
  titleClassName?: string; // Previously 'headingClassName'
  subtitleClassName?: string; // Previously 'subheadingClassName'
  descriptionClassName?: string; // Previously 'labelClassName'

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
  showPasswordField?: boolean;
  showEmailField?: boolean;
  showConfirmPasswordField?: boolean; // NEW
  showOtpField?: boolean; // NEW - show OTP field
  onSubmit?: (data: FlexibleFormData) => void;
}

export default function Form({
  description, // Previously 'label'
  title = 'SMS', // Previously 'heading'
  subtitle = 'Welcome,', // Previously 'subheading'
  showBackButton = false,
  backButtonText = 'Back to login',
  backButtonHref = '/auth/login',
  backButtonClassName = 'text-sm text-gray-600 hover:text-gray-800 flex items-center font-medium',
  titleClassName = 'text-[2.7rem] font-semibold leading-[1.3]', // Previously 'headingClassName'
  subtitleClassName = 'text-[2.5rem] font-normal leading-[34px] lining-nums proportional-numstext-[#313131]', // Previously 'subheadingClassName'
  descriptionClassName = 'mt-5 text-[21px] leading-[34px] lining-nums proportional-numstext', // Previously 'labelClassName'
  icon = GraduationCap,
  iconBgColor = 'bg-green-50',
  iconColor = 'text-foreground',
  iconSize = 'xl',
  buttonLabel = 'Login',
  buttonClassName = 'rounded-md w-full h-10 mt-4 bg-[#515DEF] text-background cursor-pointer hover:bg-[#4141D9] transition-colors duration-200 ease-in-out hover:scale-101', // UPDATED for better UX
  showRememberMe = true,
  showSupportLink = true,
  showEmailField = true,
  showPasswordField = true,
  showConfirmPasswordField = false, // NEW
  showOtpField = false, // NEW
  emailPlaceholder = 'Enter your email',
  passwordPlaceholder = 'Enter your password',
  confirmPasswordPlaceholder = 'Re-enter your password', // NEW
  emailLabel = 'Email', // NEW - default email field label
  passwordLabel = 'Password', // NEW - default password field label
  confirmPasswordLabel = 'Confirm Password', // NEW
  otpLabel = 'Verification Code', // NEW
  otpPlaceholder = 'Enter 6-digit code', // NEW
  onSubmit,
}: FormProps) {
  const router = useRouter();

  // Use simple form without schema validation - we'll handle validation manually
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<FlexibleFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      rememberMe: false,
      otp: '',
    },
  });

  const rememberMe = watch('rememberMe');

  // Custom validation function
  const validateForm = (data: FlexibleFormData) => {
    let isValid = true;

    // Clear previous errors
    clearErrors();

    // Email validation
    if (showEmailField && (!data.email || data.email.trim() === '')) {
      setError('email', { message: 'Email is required' });
      isValid = false;
    } else if (
      showEmailField &&
      data.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    ) {
      setError('email', { message: 'Please enter a valid email address' });
      isValid = false;
    }

    // Password validation
    if (showPasswordField && (!data.password || data.password.trim() === '')) {
      setError('password', { message: 'Password is required' });
      isValid = false;
    } else if (showPasswordField && data.password && data.password.length < 6) {
      setError('password', {
        message: 'Password must be at least 6 characters long',
      });
      isValid = false;
    }

    // Strong password validation for set password form
    if (showConfirmPasswordField && data.password) {
      if (data.password.length < 8) {
        setError('password', {
          message: 'Password must be at least 8 characters long',
        });
        isValid = false;
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
        setError('password', {
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        });
        isValid = false;
      }
    }

    // Confirm password validation
    if (
      showConfirmPasswordField &&
      (!data.confirmPassword || data.confirmPassword.trim() === '')
    ) {
      setError('confirmPassword', { message: 'Please confirm your password' });
      isValid = false;
    } else if (
      showConfirmPasswordField &&
      data.password !== data.confirmPassword
    ) {
      setError('confirmPassword', { message: "Passwords don't match" });
      isValid = false;
    }

    // OTP validation
    if (showOtpField && (!data.otp || data.otp.trim() === '')) {
      setError('otp', { message: 'OTP is required' });
      isValid = false;
    } else if (
      showOtpField &&
      data.otp &&
      (data.otp.length !== 6 || !/^\d+$/.test(data.otp))
    ) {
      setError('otp', { message: 'OTP must be exactly 6 digits' });
      isValid = false;
    }

    return isValid;
  };

  const handleFormSubmit: SubmitHandler<FlexibleFormData> = async data => {
    try {
      // Perform custom validation
      if (!validateForm(data)) {
        return;
      }

      // Call custom onSubmit if provided
      if (onSubmit) {
        onSubmit(data);
      } else {
        // Default behavior - redirect to admin dashboard
        router.push('/dashboard/admin');
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className='w-full max-w-md'>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className='space-y-5'
        noValidate
      >
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
              className={`  ${titleClassName}`}
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

        {/* Form Fields */}
        {showEmailField && (
          <LabeledInputField
            {...register('email')}
            label={emailLabel}
            type='text'
            placeholder={emailPlaceholder}
            className='bg-white'
            error={errors.email?.message}
          />
        )}

        {showPasswordField && (
          <LabeledInputField
            {...register('password')}
            label={passwordLabel}
            type='password'
            placeholder={passwordPlaceholder}
            className='bg-white'
            error={errors.password?.message}
          />
        )}

        {showConfirmPasswordField && (
          <LabeledInputField
            {...register('confirmPassword')}
            label={confirmPasswordLabel}
            type='password'
            placeholder={confirmPasswordPlaceholder}
            className='bg-white'
            error={errors.confirmPassword?.message}
          />
        )}

        {showOtpField && (
          <LabeledInputField
            {...register('otp')}
            label={otpLabel}
            type='text'
            placeholder={otpPlaceholder}
            className='bg-white text-center tracking-widest'
            error={errors.otp?.message}
            maxLength={6}
          />
        )}

        {/* Conditional Remember Me Row */}
        {showRememberMe && (
          <RememberAndForgotRow
            remember={rememberMe || false}
            onRememberChange={checked => setValue('rememberMe', checked)}
          />
        )}

        {/* Submit Button */}
        <button
          type='submit'
          disabled={isSubmitting}
          className={`${buttonClassName} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Please wait...' : buttonLabel}
        </button>

        {/* Conditional Support Link */}
        {showSupportLink && <LoginFooterSupportLink />}
      </form>
    </div>
  );
}
