import React from 'react';

export default function Metric({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <div
      className={`text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 ${className}`}
    >
      {value}
    </div>
  );
}
