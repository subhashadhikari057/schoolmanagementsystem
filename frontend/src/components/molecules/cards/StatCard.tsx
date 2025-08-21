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
  variant = 'default',
  size = 'md',
}: {
  icon?: React.ElementType;
  bgColor?: string;
  iconColor?: string;
  label: string;
  value: string | number;
  change: string | number;
  isPositive?: boolean;
  className?: string;
  variant?: 'default' | 'solid';
  size?: 'sm' | 'md' | 'lg';
}) {
  const paddingBySize = size === 'sm' ? 'p-3' : size === 'lg' ? 'p-6' : 'p-5';
  const valueTextBySize =
    size === 'sm'
      ? 'text-xl'
      : size === 'lg'
        ? 'text-4xl'
        : 'text-2xl sm:text-3xl';
  const labelTextBySize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const changeTextBySize =
    size === 'sm' ? 'text-[10px]' : 'text-[11px] sm:text-xs';

  if (variant === 'solid') {
    return (
      <div
        className={`${bgColor ?? 'bg-blue-600'} rounded-xl ${paddingBySize} shadow-sm text-white min-w-0 w-full ${className}`}
      >
        <div
          className={`${labelTextBySize} uppercase tracking-wide opacity-80 mb-1`}
        >
          {label}
        </div>
        <div className={`${valueTextBySize} font-bold leading-tight`}>
          {value}
        </div>
        <div className={`${changeTextBySize} opacity-80 mt-1`}>
          {String(change)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 ${paddingBySize} shadow-sm hover:shadow-md transition-shadow min-w-0 w-full ${className}`}
    >
      <div className='px-4 sm:px-0 sm:flex items-start justify-between gap-2 sm:gap-3 lg:gap-4  w-full'>
        <div className='flex-1 min-w-0'>
          <MetricDisplay
            value={value}
            label={label}
            change={change}
            isPositive={isPositive}
            className='px-4 sm:p-0'
          />
        </div>
        {IconComponent && (
          <div className='flex-shrink-0'>
            <IconContainer
              icon={IconComponent}
              bgColor={''}
              iconColor={iconColor || ''}
              size={size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'xl'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
