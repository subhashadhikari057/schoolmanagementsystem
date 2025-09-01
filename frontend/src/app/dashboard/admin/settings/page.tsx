'use client';

import { useRouter } from 'next/navigation';
import SystemSettings from '@/components/organisms/tabs/SystemSettings';
import SettingsNavigation from '@/components/molecules/SettingsNavigation';

export default function SystemSettingsPage() {
  const router = useRouter();

  const breadcrumbs = [
    { label: 'Settings', href: '/dashboard/admin/settings' },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <SettingsNavigation
        breadcrumbs={breadcrumbs}
        title='Settings'
        description='Manage system, notifications, backup & recovery settings'
        showBackButton={true}
        backLabel='Back to Admin'
        onBack={() => router.push('/dashboard/admin')}
      />
      <div className='px-3 sm:px-4 lg:px-6'>
        <SystemSettings />
      </div>
    </div>
  );
}
