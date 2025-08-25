'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  ChangePasswordFormData,
} from '@/lib/validations/auth';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Button from '@/components/atoms/form-controls/Button';
import { useAuth } from '@/hooks/useAuth';

export function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit: SubmitHandler<ChangePasswordFormData> = async data => {
    try {
      await changePassword(data);
      reset();
      // TODO: Show success message
    } catch (error) {
      // TODO: Show error message
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <LabeledInputField
        {...register('current_password')}
        label='Current Password'
        type='password'
        placeholder='Enter your current password'
        error={errors.current_password?.message}
      />
      <LabeledInputField
        {...register('new_password')}
        label='New Password'
        type='password'
        placeholder='Enter your new password'
        error={errors.new_password?.message}
      />
      <LabeledInputField
        {...register('confirm_password')}
        label='Confirm New Password'
        type='password'
        placeholder='Confirm your new password'
        error={errors.confirm_password?.message}
      />
      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? 'Changing...' : 'Change Password'}
      </Button>
    </form>
  );
}
