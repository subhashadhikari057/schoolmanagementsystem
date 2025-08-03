import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  className?: string;
}

export default function Avatar({ className }: AvatarProps) {
  return (
    <div
      className={`${className} bg-gray-100 border border-gray-200 flex items-center justify-center`}
    >
      <User className='w-1/2 h-1/2 text-gray-500' />
    </div>
  );
}
