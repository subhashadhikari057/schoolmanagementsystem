'use client';

import React from 'react';
import { X, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  details?: string[];
  type?: 'warning' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bgGradient: 'from-red-50 to-orange-50',
          iconColor: 'text-red-600',
          icon: AlertTriangle,
          buttonColor: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
        };
      case 'info':
        return {
          bgGradient: 'from-green-50 to-emerald-50',
          iconColor: 'text-green-600',
          icon: Shield,
          buttonColor: 'bg-green-600 hover:bg-green-700 active:bg-green-800',
        };
      default:
        return {
          bgGradient: 'from-yellow-50 to-orange-50',
          iconColor: 'text-yellow-600',
          icon: AlertTriangle,
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800',
        };
    }
  };

  const typeStyles = getTypeStyles();
  const Icon = typeStyles.icon;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      onClick={handleClose}
    >
      <div
        className='bg-white rounded-lg w-full max-w-md shadow-xl animate-in fade-in duration-200'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${typeStyles.bgGradient} p-5 rounded-t-lg border-b border-gray-100 relative`}
        >
          <button
            onClick={handleClose}
            className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/50'
            }`}
            disabled={isLoading}
            aria-label='Close'
          >
            <X className='h-4 w-4 text-gray-500' />
          </button>

          <div className='flex items-center gap-3 pr-10'>
            <Icon className={`w-6 h-6 ${typeStyles.iconColor} flex-shrink-0`} />
            <h2 className='text-lg font-bold text-gray-800'>{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className='p-5'>
          <p className='text-sm text-gray-700 leading-relaxed'>{message}</p>

          {details && details.length > 0 && (
            <ul className='mt-3 space-y-1.5 text-sm text-gray-600'>
              {details.map((detail, index) => (
                <li key={index} className='flex items-start gap-2'>
                  <span className='text-gray-400 mt-0.5'>•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-lg'>
          <Button
            onClick={handleClose}
            disabled={isLoading}
            className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50'
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${typeStyles.buttonColor} text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 shadow-sm`}
          >
            {isLoading ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
