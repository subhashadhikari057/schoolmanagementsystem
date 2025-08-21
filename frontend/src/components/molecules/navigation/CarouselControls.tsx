import React from 'react';
import CarouselButton from '@/components/atoms/interactive/CarouselButton';
import CarouselIndicator from '@/components/atoms/interactive/CarouselIndicator';

interface CarouselControlsProps {
  currentIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onIndicatorClick: (index: number) => void;
}

const CarouselControls: React.FC<CarouselControlsProps> = ({
  currentIndex,
  totalSlides,
  onPrev,
  onNext,
  onIndicatorClick,
}) => {
  return (
    <>
      {/* Navigation arrows */}
      <div className='absolute inset-0 flex items-center justify-between p-4 pointer-events-none'>
        <CarouselButton
          onClick={onPrev}
          direction='left'
          ariaLabel='Previous slide'
        />
        <CarouselButton
          onClick={onNext}
          direction='right'
          ariaLabel='Next slide'
        />
      </div>

      {/* Slide indicators - only show if multiple slides */}
      {totalSlides > 1 && (
        <div className='absolute bottom-4 left-0 right-0 pointer-events-none'>
          <div className='flex items-center justify-center gap-2'>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <CarouselIndicator
                key={i}
                active={currentIndex === i}
                onClick={() => onIndicatorClick(i)}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CarouselControls;
