import React, { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/atoms/display/Avatar';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Icon from '@/components/atoms/display/Icon';
import { useParams } from 'next/navigation';
import { isDevMockEnabled } from '@/utils';

const getDevUser = () => ({
  id: 'devuser',
  full_name: 'John Wilson',
  role: 'Super Admin',
  email: 'john.wilson@school.edu',
  phone: '+1 (555) 123-4567',
  department: 'Administration',
  joined: '2015-08-15',
});

export const UserProfileHeader = () => {
  const params = useParams();
  const { user } = useAuth();
  const nameslug = params?.nameslug;
  const isDev = isDevMockEnabled() && nameslug === 'devuser';
  const profileUser = isDev ? getDevUser() : user;

  // Local state for preview image URL (string or null)
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Ref to hidden file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mocked permissions for demo
  const permissions = [
    'Full Access',
    'User Management',
    'Financial Management',
    '+2 more',
  ];

  const onEditClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: validate file type/size here

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      // Here you can add logic to upload the image to backend/storage
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className='flex items-center justify-between bg-white rounded-xl shadow p-6 mb-6'>
      <div className='flex items-center gap-6'>
        <div className='relative'>
          <Avatar
            name={profileUser?.full_name || 'User'}
            className='w-20 h-20 text-3xl rounded-full'
            src={imagePreview || undefined}
          />
          <div
            onClick={onEditClick}
            className='absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full p-1 cursor-pointer border-2 border-white hover:bg-blue-600'
            title='Change profile picture'
            role='button'
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onEditClick()}
          >
            <Icon className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-500'>
              <svg width='18' height='18' fill='none' viewBox='0 0 24 24'>
                <path
                  d='M12 20h9'
                  stroke='#fff'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z'
                  stroke='#fff'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </Icon>
          </div>
          <input
            type='file'
            accept='image/*'
            className='hidden'
            ref={fileInputRef}
            onChange={onFileChange}
          />
        </div>
        <div>
          <SectionTitle
            text={profileUser?.full_name || 'User Name'}
            className='mb-0'
            level={3}
          />
          <Label className='text-base font-medium mb-1'>
            {profileUser?.role
              ? profileUser.role
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())
              : 'Role'}
          </Label>
          <div className='flex flex-wrap items-center gap-2 text-gray-500 text-sm mt-1'>
            <Label>ID: {profileUser?.id || 'EMP001'}</Label>
            <span className='mx-1'>•</span>
            <Label>Administration</Label>
            <span className='mx-1'>•</span>
            <Label>Joined: 2015-08-15</Label>
          </div>
          <div className='flex flex-wrap gap-2 mt-2'>
            {permissions.map(perm => (
              <Label
                key={perm}
                className='border rounded-full px-3 py-1 text-xs bg-white text-gray-700 border-gray-300'
              >
                {perm}
              </Label>
            ))}
          </div>
        </div>
      </div>
      <div className='flex flex-col items-end gap-2'>
        <div className='flex items-center gap-2 text-gray-400 text-xs'>
          <Icon>
            <svg width='16' height='16' fill='none' viewBox='0 0 24 24'>
              <path
                d='M16 3.13V4a4 4 0 0 1-8 0v-.87'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <rect
                width='18'
                height='18'
                x='3'
                y='4'
                rx='2'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M8 11h8M8 15h6'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </Icon>
          <Label>Last login: 2025-01-28 09:30 AM</Label>
        </div>
        <ReusableButton
          label='Logout'
          className='border px-3 py-1 rounded text-gray-700 bg-white hover:bg-gray-100'
        />
      </div>
    </div>
  );
};
