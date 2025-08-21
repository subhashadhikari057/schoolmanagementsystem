'use client';

import React, { useState, useEffect } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import {
  profileApi,
  ChangePasswordDto,
  AccountActivity,
} from '@/api/services/profile';
import Icon from '@/components/atoms/display/Icon';

const getActivityIcon = (action: string, status: string) => {
  const isSuccess = status === 'SUCCESS';

  if (action.includes('LOGIN')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M16.7 6.7l-6.4 6.6-3-3'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </Icon>
    );
  }

  return (
    <Icon
      className={`p-2 mr-3 ${isSuccess ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}
    >
      <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
        <path
          d='M10 2a8 8 0 100 16 8 8 0 000-16z'
          stroke='currentColor'
          strokeWidth='1.5'
        />
        <path
          d='M10 6v4l2 2'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    </Icon>
  );
};

const formatActivityTitle = (action: string) => {
  return action
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const formatActivityDescription = (activity: AccountActivity) => {
  const date = new Date(activity.createdAt).toLocaleDateString();
  const time = new Date(activity.createdAt).toLocaleTimeString();
  const device = activity.userAgent ? 'Web Browser' : 'Unknown Device';
  const ip = activity.ipAddress || 'Unknown IP';

  return `${date} at ${time} - ${device} (${ip})`;
};

// Password validation functions
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

export default function SecuritySettings() {
  const [formData, setFormData] = useState<ChangePasswordDto>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState(
    validatePassword(''),
  );

  // Account Activity State
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 5;

  const baseButtonClass = 'p-1 px-2 rounded-lg shadow-sm cursor-pointer';

  useEffect(() => {
    loadActivities();
  }, []);

  // Update password validation when newPassword changes
  useEffect(() => {
    setPasswordValidation(validatePassword(formData.newPassword));
  }, [formData.newPassword]);

  const loadActivities = async () => {
    try {
      setLoadingActivities(true);
      const data = await profileApi.getAccountActivity();
      // Filter only login-related activities
      const loginActivities = data.filter(
        activity =>
          activity.action.includes('LOGIN') ||
          activity.action.includes('AUTH') ||
          activity.module === 'AUTH',
      );
      setActivities(loginActivities);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (err) {
      setActivityError('Failed to load account activity');
      console.error('Error loading activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(activities.length / activitiesPerPage);
  const startIndex = (currentPage - 1) * activitiesPerPage;
  const endIndex = startIndex + activitiesPerPage;
  const currentActivities = activities.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet all requirements');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await profileApi.changePassword(formData);
      setSuccess('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
      setPasswordValidation(validatePassword(''));
    } catch (err) {
      setError(
        'Failed to change password. Please check your current password.',
      );
      console.error('Error changing password:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ currentPassword: '', newPassword: '' });
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setPasswordValidation(validatePassword(''));
  };

  const renderValidationItem = (isValid: boolean, text: string) => (
    <li
      className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-gray-400'}`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          isValid ? 'bg-green-100' : 'bg-gray-100'
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

  return (
    <div className='w-full max-w-full mx-auto space-y-8'>
      {/* Change Password */}
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-6'>
        <div>
          <SectionTitle
            className='text-2xl font-semibold'
            text='Change Password'
          />
          <Label className='text-sm text-muted-foreground mb-4 block'>
            Update your password to keep your account secure.
          </Label>
        </div>

        {error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
            <Label className='text-red-600'>{error}</Label>
          </div>
        )}

        {success && (
          <div className='p-4 bg-green-50 border border-green-200 rounded-md'>
            <Label className='text-green-600'>{success}</Label>
          </div>
        )}

        <div className='hidden sm:block h-[1px] bg-border' />
        <div className='space-y-6 pt-4'>
          <LabeledInputField
            label='Current Password'
            type='password'
            value={formData.currentPassword}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
          />
          <LabeledInputField
            label='New Password'
            type='password'
            value={formData.newPassword}
            onChange={e =>
              setFormData(prev => ({ ...prev, newPassword: e.target.value }))
            }
          />
          <LabeledInputField
            label='Confirm New Password'
            type='password'
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Live Password Validation */}
        <div
          className={`mt-4 p-4 rounded-md border ${
            passwordValidation.isValid
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <Label
            className={`text-sm font-medium mb-3 block ${
              passwordValidation.isValid ? 'text-green-800' : 'text-blue-800'
            }`}
          >
            {passwordValidation.isValid
              ? '✅ Password meets all requirements'
              : 'Password Requirements:'}
          </Label>
          <ul className='list-none space-y-2 text-sm'>
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

        <div className='flex justify-end gap-4 mt-6'>
          <ReusableButton
            label='Cancel'
            onClick={handleCancel}
            className={`${baseButtonClass} border border-gray-300 hover:bg-gray-100`}
          />
          <ReusableButton
            label={loading ? 'Updating...' : 'Update Password'}
            onClick={handleChangePassword}
            className={`${baseButtonClass} ${
              passwordValidation.isValid &&
              formData.newPassword === confirmPassword
                ? 'bg-blue-500 text-white hover:bg-blue-400'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } ${loading ? 'opacity-50' : ''}`}
          />
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-4'>
        <SectionTitle
          className='text-xl font-semibold'
          text='Two-Factor Authentication'
        />
        <Label className='text-sm text-muted-foreground'>
          Add extra security to your account using 2FA.
        </Label>
        <div className='mt-2'>
          <label className='inline-flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={twoFactorEnabled}
              onChange={e => setTwoFactorEnabled(e.target.checked)}
              className='form-checkbox h-5 w-5 text-blue-600'
            />
            <span className='text-sm text-gray-700'>
              Enable Two-Factor Authentication
            </span>
          </label>
        </div>
        {twoFactorEnabled && (
          <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
            <Label className='text-yellow-800 text-sm'>
              Two-factor authentication setup will be available soon.
            </Label>
          </div>
        )}
      </Card>

      {/* Login Activity */}
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <SectionTitle
              className='text-xl font-semibold'
              text='Login Activity'
            />
            <Label className='text-sm text-muted-foreground'>
              Recent login attempts and authentication activities:
            </Label>
          </div>
          <ReusableButton
            label='Refresh'
            onClick={loadActivities}
            className={`${baseButtonClass} bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50`}
          />
        </div>

        {activityError && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
            <Label className='text-red-600'>{activityError}</Label>
          </div>
        )}

        {loadingActivities ? (
          <div className='space-y-3'>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className='flex items-center p-4 rounded-xl bg-gray-50 border border-gray-100'
              >
                <div className='animate-pulse'>
                  <div className='w-12 h-12 bg-gray-200 rounded mr-3'></div>
                </div>
                <div className='flex-1'>
                  <div className='h-4 bg-gray-200 rounded w-1/3 mb-2'></div>
                  <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className='text-center py-8'>
            <Label className='text-gray-500'>No login activity found</Label>
          </div>
        ) : (
          <>
            <div className='space-y-3'>
              {currentActivities.map(activity => (
                <div
                  key={activity.id}
                  className='flex items-center p-4 rounded-xl bg-gray-50 border border-gray-100'
                >
                  {getActivityIcon(activity.action, activity.status)}
                  <div>
                    <div className='font-medium text-gray-800'>
                      {formatActivityTitle(activity.action)}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      {formatActivityDescription(activity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 pt-4 border-t border-gray-200'>
                <div className='text-sm text-gray-600 mb-2'>
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, activities.length)} of {activities.length}{' '}
                  activities
                </div>
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full'>
                  <ReusableButton
                    label='Previous'
                    onClick={() =>
                      currentPage > 1 && handlePageChange(currentPage - 1)
                    }
                    className={`${baseButtonClass} px-3 py-1 text-xs sm:text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  />

                  <div className='flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent py-1'>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm rounded-md ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                          style={{ minWidth: 32 }}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <ReusableButton
                    label='Next'
                    onClick={() =>
                      currentPage < totalPages &&
                      handlePageChange(currentPage + 1)
                    }
                    className={`${baseButtonClass} px-3 py-1 text-xs sm:text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
