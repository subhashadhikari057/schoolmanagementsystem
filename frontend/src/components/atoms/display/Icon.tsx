import React from 'react';

export default function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`rounded-full ${className}`}>{children}</div>;
}
