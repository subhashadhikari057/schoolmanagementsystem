'use client';

import React from 'react';
import { X, Package, Calendar, DollarSign, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AssetItem } from '@/types/asset.types';

interface AssetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AssetItem | null;
}

const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(v);

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-4 flex items-start justify-center overflow-y-auto'>
      <div className='mt-12 w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
        <div className='px-6 py-6 border-b border-gray-100 flex items-start justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='p-3 bg-gradient-to-br from-slate-800 to-black text-white rounded-xl shadow-md'>
              <Package className='h-5 w-5' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                {item.tagNumber || item.serialNumber}
              </h2>
              <p className='text-sm text-gray-600 mt-1'>
                {item.status.toUpperCase().replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            <div className='text-sm text-gray-600'>
              Installed:{' '}
              {item.purchaseDate
                ? new Date(item.purchaseDate).toLocaleDateString()
                : '—'}
            </div>
            <button
              onClick={onClose}
              className='p-2 rounded hover:bg-gray-100 text-gray-600'
            >
              <X />
            </button>
          </div>
        </div>

        <div className='p-6 space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='col-span-2 bg-white rounded-xl shadow-sm p-5 border border-gray-100'>
              <h3 className='font-semibold text-gray-900 mb-3'>
                Basic Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700'>
                <div>
                  <div className='text-sm font-medium'>Model</div>
                  <div className='text-gray-600 mt-1'>
                    {item.tagNumber || item.serialNumber}
                  </div>
                </div>
                <div>
                  <div className='text-sm font-medium'>Serial Number</div>
                  <div className='text-gray-600 mt-1'>{item.serialNumber}</div>
                </div>
                <div>
                  <div className='text-sm font-medium'>Status</div>
                  <div className='mt-1'>
                    <Badge variant='outline' className='px-2 py-1 text-sm'>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className='text-sm font-medium'>Purchase Date</div>
                  <div className='text-gray-600 mt-1'>
                    {item.purchaseDate
                      ? new Date(item.purchaseDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col items-start justify-center'>
              <div className='text-sm text-gray-500'>Asset Value</div>
              <div className='text-2xl font-bold text-gray-900 mt-2'>
                {item.cost ? formatCurrency(item.cost) : '—'}
              </div>
              <div className='text-sm text-gray-400 mt-2'>
                {item.warranty || 'No warranty info'}
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm p-5 border border-gray-100'>
            <h3 className='font-semibold text-gray-900 mb-3'>Location</h3>
            <div className='grid grid-cols-3 gap-4 text-sm text-gray-700'>
              <div>
                <div className='text-xs text-gray-500'>Room</div>
                <div className='font-medium'>
                  {item.assignedTo?.name || '—'}
                </div>
              </div>
              <div>
                <div className='text-xs text-gray-500'>Building</div>
                <div className='font-medium'>—</div>
              </div>
              <div>
                <div className='text-xs text-gray-500'>Floor</div>
                <div className='font-medium'>—</div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm p-5 border border-gray-100'>
            <h3 className='font-semibold text-gray-900 mb-3'>
              Vendor & Warranty
            </h3>
            <div className='flex items-start justify-between'>
              <div>
                <div className='text-sm text-gray-500'>Vendor</div>
                <div className='font-medium text-gray-900 mt-1'>
                  {item.vendor}
                </div>
              </div>
              <div className='bg-gray-50 rounded-lg p-3 text-sm flex flex-col items-start'>
                <div className='flex items-center gap-2'>
                  <Shield className='h-4 w-4 text-green-600' />
                  <div>
                    <div className='text-xs text-gray-500'>Warranty Status</div>
                    <div className='text-sm font-medium'>Active</div>
                  </div>
                </div>
                <div className='text-xs text-gray-500 mt-2'>
                  {item.warranty}
                </div>
              </div>
            </div>
          </div>

          {item.lastEvent && (
            <div className='bg-white rounded-xl shadow-sm p-5 border border-gray-100'>
              <h3 className='font-semibold text-gray-900 mb-3'>
                Recent Activity
              </h3>
              <div className='bg-gray-50 rounded-lg p-3 text-sm text-gray-700'>
                <div className='font-medium'>{item.lastEvent.type}</div>
                <div className='text-xs text-gray-500'>
                  {item.lastEvent.date
                    ? new Date(item.lastEvent.date).toLocaleDateString()
                    : item.lastEvent.at
                      ? new Date(item.lastEvent.at).toLocaleDateString()
                      : '—'}
                </div>
                {item.lastEvent.note && (
                  <div className='text-sm text-gray-600 mt-2'>
                    {item.lastEvent.note}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100'>
              <div className='text-2xl font-bold'>749</div>
              <div className='text-xs text-gray-500'>Days in Service</div>
            </div>
            <div className='bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100'>
              <div className='text-2xl font-bold'>2.1</div>
              <div className='text-xs text-gray-500'>Years Old</div>
            </div>
            <div className='bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100'>
              <div className='text-2xl font-bold'>$1.13</div>
              <div className='text-xs text-gray-500'>Cost per Day</div>
            </div>
            <div className='bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100'>
              <div className='text-2xl font-bold'>347</div>
              <div className='text-xs text-gray-500'>Warranty Days Left</div>
            </div>
          </div>

          <div className='flex justify-end space-x-3'>
            <Button
              onClick={onClose}
              variant='outline'
              className='border-gray-200'
            >
              Close
            </Button>
            <Button
              onClick={onClose}
              className='bg-gradient-to-r from-slate-900 to-black text-white'
            >
              Replace Asset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailsModal;
