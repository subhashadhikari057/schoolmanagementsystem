import React from 'react';

interface QualificationCellProps {
  qualification?: string;
  specialization?: string;
  experienceYears?: number;
  gender?: string;
  bloodGroup?: string;
  dob?: string | Date;
  maritalStatus?: string;
}

const QualificationCell: React.FC<QualificationCellProps> = ({
  qualification,
  specialization,
  experienceYears,
  gender,
  bloodGroup,
  dob,
  maritalStatus,
}) => {
  return (
    <div className='space-y-1'>
      {/* Qualification */}
      <div className='text-sm font-medium text-gray-900'>
        {qualification || 'Not Specified'}
      </div>

      {/* Specialization */}
      {specialization && (
        <div className='text-xs text-gray-600'>
          Specialization: {specialization}
        </div>
      )}

      {/* Experience Years */}
      {experienceYears && (
        <div className='text-xs text-gray-500'>
          {experienceYears} years experience
        </div>
      )}

      {/* Personal Information Badges */}
      <div className='flex gap-1 flex-wrap'>
        {gender && (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            {gender}
          </span>
        )}
        {bloodGroup && (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            {bloodGroup}
          </span>
        )}
        {maritalStatus && (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
            {maritalStatus}
          </span>
        )}
      </div>

      {/* Date of Birth */}
      {dob && (
        <div className='text-xs text-gray-500'>
          DOB: {new Date(dob).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default QualificationCell;
