'use client';

import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select, {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { AssetItem, ReplaceAssetRequest } from '@/types/asset.types';

interface ReplaceAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  // optionally return the new created item
  onSuccess: (createdItem?: any) => void;
  item: AssetItem | null;
}

interface ReplaceFormData {
  reason: string;
  newSerialNumber: string;
  newTagNumber: string;
  purchaseDate: string;
  cost: number;
  vendor: string;
  warranty: string;
  retireOldItem: boolean;
}

const ReplaceAssetModal: React.FC<ReplaceAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
}) => {
  const [formData, setFormData] = useState<ReplaceFormData>({
    reason: '',
    newSerialNumber: '',
    newTagNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    cost: 0,
    vendor: '',
    warranty: '1 year',
    retireOldItem: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when item changes
  React.useEffect(() => {
    if (item && isOpen) {
      (async () => {
        const { generateSerial } = await import('@/utils/serial');
        setFormData(prev => ({
          ...prev,
          reason:
            item.status === 'damaged' ? 'damaged_beyond_repair' : 'upgrade',
          vendor: item.vendor || '',
          newSerialNumber: generateSerial(
            item.tagNumber || item.serialNumber || undefined,
          ),
          newTagNumber: `TAG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        }));
      })();
    }
  }, [item, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'cost'
            ? parseFloat(value) || 0
            : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setError(null);

    // Basic validation
    if (!formData.reason) {
      setError('Replacement reason is required');
      return;
    }
    if (!formData.newSerialNumber.trim()) {
      setError('New serial number is required');
      return;
    }
    if (!formData.purchaseDate) {
      setError('Purchase date is required');
      return;
    }
    if (formData.cost <= 0) {
      setError('Cost must be greater than 0');
      return;
    }
    if (!formData.vendor.trim()) {
      setError('Vendor is required');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Processing replacement...', {
      description: `Replacing ${item.serialNumber}`,
    });

    try {
      // Frontend-only replacement: create new item object
      await new Promise(resolve => setTimeout(resolve, 800));
      const createdItem = {
        id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
        serialNumber: formData.newSerialNumber.trim(),
        tagNumber:
          formData.newTagNumber.trim() ||
          `TAG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        status: 'ok' as const,
        purchaseDate: formData.purchaseDate,
        cost: formData.cost,
        warranty: formData.warranty,
        vendor: formData.vendor.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      toast.dismiss(loadingToast);
      toast.success('Asset replaced successfully!', {
        description: `${item.serialNumber} has been ${formData.retireOldItem ? 'retired and replaced' : 'replaced'} with ${formData.newSerialNumber}`,
        duration: 4000,
      });

      // Reset form
      setFormData({
        reason: '',
        newSerialNumber: '',
        newTagNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: 0,
        vendor: '',
        warranty: '1 year',
        retireOldItem: true,
      });

      onSuccess(createdItem);
      onClose();
    } catch (err: any) {
      console.error('Error replacing asset:', err);
      toast.dismiss(loadingToast);
      const errorMessage =
        err.message || 'Failed to replace asset. Please try again.';
      toast.error('Replacement failed', {
        description: errorMessage,
        duration: 6000,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        reason: '',
        newSerialNumber: '',
        newTagNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: 0,
        vendor: '',
        warranty: '1 year',
        retireOldItem: true,
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  const reasonOptions = [
    { value: 'damaged_beyond_repair', label: 'Damaged Beyond Repair' },
    { value: 'end_of_life', label: 'End of Life' },
    { value: 'upgrade', label: 'Technology Upgrade' },
    { value: 'lost_stolen', label: 'Lost or Stolen' },
    { value: 'warranty_replacement', label: 'Warranty Replacement' },
    { value: 'other', label: 'Other' },
  ];

  const warrantyOptions = [
    '6 months',
    '1 year',
    '2 years',
    '3 years',
    '5 years',
    'Lifetime',
    'No warranty',
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      case 'under_repair':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'
      onClick={handleClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-pink-200/30 rounded-full blur-2xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg'>
                <RotateCcw size={22} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  Replace Asset
                </h2>
                <p className='text-sm text-gray-600 mt-1'>
                  Replace existing asset with a new one
                </p>
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                handleClose();
              }}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className='p-6'
          onClick={e => e.stopPropagation()}
        >
          <div className='space-y-6'>
            {/* Old Asset Summary */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3 flex items-center'>
                <Package className='h-5 w-5 mr-2' />
                Current Asset (Read-only)
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div>
                  <label className='block text-gray-700 font-medium mb-1'>
                    Serial Number
                  </label>
                  <div className='font-mono bg-white p-2 rounded border'>
                    {item.serialNumber}
                  </div>
                </div>
                <div>
                  <label className='block text-gray-700 font-medium mb-1'>
                    Tag Number
                  </label>
                  <div className='font-mono bg-white p-2 rounded border'>
                    {item.tagNumber}
                  </div>
                </div>
                <div>
                  <label className='block text-gray-700 font-medium mb-1'>
                    Status
                  </label>
                  <div className='bg-white p-2 rounded border'>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className='block text-gray-700 font-medium mb-1'>
                    Purchase Cost
                  </label>
                  <div className='bg-white p-2 rounded border'>
                    ${item.cost.toFixed(2)}
                  </div>
                </div>
                <div className='md:col-span-2'>
                  <label className='block text-gray-700 font-medium mb-1'>
                    Vendor
                  </label>
                  <div className='bg-white p-2 rounded border'>
                    {item.vendor}
                  </div>
                </div>
                {item.lastEvent && (
                  <div className='md:col-span-2'>
                    <label className='block text-gray-700 font-medium mb-1'>
                      Last Event
                    </label>
                    <div className='bg-white p-2 rounded border'>
                      <div className='flex items-center space-x-2'>
                        <AlertTriangle className='h-4 w-4 text-orange-500' />
                        <span className='font-medium'>
                          {item.lastEvent.type}
                        </span>
                        <span className='text-gray-500'>•</span>
                        <span className='text-gray-600'>
                          {new Date(item.lastEvent.date).toLocaleDateString()}
                        </span>
                      </div>
                      {item.lastEvent.description && (
                        <p className='text-gray-600 mt-1 text-sm'>
                          {item.lastEvent.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Replacement Reason */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                Replacement Details
              </h3>

              <div className='space-y-2'>
                <Label htmlFor='reason'>
                  Replacement Reason <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.reason}
                  onValueChange={v =>
                    setFormData(prev => ({ ...prev, reason: v }))
                  }
                >
                  <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
                    <SelectValue placeholder='Select a reason...' />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* New Asset Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                New Asset Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='newSerialNumber'>
                    New Serial Number <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='newSerialNumber'
                    name='newSerialNumber'
                    value={formData.newSerialNumber}
                    onChange={handleInputChange}
                    placeholder='Enter serial number'
                    disabled={isLoading}
                    className='w-full font-mono text-base h-12 rounded-lg'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='newTagNumber'>New Tag Number</Label>
                  <Input
                    id='newTagNumber'
                    name='newTagNumber'
                    value={formData.newTagNumber}
                    onChange={handleInputChange}
                    placeholder='Enter tag number (optional)'
                    disabled={isLoading}
                    className='w-full text-base h-12 rounded-lg'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='purchaseDate'>
                    Purchase Date <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    type='date'
                    id='purchaseDate'
                    name='purchaseDate'
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    leftIcon={<Calendar size={16} />}
                    className='text-base h-12 rounded-lg'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='cost'>
                    Cost <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    type='number'
                    step='0.01'
                    id='cost'
                    name='cost'
                    value={formData.cost}
                    onChange={handleInputChange}
                    min='0'
                    placeholder='0.00'
                    disabled={isLoading}
                    leftIcon={<DollarSign size={16} />}
                    className='text-base h-12 rounded-lg'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='vendor'>
                    Vendor <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='vendor'
                    name='vendor'
                    value={formData.vendor}
                    onChange={handleInputChange}
                    placeholder='e.g., TechCorp Solutions'
                    disabled={isLoading}
                    className='text-base h-12 rounded-lg'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='warranty'>Warranty Period</Label>
                  <Select
                    value={formData.warranty}
                    onValueChange={v =>
                      setFormData(prev => ({ ...prev, warranty: v }))
                    }
                  >
                    <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
                      <SelectValue placeholder='Select warranty' />
                    </SelectTrigger>
                    <SelectContent>
                      {warrantyOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Retire Old Item Checkbox */}
              <div className='flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                <input
                  type='checkbox'
                  id='retireOldItem'
                  name='retireOldItem'
                  checked={formData.retireOldItem}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded'
                />
                <div>
                  <label
                    htmlFor='retireOldItem'
                    className='text-sm font-medium text-gray-900 cursor-pointer'
                  >
                    Retire old item
                  </label>
                  <p className='text-xs text-gray-600 mt-1'>
                    Check this to mark the old asset as retired. Uncheck if you
                    want to keep it active (e.g., for repair).
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4 animate-in slide-in-from-top-2'>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                  <p className='text-sm text-red-700 font-medium'>{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex justify-between items-center mt-8 pt-4 border-t border-gray-100'>
            <div className='text-sm text-gray-600'>
              <span className='font-medium'>Cost Impact:</span> +$
              {formData.cost.toFixed(2)}
            </div>

            <div className='flex space-x-3'>
              <Button
                type='button'
                variant='outline'
                onClick={e => {
                  e.stopPropagation();
                  handleClose();
                }}
                disabled={isLoading}
                className='border-gray-200'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  isLoading ||
                  !formData.reason ||
                  !formData.newSerialNumber.trim() ||
                  !formData.purchaseDate ||
                  formData.cost <= 0 ||
                  !formData.vendor.trim()
                }
                className='bg-gradient-to-r from-slate-900 to-black text-white hover:opacity-95'
              >
                {isLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2'></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} className='mr-2' />
                    Replace Asset
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

export default ReplaceAssetModal;
