import React from 'react';

interface QualificationCellProps {
  qualification?: string;
  specialization?: string;
  experienceYears?: number;
}

const QualificationCell: React.FC<QualificationCellProps> = ({
  qualification,
  specialization,
  experienceYears,
}) => {
  return (
    <div className='space-y-1'>
      {qualification && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>🎓</span>
          <span className='text-gray-900'>{qualification}</span>
        </div>
      )}

      {specialization && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>⭐</span>
          <span className='text-gray-600'>{specialization}</span>
        </div>
      )}

      {experienceYears && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>📊</span>
          <span className='text-gray-600'>{experienceYears} years exp.</span>
        </div>
      )}

      {!qualification && !specialization && !experienceYears && (
        <span className='text-gray-500 text-sm'>No qualification info</span>
      )}
    </div>
  );
};

export default QualificationCell;
