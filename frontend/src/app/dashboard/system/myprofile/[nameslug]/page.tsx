'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import ProfileSettings from '@/components/organisms/tabs/ProfileSettings';
import SecuritySettings from '@/components/organisms/tabs/SecuritySettingPage';
import { UserProfileHeader } from '@/components/organisms/modals/UserProfileModal';
import NotificationPreferences from '@/components/organisms/tabs/NotificationPreferences';
import AccountActivity from '@/components/organisms/tabs/AccountActivity';
import { useAuth } from '@/hooks/useAuth';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { PageLoader } from '@/components/atoms/loading';

const MyAccountPage = () => {
  const params = useParams();
  const { user } = useAuth();
  const userId = params?.nameslug as string;
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<any>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // Simulate loading time for profile data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state first, then verify access
  if (loading) {
    return <PageLoader />;
  }

  // Verify that the user is accessing their own profile
  if (user && user.id !== userId) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-semibold text-red-600 mb-2'>
            Access Denied
          </h1>
          <p className='text-gray-600'>You can only access your own profile.</p>
        </div>
      </div>
    );
  }

  const handleEditClick = () => {
    if (editing) {
      profileRef.current?.closeEdit?.();
      setEditing(false);
    } else {
      profileRef.current?.toggleEdit?.();
      setEditing(true);
    }
  };

  const handleSaveClick = () => {
    profileRef.current?.handleSave?.();
  };

  const tabs = [
    {
      name: 'Profile Settings',
      content: (
        <ProfileSettings
          ref={profileRef}
          onEditingChange={setEditing}
          editing={editing}
        />
      ),
    },
    { name: 'Security', content: <SecuritySettings editing={editing} /> },
    // { name: 'Notifications', content: <NotificationPreferences editing={editing} /> },
    { name: 'Activity Log', content: <AccountActivity /> },
  ];

  return (
    <div className='min-h-screen bg-background w-full'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <SectionTitle className='text-2xl font-semibold' text='My Account' />
          <Label className='text-sm text-muted-foreground'>
            Manage your profile, security settings, and account preferences
          </Label>
        </div>

        <div className='flex items-center gap-3'>
          <ReusableButton
            label='Export Data'
            onClick={() => {}}
            className={
              'p-1 px-2 rounded-lg shadow-sm cursor-pointer border border-gray-300'
            }
          />
          {editing ? (
            <>
              <ReusableButton
                label='Save Changes'
                onClick={handleSaveClick}
                className='p-1 px-2 rounded-lg shadow-sm cursor-pointer bg-blue-500 text-white border border-blue-500'
              />
              <ReusableButton
                label='Cancel'
                onClick={handleEditClick}
                className='p-1 px-2 rounded-lg shadow-sm cursor-pointer bg-red-500 text-white border border-red-500'
              />
            </>
          ) : (
            <ReusableButton
              label='Edit Profile'
              onClick={handleEditClick}
              className='p-1 px-2 rounded-lg shadow-sm cursor-pointer bg-blue-500 text-white'
            />
          )}
        </div>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
};

export default MyAccountPage;
