'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SettingsNavigationProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description: string;
  onBack?: () => void;
  backLabel?: string;
  showBackButton?: boolean;
}

export default function SettingsNavigation({
  breadcrumbs,
  title,
  description,
  onBack,
  backLabel = 'Back to Settings',
  showBackButton = true,
}: SettingsNavigationProps) {
  const router = useRouter();

  const handleBreadcrumbClick = (href: string) => {
    router.push(href);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className='bg-white border-b border-gray-200'>
        <div className='px-3 sm:px-4 lg:px-6'>
          <div className='flex items-center space-x-2 py-3'>
            <Home className='h-4 w-4 text-gray-400' />
            <ChevronRight className='h-4 w-4 text-gray-400' />
            <button
              onClick={() => handleBreadcrumbClick('/dashboard/admin')}
              className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
            >
              Admin
            </button>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <ChevronRight className='h-4 w-4 text-gray-400' />
                {item.href && index !== breadcrumbs.length - 1 ? (
                  <button
                    onClick={() => handleBreadcrumbClick(item.href!)}
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    className={`text-sm ${index === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Header with Back Button */}
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <div className='flex items-center gap-4 mb-4'>
          {showBackButton && (
            <ReusableButton
              onClick={handleBackClick}
              className='flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200'
            >
              <ArrowLeft className='h-4 w-4' />
              {backLabel}
            </ReusableButton>
          )}
          <div>
            <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'>
              {title}
            </h1>
            <p className='text-xs sm:text-sm lg:text-base text-gray-600 mt-1'>
              {description}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
