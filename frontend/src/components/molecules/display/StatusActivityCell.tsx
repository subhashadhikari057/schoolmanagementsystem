import React from 'react';

interface StatusActivityCellProps {
  status: string;
  employmentStatus?: string;
  isOnline?: boolean;
  lastActivity?: string;
  emergencyContact?: string;
  citizenshipNumber?: string;
  panNumber?: string;
}

const StatusActivityCell: React.FC<StatusActivityCellProps> = ({
  status,
  employmentStatus,
  isOnline,
  lastActivity,
  emergencyContact,
  citizenshipNumber,
  panNumber,
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

  const getEmploymentStatusColor = (employmentStatus: string) => {
    switch (employmentStatus.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Use employment status if available, otherwise use status
  const displayStatus = employmentStatus
    ? employmentStatus.charAt(0).toUpperCase() + employmentStatus.slice(1)
    : status;
  const statusColor = employmentStatus
    ? getEmploymentStatusColor(employmentStatus)
    : getStatusColor(status);

  return (
    <div className='space-y-1 min-w-0'>
      <div className='flex items-center gap-1 sm:gap-2'>
        <span
          className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${statusColor} whitespace-nowrap`}
        >
          {displayStatus}
        </span>
      </div>
      {isOnline !== undefined && (
        <div className='flex items-center gap-1 text-xs text-gray-500'>
          <div
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'} flex-shrink-0`}
          ></div>
          <span className='whitespace-nowrap'>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      )}
      {emergencyContact && (
        <div className='text-xs text-gray-500 truncate'>
          Emergency: {emergencyContact}
        </div>
      )}
      {citizenshipNumber && (
        <div className='text-xs text-gray-500 truncate'>
          ID: {citizenshipNumber}
        </div>
      )}
      {panNumber && (
        <div className='text-xs text-gray-500 truncate'>PAN: {panNumber}</div>
      )}
    </div>
  );
};

export { StatusActivityCell };
export default StatusActivityCell;
