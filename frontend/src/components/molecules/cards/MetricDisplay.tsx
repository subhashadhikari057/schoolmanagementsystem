import React from 'react';
import Label from '@/components/atoms/display/Label';
import Metric from '@/components/atoms/data/Metric';
import Change from '@/components/atoms/data/Change';

export default function MetricDisplay({
  value,
  label,
  change,
  isPositive = true,
  className,
}: {
  value: string | number;
  label: string;
  change: string | number;
  isPositive?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1 sm:space-y-2 min-w-0 flex-1 ${className}`}>
      <Label className='text-xs sm:text-sm opacity-70 sm:opacity-100'>
        {label}
      </Label>
      <Metric
        className='text-lg sm:text-xl lg:text-2xl font-semibold'
        value={value}
      />
      <Change
        value={change}
        isPositive={isPositive}
        className='text-xs sm:text-sm'
      />
    </div>
  );
}
