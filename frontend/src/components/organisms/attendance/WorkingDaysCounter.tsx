/**
 * =============================================================================
 * Working Days Counter Component
 * =============================================================================
 * Shows live working days count with detailed breakdown modal
 * =============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Info, TrendingUp, X } from 'lucide-react';
import {
  workingDaysService,
  WorkingDaysBreakdown,
} from '@/api/services/working-days.service';

interface WorkingDaysCounterProps {
  className?: string;
  showLabel?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: WorkingDaysBreakdown | null;
}

const BreakdownModal: React.FC<BreakdownModalProps> = ({
  isOpen,
  onClose,
  breakdown,
}) => {
  if (!isOpen || !breakdown) return null;

  const percentage =
    workingDaysService.calculateWorkingDaysPercentage(breakdown);
  const monthName = workingDaysService.getMonthName(breakdown.month);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-5 w-5 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>
              Working Days Breakdown
            </h3>
          </div>
          <button
            onClick={onClose}
            className='p-1 hover:bg-gray-100 rounded-full transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* Month/Year Info */}
          <div className='text-center mb-6'>
            <h4 className='text-xl font-bold text-gray-900'>
              {monthName} {breakdown.year}
            </h4>
            {breakdown.isCurrentMonth && (
              <span className='inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
                Current Month
              </span>
            )}
          </div>

          {/* Main Stats */}
          <div className='grid grid-cols-2 gap-4 mb-6'>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {breakdown.availableDays}
              </div>
              <div className='text-sm text-blue-700'>Working Days</div>
            </div>
            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {percentage}%
              </div>
              <div className='text-sm text-green-700'>of Total Days</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-gray-600 rounded-full'></div>
                <span className='text-sm font-medium text-gray-700'>
                  Total Days
                </span>
              </div>
              <span className='text-sm font-semibold text-gray-900'>
                {breakdown.totalDays}
              </span>
            </div>

            <div className='flex items-center justify-between p-3 bg-red-50 rounded-lg'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                <span className='text-sm font-medium text-red-700'>
                  Saturdays
                </span>
              </div>
              <span className='text-sm font-semibold text-red-800'>
                -{breakdown.saturdays}
              </span>
            </div>

            <div className='flex items-center justify-between p-3 bg-orange-50 rounded-lg'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-orange-500 rounded-full'></div>
                <span className='text-sm font-medium text-orange-700'>
                  Holidays
                </span>
              </div>
              <span className='text-sm font-semibold text-orange-800'>
                -{breakdown.holidays}
              </span>
            </div>

            <div className='flex items-center justify-between p-3 bg-purple-50 rounded-lg'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-purple-500 rounded-full'></div>
                <span className='text-sm font-medium text-purple-700'>
                  Events
                </span>
              </div>
              <span className='text-sm font-semibold text-purple-800'>
                -{breakdown.events}
              </span>
            </div>

            <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                <span className='text-sm font-medium text-blue-700'>Exams</span>
              </div>
              <span className='text-sm font-semibold text-blue-800'>
                {breakdown.exams}
              </span>
              <span className='text-xs text-blue-600'>
                (Still working days)
              </span>
            </div>

            <div className='mt-4 pt-3 border-t border-gray-200'>
              <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <TrendingUp className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-medium text-green-700'>
                    Available Working Days
                  </span>
                </div>
                <span className='text-lg font-bold text-green-800'>
                  {breakdown.availableDays}
                </span>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {breakdown.lastCalculated && (
            <div className='mt-4 text-center text-xs text-gray-500'>
              Last calculated:{' '}
              {new Date(breakdown.lastCalculated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 bg-gray-50 rounded-b-lg'>
          <button
            onClick={onClose}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const WorkingDaysCounter: React.FC<WorkingDaysCounterProps> = ({
  className = '',
  showLabel = true,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
}) => {
  const [breakdown, setBreakdown] = useState<WorkingDaysBreakdown | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkingDays = async () => {
    try {
      setError(null);
      const data = await workingDaysService.getCurrentWorkingDays();
      setBreakdown(data);
    } catch (err) {
      console.error('Error fetching working days:', err);
      setError('Failed to load working days');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkingDays();

    if (autoRefresh) {
      const interval = setInterval(fetchWorkingDays, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
        {showLabel && <span className='text-sm text-gray-600'>Loading...</span>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Info className='h-4 w-4 text-red-500' />
        {showLabel && (
          <span className='text-sm text-red-600'>Error loading</span>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-colors group ${className}`}
        title='Click to view working days breakdown'
      >
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1'>
            <Clock className='h-4 w-4 text-blue-600' />
            <span className='text-lg font-bold text-blue-600'>
              {breakdown?.availableDays || 0}
            </span>
          </div>
          {showLabel && (
            <span className='text-sm text-gray-700 group-hover:text-blue-700'>
              Working Days
            </span>
          )}
        </div>

        {breakdown?.isCurrentMonth && (
          <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
        )}
      </button>

      <BreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        breakdown={breakdown}
      />
    </>
  );
};

export default WorkingDaysCounter;
