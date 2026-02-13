import React from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  BadgeDollarSign,
  CalendarDays,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';

interface LeaveTypeDetailModalProps {
  open: boolean;
  onClose: () => void;
  leaveType: any;
}

const formatLimitPeriod = (period?: string) => {
  if (!period) return 'Yearly';
  if (period === 'WEEK') return 'Weekly';
  if (period === 'LIFETIME') return 'Lifetime';
  return 'Yearly';
};

const formatEligibility = (value?: string) => {
  if (!value || value === 'ANY') return 'All Teachers';
  if (value === 'MALE') return 'Male Only';
  if (value === 'FEMALE') return 'Female Only';
  return value;
};

const LeaveTypeDetailModal: React.FC<LeaveTypeDetailModalProps> = ({
  open,
  onClose,
  leaveType,
}) => {
  if (!open || !leaveType) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100'>
        <div className='flex items-center justify-between p-6 border-b'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Leave Type Details
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              View the leave type configuration.
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X size={24} />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='text-lg font-semibold text-gray-900'>
              {leaveType.name}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                leaveType.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {leaveType.status === 'ACTIVE' ? (
                <CheckCircle2 className='h-3.5 w-3.5' />
              ) : (
                <XCircle className='h-3.5 w-3.5' />
              )}
              {leaveType.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
            <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700'>
              <CalendarDays className='h-3.5 w-3.5' />
              {formatLimitPeriod(leaveType.limitPeriod)}
            </span>
            <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700'>
              <BadgeDollarSign className='h-3.5 w-3.5' />
              {leaveType.isPaid ? 'Paid' : 'Unpaid'}
            </span>
          </div>

          {leaveType.description && (
            <div className='bg-gray-50 border border-gray-100 rounded-lg p-4'>
              <p className='text-sm text-gray-700'>{leaveType.description}</p>
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='rounded-lg border border-gray-100 p-4'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>
                Entitlement
              </p>
              <p className='text-lg font-semibold text-gray-900 mt-2'>
                {leaveType.maxDays} day{leaveType.maxDays !== 1 ? 's' : ''}
              </p>
            </div>
            <div className='rounded-lg border border-gray-100 p-4'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>
                Paid Days
              </p>
              <p className='text-lg font-semibold text-gray-900 mt-2'>
                {leaveType.paidDays || 0} day
                {leaveType.paidDays !== 1 ? 's' : ''}
              </p>
            </div>
            <div className='rounded-lg border border-gray-100 p-4'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>
                Eligibility
              </p>
              <p className='text-lg font-semibold text-gray-900 mt-2'>
                {formatEligibility(leaveType.eligibilityGender)}
              </p>
            </div>
            <div className='rounded-lg border border-gray-100 p-4'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>
                Proration
              </p>
              <p className='text-sm text-gray-700 mt-2'>
                {leaveType.prorateOnTenure
                  ? `Prorate over ${leaveType.proratePeriodMonths || 12} months`
                  : 'No proration'}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='rounded-lg border border-gray-100 p-4'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>
                Carry Forward
              </p>
              <p className='text-sm text-gray-700 mt-2'>
                {leaveType.carryForwardLimit !== null &&
                leaveType.carryForwardLimit !== undefined
                  ? `${leaveType.carryForwardLimit} day(s)`
                  : 'Not enabled'}
              </p>
            </div>
            <div className='rounded-lg border border-gray-100 p-4'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>
                Encash After
              </p>
              <p className='text-sm text-gray-700 mt-2'>
                {leaveType.encashAfterLimit !== null &&
                leaveType.encashAfterLimit !== undefined
                  ? `${leaveType.encashAfterLimit} day(s)`
                  : 'Not enabled'}
              </p>
            </div>
            <div className='rounded-lg border border-gray-100 p-4 md:col-span-2'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>
                Substitute Credit
              </p>
              <p className='text-sm text-gray-700 mt-2'>
                {leaveType.requiresSubstituteCredit
                  ? 'Requires credit from worked leave days'
                  : 'No substitute credit required'}
              </p>
            </div>
          </div>
        </div>

        <div className='flex justify-end p-6 pt-0'>
          <Button
            onClick={onClose}
            className='bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200'
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypeDetailModal;
