import React from 'react';

interface RoleDepartmentCellProps {
  position: string;
  department: string;
}

const RoleDepartmentCell: React.FC<RoleDepartmentCellProps> = ({
  position,
  department,
}) => {
  return (
    <div className='space-y-1'>
      <div className='font-medium text-gray-900 text-sm'>{position}</div>
      <div className='text-sm text-gray-500'>{department}</div>
    </div>
  );
};

export { RoleDepartmentCell };
export default RoleDepartmentCell;
