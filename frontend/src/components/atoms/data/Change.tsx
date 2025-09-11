import React from 'react';

export default function Change({
  value,
  isPositive = true,
  className,
}: {
  value: string | number;
  isPositive?: boolean;
  className?: string;
}) {
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeIcon = isPositive ? '↗' : '↘';

  return (
    <div
      className={`flex items-center gap-1 ${changeColor} ${className || 'text-xs sm:text-sm'}`}
    >
      <span className='text-xs'>{changeIcon}</span>
      <span>{value}</span>
    </div>
  );
}
