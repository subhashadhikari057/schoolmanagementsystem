import React from 'react';

interface PersonalInfoCellProps {
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  languagesKnown?: string[];
}

const PersonalInfoCell: React.FC<PersonalInfoCellProps> = ({
  dateOfBirth,
  gender,
  bloodGroup,
  languagesKnown,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <div className='space-y-1'>
      {dateOfBirth && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>🎂</span>
          <span className='text-gray-600'>
            {formatDate(dateOfBirth)} ({calculateAge(dateOfBirth)} yrs)
          </span>
        </div>
      )}

      {gender && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>👤</span>
          <span className='text-gray-600'>{gender}</span>
        </div>
      )}

      {bloodGroup && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-red-500'>🩸</span>
          <span className='text-gray-600'>{bloodGroup}</span>
        </div>
      )}

      {languagesKnown && languagesKnown.length > 0 && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>🗣️</span>
          <span className='text-gray-600'>
            {languagesKnown.slice(0, 2).join(', ')}
          </span>
          {languagesKnown.length > 2 && (
            <span className='text-gray-500'>+{languagesKnown.length - 2}</span>
          )}
        </div>
      )}

      {!dateOfBirth &&
        !gender &&
        !bloodGroup &&
        (!languagesKnown || languagesKnown.length === 0) && (
          <span className='text-gray-500 text-sm'>No personal info</span>
        )}
    </div>
  );
};

export default PersonalInfoCell;
