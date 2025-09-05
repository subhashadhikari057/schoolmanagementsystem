'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Package, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface QuickAddUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Return the created items so parent can update local state
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
  const [quantity, setQuantity] = useState<number>(1);
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [warranty, setWarranty] = useState<string>('1 year');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    // Reset minimal state
    setQuantity(1);
    setCostPerUnit(0);
    setVendor('');
    setWarranty('1 year');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1) return;

    setIsLoading(true);
    const loading = toast.loading('Adding units...', {
      description: `${quantity} × ${modelName}`,
    });
    try {
      const { generateSerial } = await import('@/utils/serial');
      const items = Array.from({ length: quantity }).map(() => ({
        id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
        serialNumber: generateSerial(modelName),
        tagNumber: '',
        status: 'ok' as const,
        purchaseDate,
        cost: costPerUnit,
        warranty,
        vendor: vendor.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: { type: 'room', id: '', name: '' },
        // model reference is optional on item in this UI-only flow
        _modelId: modelId,
      }));

      toast.dismiss(loading);
      toast.success('Units added', {
        description: `${items.length} unit${items.length > 1 ? 's' : ''} created for ${modelName}`,
      });

      onSuccess(items);
      handleClose();
    } catch (err) {
      console.error(err);
      toast.dismiss(loading);
      toast.error('Failed to add units');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4 flex items-center justify-center'
      onClick={handleClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        <div className='px-5 py-4 border-b flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='p-2.5 bg-emerald-600 text-white rounded-xl'>
              <Package size={18} />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                Quick add units
              </h2>
              <p className='text-sm text-gray-500'>Model: {modelName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className='p-2 text-gray-400 hover:text-gray-600 rounded'
            disabled={isLoading}
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-5 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Quantity <span className='text-red-500'>*</span>
              </label>
              <Input
                type='number'
                min={1}
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                className='mt-1 h-11 text-base'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Cost per unit
              </label>
              <Input
                type='number'
                step='0.01'
                min={0}
                value={costPerUnit}
                onChange={e => setCostPerUnit(parseFloat(e.target.value) || 0)}
                leftIcon={<DollarSign size={16} />}
                className='mt-1 h-11 text-base'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Purchase date
              </label>
              <Input
                type='date'
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                leftIcon={<Calendar size={16} />}
                className='mt-1 h-11 text-base'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Warranty
              </label>
              <Input
                value={warranty}
                onChange={e => setWarranty(e.target.value)}
                placeholder='e.g., 1 year'
                className='mt-1 h-11 text-base'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Vendor
            </label>
            <Input
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              placeholder='e.g., TechCorp Solutions'
              className='mt-1 h-11 text-base'
            />
          </div>

          <div className='flex items-center justify-between pt-4 border-t'>
            <div className='text-sm text-gray-600'>
              Total:{' '}
              <span className='font-semibold'>
                ${(quantity * costPerUnit).toFixed(2)}
              </span>
            </div>
            <div className='flex space-x-3'>
              <Button type='button' variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isLoading || quantity < 1}
                className='bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
              >
                {isLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2'></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} className='mr-2' />
                    Add Units
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddUnitsModal;
