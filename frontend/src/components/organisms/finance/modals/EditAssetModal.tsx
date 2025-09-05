'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select, {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { AssetItem } from '@/types/asset.types';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: AssetItem | null;
}

const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
}) => {
  const [form, setForm] = useState({
    modelName: '',
    serialNumber: '',
    tagNumber: '',
    status: 'ok',
    purchaseDate: '',
    cost: 0,
    vendor: '',
    warranty: '',
    roomId: '',
  });

  useEffect(() => {
    if (item && isOpen) {
      setForm({
        modelName: item.tagNumber || '',
        serialNumber: item.serialNumber,
        tagNumber: item.tagNumber || '',
        status: item.status,
        purchaseDate: item.purchaseDate,
        cost: item.cost,
        vendor: item.vendor,
        warranty: item.warranty,
        roomId: item.assignedTo?.id || '',
      });
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4 flex items-center justify-center'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='px-6 py-4 border-b flex items-center justify-between bg-white'>
          <div>
            <h2 className='text-lg font-bold text-gray-900'>Edit Asset</h2>
            <p className='text-sm text-gray-500'>Update asset details</p>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 rounded'
          >
            <X />
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            onSuccess();
            onClose();
          }}
          className='p-6 space-y-6'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label>Model *</Label>
              <Select
                value={form.modelName}
                onValueChange={v =>
                  setForm(prev => ({ ...prev, modelName: v }))
                }
              >
                <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
                  <SelectValue placeholder={form.modelName || 'Select model'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={form.modelName || 'default'}>
                    {form.modelName || 'Dell OptiPlex 7080'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category *</Label>
              <Select value={'computer'} onValueChange={() => {}}>
                <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
                  <SelectValue placeholder='Computer' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='computer'>Computer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Serial Number *
              </label>
              <Input
                value={form.serialNumber}
                onChange={e =>
                  setForm(prev => ({ ...prev, serialNumber: e.target.value }))
                }
                className='mt-1 text-base h-12 rounded-lg'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Tag Number
              </label>
              <Input
                value={form.tagNumber}
                onChange={e =>
                  setForm(prev => ({ ...prev, tagNumber: e.target.value }))
                }
                placeholder='e.g., TAG-001'
                className='mt-1 text-base h-12 rounded-lg'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label>Status *</Label>
              <Select
                value={form.status}
                onValueChange={v => setForm(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ok'>OK</SelectItem>
                  <SelectItem value='damaged'>Damaged</SelectItem>
                  <SelectItem value='under_repair'>Under Repair</SelectItem>
                  <SelectItem value='retired'>Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Purchase Date *
              </label>
              <Input
                type='date'
                value={form.purchaseDate}
                onChange={e =>
                  setForm(prev => ({ ...prev, purchaseDate: e.target.value }))
                }
                className='mt-1 text-base h-12 rounded-lg'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Cost ($) *
              </label>
              <Input
                type='number'
                value={form.cost}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    cost: parseFloat(e.target.value) || 0,
                  }))
                }
                className='mt-1 text-base h-12 rounded-lg'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Vendor *
              </label>
              <Input
                value={form.vendor}
                onChange={e =>
                  setForm(prev => ({ ...prev, vendor: e.target.value }))
                }
                className='mt-1 text-base h-12 rounded-lg'
              />
            </div>
            <div>
              <Label>Warranty</Label>
              <Select
                value={form.warranty}
                onValueChange={v => setForm(prev => ({ ...prev, warranty: v }))}
              >
                <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
                  <SelectValue placeholder='Select warranty' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='3 Years'>3 Years</SelectItem>
                  <SelectItem value='1 Year'>1 Year</SelectItem>
                  <SelectItem value='2 Years'>2 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex items-center justify-end space-x-3 pt-4 border-t'>
            <Button
              variant='outline'
              onClick={onClose}
              className='border-gray-200'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-gradient-to-r from-slate-900 to-black text-white'
            >
              Update Asset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssetModal;
