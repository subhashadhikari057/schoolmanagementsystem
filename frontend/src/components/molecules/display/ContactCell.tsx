import React from 'react';

interface ContactCellProps {
  email?: string;
  phone?: string;
  address?: string;
}

const ContactCell: React.FC<ContactCellProps> = ({ email, phone, address }) => {
  return (
    <div className='space-y-1'>
      {email && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>✉</span>
          <span className='text-gray-900'>{email}</span>
        </div>
      )}
      {phone && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>📞</span>
          <span className='text-gray-900'>{phone}</span>
        </div>
      )}
      {address && (
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>📍</span>
          <span className='text-gray-600'>{address}</span>
        </div>
      )}
      {!email && !phone && !address && (
        <span className='text-gray-500 text-sm'>No contact info</span>
      )}
    </div>
  );
};

export default ContactCell;
