'use client';

import React from 'react';
import { Shield, Globe } from 'lucide-react';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import SchoolInformationTab from '@/components/organisms/settings/SchoolInformationTab';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import SettingsNavigation from '@/components/molecules/SettingsNavigation';
import { Building2, Calendar } from 'lucide-react';

export default function SystemSettingsPage() {
  const breadcrumbs = [
    { label: 'Settings', href: '/dashboard/admin/settings' },
    { label: 'System Settings' },
  ];

  // Stats for system settings overview
  const settingsStats = [
    {
      icon: Building2,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      value: '95%',
      label: 'Configuration Complete',
      change: '5%',
      isPositive: true,
    },
    {
      icon: Calendar,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      value: '2024-25',
      label: 'Grading and attendance',
      change: 'Current',
      isPositive: true,
    },
    {
      icon: Globe,
      bgColor: 'bg-purple-600',
      iconColor: 'text-white',
      value: '3',
      label: 'Languages Supported',
      change: '2 new',
      isPositive: true,
    },
    {
      icon: Shield,
      bgColor: 'bg-orange-600',
      iconColor: 'text-white',
      value: 'Secure',
      label: 'System Status',
      change: '99.9%',
      isPositive: true,
    },
  ];

  // Tab configuration for GenericTabs - Only School Information tab
  const tabs = [
    {
      name: 'School Information',
      content: <SchoolInformationTab />,
    },
  ];

  return (
    <div className='min-h-screen'>
      <SettingsNavigation
        breadcrumbs={breadcrumbs}
        title='System Settings'
        description="Configure your school's core system settings and preferences"
        showBackButton={true}
      />

      {/* Stats */}
      <div className='px-4 sm:px-6 lg:px-8 mb-6'>
        <Statsgrid stats={settingsStats} />
      </div>

      {/* Main Content with GenericTabs */}
      <div className='px-4 sm:px-6 lg:px-8 pb-8'>
        <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
          <GenericTabs tabs={tabs} defaultIndex={0} />
        </div>
      </div>
    </div>
  );
}
