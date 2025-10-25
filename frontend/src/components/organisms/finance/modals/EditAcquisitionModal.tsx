'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Save,
  Building,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Acquisition } from '@/types/asset.types';

interface EditAcquisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  acquisition: Acquisition | null;
  onSave: (updatedAcquisition: Acquisition) => void;
}

const EditAcquisitionModal: React.FC<EditAcquisitionModalProps> = ({
  isOpen,
  onClose,
  acquisition,
  onSave,
}) => {
  const [formData, setFormData] = useState<Acquisition | null>(acquisition);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form data when acquisition changes
  React.useEffect(() => {
    setFormData(acquisition);
  }, [acquisition]);

  if (!formData) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section?: string,
    nestedField?: string,
  ) => {
    const { name, value } = e.target;

    if (section && nestedField) {
      // Handle nested fields like vendor.name
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: {
            ...(prev[section as keyof Acquisition] as any),
            [nestedField]: value,
          },
        };
      });
    } else if (section) {
      // Handle fields inside a section like management.notes
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: {
            ...(prev[section as keyof Acquisition] as any),
            [name]: value,
          },
        };
      });
    } else {
      // Handle top-level fields
      setFormData(prev => {
        if (!prev) return prev;

        // Convert to number if field should be numeric
        const numericFields = [
          'quantity',
          'unitCost',
          'totalValue',
          'warrantyMonths',
        ];
        const newValue = numericFields.includes(name)
          ? parseFloat(value) || 0
          : value;

        return {
          ...prev,
          [name]: newValue,
        };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    setIsSaving(true);

    try {
      // In a real app, you'd make an API call here
      // await updateAcquisition(formData);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      onSave(formData);
      toast.success('Acquisition updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update acquisition:', error);
      toast.error('Failed to update acquisition');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <div className='flex items-center mb-2'>
            <div className='bg-amber-100 p-2 rounded-full mr-3'>
              <ShoppingCart className='h-5 w-5 text-amber-600' />
            </div>
            <DialogTitle className='text-xl'>Edit Acquisition</DialogTitle>
          </div>
          <DialogDescription>
            Update acquisition information and management details
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='space-y-6 overflow-y-auto max-h-[65vh] pr-2'
        >
          {/* Asset Information Section */}
          <div className='bg-blue-50 rounded-lg p-4'>
            <h3 className='text-lg font-medium text-blue-800 mb-3 flex items-center'>
              <Package className='h-5 w-5 mr-2' />
              Asset Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='assetName'>Asset Name</Label>
                <Input
                  id='assetName'
                  name='assetName'
                  value={formData.assetName || ''}
                  onChange={e => handleChange(e)}
                  required
                />
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div className='space-y-2'>
                  <Label htmlFor='brand'>Brand</Label>
                  <Input
                    id='brand'
                    name='brand'
                    value={formData.brand || ''}
                    onChange={e => handleChange(e)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='modelNo'>Model No</Label>
                  <Input
                    id='modelNo'
                    name='modelNo'
                    value={formData.modelNo || ''}
                    onChange={e => handleChange(e)}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='category'>Category</Label>
                <Input
                  id='category'
                  name='category'
                  value={formData.category || ''}
                  onChange={e => handleChange(e)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='warrantyMonths'>Warranty (Months)</Label>
                <Input
                  id='warrantyMonths'
                  name='warrantyMonths'
                  type='number'
                  min='0'
                  value={formData.warrantyMonths || 0}
                  onChange={e => handleChange(e)}
                />
              </div>
            </div>
          </div>

          {/* Financial Information Section */}
          <div className='bg-green-50 rounded-lg p-4'>
            <h3 className='text-lg font-medium text-green-800 mb-3 flex items-center'>
              <DollarSign className='h-5 w-5 mr-2' />
              Financial Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='quantity'>Quantity</Label>
                <Input
                  id='quantity'
                  name='quantity'
                  type='number'
                  min='1'
                  value={formData.quantity || 1}
                  onChange={e => handleChange(e)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='unitCost'>Unit Cost</Label>
                <Input
                  id='unitCost'
                  name='unitCost'
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.unitCost || 0}
                  onChange={e => handleChange(e)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='totalValue'>Total Value</Label>
                <Input
                  id='totalValue'
                  name='totalValue'
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.totalValue || 0}
                  onChange={e => handleChange(e)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='paymentMode'>Payment Mode</Label>
                <Input
                  id='paymentMode'
                  name='paymentMode'
                  value={formData.vendor?.paymentMode || ''}
                  onChange={e => handleChange(e, 'vendor', 'paymentMode')}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='paymentTiming'>Payment Timing</Label>
                <Input
                  id='paymentTiming'
                  name='paymentTiming'
                  value={formData.vendor?.paymentTiming || ''}
                  onChange={e => handleChange(e, 'vendor', 'paymentTiming')}
                />
              </div>
            </div>
          </div>

          {/* Vendor Information Section */}
          <div className='bg-purple-50 rounded-lg p-4'>
            <h3 className='text-lg font-medium text-purple-800 mb-3 flex items-center'>
              <Building className='h-5 w-5 mr-2' />
              Vendor Information
            </h3>
            <div className='grid grid-cols-1 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='vendorName'>Vendor Name</Label>
                <Input
                  id='vendorName'
                  name='name'
                  value={formData.vendor?.name || ''}
                  onChange={e => handleChange(e, 'vendor', 'name')}
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='panVat'>PAN/VAT Number</Label>
                  <Input
                    id='panVat'
                    name='panVat'
                    value={formData.vendor?.panVat || ''}
                    onChange={e => handleChange(e, 'vendor', 'panVat')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='invoiceDate'>Invoice Date</Label>
                  <Input
                    id='invoiceDate'
                    name='invoiceDate'
                    type='date'
                    value={formData.vendor?.invoiceDate?.split('T')[0] || ''}
                    onChange={e => handleChange(e, 'vendor', 'invoiceDate')}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='contact'>Contact</Label>
                <Input
                  id='contact'
                  name='contact'
                  value={formData.vendor?.contact || ''}
                  onChange={e => handleChange(e, 'vendor', 'contact')}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='address'>Address</Label>
                <Textarea
                  id='address'
                  name='address'
                  value={formData.vendor?.address || ''}
                  onChange={e => handleChange(e, 'vendor', 'address')}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Management Information Section */}
          <div className='bg-amber-50 rounded-lg p-4'>
            <h3 className='text-lg font-medium text-amber-800 mb-3 flex items-center'>
              <FileText className='h-5 w-5 mr-2' />
              Management Information
            </h3>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='assignedDate'>Assigned Date</Label>
                <Input
                  id='assignedDate'
                  name='assignedDate'
                  type='date'
                  value={formData.management?.assignedDate?.split('T')[0] || ''}
                  onChange={e => handleChange(e, 'management')}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='notes'>Notes</Label>
                <Textarea
                  id='notes'
                  name='notes'
                  value={formData.management?.notes || ''}
                  onChange={e => handleChange(e, 'management')}
                  rows={3}
                  placeholder='Add any additional notes or comments here...'
                />
              </div>
            </div>
          </div>
        </form>

        <Separator className='my-4' />

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose} type='button'>
            Cancel
          </Button>
          <Button
            type='submit'
            onClick={handleSubmit}
            disabled={isSaving}
            className='bg-amber-600 hover:bg-amber-700'
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className='h-4 w-4 mr-2' />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAcquisitionModal;
