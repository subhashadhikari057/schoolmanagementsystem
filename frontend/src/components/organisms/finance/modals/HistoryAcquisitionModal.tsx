'use client';

import React from 'react';
import {
  History,
  Clock,
  FileText,
  Package,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Truck,
  User,
  DollarSign,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Acquisition } from '@/types/asset.types';

interface AcquisitionEvent {
  id: string;
  date: string;
  type: string;
  description: string;
  user: string;
  details?: string;
}

interface HistoryAcquisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  acquisition: Acquisition | null;
}

const HistoryAcquisitionModal: React.FC<HistoryAcquisitionModalProps> = ({
  isOpen,
  onClose,
  acquisition,
}) => {
  if (!acquisition) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Generate mock history events based on the acquisition data
  const generateMockHistory = (acq: Acquisition): AcquisitionEvent[] => {
    const events: AcquisitionEvent[] = [];

    // Initial record creation
    events.push({
      id: `event-${Date.now()}-1`,
      date: acq.createdAt,
      type: 'CREATED',
      description: 'Acquisition record created',
      user: 'John Smith',
      details: `Initial acquisition record for ${acq.quantity} ${acq.assetName} from ${acq.vendor.name}`,
    });

    // Invoice processing
    if (acq.vendor.invoiceDate) {
      events.push({
        id: `event-${Date.now()}-2`,
        date: acq.vendor.invoiceDate + 'T10:30:00Z',
        type: 'INVOICE',
        description: 'Invoice processed',
        user: 'Jane Doe',
        details: `Invoice from ${acq.vendor.name} processed for ${acq.quantity} units at ${acq.unitCost} per unit.`,
      });
    }

    // Payment (random date between invoice and assignment)
    const invoiceDate = acq.vendor.invoiceDate
      ? new Date(acq.vendor.invoiceDate)
      : new Date(acq.createdAt);
    const paymentDate = new Date(invoiceDate);
    paymentDate.setDate(paymentDate.getDate() + 7);

    events.push({
      id: `event-${Date.now()}-3`,
      date: paymentDate.toISOString(),
      type: 'PAYMENT',
      description: 'Payment processed',
      user: 'Robert Johnson',
      details: `Payment of ${acq.totalValue} processed to vendor using ${acq.vendor.paymentMode || 'Bank Transfer'}`,
    });

    // Delivery (if assigned)
    if (acq.management.assignedDate) {
      const deliveryDate = new Date(acq.management.assignedDate);
      deliveryDate.setDate(deliveryDate.getDate() - 3);

      events.push({
        id: `event-${Date.now()}-4`,
        date: deliveryDate.toISOString(),
        type: 'DELIVERY',
        description: 'Items delivered',
        user: 'Michael Brown',
        details: `${acq.quantity} units of ${acq.assetName} delivered and received at warehouse`,
      });

      // Assignment to room
      events.push({
        id: `event-${Date.now()}-5`,
        date: acq.management.assignedDate,
        type: 'ASSIGNMENT',
        description: 'Assigned to room',
        user: 'Sarah Williams',
        details: `Assets assigned to Room ${acq.management.roomId}`,
      });

      // Status update (if in service)
      if (acq.management.status === 'IN_SERVICE') {
        const serviceDate = new Date(acq.management.assignedDate);
        serviceDate.setDate(serviceDate.getDate() + 1);

        events.push({
          id: `event-${Date.now()}-6`,
          date: serviceDate.toISOString(),
          type: 'STATUS',
          description: 'Status updated to IN SERVICE',
          user: 'David Miller',
          details: 'Assets verified, tagged, and put into service',
        });
      }
    }

    // Sort events by date (newest first)
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  };

  const historyEvents = generateMockHistory(acquisition);

  // Get appropriate icon for event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CREATED':
        return <FileText className='h-5 w-5 text-blue-600' />;
      case 'INVOICE':
        return <DollarSign className='h-5 w-5 text-green-600' />;
      case 'PAYMENT':
        return <ShoppingCart className='h-5 w-5 text-purple-600' />;
      case 'DELIVERY':
        return <Truck className='h-5 w-5 text-orange-600' />;
      case 'ASSIGNMENT':
        return <Package className='h-5 w-5 text-indigo-600' />;
      case 'STATUS':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'NOTE':
        return <Info className='h-5 w-5 text-cyan-600' />;
      case 'WARNING':
        return <AlertTriangle className='h-5 w-5 text-amber-600' />;
      default:
        return <Clock className='h-5 w-5 text-gray-600' />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <div className='flex items-center mb-2'>
            <div className='bg-indigo-100 p-2 rounded-full mr-3'>
              <History className='h-5 w-5 text-indigo-600' />
            </div>
            <DialogTitle className='text-xl'>Acquisition History</DialogTitle>
          </div>
          <DialogDescription>
            View the complete timeline of events for this acquisition
          </DialogDescription>
        </DialogHeader>

        <div className='overflow-y-auto max-h-[70vh] pr-2'>
          <div className='bg-indigo-50 rounded-lg p-4 mb-4'>
            <h3 className='text-base font-medium text-indigo-800 mb-2'>
              {acquisition.assetName}
            </h3>
            <div className='text-sm text-indigo-700'>
              <div className='flex items-center gap-2 mb-1'>
                <Package className='h-4 w-4' />
                <span>
                  {acquisition.quantity} units • {acquisition.brand}{' '}
                  {acquisition.modelNo && `• ${acquisition.modelNo}`}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <ShoppingCart className='h-4 w-4' />
                <span>From {acquisition.vendor.name}</span>
              </div>
            </div>
          </div>

          <div className='space-y-6'>
            {historyEvents.map((event, index) => (
              <div key={event.id} className='relative'>
                {/* Timeline connector */}
                {index < historyEvents.length - 1 && (
                  <div className='absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200'></div>
                )}

                {/* Event item */}
                <div className='flex gap-4'>
                  {/* Icon */}
                  <div className='flex-shrink-0 mt-1'>
                    <div
                      className={`
                      p-2 rounded-full
                      ${
                        event.type === 'CREATED'
                          ? 'bg-blue-100'
                          : event.type === 'INVOICE'
                            ? 'bg-green-100'
                            : event.type === 'PAYMENT'
                              ? 'bg-purple-100'
                              : event.type === 'DELIVERY'
                                ? 'bg-orange-100'
                                : event.type === 'ASSIGNMENT'
                                  ? 'bg-indigo-100'
                                  : event.type === 'STATUS'
                                    ? 'bg-green-100'
                                    : event.type === 'WARNING'
                                      ? 'bg-amber-100'
                                      : event.type === 'NOTE'
                                        ? 'bg-cyan-100'
                                        : 'bg-gray-100'
                      }
                    `}
                    >
                      {getEventIcon(event.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className='flex-1'>
                    <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
                      {/* Date and type */}
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium text-gray-900'>
                          {event.description}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {formatDate(event.date)}
                        </span>
                      </div>

                      {/* Details */}
                      <p className='text-sm text-gray-600 mb-2'>
                        {event.details}
                      </p>

                      {/* User */}
                      <div className='flex items-center mt-3'>
                        <div className='bg-gray-100 rounded-full p-1 mr-2'>
                          <User className='h-3 w-3 text-gray-600' />
                        </div>
                        <span className='text-xs text-gray-500'>
                          {event.user}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className='my-4' />

        <div className='flex justify-between'>
          <Button
            variant='outline'
            onClick={() => {
              // Could add export functionality here
              onClose();
            }}
          >
            <FileText className='h-4 w-4 mr-2' />
            Export History
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryAcquisitionModal;
