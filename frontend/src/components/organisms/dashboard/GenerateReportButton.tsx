import React from 'react';
import { ToggleButton } from '@/components/atoms/interactive';

export default function GenerateReportButton() {
  return (
    <ToggleButton className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600'>
      <div className='flex items-center gap-2'>
        <span className='inline-block align-middle mr-2'>
          <svg
            width='24'
            height='24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            viewBox='0 0 24 24'
          >
            <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
            <polyline points='14 2 14 8 20 8' />
            <line x1='16' y1='13' x2='8' y2='13' />
            <line x1='16' y1='17' x2='8' y2='17' />
            <polyline points='10 9 9 9 8 9' />
          </svg>
        </span>
        Generate Report
      </div>
    </ToggleButton>
  );
}
