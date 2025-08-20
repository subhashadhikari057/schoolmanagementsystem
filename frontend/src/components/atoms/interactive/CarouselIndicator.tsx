import React from 'react';

interface CarouselIndicatorProps {
  active: boolean;
  onClick: () => void;
  index: number;
}

const CarouselIndicator: React.FC<CarouselIndicatorProps> = ({
  active,
  onClick,
  index,
}) => {
  return (
    <button
      className={`transition-all w-3 h-3 bg-white rounded-full ${
        active ? 'p-2' : 'bg-opacity-50'
      } pointer-events-auto`}
      onClick={onClick}
      aria-label={`Go to slide ${index + 1}`}
    />
  );
};

export default CarouselIndicator;
