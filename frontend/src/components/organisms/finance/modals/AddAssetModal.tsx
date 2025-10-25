'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Package } from 'lucide-react';
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
import type { AssetCategory } from '@/types/asset.types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  // pass created models back: created model ids/items can be consumed by parent
  onSuccess: (createdModels?: any[]) => void;
  targetRoomId?: string;
}

interface AssetFormData {
  // Asset Info
  nameOfAsset: string;
  brand: string;
  modelNo: string;
  serialNo: string;

  // Vendor Info
  vendorName: string;
  vendorPanVat: string;
  vendorAddress: string;
  vendorContactDetails: string;
  paymentTiming: 'installment' | 'full_payment';
  paymentMode: 'cash' | 'bank';
  invoiceDate: string;
  settlementDate: string;

  // Accounting Info
  ledgerNo: string;
  purchaseValue: number;
  transportationCharges: number;
  assetCategory: AssetCategory;
  budgetHead: string;
  noOfQuantity: number;
  rate: number;
  totalValue: number;

  // Management Info
  hsCode: string;
  assignedDate: string;
  assignedPlace: string;
  status: 'under_repair' | 'to_repair' | 'ok' | 'written_off';

  // Form Creation Date
  acquisitionFormCreationDate: string;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetRoomId,
}) => {
  const [formData, setFormData] = useState<AssetFormData>({
    // Asset Info
    nameOfAsset: '',
    brand: '',
    modelNo: '',
    serialNo: '',

    // Vendor Info
    vendorName: '',
    vendorPanVat: '',
    vendorAddress: '',
    vendorContactDetails: '',
    paymentTiming: 'full_payment',
    paymentMode: 'cash',
    invoiceDate: '',
    settlementDate: '',

    // Accounting Info
    ledgerNo: '',
    purchaseValue: 0,
    transportationCharges: 0,
    assetCategory: 'electronics',
    budgetHead: '',
    noOfQuantity: 1,
    rate: 0,
    totalValue: 0,

    // Management Info
    hsCode: '',
    assignedDate: '',
    assignedPlace: targetRoomId || '',
    status: 'ok',

    // Form Creation Date
    acquisitionFormCreationDate: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate total value when rate, quantity, or transportation charges change
  useEffect(() => {
    const calculatedTotal =
      formData.rate * formData.noOfQuantity + formData.transportationCharges;
    if (calculatedTotal !== formData.totalValue) {
      setFormData(prev => ({
        ...prev,
        totalValue: calculatedTotal,
      }));
    }
  }, [formData.rate, formData.noOfQuantity, formData.transportationCharges]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: [
        'purchaseValue',
        'transportationCharges',
        'noOfQuantity',
        'rate',
        'totalValue',
      ].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));

    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.nameOfAsset.trim()) {
      setError('Name of Asset is required');
      return;
    }
    if (!formData.vendorName.trim()) {
      setError('Vendor Name is required');
      return;
    }
    if (!formData.invoiceDate) {
      setError('Invoice Date is required');
      return;
    }
    if (formData.noOfQuantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }
    if (formData.rate <= 0) {
      setError('Rate must be greater than 0');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Adding asset...', {
      description: `Creating ${formData.nameOfAsset}`,
    });

    try {
      // Create asset model with the acquisition data
      const createdModel = {
        id: `tmp-model-${Math.random().toString(36).slice(2, 9)}`,
        name: formData.nameOfAsset.trim(),
        category: formData.assetCategory,
        description: `Brand: ${formData.brand}, Model: ${formData.modelNo}`,
        manufacturer: formData.brand,
        modelNumber: formData.modelNo,
        items: [
          {
            id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
            serialNumber: formData.serialNo || `AUTO-${Date.now()}`,
            tagNumber: `TAG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            status: formData.status === 'ok' ? 'ok' : 'damaged',
            purchaseDate: formData.invoiceDate,
            cost: formData.purchaseValue,
            warranty: '1 year',
            vendor: formData.vendorName.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        totalQuantity: formData.noOfQuantity,
        okCount: formData.status === 'ok' ? formData.noOfQuantity : 0,
        damagedCount: formData.status !== 'ok' ? formData.noOfQuantity : 0,
        underRepairCount: 0,
        retiredCount: 0,
        totalValue: formData.totalValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Additional acquisition metadata
        acquisitionData: {
          vendorPanVat: formData.vendorPanVat,
          vendorAddress: formData.vendorAddress,
          vendorContactDetails: formData.vendorContactDetails,
          paymentTiming: formData.paymentTiming,
          paymentMode: formData.paymentMode,
          settlementDate: formData.settlementDate,
          ledgerNo: formData.ledgerNo,
          transportationCharges: formData.transportationCharges,
          budgetHead: formData.budgetHead,
          hsCode: formData.hsCode,
          assignedDate: formData.assignedDate,
          assignedPlace: formData.assignedPlace,
          acquisitionFormCreationDate: formData.acquisitionFormCreationDate,
        },
      };

      toast.dismiss(loadingToast);
      toast.success('Asset added successfully!', {
        description: `${formData.nameOfAsset} has been added to inventory`,
        duration: 4000,
      });

      // Reset form
      setFormData({
        nameOfAsset: '',
        brand: '',
        modelNo: '',
        serialNo: '',
        vendorName: '',
        vendorPanVat: '',
        vendorAddress: '',
        vendorContactDetails: '',
        paymentTiming: 'full_payment',
        paymentMode: 'cash',
        invoiceDate: '',
        settlementDate: '',
        ledgerNo: '',
        purchaseValue: 0,
        transportationCharges: 0,
        assetCategory: 'electronics',
        budgetHead: '',
        noOfQuantity: 1,
        rate: 0,
        totalValue: 0,
        hsCode: '',
        assignedDate: '',
        assignedPlace: targetRoomId || '',
        status: 'ok',
        acquisitionFormCreationDate: new Date().toISOString().split('T')[0],
      });

      onSuccess([createdModel]);
      onClose();
    } catch (err: any) {
      console.error('Error adding asset:', err);
      toast.dismiss(loadingToast);
      const errorMessage =
        err.message || 'Failed to add asset. Please try again.';
      toast.error('Failed to add asset', {
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
        nameOfAsset: '',
        brand: '',
        modelNo: '',
        serialNo: '',
        vendorName: '',
        vendorPanVat: '',
        vendorAddress: '',
        vendorContactDetails: '',
        paymentTiming: 'full_payment',
        paymentMode: 'cash',
        invoiceDate: '',
        settlementDate: '',
        ledgerNo: '',
        purchaseValue: 0,
        transportationCharges: 0,
        assetCategory: 'electronics',
        budgetHead: '',
        noOfQuantity: 1,
        rate: 0,
        totalValue: 0,
        hsCode: '',
        assignedDate: '',
        assignedPlace: targetRoomId || '',
        status: 'ok',
        acquisitionFormCreationDate: new Date().toISOString().split('T')[0],
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

  return (
    <div
      className='fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200'
      onClick={handleClose}
    >
      <div
        className='bg-gray-50/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200/50'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/60 flex items-center justify-between bg-cyan-500 backdrop-blur-sm sticky top-0 z-10'>
          <div className='flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0'>
            <div className='p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl shadow-md text-white flex-shrink-0'>
              <Package size={18} className='sm:w-5 sm:h-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <h2 className='text-base sm:text-lg font-bold text-white truncate'>
                Asset Acquisition Form
              </h2>
            </div>
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              handleClose();
            }}
            disabled={isLoading}
            className='p-2 text-white/80 hover:text-white rounded-lg transition-colors'
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className='p-4 sm:p-6'
          onClick={e => e.stopPropagation()}
        >
          <div className='space-y-4 sm:space-y-6'>
            {/* Asset Info */}
            <div className='space-y-3 bg-white rounded-lg border border-gray-100 p-3 sm:p-4 shadow-sm'>
              <h3 className='text-sm sm:text-md font-bold text-gray-900 mb-3'>
                Asset Info:
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <div>
                  <label
                    htmlFor='nameOfAsset'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Name Of Asset <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    id='nameOfAsset'
                    name='nameOfAsset'
                    value={formData.nameOfAsset}
                    onChange={handleInputChange}
                    placeholder='Enter asset name'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='brand'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Brand
                  </label>
                  <Input
                    id='brand'
                    name='brand'
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder='Enter brand'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='modelNo'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Model No.
                  </label>
                  <Input
                    id='modelNo'
                    name='modelNo'
                    value={formData.modelNo}
                    onChange={handleInputChange}
                    placeholder='Enter model number'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='serialNo'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Serial NO.
                  </label>
                  <Input
                    id='serialNo'
                    name='serialNo'
                    value={formData.serialNo}
                    onChange={handleInputChange}
                    placeholder='Enter serial number'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
              </div>
            </div>

            {/* Vendor Info */}
            <div className='space-y-3 bg-white rounded-lg border border-gray-100 p-3 sm:p-4 shadow-sm'>
              <h3 className='text-sm sm:text-md font-bold text-gray-900 mb-3'>
                Vendor Info:
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <div>
                  <label
                    htmlFor='vendorName'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Vendor Name <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    id='vendorName'
                    name='vendorName'
                    value={formData.vendorName}
                    onChange={handleInputChange}
                    placeholder='Enter vendor name'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='vendorPanVat'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Vendor PAN/VAT
                  </label>
                  <Input
                    id='vendorPanVat'
                    name='vendorPanVat'
                    value={formData.vendorPanVat}
                    onChange={handleInputChange}
                    placeholder='Enter PAN/VAT number'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div className='sm:col-span-2'>
                  <label
                    htmlFor='vendorAddress'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Vendor Address
                  </label>
                  <Input
                    id='vendorAddress'
                    name='vendorAddress'
                    value={formData.vendorAddress}
                    onChange={handleInputChange}
                    placeholder='Enter vendor address'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='vendorContactDetails'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Vendor Contact Details
                  </label>
                  <Input
                    id='vendorContactDetails'
                    name='vendorContactDetails'
                    value={formData.vendorContactDetails}
                    onChange={handleInputChange}
                    placeholder='Enter contact details'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <Label htmlFor='paymentTiming'>
                    Payment Timing (installment or full payment)
                  </Label>
                  <Select
                    value={formData.paymentTiming}
                    onValueChange={v =>
                      setFormData(prev => ({
                        ...prev,
                        paymentTiming: v as 'installment' | 'full_payment',
                      }))
                    }
                  >
                    <SelectTrigger className='mt-1 h-10'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='full_payment'>Full Payment</SelectItem>
                      <SelectItem value='installment'>Installment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='paymentMode'>Payment Mode (Cash/bank)</Label>
                  <Select
                    value={formData.paymentMode}
                    onValueChange={v =>
                      setFormData(prev => ({
                        ...prev,
                        paymentMode: v as 'cash' | 'bank',
                      }))
                    }
                  >
                    <SelectTrigger className='mt-1 h-10'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='cash'>Cash</SelectItem>
                      <SelectItem value='bank'>Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor='invoiceDate'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Invoice Date <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='date'
                    id='invoiceDate'
                    name='invoiceDate'
                    value={formData.invoiceDate}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='settlementDate'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Settlement Date
                  </label>
                  <Input
                    type='date'
                    id='settlementDate'
                    name='settlementDate'
                    value={formData.settlementDate}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
              </div>
            </div>

            {/* Accounting Info */}
            <div className='space-y-3 bg-white rounded-lg border border-gray-100 p-3 sm:p-4 shadow-sm'>
              <h3 className='text-sm sm:text-md font-bold text-gray-900 mb-3'>
                Accounting Info:
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                <div>
                  <label
                    htmlFor='ledgerNo'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Ledger No.
                  </label>
                  <Input
                    id='ledgerNo'
                    name='ledgerNo'
                    value={formData.ledgerNo}
                    onChange={handleInputChange}
                    placeholder='Enter ledger number'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='purchaseValue'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Purchase value
                  </label>
                  <Input
                    type='number'
                    step='0.01'
                    id='purchaseValue'
                    name='purchaseValue'
                    value={formData.purchaseValue}
                    onChange={handleInputChange}
                    placeholder='0.00'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='transportationCharges'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Transportation Charges
                  </label>
                  <Input
                    type='number'
                    step='0.01'
                    id='transportationCharges'
                    name='transportationCharges'
                    value={formData.transportationCharges}
                    onChange={handleInputChange}
                    placeholder='0.00'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <Label htmlFor='assetCategory'>Asset Category</Label>
                  <Select
                    value={formData.assetCategory}
                    onValueChange={v =>
                      setFormData(prev => ({
                        ...prev,
                        assetCategory: v as AssetCategory,
                      }))
                    }
                  >
                    <SelectTrigger className='mt-1 h-10'>
                      <SelectValue />
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
                <div>
                  <label
                    htmlFor='budgetHead'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Budget Head
                  </label>
                  <Input
                    id='budgetHead'
                    name='budgetHead'
                    value={formData.budgetHead}
                    onChange={handleInputChange}
                    placeholder='Enter budget head'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='noOfQuantity'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    No. of Quantity <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='number'
                    id='noOfQuantity'
                    name='noOfQuantity'
                    value={formData.noOfQuantity}
                    onChange={handleInputChange}
                    min='1'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='rate'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Rate <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='number'
                    step='0.01'
                    id='rate'
                    name='rate'
                    value={formData.rate}
                    onChange={handleInputChange}
                    placeholder='0.00'
                    min='0'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='totalValue'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Total Value
                  </label>
                  <Input
                    type='number'
                    step='0.01'
                    id='totalValue'
                    name='totalValue'
                    value={formData.totalValue}
                    readOnly
                    disabled
                    className='w-full h-10 bg-gray-100'
                  />
                </div>
              </div>
            </div>

            {/* Management Info */}
            <div className='space-y-3 bg-white rounded-lg border border-gray-100 p-3 sm:p-4 shadow-sm'>
              <h3 className='text-sm sm:text-md font-bold text-gray-900 mb-3'>
                Management Info:
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <div>
                  <label
                    htmlFor='hsCode'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    H.S.Code
                  </label>
                  <Input
                    id='hsCode'
                    name='hsCode'
                    value={formData.hsCode}
                    onChange={handleInputChange}
                    placeholder='Enter H.S. Code'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='assignedDate'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Assigned Date
                  </label>
                  <Input
                    type='date'
                    id='assignedDate'
                    name='assignedDate'
                    value={formData.assignedDate}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <label
                    htmlFor='assignedPlace'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Assigned Place
                  </label>
                  <Input
                    id='assignedPlace'
                    name='assignedPlace'
                    value={formData.assignedPlace}
                    onChange={handleInputChange}
                    placeholder='Enter assigned place/room'
                    disabled={isLoading}
                    className='w-full h-10'
                  />
                </div>
                <div>
                  <Label htmlFor='status'>
                    Status(under repair, to repair, ok, written off)
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={v =>
                      setFormData(prev => ({
                        ...prev,
                        status: v as
                          | 'under_repair'
                          | 'to_repair'
                          | 'ok'
                          | 'written_off',
                      }))
                    }
                  >
                    <SelectTrigger className='mt-1 h-10'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ok'>OK</SelectItem>
                      <SelectItem value='to_repair'>To Repair</SelectItem>
                      <SelectItem value='under_repair'>Under Repair</SelectItem>
                      <SelectItem value='written_off'>Written Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Acquisition Form Creation Date */}
            <div className='space-y-3 bg-white rounded-lg border border-gray-100 p-3 sm:p-4 shadow-sm'>
              <div>
                <label
                  htmlFor='acquisitionFormCreationDate'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Acquisition Form Creation Date:
                </label>
                <Input
                  type='date'
                  id='acquisitionFormCreationDate'
                  name='acquisitionFormCreationDate'
                  value={formData.acquisitionFormCreationDate}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full h-10 max-w-xs'
                />
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
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mt-6 pt-4 border-t border-gray-200/60 sticky bottom-0 bg-gray-50/95 backdrop-blur-sm -mx-4 sm:-mx-6 px-4 sm:px-6 py-4'>
            <div className='text-sm text-gray-600'>
              Total Value:{' '}
              <span className='font-bold text-base'>
                ${formData.totalValue.toFixed(2)}
              </span>
            </div>
            <div className='flex flex-col-reverse sm:flex-row space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 w-full sm:w-auto'>
              <Button
                type='button'
                variant='outline'
                onClick={e => {
                  e.stopPropagation();
                  handleClose();
                }}
                disabled={isLoading}
                className='w-full sm:w-auto border-gray-200'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  isLoading ||
                  !formData.nameOfAsset.trim() ||
                  !formData.vendorName.trim() ||
                  !formData.invoiceDate ||
                  formData.noOfQuantity < 1 ||
                  formData.rate <= 0
                }
                className='w-full sm:w-auto bg-gradient-to-r from-slate-900 to-black text-white'
              >
                {isLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2'></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} className='mr-2' />
                    Add Asset
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
