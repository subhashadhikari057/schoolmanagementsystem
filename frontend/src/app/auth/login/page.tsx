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
  const { login, isLoading, user, isAuthenticated } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Check for session expiry message on mount - client-side only
  useEffect(() => {
    // Delay to prevent hydration mismatch
    const checkRedirectMessage = () => {
      const message = sessionStorage.getItem('auth_redirect_message');
      const path = sessionStorage.getItem('auth_redirect_path');

      if (message) {
        sessionStorage.removeItem('auth_redirect_message');

        // Show toast message for session expiry with delay
        setTimeout(() => {
          toast.error(message, {
            duration: 4000,
            position: 'top-center',
          });
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
    // CRITICAL: Only redirect if we have a truly authenticated user
    // and we're not in the middle of a login process
    if (isAuthenticated && user && !isLoading) {
      // Additional safety check: verify we have valid user data
      if (!user.id || !user.email || !user.role) {
        console.warn('Invalid user data detected, not redirecting:', user);
        return;
      }

      // Add a small delay to ensure login process is complete
      // This prevents redirect during login error handling
      const redirectTimer = setTimeout(() => {
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
      }, 100); // Small delay to ensure stability

      // Cleanup timer on unmount
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, user, router, redirectPath, isLoading]);

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

        // Show success message for password change requirement
        toast.success('Please set a new password to continue.', {
          duration: 3000,
        });

        // Redirect to password change page WITHOUT exposing sensitive data in URL
        router.push('/auth/change-password');
        return;
      }

      // Normal login - the redirect will happen in useEffect below
      // Show brief success message
      toast.success('Login successful! Redirecting...', {
        duration: 2000,
      });
    } catch (error) {
      // Prevent any form reset or page refresh by handling the error gracefully
      // Only log unexpected login errors in development
      if (process.env.NODE_ENV === 'development') {
        const apiError = error as any;
        if (apiError?.statusCode !== 401) {
          // Don't log invalid credentials
          console.error('Login failed:', error);
        }
      }

      // CRITICAL: Clear any stale authentication data to prevent redirect loops
      // This ensures that failed login doesn't leave the user in a false authenticated state
      try {
        // Clear stored user data from all possible storage locations
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('auth_user');

        // Clear any auth-related session data that might cause redirects
        sessionStorage.removeItem('temp_auth_data');
        sessionStorage.removeItem('auth_redirect_path');

        // Clear potentially stale authentication cookies
        // This is safe to do on login failure as we want a clean slate
        document.cookie =
          'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
        document.cookie =
          'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
      } catch (clearError) {
        console.warn('Failed to clear auth data:', clearError);
      }

      // Show user-friendly error message as toast notification
      const apiError = error as {
        message?: string;
        statusCode?: number;
        code?: string;
      };
      let errorMessage = 'Login failed. Please try again.';

      // Provide specific error messages based on status codes
      if (apiError.statusCode === 401) {
        errorMessage =
          'Invalid email or password. Please check your credentials and try again.';
      } else if (apiError.statusCode === 429) {
        errorMessage =
          'Too many login attempts. Please wait a moment before trying again.';
      } else if (apiError.statusCode === 403) {
        errorMessage =
          'Your account has been disabled. Please contact support for assistance.';
      } else if (apiError.statusCode === 422) {
        errorMessage = 'Please check that all fields are filled out correctly.';
      } else if (apiError.code === 'NETWORK_ERROR') {
        errorMessage =
          'Network error. Please check your connection and try again.';
      } else if (apiError.message && !apiError.message.includes('fetch')) {
        // Use API message if it's user-friendly (not technical fetch errors)
        errorMessage = apiError.message;
      }

      // Show toast notification with professional error message
      toast.error(errorMessage, {
        duration: 5000, // Show for 5 seconds
        position: 'top-center',
        style: {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          color: '#dc2626',
        },
      });

      // Don't re-throw the error to prevent any unwanted side effects
      // The form will remain as-is with user's input preserved
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
          <LoginForm
            description='login to access SMS Portal '
            title='SMS'
            subtitle='Welcome👋,'
            emailLabel='Email'
            passwordLabel='Password'
            buttonLabel={isLoading ? 'Signing in...' : 'Login'}
            onSubmit={handleLogin}
          />
        </div>
      </div>
      <div className='hidden lg:block'>
        <BannerSlider banners={authCarouselBanners} />
      </div>
    </div>
  );
}
