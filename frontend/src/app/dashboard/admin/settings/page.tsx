'use client';

import PlaceholderPage from '@/components/templates/PlaceholderPage';

export default function SystemSettingsPage() {
  return (
    <PlaceholderPage
      title='System Settings'
      description='System configuration and administration panel is under development.'
      expectedFeatures={[
        'School information and branding',
        'Academic year and term settings',
        'User roles and permissions',
        'Fee structure configuration',
        'Notification preferences',
        'Backup and restore options',
        'Integration settings',
      ]}
      backUrl='/dashboard/admin'
    />
  );
}
