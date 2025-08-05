import React from 'react';
import Avatar from '@/components/atoms/display/Avatar';

interface ParentInfoCellProps {
  name: string;
  relation?: string;
  job?: string;
  avatar?: string;
}

const ParentInfoCell: React.FC<ParentInfoCellProps> = ({
  name,
  relation,
  job,
  avatar,
}) => {
  return (
    <div className='flex items-center gap-3'>
      <Avatar
        src={avatar}
        name={name}
        className='w-10 h-10'
        showInitials={true}
      />
      <div>
        <div className='font-medium text-gray-900'>{name}</div>
        <div className='text-sm text-gray-500'>
          {relation && job
            ? `${relation} • ${job}`
            : relation || job || 'Parent'}
        </div>
      </div>
    </div>
  );
};

export default ParentInfoCell;
