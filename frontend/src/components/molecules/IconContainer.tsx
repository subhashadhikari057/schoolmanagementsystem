import React from 'react'
import Icon from '../atoms/Icon'

interface IconContainerProps {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
}

export default function IconContainer({
  icon: IconComponent,  
  iconColor, 
  className,
  size = 'md'
}: IconContainerProps) {
  
  // Predefined size classes
  const sizeClasses = {
    'xs': 'w-3 h-3',
    'sm': 'w-4 h-4', 
    'md': 'w-6 h-6',
    'lg': 'w-8 h-8',
    'xl': 'w-10 h-10',
    '2xl': 'w-12 h-12'
  };

  // Use predefined size or custom size string
  const iconSize = sizeClasses[size as keyof typeof sizeClasses] || size;

  return (
    <Icon className={`$ ${className}`}>
      <IconComponent className={`${iconSize} ${iconColor}`} />
    </Icon>
  )
}
