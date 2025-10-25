'use client';

import React from 'react';
import {
  AlertTriangle,
  Package,
  FileText,
  Wrench,
  Clock,
  Tag,
  Info,
  Calendar,
  User,
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
import type { AssetItem } from '@/types/asset.types';

interface ViewDamagedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AssetItem | null;
  modelName: string;
}

const ViewDamagedItemModal: React.FC<ViewDamagedItemModalProps> = ({
  isOpen,
  onClose,
  item,
  modelName,
}) => {
  if (!item) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DAMAGED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'UNDER_REPAIR':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventStatusColor = (type: string) => {
    if (
      type.includes('DAMAGE') ||
      type.includes('ISSUE') ||
      type.includes('FAILURE')
    ) {
      return 'bg-red-500';
    }
    if (type.includes('REPAIR_START')) {
      return 'bg-yellow-500';
    }
    if (type.includes('REPAIR_COMPLETE') || type.includes('FIXED')) {
      return 'bg-green-500';
    }
    if (type.includes('MAINTENANCE')) {
      return 'bg-blue-500';
    }
    return 'bg-gray-500';
  };

  const formatEventType = (type: string): string => {
    // Convert from SNAKE_CASE to Title Case and replace underscores
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <div className='flex items-center mb-2'>
            <div className='bg-red-100 p-2 rounded-full mr-3'>
              <AlertTriangle className='h-5 w-5 text-red-600' />
            </div>
            <DialogTitle className='text-xl'>Damaged Asset Details</DialogTitle>
          </div>
          <DialogDescription>
            View complete information about this damaged or in-repair asset
          </DialogDescription>
        </DialogHeader>

        <div className='overflow-y-auto max-h-[70vh] pr-2'>
          {/* Asset Header */}
          <div className='bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  {modelName}
                </h3>
                <div className='flex items-center mt-1 space-x-2'>
                  <span className='text-sm text-gray-500'>
                    {item.serial || 'No Serial'}
                  </span>
                  {item.tag && (
                    <>
                      <span className='text-gray-300'>•</span>
                      <span className='text-sm text-gray-500'>
                        Tag: {item.tag}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Badge className={getStatusColor(item.status)}>
                {item.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Issue Details */}
          <div className='bg-red-50 rounded-lg p-4 mb-6'>
            <h3 className='text-lg font-medium text-red-800 mb-3 flex items-center'>
              <AlertTriangle className='h-5 w-5 mr-2' />
              Issue Information
            </h3>
            <div className='space-y-4'>
              {item.lastEvent ? (
                <>
                  <div>
                    <p className='text-sm text-gray-500'>Issue Type</p>
                    <p className='text-base font-medium'>
                      {item.lastEvent.type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Reported Date</p>
                    <p className='text-base font-medium'>
                      {formatDate(item.lastEvent.at)}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Description</p>
                    <p className='text-base'>
                      {item.lastEvent.note || 'No description provided'}
                    </p>
                  </div>
                </>
              ) : (
                <p className='text-base'>No issue information available</p>
              )}
            </div>
          </div>

          {/* Repair Status */}
          <div className='bg-yellow-50 rounded-lg p-4 mb-6'>
            <h3 className='text-lg font-medium text-yellow-800 mb-3 flex items-center'>
              <Wrench className='h-5 w-5 mr-2' />
              Repair Status
            </h3>
            <div className='space-y-4'>
              {item.status === 'UNDER_REPAIR' ? (
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-sm text-gray-500'>Repair Started</p>
                      <p className='text-base font-medium'>
                        {/* Mock data */}
                        {formatDate(new Date().toISOString())}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>
                        Expected Completion
                      </p>
                      <p className='text-base font-medium'>
                        {/* Mock data */}
                        {formatDate(
                          new Date(
                            Date.now() + 7 * 24 * 60 * 60 * 1000,
                          ).toISOString(),
                        )}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Assigned To</p>
                      <p className='text-base font-medium'>
                        {/* Mock data */}
                        IT Department
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Current Location</p>
                      <p className='text-base font-medium'>
                        {item.location?.type === 'VENDOR'
                          ? 'External Vendor'
                          : 'In-house Repair'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Repair Notes</p>
                    <p className='text-base'>
                      {item.location?.note || 'No repair notes provided'}
                    </p>
                  </div>
                </>
              ) : (
                <p className='text-base'>Repair not yet started</p>
              )}
            </div>
          </div>

          {/* Asset Information */}
          <div className='bg-blue-50 rounded-lg p-4 mb-6'>
            <h3 className='text-lg font-medium text-blue-800 mb-3 flex items-center'>
              <Package className='h-5 w-5 mr-2' />
              Asset Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Asset Tag</p>
                <p className='text-base font-medium'>
                  {item.tag || 'Not Tagged'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Serial Number</p>
                <p className='text-base font-medium'>{item.serial || 'N/A'}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Warranty Expiry</p>
                <p className='text-base font-medium'>
                  {formatDate(item.warrantyExpiry) || 'No Warranty / Unknown'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Acquisition ID</p>
                <p className='text-base font-medium'>
                  {item.acquisitionId || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Repair History */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <h3 className='text-lg font-medium text-gray-800 mb-3 flex items-center'>
              <FileText className='h-5 w-5 mr-2' />
              Event History
            </h3>

            {/* Show event history */}
            <div className='space-y-6'>
              {/* If we have a full event history, show it */}
              {item.eventHistory && item.eventHistory.length > 0 ? (
                item.eventHistory.map((event, index) => (
                  <div key={index} className='flex'>
                    <div className='mr-4 flex flex-col items-center'>
                      <div
                        className={`${getEventStatusColor(event.type)} rounded-full w-3 h-3`}
                      ></div>
                      {index < (item.eventHistory?.length || 0) - 1 && (
                        <div className='bg-gray-200 w-0.5 h-full'></div>
                      )}
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>
                        {formatDate(event.at)}
                        {event.reportedBy &&
                          ` • Reported by: ${event.reportedBy}`}
                      </p>
                      <p className='text-base font-medium'>
                        {formatEventType(event.type)}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {event.note || `No additional details`}
                      </p>
                      {event.severity && (
                        <div className='mt-1'>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}
                          >
                            Severity: {event.severity}
                          </span>
                        </div>
                      )}
                      {event.cost && event.cost > 0 && (
                        <div className='mt-1 text-sm'>
                          <span className='font-medium'>Cost:</span>{' '}
                          {formatCurrency(event.cost)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Fallback to showing just the last event if no history is available
                <>
                  {item.lastEvent ? (
                    <div className='flex'>
                      <div className='mr-4 flex flex-col items-center'>
                        <div className='bg-red-500 rounded-full w-3 h-3'></div>
                        <div className='bg-gray-200 w-0.5 h-full'></div>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>
                          {formatDate(item.lastEvent.at)}
                        </p>
                        <p className='text-base font-medium'>
                          {formatEventType(item.lastEvent.type)}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {item.lastEvent.note ||
                            `${item.lastEvent.type} reported`}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {item.status === 'UNDER_REPAIR' && (
                    <div className='flex'>
                      <div className='mr-4 flex flex-col items-center'>
                        <div className='bg-yellow-500 rounded-full w-3 h-3'></div>
                        <div className='bg-gray-200 w-0.5 h-full'></div>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>
                          {formatDate(new Date().toISOString())}
                        </p>
                        <p className='text-base font-medium'>Repair Started</p>
                        <p className='text-sm text-gray-600'>
                          {item.location?.note || 'Repair process initiated'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Empty history message */}
                  {!item.lastEvent && item.status !== 'UNDER_REPAIR' && (
                    <p className='text-sm text-gray-500 italic'>
                      No event history available
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <Separator className='my-4' />

        <div className='flex justify-between'>
          <Button
            variant='outline'
            onClick={() => {
              // Could add print functionality here
              onClose();
            }}
          >
            <FileText className='h-4 w-4 mr-2' />
            Print Report
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDamagedItemModal;
