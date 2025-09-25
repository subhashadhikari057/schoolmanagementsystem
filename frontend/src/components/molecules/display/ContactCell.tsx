import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactCellProps {
  email?: string;
  phone?: string;
  address?: string;
}

const ContactCell: React.FC<ContactCellProps> = ({ email, phone, address }) => {
  return (
    <div className='space-y-1 min-w-0'>
      {email && (
        <div className='flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0'>
          <Mail className='h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
          <span className='text-gray-900 truncate break-all'>{email}</span>
        </div>
      )}
      {phone && (
        <div className='flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0'>
          <Phone className='h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
          <span className='text-gray-900 truncate'>{phone}</span>
        </div>
      )}
      {address && (
        <div className='flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0'>
          <MapPin className='h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0 mt-0.5' />
          <span className='text-gray-600 line-clamp-2 break-words'>
            {address}
          </span>
        </div>
      )}
      {!email && !phone && !address && (
        <span className='text-gray-500 text-xs sm:text-sm'>
          No contact info
        </span>
      )}
    </div>
  );
};

export default ContactCell;
