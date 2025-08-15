'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/organisms/auth/LoginForm';
import BannerSlider from '@/components/organisms/content/BannerSlider';
import { authCarouselBanners } from '@/constants/carouselData';
import { LoginRequest } from '@/api/types/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, user, isAuthenticated } = useAuth();
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Check for session expiry message on mount - client-side only
  useEffect(() => {
    // Delay to prevent hydration mismatch
    const checkRedirectMessage = () => {
      const message = sessionStorage.getItem('auth_redirect_message');
      const path = sessionStorage.getItem('auth_redirect_path');

      if (message) {
        setRedirectMessage(message);
        sessionStorage.removeItem('auth_redirect_message');

        // Show toast message for session expiry with delay
        setTimeout(() => {
          toast.error(message);
        }, 100);
      }

      if (path) {
        setRedirectPath(path);
      }
    };

    // Run after a short delay to ensure hydration is complete
    const timeoutId = setTimeout(checkRedirectMessage, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Redirect based on user role after successful login
  useEffect(() => {
    if (isAuthenticated && user) {
      // If we have a saved redirect path from session expiry, use that
      if (redirectPath) {
        router.push(redirectPath);
        sessionStorage.removeItem('auth_redirect_path');
        return;
      }

      // Otherwise, redirect based on role
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
            return '/dashboard'; // fallback
        }
      };

      const dashboardRoute = getDashboardRoute(user.role);
      router.push(dashboardRoute);
    }
  }, [isAuthenticated, user, router, redirectPath]);

  const handleLogin = async (data: Record<string, unknown>) => {
    try {
      // Prepare login credentials according to API contract
      const credentials: LoginRequest = {
        identifier: data.email as string, // email or phone
        password: data.password as string,
      };

      const loginResult = await login(credentials);

      // Check if password change is required
      if (
        loginResult?.requirePasswordChange &&
        loginResult.tempToken &&
        loginResult.userInfo
      ) {
        // Store temp data securely in sessionStorage (more secure than localStorage for temp data)
        sessionStorage.setItem(
          'temp_password_change_token',
          loginResult.tempToken,
        );
        sessionStorage.setItem(
          'temp_password_change_user',
          JSON.stringify(loginResult.userInfo),
        );

        // Redirect to password change page WITHOUT exposing sensitive data in URL
        router.push('/auth/change-password');
        return;
      }

      // Normal login - the redirect will happen in useEffect below
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled by useAuth hook and displayed in the form
    }
  };

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
        <div className='w-full max-w-md'>
          {redirectMessage && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-sm text-red-600'>{redirectMessage}</p>
            </div>
          )}

          <LoginForm
            description='login to access SMS Portal 👋'
            title='SMS'
            subtitle='Welcome,'
            emailLabel='Email'
            passwordLabel='Password'
            buttonLabel={isLoading ? 'Signing in...' : 'Login'}
            onSubmit={handleLogin}
          />

          {error && (
            <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}
        </div>
      </div>
      <div className='hidden lg:block'>
        <BannerSlider banners={authCarouselBanners} />
      </div>
    </div>
  );
}
