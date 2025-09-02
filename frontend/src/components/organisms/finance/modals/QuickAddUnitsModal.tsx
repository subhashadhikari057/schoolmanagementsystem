import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuickAddUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // return created items for optimistic update
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
  const [purchaseDate, setPurchaseDate] = useState('');
  const [cost, setCost] = useState('');
  const [warranty, setWarranty] = useState('1 year');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }
    if (!purchaseDate) {
      setError('Purchase date is required');
      return;
    }
    if (!cost || parseFloat(cost) <= 0) {
      setError('Cost must be greater than 0');
      return;
    }
    setIsLoading(true);
    setTimeout(async () => {
      const { generateSerial } = await import('@/utils/serial');
      const items = Array.from({ length: quantity }).map(() => ({
        id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
        serialNumber: generateSerial(modelName),
        tagNumber: '',
        status: 'ok' as const,
        purchaseDate,
        cost: parseFloat(cost) || 0,
        warranty,
        vendor: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setIsLoading(false);
      onSuccess(items);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white'>
          <div className='flex items-center space-x-4'>
            <div className='p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl shadow-md text-white'>
              <Plus size={20} />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                Add Units to {modelName}
              </h2>
              <p className='text-sm text-gray-500'>
                Quickly add new units for this model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors'
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className='p-6'>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='quantity'>Quantity</Label>
              <Input
                id='quantity'
                type='number'
                min={1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                disabled={isLoading}
                className='mt-1 w-full'
              />
            </div>
            <div>
              <Label htmlFor='purchaseDate'>Purchase Date</Label>
              <Input
                id='purchaseDate'
                type='date'
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                disabled={isLoading}
                className='mt-1 w-full'
              />
            </div>
            <div>
              <Label htmlFor='cost'>Cost per Unit</Label>
              <Input
                id='cost'
                type='number'
                min={0}
                step='0.01'
                value={cost}
                onChange={e => setCost(e.target.value)}
                disabled={isLoading}
                className='mt-1 w-full'
                leftIcon={<DollarSign size={16} />}
              />
            </div>
            <div>
              <Label htmlFor='warranty'>Warranty</Label>
              <Input
                id='warranty'
                value={warranty}
                onChange={e => setWarranty(e.target.value)}
                disabled={isLoading}
                className='mt-1 w-full'
              />
            </div>
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700'>
                {error}
              </div>
            )}
          </div>
          <div className='flex justify-end items-center mt-6 pt-4 border-t border-gray-100 space-x-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={
                isLoading ||
                quantity < 1 ||
                !purchaseDate ||
                !cost ||
                parseFloat(cost) <= 0
              }
              className='bg-gradient-to-r from-slate-900 to-black text-white'
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
        </form>
      </div>
    </div>
  );
};

export default QuickAddUnitsModal;
