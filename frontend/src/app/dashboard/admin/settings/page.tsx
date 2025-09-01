'use client';

import { useRouter } from 'next/navigation';
import SystemSettings from '@/components/organisms/tabs/SystemSettings';
import SettingsNavigation from '@/components/molecules/SettingsNavigation';

export default function MainSettingsPage() {
  const router = useRouter();

  const breadcrumbs: never[] = [];

  return (
    <div className='min-h-screen'>
      <SettingsNavigation
        breadcrumbs={breadcrumbs}
        title='Settings'
        description='Manage system, notifications, backup & recovery settings'
        showBackButton={true}
        onBack={() => router.push('/dashboard/admin')}
      />
      <div className='px-4 sm:px-6 lg:px-8 pb-8'>
        <SystemSettings />
      </div>
    </div>
  );
}
