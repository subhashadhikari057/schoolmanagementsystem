'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Package,
  Calendar,
  DollarSign,
  Building2,
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
import type { CreateAssetRequest, AssetCategory } from '@/types/asset.types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  // pass created models back: created model ids/items can be consumed by parent
  onSuccess: (createdModels?: any[]) => void;
  targetRoomId?: string;
}

interface AssetFormData {
  modelName: string;
  category: AssetCategory;
  quantity: number;
  purchaseDate: string;
  costPerUnit: number;
  vendor: string;
  warranty: string;
  description: string;
  manufacturer: string;
  modelNumber: string;
  targetRoomId: string;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetRoomId,
}) => {
  const [formData, setFormData] = useState<AssetFormData>({
    modelName: '',
    category: 'electronics',
    quantity: 1,
    purchaseDate: '',
    costPerUnit: 0,
    vendor: '',
    warranty: '1 year',
    description: '',
    manufacturer: '',
    modelNumber: '',
    targetRoomId: targetRoomId || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'quantity' || name === 'costPerUnit'
          ? parseFloat(value) || 0
          : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.modelName.trim()) {
      setError('Model name is required');
      return;
    }
    if (!formData.vendor.trim()) {
      setError('Vendor is required');
      return;
    }
    if (!formData.purchaseDate) {
      setError('Purchase date is required');
      return;
    }
    if (formData.quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }
    if (formData.costPerUnit <= 0) {
      setError('Cost per unit must be greater than 0');
      return;
    }
    if (!formData.targetRoomId) {
      setError('Target room must be selected');
      return;
    }

    // Frontend-only creation: generate asset model and items, optimistic
    setIsLoading(true);
    const loadingToast = toast.loading('Adding assets...', {
      description: `Creating ${formData.quantity} ${formData.modelName} items`,
    });
    try {
      const { generateSerial } = await import('@/utils/serial');
      const items = Array.from({ length: formData.quantity }).map(() => ({
        id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
        serialNumber: generateSerial(formData.modelName),
        tagNumber: '',
        status: 'ok' as const,
        purchaseDate: formData.purchaseDate,
        cost: formData.costPerUnit,
        warranty: formData.warranty,
        vendor: formData.vendor.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const createdModel = {
        id: `tmp-model-${Math.random().toString(36).slice(2, 9)}`,
        name: formData.modelName.trim(),
        category: formData.category,
        description: formData.description?.trim() || undefined,
        manufacturer: formData.manufacturer?.trim() || undefined,
        modelNumber: formData.modelNumber?.trim() || undefined,
        items,
        totalQuantity: items.length,
        okCount: items.length,
        damagedCount: 0,
        underRepairCount: 0,
        retiredCount: 0,
        totalValue: items.reduce((s, it) => s + (it.cost || 0), 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      toast.dismiss(loadingToast);
      toast.success('Assets added successfully!', {
        description: `${formData.quantity} ${formData.modelName} items have been added`,
        duration: 4000,
      });

      // Reset form
      setFormData({
        modelName: '',
        category: 'electronics',
        quantity: 1,
        purchaseDate: '',
        costPerUnit: 0,
        vendor: '',
        warranty: '1 year',
        description: '',
        manufacturer: '',
        modelNumber: '',
        targetRoomId: targetRoomId || '',
      });

      onSuccess([createdModel]);
      onClose();
    } catch (err: any) {
      console.error('Error adding assets:', err);
      toast.dismiss(loadingToast);
      const errorMessage =
        err.message || 'Failed to add assets. Please try again.';
      toast.error('Failed to add assets', {
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
        modelName: '',
        category: 'electronics',
        quantity: 1,
        purchaseDate: '',
        costPerUnit: 0,
        vendor: '',
        warranty: '1 year',
        description: '',
        manufacturer: '',
        modelNumber: '',
        targetRoomId: targetRoomId || '',
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const categoryOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'books', label: 'Books' },
    { value: 'sports', label: 'Sports Equipment' },
    { value: 'laboratory', label: 'Laboratory Equipment' },
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

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'
      onClick={handleClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white'>
          <div className='flex items-center space-x-4'>
            <div className='p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl shadow-md text-white'>
              <Package size={20} />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                Add New Assets
              </h2>
              <p className='text-sm text-gray-500'>
                Quickly add assets to your inventory
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <div className='text-sm text-gray-600'>Quick add</div>
            <button
              onClick={e => {
                e.stopPropagation();
                handleClose();
              }}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors'
            >
              <X size={18} />
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
            {/* Basic Information */}
            <div className='space-y-3 bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
              <h3 className='text-md font-semibold text-gray-900'>
                Basic Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-3'>
                <div>
                  <label
                    htmlFor='modelName'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Model Name <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    id='modelName'
                    name='modelName'
                    value={formData.modelName}
                    onChange={handleInputChange}
                    placeholder='e.g., Dell OptiPlex 7080'
                    disabled={isLoading}
                    className='mt-1 w-full text-base h-12 rounded-lg'
                  />
                </div>
                <div>
                  <Label htmlFor='category'>
                    Category <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={v =>
                      setFormData(prev => ({
                        ...prev,
                        category: v as AssetCategory,
                      }))
                    }
                  >
                    <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <label
                    htmlFor='manufacturer'
                    className='block text-sm font-semibold text-gray-700'
                  >
                    Manufacturer
                  </label>
                  <Input
                    id='manufacturer'
                    name='manufacturer'
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder='e.g., Dell'
                    disabled={isLoading}
                    className='text-base h-12 rounded-lg'
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='modelNumber'
                    className='block text-sm font-semibold text-gray-700'
                  >
                    Model Number
                  </label>
                  <Input
                    id='modelNumber'
                    name='modelNumber'
                    value={formData.modelNumber}
                    onChange={handleInputChange}
                    placeholder='e.g., OP7080-MT'
                    disabled={isLoading}
                    className='text-base h-12 rounded-lg'
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='quantity'
                    className='block text-sm font-semibold text-gray-700'
                  >
                    Quantity <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='number'
                    id='quantity'
                    name='quantity'
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min='1'
                    disabled={isLoading}
                    className='text-base h-12 rounded-lg'
                  />
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className='space-y-3 bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
              <h3 className='text-md font-semibold text-gray-900'>
                Purchase Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-3'>
                <div className='space-y-2'>
                  <label
                    htmlFor='purchaseDate'
                    className='block text-sm font-semibold text-gray-700'
                  >
                    Purchase Date <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='date'
                    id='purchaseDate'
                    name='purchaseDate'
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='mt-1'
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='costPerUnit'
                    className='block text-sm font-semibold text-gray-700'
                  >
                    Cost per Unit <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='number'
                    step='0.01'
                    id='costPerUnit'
                    name='costPerUnit'
                    value={formData.costPerUnit}
                    onChange={handleInputChange}
                    min='0'
                    placeholder='0.00'
                    disabled={isLoading}
                    leftIcon={<DollarSign size={16} />}
                    className='text-base h-12 rounded-lg'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-3'>
                <div className='space-y-2'>
                  <label
                    htmlFor='vendor'
                    className='block text-sm font-semibold text-gray-700'
                  >
                    Vendor <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    id='vendor'
                    name='vendor'
                    value={formData.vendor}
                    onChange={handleInputChange}
                    placeholder='e.g., TechCorp Solutions'
                    disabled={isLoading}
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
            </div>

            {/* Assignment */}
            <div className='space-y-3 bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
              <h3 className='text-md font-semibold text-gray-900'>
                Room Assignment
              </h3>
              <div className='mt-3 grid grid-cols-1 gap-3'>
                <div>
                  <Label htmlFor='targetRoomId'>
                    Target Room <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={formData.targetRoomId}
                    onValueChange={v =>
                      setFormData(prev => ({ ...prev, targetRoomId: v }))
                    }
                  >
                    <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
                      <SelectValue placeholder='Select a room...' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>None</SelectItem>
                      <SelectItem value='1'>
                        Room 101 - Computer Lab A
                      </SelectItem>
                      <SelectItem value='2'>Room 102 - Science Lab</SelectItem>
                      <SelectItem value='3'>Room 201 - Library</SelectItem>
                      <SelectItem value='4'>
                        Room 301 - Classroom 101
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor='description'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Description
                  </label>
                  <textarea
                    id='description'
                    name='description'
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder='Additional details about the asset...'
                    disabled={isLoading}
                    rows={3}
                    className='mt-1 w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-base text-gray-900 resize-none'
                  />
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
          <div className='flex justify-between items-center mt-6 pt-4 border-t border-gray-100'>
            <div className='text-sm text-gray-600'>
              Total Value:{' '}
              <span className='font-semibold'>
                ${(formData.costPerUnit * formData.quantity).toFixed(2)}
              </span>
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
                  !formData.modelName.trim() ||
                  !formData.vendor.trim() ||
                  !formData.purchaseDate ||
                  formData.quantity < 1 ||
                  formData.costPerUnit <= 0 ||
                  !formData.targetRoomId
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
                    Add Assets
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

export default AddAssetModal;
