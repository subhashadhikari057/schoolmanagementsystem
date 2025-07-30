"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Banner } from "../../types/banner";
import CarouselSlide from "../molecules/CarouselSlides";

interface CarouselProps {
  autoSlide?: boolean;
  autoSlideInterval?: number;
  slides: Banner[];
}

export default function Carousel({
  autoSlide = false,
  autoSlideInterval = 3000,
  slides,
}: CarouselProps) {
  const [curr, setCurr] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const prev = () =>
    setCurr((curr) => (curr === 0 ? slides.length - 1 : curr - 1));
  
  const next = useCallback(() =>
    setCurr((curr) => (curr === slides.length - 1 ? 0 : curr + 1)),
    [slides.length]
  );

  useEffect(() => {
    if (!autoSlide || slides.length <= 1) return;
    const slideInterval = setInterval(next, autoSlideInterval);
    return () => clearInterval(slideInterval);
  }, [autoSlide, autoSlideInterval, next, slides.length]);

  if (!slides || slides.length === 0) {
    return null;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'none';
      const percentage = (diff / window.innerWidth) * 100;
      const newPosition = curr * 100 + percentage;
      carouselRef.current.style.transform = `translateX(-${newPosition}%)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    const threshold = window.innerWidth / 5;
    
    if (diff > threshold) {
      next();
    } else if (diff < -threshold) {
      prev();
    }
    
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'transform 0.5s ease-out';
      carouselRef.current.style.transform = `translateX(-${curr * 100}%)`;
    }
  };

  return (
    <div className="rounded-3xl relative w-full h-full mx-auto overflow-hidden">
      <div
        ref={carouselRef}
        className="flex transition-transform ease-out duration-500 h-full"
        style={{ transform: `translateX(-${curr * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide) => (
          <CarouselSlide key={slide.id} slide={slide} />
        ))}
      </div>
      
      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === curr 
                ? 'bg-blue-600 w-6' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            onClick={() => setCurr(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}