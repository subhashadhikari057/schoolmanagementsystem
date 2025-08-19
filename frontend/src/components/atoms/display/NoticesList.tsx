import React from 'react';

interface Notice {
  id: string;
  title: string;
  forClass: string;
}

interface NoticesListProps {
  notices: Notice[];
}

const NoticesList: React.FC<NoticesListProps> = ({ notices }) => (
  <div className='bg-white rounded-lg shadow p-6'>
    <h2 className='text-lg font-semibold mb-4'>School Notices</h2>
    <ul className='space-y-2'>
      {notices.map(notice => (
        <li key={notice.id} className='flex items-center gap-2'>
          <span className='font-medium'>{notice.title}</span>
          {notice.forClass !== 'All' && (
            <span className='bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded'>
              For {notice.forClass}
            </span>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default NoticesList;
