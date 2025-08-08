'use client';

import React from 'react';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { ActionButtons } from '@/components/atoms/interactive';

// SVG icon components
const FileText = () => (
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
);
const BarChart2 = () => (
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
    <line x1='18' y1='20' x2='18' y2='10' />
    <line x1='12' y1='20' x2='12' y2='4' />
    <line x1='6' y1='20' x2='6' y2='14' />
  </svg>
);
const User = () => (
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
    <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
    <circle cx='12' cy='7' r='4' />
  </svg>
);
const TrendingUp = () => (
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
    <polyline points='23 6 13.5 15.5 8.5 10.5 1 18' />
    <polyline points='17 6 23 6 23 12' />
  </svg>
);

const stats = [
  {
    icon: FileText,
    bgColor: 'bg-blue-500',
    iconColor: 'text-white',
    value: '12',
    label: 'Academic Reports',
    change: '',
    isPositive: true,
  },
  {
    icon: BarChart2,
    bgColor: 'bg-green-500',
    iconColor: 'text-white',
    value: '8',
    label: 'Financial Reports',
    change: '',
    isPositive: true,
  },
  {
    icon: User,
    bgColor: 'bg-purple-500',
    iconColor: 'text-white',
    value: '15',
    label: 'Student Reports',
    change: '',
    isPositive: true,
  },
  {
    icon: TrendingUp,
    bgColor: 'bg-orange-500',
    iconColor: 'text-white',
    value: '6',
    label: 'Performance Reports',
    change: '',
    isPositive: true,
  },
];

const quickReports = [
  'Student Attendance Report',
  'Fee Collection Summary',
  'Teacher Performance Report',
  'Exam Results Analysis',
  'Financial Statement',
  'Infrastructure Utilization',
];

const recentReports = [
  {
    title: 'Monthly Attendance Summary',
    status: 'Ready',
    type: 'Academic',
    desc: 'Comprehensive attendance analysis for July 2025',
    team: 'System',
    date: 'July 26, 2025',
    size: '2.4 MB',
  },
  {
    title: 'Financial Statement Q2',
    status: 'Ready',
    type: 'Financial',
    desc: 'Quarterly financial report for April-June 2025',
    team: 'Finance Team',
    date: 'July 25, 2025',
    size: '1.8 MB',
  },
  {
    title: 'Student Performance Analysis',
    status: 'Processing',
    type: 'Academic',
    desc: 'Academic performance metrics and trends',
    team: 'Academic Team',
    date: 'July 24, 2025',
    size: '3.2 MB',
  },
];

const statusColor: Record<string, string> = {
  Ready: 'bg-green-100 text-green-700',
  Processing: 'bg-yellow-100 text-yellow-700',
};
const typeColor: Record<string, string> = {
  Academic: 'bg-gray-100 text-gray-700',
  Financial: 'bg-blue-100 text-blue-700',
};

export default function ReportsDashboard() {
  return (
    <div className='space-y-6'>
      <Statsgrid stats={stats} />

      <div className='space-y-2'>
        <SectionTitle text='Generate Quick Reports' />
        <Label className='text-gray-500'>
          Create instant reports for common requirements
        </Label>
        <div className='grid grid-cols-3 gap-4 mt-2'>
          {quickReports.map((label, i) => (
            <div
              key={i}
              className='flex items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-md'
            >
              <span className='inline-block mr-2 align-middle'>
                <FileText />
              </span>
              <span className='font-medium'>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <SectionTitle text='Recent Reports' />
          <div className='flex items-center'>
            <ActionButtons pageType='reports' />
          </div>
        </div>
        <Label className='text-gray-500'>Generated reports and analytics</Label>
        <div className='space-y-4 mt-2'>
          {recentReports.map((r, i) => (
            <div
              key={i}
              className='flex flex-col gap-2 p-4 bg-white rounded-lg border border-gray-200'
            >
              <div className='flex items-center gap-3'>
                <span className='inline-block align-middle bg-blue-100 text-blue-600 rounded-lg p-2 text-xl'>
                  <FileText />
                </span>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold'>{r.title}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${statusColor[r.status]}`}
                    >
                      {r.status}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${typeColor[r.type]}`}
                    >
                      {r.type}
                    </span>
                  </div>
                  <div className='text-gray-500 text-sm'>{r.desc}</div>
                  <div className='flex items-center gap-4 text-xs text-gray-400 mt-1'>
                    <span>Generated by: {r.team}</span>
                    <span>Date: {r.date}</span>
                    <span>Size: {r.size}</span>
                  </div>
                </div>
                <div className='flex flex-col items-center gap-2'>
                  <span className='text-gray-400'>
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
                      <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
                      <line x1='16' y1='2' x2='16' y2='6' />
                      <line x1='8' y1='2' x2='8' y2='6' />
                      <line x1='3' y1='10' x2='21' y2='10' />
                    </svg>
                  </span>
                  <span className='text-gray-400 cursor-pointer'>
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
                      <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                      <polyline points='7 10 12 15 17 10' />
                      <line x1='12' y1='15' x2='12' y2='3' />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
