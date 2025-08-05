import React from 'react';

interface ClassSectionCellProps {
  grade?: string;
  section?: string;
  class?: string; // fallback for existing data
}

const ClassSectionCell: React.FC<ClassSectionCellProps> = ({
  grade,
  section,
  class: classInfo,
}) => {
  // Use grade/section if available, otherwise fallback to class
  const displayGrade = grade || classInfo?.split(' ')[0] || 'N/A';
  const displaySection = section || classInfo?.split(' ')[1] || '';

  return (
    <div>
      <div className='font-medium text-gray-900'>{displayGrade}</div>
      {displaySection && (
        <div className='text-sm text-gray-500'>Section {displaySection}</div>
      )}
    </div>
  );
};

export default ClassSectionCell;
