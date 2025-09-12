import React from 'react';
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
  const paddingBySize =
    size === 'sm' ? 'p-3 sm:p-4' : size === 'lg' ? 'p-4 sm:p-6' : 'p-4 sm:p-5';
  const valueTextBySize =
    size === 'sm'
      ? 'text-lg sm:text-xl'
      : size === 'lg'
        ? 'text-2xl sm:text-3xl lg:text-4xl'
        : 'text-xl sm:text-2xl lg:text-3xl';
  const labelTextBySize =
    size === 'sm' ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs';
  const changeTextBySize =
    size === 'sm' ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs';

  if (variant === 'solid') {
    return (
      <div
        className={`${bgColor ?? 'bg-blue-600'} rounded-xl ${paddingBySize} shadow-sm text-white min-w-0 w-full ${className}`}
      >
        <div
          className={`${labelTextBySize} uppercase tracking-wide opacity-80 mb-1 sm:mb-2`}
        >
          {label}
        </div>
        <div className={`${valueTextBySize} font-bold leading-tight mb-1`}>
          {value}
        </div>
        <div className={`${changeTextBySize} opacity-80`}>{String(change)}</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 ${paddingBySize} shadow-sm hover:shadow-md transition-shadow min-w-0 w-full ${className}`}
    >
      <div className='flex items-start justify-between gap-3 w-full'>
        <div className='flex-1 min-w-0'>
          <div
            className={`${labelTextBySize} uppercase tracking-wide text-gray-500 mb-1 sm:mb-2`}
          >
            {label}
          </div>
          <div className={`${valueTextBySize} font-bold text-gray-900 mb-1`}>
            {value}
          </div>
          <div
            className={`${changeTextBySize} flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}
          ></div>
        </div>
        {IconComponent && (
          <div className='flex-shrink-0'>
            <IconContainer
              icon={IconComponent}
              bgColor={bgColor || ''}
              iconColor={iconColor || ''}
              size={size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
