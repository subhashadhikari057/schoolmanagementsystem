import React from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Trash2,
  Edit,
  Archive,
  CheckCircle,
} from 'lucide-react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

const getTypeConfig = (type: ConfirmationOptions['type']) => {
  switch (type) {
    case 'danger':
      return {
        borderColor: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        confirmBg: 'bg-red-600 hover:bg-red-700',
        defaultIcon: <Trash2 className='w-5 h-5' />,
      };
    case 'warning':
      return {
        borderColor: 'border-yellow-200',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
        defaultIcon: <AlertTriangle className='w-5 h-5' />,
      };
    case 'success':
      return {
        borderColor: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        confirmBg: 'bg-green-600 hover:bg-green-700',
        defaultIcon: <CheckCircle className='w-5 h-5' />,
      };
    default: // 'info'
      return {
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        confirmBg: 'bg-blue-600 hover:bg-blue-700',
        defaultIcon: <Edit className='w-5 h-5' />,
      };
  }
};

export const showConfirmation = (options: ConfirmationOptions) => {
  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
    icon,
    onConfirm,
    onCancel,
  } = options;

  const config = getTypeConfig(type);
  const displayIcon = icon || config.defaultIcon;

  toast.custom(
    t => (
      <div
        className={`bg-white border ${config.borderColor} rounded-lg shadow-lg p-4 max-w-md`}
      >
        <div className='flex items-start space-x-3'>
          <div className='flex-shrink-0'>
            <div
              className={`w-10 h-10 ${config.iconBg} rounded-full flex items-center justify-center`}
            >
              <div className={config.iconColor}>{displayIcon}</div>
            </div>
          </div>
          <div className='flex-1'>
            <h3 className='text-sm font-medium text-gray-900 mb-1'>{title}</h3>
            <p className='text-sm text-gray-600 mb-3'>{message}</p>
            <div className='flex space-x-2'>
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  if (onConfirm) {
                    try {
                      await onConfirm();
                    } catch (error) {
                      console.error('Error in confirmation callback:', error);
                      // Re-throw to allow the calling code to handle it
                      throw error;
                    }
                  }
                }}
                className={`${config.confirmBg} text-white px-3 py-1.5 text-xs font-medium rounded transition-colors`}
              >
                {confirmText}
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t);
                  if (onCancel) {
                    onCancel();
                  }
                }}
                className='bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-medium rounded hover:bg-gray-200 transition-colors'
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      position: 'top-center',
    },
  );
};

// Convenience functions for common use cases
export const showDeleteConfirmation = (
  itemName: string,
  onConfirm: () => Promise<void> | void,
) => {
  showConfirmation({
    title: `Delete ${itemName}?`,
    message: 'This action cannot be undone.',
    confirmText: 'Delete',
    type: 'danger',
    onConfirm,
  });
};

export const showArchiveConfirmation = (
  itemName: string,
  onConfirm: () => Promise<void> | void,
) => {
  showConfirmation({
    title: `Archive ${itemName}?`,
    message: 'This item will be moved to archived items.',
    confirmText: 'Archive',
    type: 'warning',
    icon: <Archive className='w-5 h-5' />,
    onConfirm,
  });
};
