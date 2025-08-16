import React from 'react';

interface ClassSectionCellProps {
  grade?: string;
  section?: string;
  class?: string | object; // fallback for existing data, can be string or object
}

const ClassSectionCell: React.FC<ClassSectionCellProps> = ({
  grade,
  section,
  class: classInfo,
}) => {
  // Handle class information more robustly
  let displayGrade = grade;
  let displaySection = section;

  // If classInfo is provided and we don't have grade/section
  if (classInfo && (!displayGrade || !displaySection)) {
    if (typeof classInfo === 'string') {
      // Parse string format like "Grade 10 A" or "10A"
      const parts = classInfo.split(' ');
      if (!displayGrade) {
        displayGrade = parts[0] === 'Grade' ? parts[1] : parts[0];
      }
      if (!displaySection) {
        displaySection = parts[0] === 'Grade' ? parts[2] : parts[1];
      }
    } else if (typeof classInfo === 'object' && classInfo !== null) {
      // Handle class object with grade and section properties
      const classObj = classInfo as {
        grade?: number | string;
        section?: string;
      };
      if (!displayGrade && classObj.grade) {
        displayGrade = `Grade ${classObj.grade}`;
      }
      if (!displaySection && classObj.section) {
        displaySection = classObj.section;
      }
    }
  }

  // Fallback values
  displayGrade = displayGrade || 'N/A';

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
