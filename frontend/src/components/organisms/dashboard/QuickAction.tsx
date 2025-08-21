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

  // Ensure actions is always an array
  const safeActions = Array.isArray(actions) ? actions : [];

  const handleActionClick = (action: QuickAction) => {
    const route = quickActionRoutes[action.id];
    if (route) {
      router.push(route);
    } else {
      console.log(`No route defined for action: ${action.title}`);
    }
  };

  return (
    <div className='bg-white rounded-xl border border-gray-200 p-6 max-w-7xl mx-auto'>
      <SectionHeader title='Quick Actions' />
      <div className='grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
        {safeActions.length > 0 ? (
          safeActions.map(action => (
            <QuickActionItems
              key={action.id}
              quickActions={{
                ...action,
                onClick: () => handleActionClick(action),
              }}
            />
          ))
        ) : (
          <div className='col-span-full text-center py-8 text-gray-500'>
            <p>No quick actions available</p>
          </div>
        )}
      </div>
    </div>
  );
}
