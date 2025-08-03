import React from 'react';

interface CarouselButtonProps {
  onClick: () => void;
  direction: 'left' | 'right';
  ariaLabel: string;
}

const CarouselButton: React.FC<CarouselButtonProps> = ({ 
  onClick, 
  direction, 
  ariaLabel 
}) => {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded-full shadow bg-white/80 text-gray-800 hover:bg-white pointer-events-auto"
      aria-label={ariaLabel}
    >
      {direction === 'left' ? (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      ) : (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
};

export default CarouselButton;


