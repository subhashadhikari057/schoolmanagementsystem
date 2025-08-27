'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  required?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<Props> = ({
  required = [],
  children,
  fallback = null,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className='text-sm text-gray-500'>Loading...</div>;
  if (!isAuthenticated || !user)
    return (
      <>
        {fallback || (
          <div className='text-sm text-red-600'>Not authenticated</div>
        )}
      </>
    );
  // SUPER_ADMIN bypasses permission gate client-side to mirror backend guard behavior
  // Normalize role: remove non-letters so variants like SUPER_ADMIN / SUPERADMIN / super-admin all match
  const roleNorm = (user.role || '').toLowerCase().replace(/[^a-z]/g, '');
  if (
    required.length &&
    roleNorm !== 'superadmin' &&
    !required.every(p => user.permissions?.includes(p))
  ) {
    return (
      <>
        {fallback || (
          <div className='text-sm text-red-600'>Insufficient permissions</div>
        )}
      </>
    );
  }
  return <>{children}</>;
};

export default PermissionGate;
