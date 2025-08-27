/**
 * =============================================================================
 * Date Status Indicator Component
 * =============================================================================
 * Displays attendance status for a specific date with EventScope-aware messaging
 * =============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface DateStatusProps {
  date: string; // YYYY-MM-DD format
  className?: string;
}

interface DateStatusResponse {
  isWorkingDay: boolean;
  isHoliday: boolean;
  isEmergencyClosure: boolean;
  message: string;
  eventDetails?: {
    title: string;
    type: string;
    eventScope?: 'PARTIAL' | 'SCHOOL_WIDE';
    description: string;
  };
}

export default function DateStatusIndicator({
  date,
  className = '',
}: DateStatusProps) {
  const [status, setStatus] = useState<DateStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDateStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/attendance/date-status/${date}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch date status');
        }

        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (date) {
      fetchDateStatus();
    }
  }, [date]);

  const getStatusIcon = () => {
    if (!status) return <Calendar className='h-5 w-5 text-gray-400' />;

    if (status.isEmergencyClosure) {
      return <AlertTriangle className='h-5 w-5 text-red-500' />;
    }

    if (status.isHoliday) {
      return <XCircle className='h-5 w-5 text-orange-500' />;
    }

    if (status.eventDetails?.eventScope === 'SCHOOL_WIDE') {
      return <XCircle className='h-5 w-5 text-blue-500' />;
    }

    if (status.isWorkingDay) {
      return <CheckCircle className='h-5 w-5 text-green-500' />;
    }

    return <Calendar className='h-5 w-5 text-gray-400' />;
  };

  const getStatusColor = () => {
    if (!status) return 'border-gray-200 bg-gray-50';

    if (status.isEmergencyClosure) {
      return 'border-red-200 bg-red-50';
    }

    if (status.isHoliday) {
      return 'border-orange-200 bg-orange-50';
    }

    if (status.eventDetails?.eventScope === 'SCHOOL_WIDE') {
      return 'border-blue-200 bg-blue-50';
    }

    if (status.isWorkingDay) {
      return 'border-green-200 bg-green-50';
    }

    return 'border-gray-200 bg-gray-50';
  };

  if (loading) {
    return (
      <div
        className={`p-3 border rounded-lg ${className} border-gray-200 bg-gray-50`}
      >
        <div className='flex items-center space-x-2'>
          <Clock className='h-5 w-5 text-gray-400 animate-spin' />
          <span className='text-sm text-gray-600'>Checking date status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-3 border rounded-lg ${className} border-red-200 bg-red-50`}
      >
        <div className='flex items-center space-x-2'>
          <AlertTriangle className='h-5 w-5 text-red-500' />
          <span className='text-sm text-red-600'>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className={`p-3 border rounded-lg ${className} ${getStatusColor()}`}>
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0 mt-0.5'>{getStatusIcon()}</div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between'>
            <h4 className='text-sm font-medium text-gray-900'>
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h4>

            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status.isWorkingDay
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {status.isWorkingDay ? 'Attendance Required' : 'No Attendance'}
            </span>
          </div>

          <p className='mt-1 text-sm text-gray-600'>{status.message}</p>

          {status.eventDetails && (
            <div className='mt-2 p-2 bg-white rounded border'>
              <div className='flex items-center justify-between'>
                <h5 className='text-xs font-medium text-gray-900'>
                  {status.eventDetails.title}
                </h5>

                {status.eventDetails.eventScope && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      status.eventDetails.eventScope === 'SCHOOL_WIDE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {status.eventDetails.eventScope === 'SCHOOL_WIDE'
                      ? 'School-wide'
                      : 'Partial Event'}
                  </span>
                )}
              </div>

              <p className='mt-1 text-xs text-gray-500'>
                {status.eventDetails.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
