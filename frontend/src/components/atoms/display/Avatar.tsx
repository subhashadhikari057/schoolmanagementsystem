import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  className?: string;
  name?: string;
  showInitials?: boolean;
  role?: 'student' | 'teacher' | 'staff' | 'parent' | 'admin';
  context?: string; // For debugging purposes
}

export default function Avatar({
  src,
  className = '',
  name = 'Guest User',
  showInitials = true,
  role = 'student',
  context = 'unknown',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging
  console.log(`Avatar [${context}]:`, {
    src,
    name,
    role,
    imageError,
    isLoading,
  });

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

  // Get role-based gradient colors
  const getRoleGradient = (role: string): string => {
    switch (role) {
      case 'teacher':
        return 'from-green-500 to-emerald-600';
      case 'staff':
        return 'from-purple-500 to-violet-600';
      case 'parent':
        return 'from-orange-500 to-amber-600';
      case 'admin':
        return 'from-red-500 to-rose-600';
      case 'student':
      default:
        return 'from-blue-500 to-indigo-600';
    }
  };

  // Clean and validate image src URL
  const getValidImageSrc = (src: string): string | null => {
    if (!src || src.trim() === '') {
      console.log('Avatar: No src provided');
      return null;
    }

    console.log('Avatar: Original src:', src);

    // Handle full URLs from backend that need to be proxied through Next.js
    if (
      src.startsWith('http://localhost:8080/api/v1/files/') ||
      src.startsWith('https://localhost:8080/api/v1/files/')
    ) {
      // Convert to relative URL for Next.js proxy
      const relativePath = src.replace(/^https?:\/\/localhost:8080\//, '/');
      console.log('Avatar: Converting backend URL to proxy URL:', relativePath);
      return relativePath;
    }

    // Handle backend profile URLs that start with /uploads or uploads
    if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
      // Convert to API format that Next.js can proxy
      const apiPath = src.replace(/^\/?(uploads\/)/, 'api/v1/files/');
      const finalUrl = `/${apiPath}`;
      console.log('Avatar: Converted uploads URL to:', finalUrl);
      return finalUrl;
    }

    // Handle relative URLs from backend API routes
    if (src.startsWith('/api/v1/files/') || src.startsWith('api/v1/files/')) {
      // Use the rewrites proxy to avoid CORS and hostname issues
      const finalUrl = `/${src.replace(/^\//, '')}`;
      console.log('Avatar: Using API URL:', finalUrl);
      return finalUrl;
    }

    // Handle full URLs - for external images
    if (src.startsWith('http://') || src.startsWith('https://')) {
      console.log('Avatar: Using full URL:', src);
      return src;
    }

    // Handle base64 images
    if (src.startsWith('data:image/')) {
      console.log('Avatar: Using base64 image');
      return src;
    }

    console.log('Avatar: Unknown URL format:', src);
    return null;
  };

  const validSrc = src ? getValidImageSrc(src) : null;
  const shouldShowImage = validSrc && !imageError;

  // Handle image load error
  const handleImageError = () => {
    console.log('Avatar: Image failed to load for URL:', validSrc);
    setImageError(true);
    setIsLoading(false);
  };

  // Handle image load start
  const handleImageLoadStart = () => {
    console.log('Avatar: Image loading started for URL:', validSrc);
    setIsLoading(true);
    setImageError(false);
  };

  // Handle image load success
  const handleImageLoad = () => {
    console.log('Avatar: Image loaded successfully for URL:', validSrc);
    setIsLoading(false);
    setImageError(false);
  };

  // Show initials if no valid image source, error occurred, or showInitials is true
  if (!shouldShowImage) {
    return (
      <div
        className={`${className} bg-gradient-to-br ${getRoleGradient(role)} flex items-center justify-center text-white font-semibold text-sm relative overflow-hidden`}
        title={`${name} (${role.charAt(0).toUpperCase() + role.slice(1)})`}
      >
        {getInitials(name)}
      </div>
    );
  }

  // Show image with fallback to initials on error
  return (
    <div
      className={`${className} relative overflow-hidden`}
      title={`${name} (${role.charAt(0).toUpperCase() + role.slice(1)})`}
    >
      {isLoading && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getRoleGradient(role)} flex items-center justify-center text-white font-semibold text-sm`}
        >
          <div className='animate-pulse'>{getInitials(name)}</div>
        </div>
      )}
      {/* Try regular img tag first to debug */}
      <img
        src={validSrc}
        alt={`${name} - ${role.charAt(0).toUpperCase() + role.slice(1)} Profile`}
        className='w-full h-full object-cover'
        onError={handleImageError}
        onLoadStart={handleImageLoadStart}
        onLoad={handleImageLoad}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    </div>
  );
}
