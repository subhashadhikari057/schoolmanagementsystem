'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight,
  DollarSign,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { feeService } from '@/api/services/fee.service';
import { toast } from 'sonner';

interface HistoryEntry {
  id: string;
  version: number;
  effectiveFrom: string;
  totalAnnual?: string;
  changeReason?: string;
  createdAt?: string;
  createdById?: string;
  snapshot?: {
    items: Array<{
      id: string;
      label: string;
      amount: string | number;
      category?: string;
      frequency?: string;
      isOptional?: boolean;
    }>;
  };
}

interface FeeStructureHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  structureId: string | null;
  structureName?: string;
}

const FeeStructureHistoryModal: React.FC<FeeStructureHistoryModalProps> = ({
  isOpen,
  onClose,
  structureId,
  structureName,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  // Fetch history when modal opens
  useEffect(() => {
    if (isOpen && structureId) {
      setLoading(true);
      setError(null);
      setSelectedVersion(null);

      feeService
        .history(structureId)
        .then(historyData => {
          setHistory(historyData || []);
          if (historyData && historyData.length > 0) {
            setSelectedVersion(historyData[historyData.length - 1].version); // Select latest version
          }
        })
        .catch(err => {
          console.error('Error fetching history:', err);
          setError('Failed to load fee structure history');
          toast.error('Failed to load history');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setHistory([]);
      setSelectedVersion(null);
    }
  }, [isOpen, structureId]);

  if (!isOpen) return null;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
    }).format(isNaN(num) ? 0 : num);
  };

  const getFrequencyBadge = (frequency: string) => {
    const frequencyMap = {
      MONTHLY: { bg: 'bg-blue-100', text: 'text-blue-800' },
      TERM: { bg: 'bg-purple-100', text: 'text-purple-800' },
      ANNUAL: { bg: 'bg-green-100', text: 'text-green-800' },
      ONE_TIME: { bg: 'bg-orange-100', text: 'text-orange-800' },
    };
    const config =
      frequencyMap[frequency as keyof typeof frequencyMap] ||
      frequencyMap.MONTHLY;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.text}`}
      >
        {frequency}
      </span>
    );
  };

  const selectedHistoryEntry = history.find(h => h.version === selectedVersion);

  // Show loading state
  if (loading) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in duration-300 text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-700'>Loading fee structure history...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in duration-300'>
          <div className='text-center mb-4'>
            <AlertCircle className='h-8 w-8 text-red-500 mx-auto mb-2' />
            <p className='text-red-500 font-medium'>Error loading history</p>
            <p className='text-gray-600 text-sm mt-1'>{error}</p>
          </div>
          <div className='flex justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <History className='h-6 w-6 text-purple-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Fee Structure History
              </h2>
              <p className='text-sm text-gray-600'>
                {structureName || 'Structure Changes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-white/60 rounded-lg text-gray-500 hover:text-gray-700 transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Content */}
        <div className='flex h-[calc(90vh-140px)]'>
          {/* History Timeline - Left Side */}
          <div className='w-80 border-r bg-gray-50 overflow-y-auto'>
            <div className='p-4'>
              <h3 className='text-sm font-semibold text-gray-800 mb-3'>
                Version History
              </h3>

              {history.length === 0 ? (
                <div className='text-center py-8'>
                  <FileText className='h-8 w-8 text-gray-300 mx-auto mb-2' />
                  <p className='text-gray-500 text-sm'>No history available</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {history
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedVersion === entry.version
                            ? 'bg-blue-100 border-blue-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedVersion(entry.version)}
                      >
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm font-semibold text-gray-900'>
                              Version {entry.version}
                            </span>
                            {index === 0 && (
                              <span className='px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full'>
                                Latest
                              </span>
                            )}
                          </div>
                          <ChevronRight className='h-4 w-4 text-gray-400' />
                        </div>

                        <div className='space-y-1'>
                          <div className='flex items-center text-xs text-gray-600'>
                            <Calendar className='h-3 w-3 mr-1' />
                            Effective:{' '}
                            {format(
                              new Date(entry.effectiveFrom),
                              'MMM dd, yyyy',
                            )}
                          </div>

                          {entry.totalAnnual && (
                            <div className='flex items-center text-xs text-gray-600'>
                              <DollarSign className='h-3 w-3 mr-1' />
                              {formatCurrency(entry.totalAnnual)}
                            </div>
                          )}

                          {entry.createdAt && (
                            <div className='flex items-center text-xs text-gray-500'>
                              <Clock className='h-3 w-3 mr-1' />
                              {format(
                                new Date(entry.createdAt),
                                'MMM dd, yyyy HH:mm',
                              )}
                            </div>
                          )}
                        </div>

                        {entry.changeReason && (
                          <p className='text-xs text-gray-600 mt-2 line-clamp-2'>
                            {entry.changeReason}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Version Details - Right Side */}
          <div className='flex-1 overflow-y-auto'>
            <div className='p-6'>
              {!selectedHistoryEntry ? (
                <div className='text-center py-12'>
                  <FileText className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                  <p className='text-gray-500'>
                    Select a version to view details
                  </p>
                </div>
              ) : (
                <div className='space-y-6'>
                  {/* Version Header */}
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Version {selectedHistoryEntry.version} Details
                      </h3>
                      {selectedHistoryEntry.totalAnnual && (
                        <div className='text-right'>
                          <p className='text-sm text-gray-500'>Total Annual</p>
                          <p className='text-xl font-bold text-green-600'>
                            {formatCurrency(selectedHistoryEntry.totalAnnual)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='text-xs text-gray-500'>
                          Effective From
                        </label>
                        <p className='text-sm font-medium text-gray-900'>
                          {format(
                            new Date(selectedHistoryEntry.effectiveFrom),
                            'MMMM dd, yyyy',
                          )}
                        </p>
                      </div>
                      {selectedHistoryEntry.createdAt && (
                        <div>
                          <label className='text-xs text-gray-500'>
                            Created
                          </label>
                          <p className='text-sm font-medium text-gray-900'>
                            {format(
                              new Date(selectedHistoryEntry.createdAt),
                              'MMMM dd, yyyy HH:mm',
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedHistoryEntry.changeReason && (
                      <div className='mt-3'>
                        <label className='text-xs text-gray-500'>
                          Change Reason
                        </label>
                        <p className='text-sm text-gray-900 mt-1'>
                          {selectedHistoryEntry.changeReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fee Components */}
                  <div>
                    <h4 className='text-sm font-semibold text-gray-800 mb-3 flex items-center'>
                      <DollarSign className='h-4 w-4 mr-2' />
                      Fee Components
                    </h4>

                    {!selectedHistoryEntry.snapshot?.items ||
                    selectedHistoryEntry.snapshot.items.length === 0 ? (
                      <div className='text-center py-6 bg-gray-50 rounded-lg'>
                        <p className='text-gray-500'>
                          No components data available
                        </p>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {selectedHistoryEntry.snapshot.items.map(
                          (item, index) => (
                            <div
                              key={item.id || index}
                              className='bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow'
                            >
                              <div className='flex items-center justify-between'>
                                <div className='flex-1'>
                                  <div className='flex items-center space-x-3'>
                                    <h5 className='font-medium text-gray-900'>
                                      {item.label}
                                    </h5>
                                    {item.isOptional && (
                                      <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
                                        Optional
                                      </span>
                                    )}
                                  </div>
                                  {item.category && (
                                    <p className='text-xs text-gray-500 mt-1'>
                                      Category: {item.category}
                                    </p>
                                  )}
                                </div>
                                <div className='text-right'>
                                  <p className='text-lg font-semibold text-gray-900'>
                                    {formatCurrency(item.amount)}
                                  </p>
                                  {item.frequency && (
                                    <div className='mt-1'>
                                      {getFrequencyBadge(item.frequency)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end space-x-3 p-6 border-t bg-gray-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeStructureHistoryModal;
