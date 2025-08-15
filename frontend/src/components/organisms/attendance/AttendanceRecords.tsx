import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface AttendanceRecord {
  id: string;
  present: number;
  total: number;
  date: string;
  isToday?: boolean;
}

interface AttendanceRecordsProps {
  records: AttendanceRecord[];
  className?: string;
}

export default function AttendanceRecords({
  records,
  className,
}: AttendanceRecordsProps) {
  // Helper function to create URL-friendly date strings
  const getDateSlug = (date: string) => {
    if (date === 'Today') return 'today';
    return date
      .toLowerCase()
      .replace(/[,\s]/g, '-')
      .replace(/[st|nd|rd|th]/g, '');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className='flex items-center justify-between'>
        <SectionTitle
          text='Records'
          level={3}
          className='text-lg font-semibold text-gray-900'
        />
        <Label className='text-blue-600 hover:text-blue-800 cursor-pointer'>
          View All
        </Label>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {records.map(record => (
          <Link
            key={record.id}
            href={`/dashboard/teacher/academics/attendance/${getDateSlug(record.date)}`}
            className='block'
          >
            <div className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
              <div className='flex items-start justify-between'>
                <div className='space-y-2'>
                  <span className='inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full'>
                    {record.present}/{record.total} present
                  </span>
                  <div className='text-sm font-medium text-gray-900'>
                    {record.date}
                  </div>
                </div>
                <ArrowUpRight className='w-4 h-4 text-gray-500' />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
