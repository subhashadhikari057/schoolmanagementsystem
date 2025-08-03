'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
// UserRole and LoadingSpinner imports removed as they're not used in this component

/**
 * Main Dashboard Router
 * Redirects users to their role-specific dashboard immediately
 */
export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Immediate redirect logic with minimal processing
    if (user) {
      // Direct role-to-route mapping for maximum performance
      const targetRoute =
        user.role === 'super_admin' ||
        user.role === 'admin' ||
        user.role === 'accountant'
          ? '/dashboard/admin'
          : user.role === 'teacher'
            ? '/dashboard/teacher'
            : user.role === 'student'
              ? '/dashboard/student'
              : user.role === 'parent'
                ? '/dashboard/parent'
                : '/dashboard/admin';

      console.log('⚡ Instant redirect:', user.role, '→', targetRoute);
      router.replace(targetRoute);
      return;
    }

    // Only redirect to login if definitely not authenticated
    if (!isAuthenticated && !isLoading) {
      router.replace('/auth/login');
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Show minimal loading state
  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <p className='text-sm text-gray-600'>Loading dashboard...</p>
      </div>
    </div>
  );
}
