'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Package, Calendar, DollarSign, Wand2 } from 'lucide-react';
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

interface AssetUnit {
  id: string;
  serialNumber: string;
  tagNumber: string;
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
  const [assetUnits, setAssetUnits] = useState<AssetUnit[]>([
    { id: '1', serialNumber: '', tagNumber: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    const currentUnits = [...assetUnits];

    if (newQuantity > currentUnits.length) {
      // Add more units
      for (let i = currentUnits.length; i < newQuantity; i++) {
        currentUnits.push({
          id: String(i + 1),
          serialNumber: '',
          tagNumber: '',
        });
      }
    } else if (newQuantity < currentUnits.length) {
      // Remove excess units
      currentUnits.splice(newQuantity);
    }

    setAssetUnits(currentUnits);
  };

  const handleUnitChange = (
    unitId: string,
    field: 'serialNumber' | 'tagNumber',
    value: string,
  ) => {
    setAssetUnits(prev =>
      prev.map(unit =>
        unit.id === unitId ? { ...unit, [field]: value } : unit,
      ),
    );
  };

  const generateSerialNumbers = async () => {
    const { generateSerial } = await import('@/utils/serial');
    setAssetUnits(prev =>
      prev.map(unit => ({
        ...unit,
        serialNumber: unit.serialNumber || generateSerial(modelName || 'ASSET'),
        tagNumber:
          unit.tagNumber ||
          `TAG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      })),
    );
  };

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    // Reset minimal state
    setQuantity(1);
    setCostPerUnit(0);
    setVendor('');
    setWarranty('1 year');
    setAssetUnits([{ id: '1', serialNumber: '', tagNumber: '' }]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1) return;

    // Validate that all units have serial numbers
    const emptySerials = assetUnits.filter(unit => !unit.serialNumber.trim());
    if (emptySerials.length > 0) {
      toast.error(`Please provide serial numbers for all ${quantity} units`);
      return;
    }

    // Check for duplicate serial numbers
    const serialNumbers = assetUnits.map(unit => unit.serialNumber.trim());
    const duplicates = serialNumbers.filter(
      (serial, index) => serialNumbers.indexOf(serial) !== index,
    );
    if (duplicates.length > 0) {
      toast.error('Serial numbers must be unique');
      return;
    }

    setIsLoading(true);
    const loading = toast.loading('Adding units...', {
      description: `${quantity} × ${modelName}`,
    });
    try {
      const items = assetUnits.map(unit => ({
        id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
        serialNumber: unit.serialNumber.trim(),
        tagNumber:
          unit.tagNumber.trim() ||
          `TAG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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
                onChange={e =>
                  handleQuantityChange(parseInt(e.target.value) || 1)
                }
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

          {/* Individual Asset Units */}
          <div className='space-y-3 border border-gray-200 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-md font-semibold text-gray-900'>
                Individual Units ({assetUnits.length})
              </h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={generateSerialNumbers}
                className='text-xs'
              >
                Auto-generate
              </Button>
            </div>
            <p className='text-xs text-gray-500 mb-3'>
              Enter serial numbers and tag numbers for each unit
            </p>

            <div className='space-y-3 max-h-48 overflow-y-auto'>
              {assetUnits.map((unit, index) => (
                <div
                  key={unit.id}
                  className='grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50'
                >
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Unit {index + 1} - Serial Number{' '}
                      <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      value={unit.serialNumber}
                      onChange={e =>
                        handleUnitChange(
                          unit.id,
                          'serialNumber',
                          e.target.value,
                        )
                      }
                      placeholder={`e.g., SN${String(index + 1).padStart(3, '0')}`}
                      className='text-sm h-9'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Unit {index + 1} - Tag Number
                    </label>
                    <Input
                      value={unit.tagNumber}
                      onChange={e =>
                        handleUnitChange(unit.id, 'tagNumber', e.target.value)
                      }
                      placeholder={`e.g., TAG-${String(index + 1).padStart(3, '0')}`}
                      className='text-sm h-9'
                    />
                  </div>
                </div>
              ))}
            </div>
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
                disabled={
                  isLoading ||
                  quantity < 1 ||
                  assetUnits.some(unit => !unit.serialNumber.trim())
                }
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
