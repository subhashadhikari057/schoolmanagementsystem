import React from 'react';
import Avatar from '@/components/atoms/display/Avatar';

interface UserInfoCellProps {
  name: string;
  id: string | number;
  avatar?: string;
  idLabel?: string; // e.g., "STF", "STU", "PAR"
}

const UserInfoCell: React.FC<UserInfoCellProps> = ({
  name,
  id,
  avatar,
  idLabel = '',
}) => {
  const displayId = idLabel ? `${idLabel}${id}` : String(id);

  return (
    <div className='flex items-center gap-3'>
      <Avatar
        src={avatar}
        name={name}
        className='w-10 h-10 rounded-full flex-shrink-0'
        showInitials={!avatar}
      />
      <div className='min-w-0 flex-1'>
        <div className='font-medium text-gray-900 truncate'>{name}</div>
        <div className='text-sm text-gray-500 truncate'>{displayId}</div>
      </div>
    </div>
  );
};

export default UserInfoCell;
