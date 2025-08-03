// Set Password Page
import LoginForm from '@/components/organisms/auth/LoginForm';
import BannerSlider from '@/components/organisms/content/BannerSlider';
import { authCarouselBanners } from '@/constants/carouselData';

export default function SetPasswordPage() {
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
          description='Your previous password has been reseted. Please set a new password for your account.'
          title='SMS'
          subtitle='Set a Password'
          showRememberMe={false}
          showBackButton={false}
        />
      </div>
      <div className='hidden lg:block'>
        <BannerSlider banners={authCarouselBanners} />
      </div>
    </div>
  );
}
