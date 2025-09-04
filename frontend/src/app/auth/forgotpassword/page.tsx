'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import BannerSlider from '@/components/organisms/content/BannerSlider';
import ForgotPasswordForm from '@/components/organisms/auth/ForgotPasswordForm';
import { authCarouselBanners } from '@/constants/carouselData';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Redirect authenticated users away from forgot password page
  useEffect(() => {
    if (isAuthenticated && user) {
      toast.error(
        'You are already logged in. Please logout first to reset your password.',
        {
          duration: 4000,
        },
      );

      // Redirect to appropriate dashboard based on user role
      const getDashboardRoute = (role: string) => {
        switch (role?.toUpperCase()) {
          case 'SUPER_ADMIN':
          case 'ADMIN':
            return '/dashboard/admin';
          case 'TEACHER':
            return '/dashboard/teacher';
          case 'STUDENT':
            return '/dashboard/student';
          case 'PARENT':
            return '/dashboard/parent';
          case 'ACCOUNTANT':
            return '/dashboard/accountant';
          case 'STAFF':
            return '/dashboard/staff';
          default:
            return '/dashboard';
        }
      };

      const dashboardRoute = getDashboardRoute(user.role);
      router.replace(dashboardRoute);
    }
  }, [isAuthenticated, user, router]);

  // Don't render the form if user is authenticated
  if (isAuthenticated && user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className='grid grid-cols-1 lg:grid-cols-2 min-h-screen h-screen w-full overflow-hidden'
      style={{
        background: `
    radial-gradient(circle at 0% 0%, rgba(0, 97, 255, 0.4) 0%, rgba(0, 97, 255, 0.10) 30%, transparent 35%),
    radial-gradient(circle at 100% 100%, rgba(96, 239, 255, 0.3) 0%, rgba(96, 239, 255, 0.20) 30%, transparent 35%),
    #F7F7F7
  `,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className='flex items-center justify-center px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-16 w-full min-h-screen lg:min-h-0'>
        <ForgotPasswordForm />
      </div>
      <div className='hidden lg:block'>
        <BannerSlider banners={authCarouselBanners} />
      </div>
    </div>
  );
}
