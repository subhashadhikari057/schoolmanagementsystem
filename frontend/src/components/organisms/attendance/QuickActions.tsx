import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export default function QuickActions({
  actions,
  className,
}: QuickActionsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <SectionTitle
        text='Quick Actions'
        level={3}
        className='text-lg font-semibold text-gray-900'
      />

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {actions.map((action, index) => (
          <div
            key={index}
            className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow'
          >
            <div className='flex items-start justify-between'>
              <div className='space-y-1'>
                <div className='text-base font-semibold text-gray-900'>
                  {action.title}
                </div>
                <Label className='text-gray-600'>{action.subtitle}</Label>
              </div>
              <div
                className={`w-10 h-10 ${action.bgColor} ${action.iconColor} rounded-lg flex items-center justify-center`}
              >
                <action.icon className='w-5 h-5' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
