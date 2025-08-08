'use client';

import React from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';

export default function SecuritySettings() {
  const baseButtonClass = 'p-1 px-2 rounded-lg shadow-sm cursor-pointer';

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
        <div className='hidden sm:block h-[1px] bg-border' />
        <div className='space-y-8 pt-4'>
          <LabeledInputField label='Current Password' type='password' />
          <LabeledInputField label='New Password' type='password' />
          <LabeledInputField label='Confirm New Password' type='password' />
        </div>
        <div className='mt-4 p-4 rounded-md bg-blue-50 text-sm text-blue-800 border border-blue-200'>
          <ul className='list-disc pl-4'>
            <li>At least 8 characters long</li>
            <li>Contains uppercase and lowercase letters</li>
            <li>Includes at least one number</li>
            <li>Includes one special character</li>
          </ul>
        </div>
        <div className='flex justify-end gap-4 mt-6'>
          <ReusableButton
            label='Cancel'
            className={`${baseButtonClass} border border-gray-300 hover:bg-gray-100`}
          />
          <ReusableButton
            label='Update Password'
            className={`${baseButtonClass} bg-blue-500 text-white hover:bg-blue-400`}
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
              className='form-checkbox h-5 w-5 text-blue-600'
            />
            <span className='text-sm text-gray-700'>
              Enable Two-Factor Authentication
            </span>
          </label>
        </div>
      </Card>
      {/* Login Activity */}
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-4'>
        <SectionTitle className='text-xl font-semibold' text='Login Activity' />
        <Label className='text-sm text-muted-foreground'>
          Recent logins from your account:
        </Label>
        <div className='mt-2 border rounded-md p-4 bg-white shadow-sm'>
          <ul className='text-sm text-gray-700 space-y-2'>
            <li>📍 Chrome on Windows – 2025-08-07 09:22 AM</li>
            <li>📍 Safari on iPhone – 2025-08-06 08:17 PM</li>
            <li>📍 Edge on Mac – 2025-08-06 11:03 AM</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
