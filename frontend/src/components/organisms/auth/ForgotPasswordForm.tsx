'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { otpService } from '@/api/services/otp.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Step = 'identifier' | 'delivery' | 'otp' | 'password';

interface FormData {
  identifier: string;
  deliveryMethod: 'email' | 'sms';
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const ForgotPasswordForm: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('identifier');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    identifier: '',
    deliveryMethod: 'email',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateIdentifier = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;

      if (
        !emailRegex.test(formData.identifier) &&
        !phoneRegex.test(formData.identifier)
      ) {
        newErrors.identifier = 'Please enter a valid email or phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    } else if (!/^\d+$/.test(formData.otp)) {
      newErrors.otp = 'OTP must contain only numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword =
        'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOtp = async () => {
    if (!validateIdentifier()) return;

    setIsLoading(true);
    try {
      const response = await otpService.requestOtp({
        identifier: formData.identifier,
        delivery_method: formData.deliveryMethod,
      });

      if (response.success) {
        toast.success(response.data?.message || 'OTP sent successfully');
        setCurrentStep('otp');
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send OTP';
      if (errorMessage.includes('Students and parents must contact')) {
        toast.error(
          'Students and parents must contact the administrator to reset their password.',
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(async () => {
    if (!validateOtp() || isLoading) return; // Prevent multiple submissions

    setIsLoading(true);
    try {
      const response = await otpService.verifyOtp({
        identifier: formData.identifier,
        otp: formData.otp,
      });

      if (response.success && response.data) {
        setResetToken(response.data.resetToken);
        toast.success(response.data.message || 'OTP verified successfully');
        setCurrentStep('password');
      } else {
        toast.error(response.message || 'Invalid OTP');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'OTP verification failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData.identifier, formData.otp, isLoading, validateOtp]);

  const handleResetPassword = async () => {
    if (!validatePassword() || isLoading) return; // Prevent multiple submissions

    setIsLoading(true);
    try {
      const response = await otpService.resetPassword({
        reset_token: resetToken,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });

      if (response.success) {
        toast.success(response.data?.message || 'Password reset successfully');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Password reset failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'identifier') {
      router.push('/auth/login');
    } else if (currentStep === 'delivery') {
      setCurrentStep('identifier');
    } else if (currentStep === 'otp') {
      setCurrentStep('delivery');
    } else if (currentStep === 'password') {
      setCurrentStep('otp');
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'identifier', label: 'Email/Phone' },
      { key: 'delivery', label: 'Delivery Method' },
      { key: 'otp', label: 'Verify OTP' },
      { key: 'password', label: 'New Password' },
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className='flex items-center justify-center mb-8'>
        {steps.map((step, index) => (
          <div key={step.key} className='flex items-center'>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStepIndex
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='bg-white rounded-lg shadow-xl p-8'>
        {/* Header */}
        <div className='text-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Reset Password
          </h1>
          <p className='text-gray-600'>
            {currentStep === 'identifier' && 'Enter your email or phone number'}
            {currentStep === 'delivery' && 'Choose how to receive your OTP'}
            {currentStep === 'otp' && 'Enter the OTP sent to you'}
            {currentStep === 'password' && 'Create your new password'}
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step 1: Enter Identifier */}
        {currentStep === 'identifier' && (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Email or Phone Number
              </label>
              <Input
                type='text'
                value={formData.identifier}
                onChange={e => handleInputChange('identifier', e.target.value)}
                placeholder='Enter your email or phone number'
                error={errors.identifier}
              />
            </div>

            <Button
              onClick={() => setCurrentStep('delivery')}
              disabled={!formData.identifier.trim() || isLoading}
              className='w-full'
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Choose Delivery Method */}
        {currentStep === 'delivery' && (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                How would you like to receive your OTP?
              </label>
              <div className='space-y-3'>
                <button
                  type='button'
                  onClick={() => handleInputChange('deliveryMethod', 'email')}
                  className={`w-full p-4 border rounded-lg flex items-center space-x-3 ${
                    formData.deliveryMethod === 'email'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Mail className='h-5 w-5' />
                  <div className='text-left'>
                    <div className='font-medium'>Email</div>
                    <div className='text-sm text-gray-600'>
                      Send OTP to your email address
                    </div>
                  </div>
                </button>

                <button
                  type='button'
                  onClick={() => handleInputChange('deliveryMethod', 'sms')}
                  className={`w-full p-4 border rounded-lg flex items-center space-x-3 ${
                    formData.deliveryMethod === 'sms'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Phone className='h-5 w-5' />
                  <div className='text-left'>
                    <div className='font-medium'>SMS</div>
                    <div className='text-sm text-gray-600'>
                      Send OTP to your phone number
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Button
              onClick={handleRequestOtp}
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </div>
        )}

        {/* Step 3: Enter OTP */}
        {currentStep === 'otp' && (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Enter OTP
              </label>
              <Input
                type='text'
                value={formData.otp}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  handleInputChange('otp', value);
                }}
                placeholder='Enter 6-digit OTP'
                error={errors.otp}
                maxLength={6}
              />
              <p className='text-sm text-gray-600 mt-1'>
                OTP sent to your{' '}
                {formData.deliveryMethod === 'email' ? 'email' : 'phone number'}
                . Check the console for development.
              </p>
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={!formData.otp.trim() || isLoading}
              className='w-full'
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <Button
              onClick={() => setCurrentStep('delivery')}
              variant='outline'
              className='w-full'
            >
              Resend OTP
            </Button>
          </div>
        )}

        {/* Step 4: Set New Password */}
        {currentStep === 'password' && (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                New Password
              </label>
              <div className='relative'>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={e =>
                    handleInputChange('newPassword', e.target.value)
                  }
                  placeholder='Enter your new password'
                  error={errors.newPassword}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Confirm Password
              </label>
              <div className='relative'>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  placeholder='Confirm your new password'
                  error={errors.confirmPassword}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            <div className='text-sm text-gray-600 bg-gray-50 p-3 rounded-lg'>
              <p className='font-medium mb-1'>Password Requirements:</p>
              <ul className='space-y-1 text-xs'>
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
              </ul>
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={
                !formData.newPassword.trim() ||
                !formData.confirmPassword.trim() ||
                isLoading
              }
              className='w-full'
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </div>
        )}

        {/* Back Button */}
        <div className='mt-6'>
          <button
            onClick={handleBack}
            disabled={isLoading}
            className='flex items-center space-x-2 text-gray-600 hover:text-gray-800 disabled:opacity-50'
          >
            <ArrowLeft className='h-4 w-4' />
            <span>Back</span>
          </button>
        </div>

        {/* Additional Info */}
        {currentStep === 'identifier' && (
          <div className='mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
            <p className='text-sm text-amber-800'>
              <strong>Note:</strong> Students and parents must contact the
              administrator to reset their password.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
