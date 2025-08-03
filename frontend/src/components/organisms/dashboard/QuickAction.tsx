'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/molecules/interactive/SectionHeader';
import { QuickAction } from '@/types/QuickActionItems';
import QuickActionItems from '@/components/molecules/cards/QuickActionItems';
import { quickActionRoutes } from '@/constants/mockData';

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const router = useRouter();

  const handleActionClick = (action: QuickAction) => {
    const route = quickActionRoutes[action.id];
    if (route) {
      router.push(route);
    } else {
      console.log(`No route defined for action: ${action.title}`);
    }
  };

  return (
    <div className='bg-white rounded-xl border border-gray-200 p-6'>
      <SectionHeader title='Quick Actions' />
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {actions.map(action => (
          <QuickActionItems
            key={action.id}
            quickActions={{
              ...action,
              onClick: () => handleActionClick(action),
            }}
          />
        ))}
      </div>
    </div>
  );
}
