'use client';

import React from 'react';
import {
  ShoppingCart,
  Calendar,
  Package,
  Building,
  Phone,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  Tag,
  Bookmark,
  MapPin,
  Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Acquisition } from '@/types/asset.types';

interface ViewAcquisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  acquisition: Acquisition | null;
}

const ViewAcquisitionModal: React.FC<ViewAcquisitionModalProps> = ({
  isOpen,
  onClose,
  acquisition,
}) => {
  if (!acquisition) return null;

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <div className='flex items-center mb-2'>
            <div className='bg-blue-100 p-2 rounded-full mr-3'>
              <ShoppingCart className='h-5 w-5 text-blue-600' />
            </div>
            <DialogTitle className='text-xl'>Acquisition Details</DialogTitle>
          </div>
          <DialogDescription>
            View complete information about this asset acquisition
          </DialogDescription>
        </DialogHeader>

        <div className='overflow-y-auto max-h-[70vh] pr-2'>
          {/* Asset Information */}
          <div className='bg-blue-50 rounded-lg p-4 mb-6'>
            <h3 className='text-lg font-medium text-blue-800 mb-3 flex items-center'>
              <Package className='h-5 w-5 mr-2' />
              Asset Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Asset Name</p>
                <p className='text-base font-medium'>{acquisition.assetName}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Brand & Model</p>
                <p className='text-base font-medium'>
                  {acquisition.brand}{' '}
                  {acquisition.modelNo && `• ${acquisition.modelNo}`}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Category</p>
                <p className='text-base font-medium capitalize'>
                  {acquisition.category || 'Not Specified'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Status</p>
                <Badge
                  className={`
                  ${
                    acquisition.management.status === 'IN_SERVICE'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }
                `}
                >
                  {acquisition.management.status?.replace('_', ' ') ||
                    'Processing'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className='bg-green-50 rounded-lg p-4 mb-6'>
            <h3 className='text-lg font-medium text-green-800 mb-3 flex items-center'>
              <DollarSign className='h-5 w-5 mr-2' />
              Financial Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Quantity</p>
                <p className='text-base font-medium'>{acquisition.quantity}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Unit Cost</p>
                <p className='text-base font-medium'>
                  {formatCurrency(acquisition.unitCost)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Total Value</p>
                <p className='text-base font-medium'>
                  {formatCurrency(acquisition.totalValue)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Payment Mode</p>
                <p className='text-base font-medium'>
                  {acquisition.vendor.paymentMode || 'Not Specified'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Payment Timing</p>
                <p className='text-base font-medium'>
                  {acquisition.vendor.paymentTiming || 'Not Specified'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Warranty</p>
                <p className='text-base font-medium'>
                  {acquisition.warrantyMonths
                    ? `${acquisition.warrantyMonths} months`
                    : 'None'}
                </p>
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className='bg-purple-50 rounded-lg p-4 mb-6'>
            <h3 className='text-lg font-medium text-purple-800 mb-3 flex items-center'>
              <Building className='h-5 w-5 mr-2' />
              Vendor Information
            </h3>
            <div className='grid grid-cols-1 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Vendor Name</p>
                <p className='text-base font-medium'>
                  {acquisition.vendor.name}
                </p>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>PAN/VAT Number</p>
                  <p className='text-base font-medium'>
                    {acquisition.vendor.panVat || 'Not Available'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Invoice Date</p>
                  <p className='text-base font-medium'>
                    {formatDate(acquisition.vendor.invoiceDate)}
                  </p>
                </div>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Contact</p>
                <p className='text-base font-medium'>
                  {acquisition.vendor.contact || 'Not Available'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Address</p>
                <p className='text-base font-medium'>
                  {acquisition.vendor.address || 'Not Available'}
                </p>
              </div>
            </div>
          </div>

          {/* Management Information */}
          <div className='bg-amber-50 rounded-lg p-4 mb-6'>
            <h3 className='text-lg font-medium text-amber-800 mb-3 flex items-center'>
              <Clock className='h-5 w-5 mr-2' />
              Management Information
            </h3>
            <div className='grid grid-cols-1 gap-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>Room Assignment</p>
                  <p className='text-base font-medium'>
                    {acquisition.management.roomId || 'Not Assigned'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Assigned Date</p>
                  <p className='text-base font-medium'>
                    {formatDate(acquisition.management.assignedDate || '') ||
                      'Not Yet Assigned'}
                  </p>
                </div>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Notes</p>
                <p className='text-base'>
                  {acquisition.management.notes || 'No notes available'}
                </p>
              </div>
            </div>
          </div>

          {/* Acquisition History */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <h3 className='text-lg font-medium text-gray-800 mb-3 flex items-center'>
              <FileText className='h-5 w-5 mr-2' />
              Acquisition Timeline
            </h3>
            <div className='space-y-4'>
              <div className='flex'>
                <div className='mr-4 flex flex-col items-center'>
                  <div className='bg-blue-500 rounded-full w-3 h-3'></div>
                  <div className='bg-blue-200 w-0.5 h-full'></div>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>
                    {formatDate(acquisition.createdAt)}
                  </p>
                  <p className='text-base font-medium'>Acquisition Recorded</p>
                  <p className='text-sm text-gray-600'>
                    Initial acquisition record created in the system
                  </p>
                </div>
              </div>

              {acquisition.vendor.invoiceDate && (
                <div className='flex'>
                  <div className='mr-4 flex flex-col items-center'>
                    <div className='bg-blue-500 rounded-full w-3 h-3'></div>
                    <div className='bg-blue-200 w-0.5 h-full'></div>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>
                      {formatDate(acquisition.vendor.invoiceDate)}
                    </p>
                    <p className='text-base font-medium'>Invoice Processed</p>
                    <p className='text-sm text-gray-600'>
                      Invoice received and processed from{' '}
                      {acquisition.vendor.name}
                    </p>
                  </div>
                </div>
              )}

              {acquisition.management.assignedDate && (
                <div className='flex'>
                  <div className='mr-4 flex flex-col items-center'>
                    <div className='bg-blue-500 rounded-full w-3 h-3'></div>
                    {acquisition.management.status === 'IN_SERVICE' ? (
                      <div className='bg-blue-200 w-0.5 h-full'></div>
                    ) : null}
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>
                      {formatDate(acquisition.management.assignedDate)}
                    </p>
                    <p className='text-base font-medium'>Assigned to Room</p>
                    <p className='text-sm text-gray-600'>
                      Assets were assigned to their destination room
                    </p>
                  </div>
                </div>
              )}

              {acquisition.management.status === 'IN_SERVICE' && (
                <div className='flex'>
                  <div className='mr-4 flex flex-col items-center'>
                    <div className='bg-green-500 rounded-full w-3 h-3'></div>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Current Status</p>
                    <p className='text-base font-medium'>Active & In Use</p>
                    <p className='text-sm text-gray-600'>
                      Assets are currently in service and being used
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className='my-4' />

        <div className='flex justify-between'>
          <Button
            variant='outline'
            onClick={() => {
              // Could add export/print functionality here
              onClose();
            }}
          >
            <FileText className='h-4 w-4 mr-2' />
            Export
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAcquisitionModal;
