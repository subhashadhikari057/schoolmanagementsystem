import React from 'react';

interface ExperienceSalaryCellProps {
  experience?: string;
  experienceYears?: number;
  joiningDate?: string | Date;
  joinedDate?: string;
  salary?: number;
  totalSalary?: number;
  basicSalary?: number;
  allowances?: number;
  bankName?: string;
  bankAccountNumber?: string;
}

const ExperienceSalaryCell: React.FC<ExperienceSalaryCellProps> = ({
  experience,
  experienceYears,
  joiningDate,
  joinedDate,
  salary,
  totalSalary,
  basicSalary,
  allowances,
  bankName,
  bankAccountNumber,
}) => {
  const displaySalary = totalSalary || basicSalary || salary;
  const displayJoinedDate = joiningDate
    ? typeof joiningDate === 'string'
      ? joiningDate
      : joiningDate.toISOString().split('T')[0]
    : joinedDate;

  return (
    <div className='space-y-1'>
      {/* Salary Display */}
      {displaySalary && (
        <div className='text-sm font-medium text-green-600'>
          Rs. {displaySalary.toLocaleString()}
        </div>
      )}

      {/* Basic + Allowances breakdown if available */}
      {basicSalary && allowances && (
        <div className='text-xs text-gray-500'>
          Basic: Rs. {basicSalary.toLocaleString()} + Allowances: Rs.{' '}
          {allowances.toLocaleString()}
        </div>
      )}

      {/* Experience */}
      {(experienceYears || experience) && (
        <div className='text-xs text-gray-500'>
          {experienceYears ? `${experienceYears} years experience` : experience}
        </div>
      )}

      {/* Joining Date */}
      {displayJoinedDate && (
        <div className='text-xs text-gray-500'>
          Joined: {new Date(displayJoinedDate).toLocaleDateString()}
        </div>
      )}

      {/* Bank Information */}
      {bankName && (
        <div className='text-xs text-gray-500'>Bank: {bankName}</div>
      )}

      {bankAccountNumber && (
        <div className='text-xs text-gray-500'>A/C: {bankAccountNumber}</div>
      )}

      {!displaySalary &&
        !experienceYears &&
        !experience &&
        !displayJoinedDate && (
          <span className='text-gray-500 text-sm'>No info available</span>
        )}
    </div>
  );
};

export { ExperienceSalaryCell };
export default ExperienceSalaryCell;
