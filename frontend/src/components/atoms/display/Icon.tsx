import React from 'react';

export default function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`rounded-lg ${className}`}>{children}</div>;
}
