import React from 'react';

interface FeeStatusCellProps {
  feeStatus?: 'Paid' | 'Partial' | 'Pending';
  feeAmount?: {
    paid: number;
    total: number;
  };
}

const FeeStatusCell: React.FC<FeeStatusCellProps> = ({
  feeStatus = 'Pending',
  feeAmount,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressWidth = () => {
    if (!feeAmount) return '0%';
    const percentage = (feeAmount.paid / feeAmount.total) * 100;
    return `${Math.min(percentage, 100)}%`;
  };

  const getProgressColor = () => {
    switch (feeStatus) {
      case 'Paid':
        return 'bg-green-500';
      case 'Partial':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <div className='space-y-2'>
      <div
        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feeStatus)}`}
      >
        {feeStatus}
      </div>

      {feeAmount && (
        <>
          <div className='text-sm text-gray-900'>
            ${feeAmount.paid.toLocaleString()} / $
            {feeAmount.total.toLocaleString()}
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className={`h-2 rounded-full ${getProgressColor()}`}
              style={{ width: getProgressWidth() }}
            ></div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeeStatusCell;
