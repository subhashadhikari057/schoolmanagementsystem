'use client';

import React, { useState } from 'react';
import { X, ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type {
  RecordAcquisitionRequest,
  AssetStatus,
} from '@/types/asset.types';

interface RecordAcquisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomId: string;
}

const RecordAcquisitionModal: React.FC<RecordAcquisitionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roomId,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RecordAcquisitionRequest>({
    assetName: '',
    brand: '',
    modelNo: '',
    category: '',
    serials: [],
    warrantyMonths: 12,
    quantity: 1,
    unitCost: 0,
    attachments: [],
    vendor: {
      name: '',
      panVat: '',
      address: '',
      contact: '',
      paymentTiming: 'FULL',
      paymentMode: 'BANK',
      invoiceDate: '',
      settlementDate: '',
    },
    management: {
      roomId: roomId,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'IN_SERVICE',
      hsCode: '',
      notes: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Submit to API
      toast.success('Acquisition recorded successfully');
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Failed to record acquisition:', error);
      toast.error('Failed to record acquisition');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      assetName: '',
      brand: '',
      modelNo: '',
      category: '',
      serials: [],
      warrantyMonths: 12,
      quantity: 1,
      unitCost: 0,
      attachments: [],
      vendor: {
        name: '',
        panVat: '',
        address: '',
        contact: '',
        paymentTiming: 'FULL',
        paymentMode: 'BANK',
        invoiceDate: '',
        settlementDate: '',
      },
      management: {
        roomId: roomId,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'IN_SERVICE',
        hsCode: '',
        notes: '',
      },
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200'
      onClick={onClose}
    >
      <div
        className='bg-gray-50/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl max-w-[95vw] sm:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200/50'
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/60 bg-white/90 backdrop-blur-sm sticky top-0 z-10'>
          <div className='flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0'>
            <ShoppingCart className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0' />
            <h2 className='text-base sm:text-xl font-semibold text-gray-900 truncate'>
              Record Acquisition
            </h2>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            className='flex-shrink-0'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='p-4 sm:p-6 space-y-6 sm:space-y-8'
        >
          {/* Asset Info Section */}
          <div className='bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-gray-200/40'>
            <h4 className='text-sm sm:text-md font-medium text-gray-900 mb-3 sm:mb-4'>
              Asset Information
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div>
                <Label htmlFor='assetName'>Asset Name *</Label>
                <Input
                  id='assetName'
                  value={formData.assetName}
                  onChange={e =>
                    setFormData({ ...formData, assetName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor='category'>Category *</Label>
                <select
                  id='category'
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                >
                  <option value=''>Select Category</option>
                  <option value='electronics'>Electronics</option>
                  <option value='furniture'>Furniture</option>
                  <option value='books'>Books</option>
                  <option value='sports'>Sports</option>
                  <option value='laboratory'>Laboratory</option>
                  <option value='other'>Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor='brand'>Brand</Label>
                <Input
                  id='brand'
                  value={formData.brand}
                  onChange={e =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor='modelNo'>Model No.</Label>
                <Input
                  id='modelNo'
                  value={formData.modelNo}
                  onChange={e =>
                    setFormData({ ...formData, modelNo: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor='quantity'>Quantity *</Label>
                <Input
                  id='quantity'
                  type='number'
                  min='1'
                  value={formData.quantity}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor='warrantyMonths'>Warranty (Months)</Label>
                <Input
                  id='warrantyMonths'
                  type='number'
                  min='0'
                  value={formData.warrantyMonths}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      warrantyMonths: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor='unitCost'>Unit Cost</Label>
                <Input
                  id='unitCost'
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.unitCost}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      unitCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Total Value</Label>
                <div className='px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700'>
                  {formatCurrency(formData.quantity * (formData.unitCost || 0))}
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Info Section */}
          <div className='bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-gray-200/40'>
            <h4 className='text-sm sm:text-md font-medium text-gray-900 mb-3 sm:mb-4'>
              Vendor Information
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div>
                <Label htmlFor='vendorName'>Vendor Name *</Label>
                <Input
                  id='vendorName'
                  value={formData.vendor.name}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      vendor: { ...formData.vendor, name: e.target.value },
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor='vendorPan'>Vendor PAN/VAT</Label>
                <Input
                  id='vendorPan'
                  value={formData.vendor.panVat}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      vendor: { ...formData.vendor, panVat: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor='vendorContact'>Contact</Label>
                <Input
                  id='vendorContact'
                  value={formData.vendor.contact}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      vendor: { ...formData.vendor, contact: e.target.value },
                    })
                  }
                  placeholder='Phone/Email'
                />
              </div>
              <div>
                <Label htmlFor='invoiceDate'>Invoice Date</Label>
                <Input
                  id='invoiceDate'
                  type='date'
                  value={formData.vendor.invoiceDate}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      vendor: {
                        ...formData.vendor,
                        invoiceDate: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className='md:col-span-2'>
                <Label htmlFor='vendorAddress'>Address</Label>
                <Textarea
                  id='vendorAddress'
                  value={formData.vendor.address}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      vendor: { ...formData.vendor, address: e.target.value },
                    })
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Management Info Section */}
          <div className='bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-gray-200/40'>
            <h4 className='text-sm sm:text-md font-medium text-gray-900 mb-3 sm:mb-4'>
              Management Information
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div>
                <Label htmlFor='assignedDate'>Assigned Date</Label>
                <Input
                  id='assignedDate'
                  type='date'
                  value={formData.management.assignedDate}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      management: {
                        ...formData.management,
                        assignedDate: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor='initialStatus'>Initial Status</Label>
                <select
                  id='initialStatus'
                  value={formData.management.status}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      management: {
                        ...formData.management,
                        status: e.target.value as AssetStatus,
                      },
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='IN_SERVICE'>In Service</option>
                  <option value='UNDER_REPAIR'>Under Repair</option>
                  <option value='DAMAGED'>Damaged</option>
                  <option value='DISPOSED'>Disposed</option>
                </select>
              </div>
              <div>
                <Label htmlFor='hsCode'>H.S. Code</Label>
                <Input
                  id='hsCode'
                  value={formData.management.hsCode}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      management: {
                        ...formData.management,
                        hsCode: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Assigned Room</Label>
                <div className='px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700'>
                  Room {roomId}
                </div>
              </div>
              <div className='sm:col-span-2'>
                <Label htmlFor='notes'>Notes</Label>
                <Textarea
                  id='notes'
                  value={formData.management.notes}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      management: {
                        ...formData.management,
                        notes: e.target.value,
                      },
                    })
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100/50'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={loading}
              className='w-full sm:w-auto'
            >
              {loading ? 'Recording...' : 'Record Acquisition'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordAcquisitionModal;
