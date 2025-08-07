import React from 'react';

interface AttendanceCellProps {
  attendance?: {
    present: number;
    total: number;
  };
}

const AttendanceCell: React.FC<AttendanceCellProps> = ({ attendance }) => {
  if (!attendance) {
    return <span className='text-gray-500 text-sm'>No data</span>;
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className='space-y-2'>
      <div className='text-xs text-gray-500'>
        {attendance.present}/{attendance.total} days
      </div>
    </div>
  );
};

export default AttendanceCell;
