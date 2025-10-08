'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  User,
  Calendar,
  Loader2,
  Download,
  Printer,
} from 'lucide-react';
import { idCardApiService, IDCardData } from '@/services/id-card.service';
import { toast } from 'sonner';
import IDCardPreview from '@/components/organisms/id-generation/IDCardPreview';

interface IDCardViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string | null;
}

export default function IDCardViewModal({
  open,
  onOpenChange,
  cardId,
}: IDCardViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<IDCardData | null>(null);

  useEffect(() => {
    if (open && cardId) {
      fetchCardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cardId]);

  const fetchCardData = async () => {
    if (!cardId) return;

    try {
      setLoading(true);
      const data = await idCardApiService.getIDCard(cardId);
      setCardData(data);
    } catch (error: unknown) {
      console.error('Error fetching card data:', error);
      toast.error('Failed to load ID card details');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='pb-4'>
          <DialogTitle className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <CreditCard className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                ID Card Details
              </h2>
              <p className='text-sm text-gray-500 mt-1'>
                View generated ID card information
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <Loader2 className='w-8 h-8 text-blue-500 animate-spin mx-auto mb-4' />
              <p className='text-sm text-gray-500'>Loading ID card...</p>
            </div>
          </div>
        ) : cardData ? (
          <div className='space-y-6'>
            <div className='space-y-3'>
              <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                <CreditCard className='w-5 h-5 text-blue-600' />
                ID Card Preview
              </h3>
              <div className='bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-12 border-2 border-blue-200 shadow-inner'>
                <IDCardPreview idCard={cardData} scale={1.5} />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <User className='w-4 h-4 text-gray-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Card Holder
                  </span>
                </div>
                <p className='text-sm text-gray-900 font-semibold'>
                  {cardData.renderedFields.find(
                    f =>
                      f.label?.toLowerCase() === 'full name' ||
                      f.label?.toLowerCase().includes('student name'),
                  )?.value || 'N/A'}
                </p>
              </div>

              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <CreditCard className='w-4 h-4 text-gray-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Template
                  </span>
                </div>
                <p className='text-sm text-gray-900 font-semibold'>
                  {cardData.template.name}
                </p>
              </div>

              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <Calendar className='w-4 h-4 text-gray-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Expiry Date
                  </span>
                </div>
                <p className='text-sm text-gray-900'>
                  {new Date(cardData.expiryDate).toLocaleDateString()}
                </p>
              </div>

              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <Calendar className='w-4 h-4 text-gray-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Generated On
                  </span>
                </div>
                <p className='text-sm text-gray-900'>
                  {new Date(cardData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <details className='bg-gray-50 rounded-lg border border-gray-200'>
              <summary className='px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg'>
                Technical Details ({cardData.renderedFields.length} fields)
              </summary>
              <div className='p-4 space-y-2 border-t border-gray-200'>
                {cardData.renderedFields.map((field, index) => (
                  <div
                    key={field.fieldId || index}
                    className='bg-white rounded p-3 border border-gray-200'
                  >
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-xs font-medium text-gray-600'>
                        {field.label}
                      </span>
                      <Badge variant='outline' className='text-xs'>
                        {field.fieldType}
                      </Badge>
                    </div>
                    <p className='text-xs text-gray-500 truncate'>
                      {field.value || 'N/A'}
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                      Position: ({field.x}, {field.y}) Size: {field.width}
                      {field.height}
                    </p>
                  </div>
                ))}
              </div>
            </details>

            <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    toast.info('Print functionality coming soon!');
                  }}
                >
                  <Printer className='w-4 h-4 mr-2' />
                  Print
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    toast.info('Download PDF functionality coming soon!');
                  }}
                >
                  <Download className='w-4 h-4 mr-2' />
                  Download PDF
                </Button>
              </div>
              <Button variant='ghost' onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className='text-center py-12'>
            <p className='text-gray-500'>No card data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
