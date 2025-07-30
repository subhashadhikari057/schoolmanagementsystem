import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Banner } from '../../types/banner';

interface CarouselSlideProps {
  slide: Banner;
}

const CarouselSlide: React.FC<CarouselSlideProps> = ({ slide }) => {
  return (
    <div className="w-full h-full relative flex-shrink-0">
      <Link href={slide.link} className="block w-full h-full relative">
        <Image
          src={slide.imageUrl}
          alt={slide.alt || "banner"}
          fill
          className="object-cover"
          unoptimized
        />
      </Link>
    </div>
  );
};

export default CarouselSlide;