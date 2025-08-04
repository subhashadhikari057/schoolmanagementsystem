'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/organisms/auth/LoginForm';
import BannerSlider from '@/components/organisms/content/BannerSlider';
import { authCarouselBanners } from '@/constants/carouselData';
import { LoginRequest } from '@/api/types/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();

  const handleLogin = async (data: Record<string, unknown>) => {
    try {
      // Prepare login credentials according to API contract
      const credentials: LoginRequest = {
        identifier: data.email as string, // email or phone
        password: data.password as string,
      };

      await login(credentials);

      // Redirect to dashboard on successful login
      router.push('/dashboard/admin');
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
      <div className='hidden lg:block'>
        <BannerSlider banners={authCarouselBanners} />
      </div>
    </div>
  );
}
