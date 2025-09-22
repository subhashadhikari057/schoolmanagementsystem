import React from 'react';
import Avatar from '@/components/atoms/display/Avatar';

interface UserInfoCellProps {
  name: string;
  id: string | number;
  avatar?: string;
  idLabel?: string; // e.g., "STF", "STU", "PAR"
  role?: 'student' | 'teacher' | 'staff' | 'parent' | 'admin';
  hideId?: boolean; // Optional prop to hide the ID display
}

const UserInfoCell: React.FC<UserInfoCellProps> = ({
  name,
  id,
  avatar,
  idLabel = '',
  role = 'student',
  hideId = false,
}) => {
  const displayId = idLabel ? `${idLabel}${id}` : String(id);

  return (
    <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
      <Avatar
        src={avatar}
        name={name}
        className='flex-shrink-0'
        size='md'
        role={role}
        context='list-table'
      />
      <div className='min-w-0 flex-1'>
        <div className='font-medium text-gray-900 truncate text-sm sm:text-base leading-tight'>
          {name}
        </div>
        {!hideId && (
          <div className='text-xs sm:text-sm text-gray-500 truncate'>
            {displayId}
          </div>
        )}
      </div>
    </div>
  );
};

export { UserInfoCell };
export default UserInfoCell;
