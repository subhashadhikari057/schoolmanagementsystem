'use client';

import React from 'react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import ProfileSettings from '@/components/organisms/tabs/ProfileSettings';
import SecuritySettings from '@/components/organisms/tabs/SecuritySettingPage';
import { UserProfileHeader } from '@/components/organisms/modals/UserProfileModal';
import NotificationPreferences from '@/components/organisms/tabs/NotificationPreferences';
import AccountActivity from '@/components/organisms/tabs/AccountActivity';

interface ActionButtonsProps {
  pageType:
    | 'students'
    | 'teachers'
    | 'parents'
    | 'staff'
    | 'subjects'
    | 'id-cards'
    | 'classes';
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

const MyAccountPage = () => {
  return (
    <div className='min-h-screen bg-background'>
      <UserProfileHeader />
      <Tabs tabs={tabs} />
    </div>
  );
};

export default MyAccountPage;
