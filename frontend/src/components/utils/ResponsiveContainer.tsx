import React, { ReactNode } from 'react';

type ResponsiveContainerProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centerContent?: boolean;
};

/**
 * ResponsiveContainer - A utility component for consistent responsive layouts
 * Provides standardized padding, max-widths, and centering across all screen sizes
 */
export default function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'full',
  padding = 'md',
  centerContent = false,
}: ResponsiveContainerProps) {
  // Responsive max-width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  // Responsive padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-3',
    md: 'p-3 sm:p-4 lg:p-6',
    lg: 'p-4 sm:p-6 lg:p-8',
  };

  const baseClasses = `
    w-full
    ${maxWidthClasses[maxWidth]}
    ${paddingClasses[padding]}
    ${centerContent ? 'mx-auto' : ''}
  `;

  return <div className={`${baseClasses} ${className}`}>{children}</div>;
}

// Hook for consistent responsive breakpoints
export const useResponsiveBreakpoints = () => {
  return {
    // Mobile: 0px - 639px (default)
    // Tablet: 640px - 1023px (sm and md)
    // Desktop: 1024px+ (lg, xl, 2xl)
    breakpoints: {
      mobile: '(max-width: 639px)',
      tablet: '(min-width: 640px) and (max-width: 1023px)',
      desktop: '(min-width: 1024px)',
    },
    // Common responsive patterns
    patterns: {
      // Grid patterns
      gridResponsive:
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      gridTwoCol: 'grid grid-cols-1 md:grid-cols-2',
      gridThreeCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',

      // Flex patterns
      flexStack: 'flex flex-col sm:flex-row',
      flexCenter: 'flex items-center justify-center',
      flexBetween: 'flex items-center justify-between',

      // Text patterns
      textResponsive: 'text-sm sm:text-base lg:text-lg',
      headingResponsive: 'text-xl sm:text-2xl lg:text-3xl',

      // Spacing patterns
      spacingResponsive: 'space-y-3 sm:space-y-4 lg:space-y-6',
      gapResponsive: 'gap-3 sm:gap-4 lg:gap-6',

      // Padding patterns
      paddingResponsive: 'p-3 sm:p-4 lg:p-6',
      paddingXResponsive: 'px-3 sm:px-4 lg:px-6',
      paddingYResponsive: 'py-3 sm:py-4 lg:py-6',

      // Container patterns
      containerResponsive: 'container mx-auto px-3 sm:px-4 lg:px-6',
    },
  };
};

// Responsive grid component
export const ResponsiveGrid = ({
  children,
  columns = 'auto',
  gap = 'md',
  className = '',
}: {
  children: ReactNode;
  columns?: 'auto' | 1 | 2 | 3 | 4 | 'custom';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const columnClasses = {
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    custom: '', // Use custom className
  };

  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 lg:gap-6',
    lg: 'gap-4 sm:gap-6 lg:gap-8',
  };

  return (
    <div
      className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}
    >
      {children}
    </div>
  );
};
