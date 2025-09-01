'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SettingsNavigationProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function SettingsNavigation({
  breadcrumbs,
  title,
  description,
  onBack,
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
      {/* Breadcrumb - Only show if there are breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className='bg-white border-b border-gray-100 shadow-sm rounded-t-2xl'>
          <div className='px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center space-x-1 py-4'>
              <Home className='h-4 w-4 text-gray-400' />
              <ChevronRight className='h-3 w-3 text-gray-300 mx-1' />
              <button
                onClick={() => handleBreadcrumbClick('/dashboard/admin')}
                className='text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150 cursor-pointer'
              >
                Admin
              </button>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className='h-3 w-3 text-gray-300 mx-1' />
                  {item.href && index !== breadcrumbs.length - 1 ? (
                    <button
                      onClick={() => handleBreadcrumbClick(item.href!)}
                      className='text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150 cursor-pointer'
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span
                      className={`text-sm ${index === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500'}`}
                    >
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Header - Adjust rounded corners based on breadcrumbs presence */}
      <div
        className={`bg-white shadow-lg border-b border-gray-100 ${breadcrumbs.length > 0 ? 'rounded-b-2xl' : 'rounded-2xl'}`}
      >
        <div className='px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex items-center space-x-4'>
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className='flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-gray-50 transition-all duration-200 group border border-gray-200 shadow-md hover:shadow-lg'
              >
                <ArrowLeft className='h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors duration-200' />
              </button>
            )}
            <div className='flex-1'>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-2 tracking-tight'>
                {title}
              </h1>
              <p className='text-base text-gray-600 leading-relaxed max-w-2xl'>
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gap below header */}
      <div className='h-8'></div>
    </>
  );
}
