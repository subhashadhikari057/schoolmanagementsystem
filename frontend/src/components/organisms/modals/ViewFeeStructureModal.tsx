'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Calendar,
  GraduationCap,
  Users,
  FileText,
  Clock,
  AlertCircle,
  Loader2,
  CreditCard,
  TrendingUp,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Enhanced error handler for view modal
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as {
      message?: string;
      response?: { data?: { message?: string } };
      error?: { message?: string };
    };

    const errorMessage =
      apiError.message ||
      apiError.response?.data?.message ||
      apiError.error?.message;

    // Map specific API errors to user-friendly messages
    switch (errorMessage) {
      case 'Network Error':
      case 'ERR_NETWORK':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'Request timeout':
      case 'TIMEOUT':
        return 'Request timed out. The server is taking too long to respond. Please try again.';
      case 'Unauthorized':
      case 'Authentication failed':
        return 'Your session has expired. Please refresh the page and log in again.';
      case 'Forbidden':
      case 'Access denied':
        return 'You do not have permission to view this fee structure.';
      case 'Fee structure not found':
      case 'Structure not found':
        return 'The fee structure could not be found. It may have been deleted.';
      case 'Invalid structure ID':
        return 'Invalid fee structure identifier. Please try again from the main list.';
      case 'Database connection failed':
        return 'Database connection error. Please try again in a few moments.';
      case 'Server error':
      case 'Internal server error':
        return 'Server error occurred. Please try again later or contact support.';
      default:
        return (
          errorMessage ||
          'Failed to load fee structure details. Please try again.'
        );
    }
  }

  if (error instanceof Error) {
    return (
      error.message || 'An error occurred while loading the fee structure.'
    );
  }

  return 'An unexpected error occurred while loading the fee structure.';
};

interface FeeStructureDetailed {
  id: string;
  name: string;
  academicYear: string;
  status: string;
  effectiveFrom: string;
  createdAt: string;
  classId: string;
  grade?: number;
  section?: string;
  assignedClasses: Array<{
    id: string;
    grade: number | null;
    section: string | null;
  }>;
  studentCount: number;
  items: Array<{ id: string; label: string; amount: string | number }>;
  totalAnnual?: string | number;
  latestVersion: number;
}

interface ViewFeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: FeeStructureDetailed | null;
}

const ViewFeeStructureModal: React.FC<ViewFeeStructureModalProps> = ({
  isOpen,
  onClose,
  structure,
}) => {
  const [structureDetails, setStructureDetails] =
    useState<FeeStructureDetailed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update structure details when modal opens or structure prop changes
  useEffect(() => {
    if (isOpen && structure && structure.id) {
      try {
        setLoading(true);
        setError(null);
        setStructureDetails(structure); // Use passed data immediately
        console.log(
          'ViewFeeStructureModal: Updated structure details',
          structure,
        );
        toast.success('Fee structure details loaded successfully');
      } catch (err) {
        console.error('Error loading structure details:', err);
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        toast.error('Failed to Load Fee Structure', {
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    } else {
      setStructureDetails(null);
    }
  }, [isOpen, structure]);

  // Additional effect to update when structure changes while modal is open
  useEffect(() => {
    if (structure && structureDetails && structure.id === structureDetails.id) {
      // Check if effectiveFrom has changed
      if (structure.effectiveFrom !== structureDetails.effectiveFrom) {
        console.log('ViewFeeStructureModal: Updating effectiveFrom', {
          old: structureDetails.effectiveFrom,
          new: structure.effectiveFrom,
        });
        setStructureDetails(structure);
      }
    }
  }, [structure, structureDetails]);

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <div className='fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in duration-300 text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-700'>Loading fee structure details...</p>
        </div>
      </div>
    );
  }

  // Show error state with enhanced messaging and retry option
  if (!structureDetails && error) {
    return (
      <div className='fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in duration-300'>
          <div className='text-center mb-4'>
            <AlertCircle className='h-8 w-8 text-red-500 mx-auto mb-2' />
            <p className='text-red-500 font-medium'>
              Error Loading Fee Structure
            </p>
            <p className='text-gray-600 text-sm mt-1'>{error}</p>
          </div>
          <div className='flex justify-end space-x-3'>
            <button
              onClick={() => {
                try {
                  setError(null);
                  if (structure) {
                    setLoading(true);
                    setStructureDetails(structure);
                    setLoading(false);
                    toast.success('Fee structure reloaded successfully');
                  }
                } catch (err) {
                  console.error('Error during retry:', err);
                  const retryErrorMessage = getErrorMessage(err);
                  setError(retryErrorMessage);
                  toast.error('Retry Failed', {
                    description: retryErrorMessage,
                  });
                }
              }}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              Retry
            </button>
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

  if (!structureDetails) return null;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
    }).format(isNaN(num) ? 0 : num);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      DRAFT: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' },
      ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archived' },
    };
    const config =
      statusMap[status as keyof typeof statusMap] || statusMap.DRAFT;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className='fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <DollarSign className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                {structureDetails.name}
              </h2>
              <div className='flex items-center space-x-3 mt-1'>
                {getStatusBadge(structureDetails.status)}
                <span className='text-sm text-blue-600 font-medium'>
                  Latest Applied Version {structureDetails.latestVersion}
                </span>
              </div>
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
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Left Column - Basic Info */}
            <div className='lg:col-span-1 space-y-6'>
              {/* Overview Card */}
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-gray-800 mb-3 flex items-center'>
                  <FileText className='h-4 w-4 mr-2' />
                  Overview
                </h3>
                <div className='space-y-3'>
                  <div>
                    <label className='text-xs text-gray-500'>
                      Academic Year
                    </label>
                    <p className='text-sm font-medium text-gray-900'>
                      {structureDetails.academicYear}
                    </p>
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>
                      Currently Applied Since
                    </label>
                    <p className='text-sm font-medium text-gray-900 flex items-center'>
                      <Calendar className='h-3 w-3 mr-1' />
                      {format(
                        new Date(structureDetails.effectiveFrom),
                        'MMM dd, yyyy',
                      )}
                    </p>
                    <p className='text-xs text-gray-400 mt-0.5'>
                      This version has been in effect since this date
                    </p>
                  </div>
                  <div className='bg-blue-50 rounded-md p-3 border border-blue-200'>
                    <div className='flex items-start space-x-2'>
                      <History className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                      <div>
                        <p className='text-xs font-medium text-blue-800'>
                          Version History
                        </p>
                        <p className='text-xs text-blue-600 mt-1'>
                          Click the history button in the main table to view all
                          versions and changes
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>
                      Structure Created
                    </label>
                    <p className='text-sm font-medium text-gray-900 flex items-center'>
                      <Clock className='h-3 w-3 mr-1' />
                      {format(
                        new Date(structureDetails.createdAt),
                        'MMM dd, yyyy',
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Class Assignment Card */}
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-gray-800 mb-3 flex items-center'>
                  <GraduationCap className='h-4 w-4 mr-2' />
                  Class Assignment
                </h3>
                <div className='space-y-3'>
                  {structureDetails.assignedClasses.map(cls => (
                    <div
                      key={cls.id}
                      className='flex items-center justify-between py-2 px-3 bg-white rounded-md border'
                    >
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          Grade {cls.grade} - {cls.section}
                        </p>
                      </div>
                      <div className='flex items-center text-xs text-gray-500'>
                        <Users className='h-3 w-3 mr-1' />
                        {structureDetails.studentCount} students
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200'>
                <h3 className='text-sm font-semibold text-green-800 mb-3 flex items-center'>
                  <TrendingUp className='h-4 w-4 mr-2' />
                  Current Version Summary
                </h3>
                <div className='space-y-2'>
                  <div>
                    <label className='text-xs text-green-600'>
                      Total Annual Amount (v{structureDetails.latestVersion})
                    </label>
                    <p className='text-lg font-bold text-green-800'>
                      {formatCurrency(structureDetails.totalAnnual || 0)}
                    </p>
                  </div>
                  <div>
                    <label className='text-xs text-green-600'>
                      Fee Components
                    </label>
                    <p className='text-sm font-medium text-green-800'>
                      {structureDetails.items.length} items in current version
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Fee Components */}
            <div className='lg:col-span-2'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-gray-800 mb-4 flex items-center'>
                  <CreditCard className='h-4 w-4 mr-2' />
                  Fee Components (Version {structureDetails.latestVersion})
                </h3>

                {structureDetails.items.length === 0 ? (
                  <div className='text-center py-8'>
                    <CreditCard className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                    <p className='text-gray-500'>No fee components defined</p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {structureDetails.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className='bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <h4 className='font-medium text-gray-900'>
                              {item.label}
                            </h4>
                          </div>
                          <div className='text-right'>
                            <p className='text-lg font-semibold text-gray-900'>
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

export default ViewFeeStructureModal;
