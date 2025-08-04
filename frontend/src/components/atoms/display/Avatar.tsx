import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string;
  className?: string;
  name?: string;
  showInitials?: boolean;
}

export default function Avatar({
  src,
  className = '',
  name = 'Guest User',
  showInitials = true,
}: AvatarProps) {
  // Generate initials from name
  const getInitials = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return 'GU';

    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // If showInitials is true or no src provided, show initials
  if (showInitials || !src) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm`}
      >
        {getInitials(name)}
      </div>
    );
  }

  // Show image if src is provided and showInitials is false
  return (
    <div className={className}>
      <Image
        src={src}
        height={100}
        width={100}
        alt={name || 'User'}
        className='rounded-full'
      />
    </div>
  );
}
