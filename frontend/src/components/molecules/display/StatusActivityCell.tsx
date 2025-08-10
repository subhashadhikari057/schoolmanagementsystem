import React from 'react';

interface StatusActivityCellProps {
  status: string;
  isOnline?: boolean;
  lastActivity?: string;
}

const StatusActivityCell: React.FC<StatusActivityCellProps> = ({
  status,
  isOnline,
  lastActivity,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
        >
          {status}
        </span>
      </div>
      {isOnline !== undefined && (
        <div className='flex items-center gap-1 text-xs text-gray-500'>
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}
          ></div>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      )}
    </div>
  );
};

export { StatusActivityCell };
export default StatusActivityCell;
