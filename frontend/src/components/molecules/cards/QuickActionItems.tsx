import React from 'react';
import { QuickAction } from '@/types/QuickActionItems';
import Icon from '@/components/atoms/display/Icon';

export default function QuickActionItems({
  quickActions,
}: {
  quickActions: QuickAction;
}) {
  return (
    <button
      onClick={quickActions.onClick}
      className='flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all group'
    >
      <div className='p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors'>
        <Icon className='w-6 h-6 text-blue-600'>{quickActions.icon}</Icon>
      </div>
      <span className='text-sm font-medium text-gray-700 text-center'>
        {quickActions.title}
      </span>
    </button>
  );
}
