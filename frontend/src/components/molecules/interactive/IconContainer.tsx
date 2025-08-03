import React from 'react'
import Icon from "@/components/atoms/display/Icon"

interface IconContainerProps {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
}

export default function IconContainer({
  icon: IconComponent,  
  bgColor,
  iconColor, 
  className,
  size = 'md'
}: IconContainerProps) {
  
  // Predefined size classes for container
  const containerSizeClasses = {
    'xs': 'w-6 h-6 p-1',
    'sm': 'w-8 h-8 p-1.5', 
    'md': 'w-10 h-10 p-2',
    'lg': 'w-12 h-12 p-2.5',
    'xl': 'w-14 h-14 p-3',
    '2xl': 'w-16 h-16 p-3.5'
  };

  // Predefined size classes for icons
  const iconSizeClasses = {
    'xs': 'w-4 h-4',
    'sm': 'w-5 h-5', 
    'md': 'w-6 h-6',
    'lg': 'w-7 h-7',
    'xl': 'w-8 h-8',
    '2xl': 'w-9 h-9'
  };

  // Use predefined size or custom size string
  const containerSize = containerSizeClasses[size as keyof typeof containerSizeClasses] || 'w-10 h-10 p-2';
  const iconSize = iconSizeClasses[size as keyof typeof iconSizeClasses] || 'w-6 h-6';

  return (
    <Icon className={`${bgColor} ${containerSize} flex items-center justify-center flex-shrink-0 ${className}`}>
      <IconComponent className={`${iconSize} ${iconColor}`} />
    </Icon>
  )
}



