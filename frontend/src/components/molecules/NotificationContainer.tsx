'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast } from '@/hooks/useToast';
import ReusableButton from '@/components/atoms/form-controls/Button';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'error':
        return <AlertCircle className='h-5 w-5 text-red-600' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-yellow-600' />;
      case 'info':
        return <Info className='h-5 w-5 text-blue-600' />;
      default:
        return <Info className='h-5 w-5 text-gray-600' />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className='fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full'>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`border rounded-lg shadow-lg p-4 ${getBgColor(toast.type)} animate-in slide-in-from-right duration-300`}
        >
          <div className='flex items-start gap-3'>
            {getIcon(toast.type)}
            <div className='flex-1 min-w-0'>
              <p className={`text-sm font-medium ${getTextColor(toast.type)}`}>
                {toast.title}
              </p>
              {toast.message && (
                <p
                  className={`text-sm mt-1 ${getTextColor(toast.type).replace('800', '700')}`}
                >
                  {toast.message}
                </p>
              )}
            </div>
            <ReusableButton
              onClick={() => onRemove(toast.id)}
              className='p-1 text-gray-400 hover:text-gray-600 hover:bg-white hover:bg-opacity-50 rounded'
            >
              <X className='h-4 w-4' />
            </ReusableButton>
          </div>
        </div>
      ))}
    </div>
  );
}
