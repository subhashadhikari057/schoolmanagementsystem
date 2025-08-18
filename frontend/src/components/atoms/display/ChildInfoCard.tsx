import React from 'react';
import Avatar from './Avatar';

interface ChildInfoCardProps {
  child:
    | {
        id: string;
        name: string;
        class: string;
        section: string;
        rollNumber: string;
        profilePic: string;
      }
    | undefined;
}

const ChildInfoCard: React.FC<ChildInfoCardProps> = ({ child }) => {
  if (!child) return null;
  return (
    <div className='flex items-center gap-6 mb-8 bg-white rounded-lg shadow p-6'>
      <Avatar
        src={child.profilePic}
        name={child.name}
        className='w-16 h-16 rounded-full object-cover border'
      />
      <div>
        <div className='font-bold text-lg'>{child.name}</div>
        <div className='text-gray-600'>
          Class {child.class}
          {child.section} • Roll No: {child.rollNumber}
        </div>
      </div>
    </div>
  );
};

export default ChildInfoCard;
