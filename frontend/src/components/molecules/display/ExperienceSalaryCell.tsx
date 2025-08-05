import React from 'react';

interface ExperienceSalaryCellProps {
  experience?: string;
  joinedDate?: string;
  salary?: number;
}

const ExperienceSalaryCell: React.FC<ExperienceSalaryCellProps> = ({
  experience,
  joinedDate,
  salary,
}) => {
  return (
    <div className='space-y-1'>
      {experience && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>📅</span>
          <span className='text-gray-900'>{experience}</span>
        </div>
      )}

      {joinedDate && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>🏢</span>
          <span className='text-gray-600'>Joined: {joinedDate}</span>
        </div>
      )}

      {salary && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-green-600'>$</span>
          <span className='font-medium text-gray-900'>
            {salary.toLocaleString()}
          </span>
        </div>
      )}

      {!experience && !joinedDate && !salary && (
        <span className='text-gray-500 text-sm'>No info available</span>
      )}
    </div>
  );
};

export default ExperienceSalaryCell;
