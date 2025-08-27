import * as React from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'overflow-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300',
        className,
      )}
    >
      {children}
    </div>
  );
};

export { ScrollArea };
