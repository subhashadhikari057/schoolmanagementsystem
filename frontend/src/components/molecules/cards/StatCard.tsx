import React from 'react';
import MetricDisplay from './MetricDisplay';
import IconContainer from '../interactive/IconContainer';

export default function StatCard({
  icon: IconComponent,
  bgColor,
  iconColor,
  label,
  value,
  change,
  isPositive = true,
  className,
}: {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  label: string;
  value: string | number;
  change: string | number;
  isPositive?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow min-w-0 ${className}`}
    >
      <div className='flex items-start justify-between gap-2 sm:gap-3 lg:gap-4'>
        <div className='flex-1 min-w-0'>
          <MetricDisplay
            value={value}
            label={label}
            change={change}
            isPositive={isPositive}
          />
        </div>
        <div className='flex-shrink-0'>
          <IconContainer
            icon={IconComponent}
            bgColor={bgColor}
            iconColor={iconColor}
            size='xl'
          />
        </div>
      </div>
    </div>
  );
}
