'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface QuickAddUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdItems: any[]) => void;
  modelName: string;
  modelId: string;
}

const QuickAddUnitsModal: React.FC<QuickAddUnitsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  modelName,
  modelId,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For now, just simulate success
      toast.success(`Added ${quantity} units successfully`);
      onSuccess([]);
      onClose();
    } catch (error) {
      toast.error('Failed to add units');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Quick Add Units - {modelName}
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6'>
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Quantity
            </label>
            <input
              type='number'
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              min='1'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div className='flex items-center justify-end space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Units
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddUnitsModal;
