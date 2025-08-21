import { Banner } from '@/types/banner';
import Carousel from './Carousels';

interface BannerSliderProps {
  banners: Banner[];
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

export default function BannerSlider({
  banners,
  autoSlide = true,
  autoSlideInterval = 5000,
}: BannerSliderProps) {
  return (
    <div className='p-4 sm:p-6 md:px-8 lg:px-12 2xl:px-[114px] xl:px-16 py-8 md:py-12 lg:py-15 w-full h-full'>
      <Carousel
        slides={banners}
        autoSlide={autoSlide}
        autoSlideInterval={autoSlideInterval}
      />
    </div>
  );
}
