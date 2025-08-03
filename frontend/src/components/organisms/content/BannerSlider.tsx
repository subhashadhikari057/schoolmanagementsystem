
import { Banner } from "../../types/banner";
import Carousel from "./Carousels";

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
    <div className="h-full w-full p-4 sm:p-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[114px] py-8 md:py-12 lg:py-15">
      <Carousel
        slides={banners}
        autoSlide={autoSlide}
        autoSlideInterval={autoSlideInterval}
      />
    </div>
  );
}


