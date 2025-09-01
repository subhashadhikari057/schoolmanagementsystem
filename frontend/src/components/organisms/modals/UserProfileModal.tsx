import React, { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/atoms/display/Avatar';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Icon from '@/components/atoms/display/Icon';
import { useParams } from 'next/navigation';
import { profileApi, UserProfile } from '@/api/services/profile';
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
  const { user, logout } = useAuth();
  const nameslug = params?.nameslug;
  const isDev = isDevMockEnabled() && nameslug === 'devuser';
  const profileUser = isDev ? getDevUser() : user;

  // Local profile data fetched from profile API to access employeeId etc.
  const [fullProfile, setFullProfile] = useState<UserProfile | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const p = await profileApi.getProfile();
        if (mounted) setFullProfile(p);
      } catch (err) {
        // ignore — keep UI working with minimal info from auth
        // console.debug('Profile fetch failed for header', err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

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

  const handleLogout = () => {
    logout();
  };

  // Prefer explicit employeeId when available in fullProfile (teacherData or staffData)
  // Fallback to existing trimmed id behavior using profileUser.id
  const employeeIdFromProfile =
    fullProfile?.teacherData?.employeeId ||
    fullProfile?.staffData?.employeeId ||
    null;
  const displayId = employeeIdFromProfile
    ? employeeIdFromProfile
    : profileUser?.id
      ? profileUser.id.replace(/\D/g, '').slice(0, 3)
      : null;

  // Prefer backend profile values for display where available
  const displayName =
    fullProfile?.fullName ||
    (profileUser as any)?.full_name ||
    (profileUser as any)?.fullName ||
    'User Name';
  const displayRole = fullProfile?.role || (profileUser as any)?.role || 'Role';
  const displayDepartment =
    fullProfile?.teacherData?.department ||
    fullProfile?.staffData?.department ||
    (profileUser as any)?.department ||
    'Administration';
  // Normalize/format joined date to show only date (no time)
  const rawJoined =
    fullProfile?.teacherData?.joiningDate ||
    fullProfile?.createdAt ||
    (profileUser as any)?.joined ||
    null;

  const formatDateOnly = (v?: string | null) => {
    if (!v) return 'no joining date found';
    const s = String(v);
    // ISO datetime: keep date before 'T'
    if (s.includes('T')) return s.split('T')[0];
    // Datetime with space: keep date before first space
    if (s.includes(' ')) return s.split(' ')[0];
    // If already YYYY-MM-DD or longer ISO-like, take first 10 chars
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s.slice(0, 10)))
      return s.slice(0, 10);
    // Fallback: try to parse and format as ISO date
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch (e) {
      // ignore
    }
    return s;
  };

  const displayJoined = rawJoined
    ? formatDateOnly(rawJoined)
    : 'no joining date found';

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
          <SectionTitle text={displayName} className='mb-0' level={3} />
          <Label className='text-base font-medium mb-1'>
            {displayRole
              ? displayRole
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())
              : 'Role'}
          </Label>
          <div className='flex flex-wrap items-center gap-2 text-gray-500 text-sm mt-1'>
            <Label>ID: {displayId || 'EMP001'}</Label>
            <span className='mx-1'>•</span>
            <Label>{displayDepartment}</Label>
            <span className='mx-1'>•</span>
            <Label>Joined: {displayJoined}</Label>
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
          onClick={handleLogout}
          className='border px-3 py-1 rounded text-gray-700 bg-white hover:bg-gray-100'
        />
      </div>
    </div>
  );
};
