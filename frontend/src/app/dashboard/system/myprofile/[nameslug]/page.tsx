'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import ProfileSettings from '@/components/organisms/tabs/ProfileSettings';
import SecuritySettings from '@/components/organisms/tabs/SecuritySettingPage';
import { UserProfileHeader } from '@/components/organisms/modals/UserProfileModal';
import NotificationPreferences from '@/components/organisms/tabs/NotificationPreferences';
import AccountActivity from '@/components/organisms/tabs/AccountActivity';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/atoms/loading';

const MyAccountPage = () => {
  const params = useParams();
  const { user } = useAuth();
  const userId = params?.nameslug as string;
  const [loading, setLoading] = useState(true);

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

  const tabs = [
    {
      name: 'Profile Settings',
      content: <ProfileSettings />,
    },
    {
      name: 'Security',
      content: <SecuritySettings />,
    },
    {
      name: 'Notifications',
      content: <NotificationPreferences />,
    },
    {
      name: 'Activity Log',
      content: <AccountActivity />,
    },
  ];

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <UserProfileHeader />
      <Tabs tabs={tabs} />
    </div>
  );
};

export default MyAccountPage;
