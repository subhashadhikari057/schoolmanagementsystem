'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import OverviewTab from '@/components/organisms/finance/OverviewTab';
import TransactionsTab from '@/components/organisms/finance/TransactionsTab';

const stats = [
  {
    label: 'Total Students',
    value: '2,847',
    icon: Users,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    change: '+120',
    isPositive: true,
  },
  {
    label: 'Total Fees Collected',
    value: '$2.8M',
    icon: DollarSign,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    change: '+$100K',
    isPositive: true,
  },
  {
    label: 'Pending Dues',
    value: '$120K',
    icon: FileText,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    change: '-$10K',
    isPositive: false,
  },
  {
    label: 'Collection Rate',
    value: '94.2%',
    icon: TrendingUp,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    change: '+1.2%',
    isPositive: true,
  },
];

const tabs = [
  {
    name: 'Overview',
    content: (
      <OverviewTab
        collectionSummary={{
          totalExpected: 2847500,
          collected: 2662300,
          outstanding: 185200,
          overdue: 45600,
          collectedPercent: 93.5,
        }}
        paymentMethods={[
          {
            label: 'Online Payments',
            value: 1847200,
            percent: 69.4,
            color: '#2F80ED',
            icon: (
              <span className='inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2'>
                <svg
                  width='18'
                  height='18'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <rect x='3' y='7' width='18' height='13' rx='2' />
                  <path d='M16 3v4M8 3v4' />
                </svg>
              </span>
            ),
          },
          {
            label: 'Bank Transfer',
            value: 542100,
            percent: 20.4,
            color: '#22C55E',
            icon: (
              <span className='inline-block w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2'>
                <svg
                  width='18'
                  height='18'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path d='M3 10v10h18V10' />
                  <path d='M12 2L2 7h20L12 2z' />
                </svg>
              </span>
            ),
          },
          {
            label: 'Cash/Cheque',
            value: 273000,
            percent: 10.2,
            color: '#A78BFA',
            icon: (
              <span className='inline-block w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2'>
                <svg
                  width='18'
                  height='18'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <rect x='2' y='7' width='20' height='10' rx='2' />
                  <path d='M6 11h.01M18 11h.01' />
                </svg>
              </span>
            ),
          },
        ]}
        gradeCollections={[
          {
            grade: 'Grade 9',
            students: 712,
            collected: 589400,
            total: 623000,
            percent: 94.6,
          },
          {
            grade: 'Grade 10',
            students: 689,
            collected: 645200,
            total: 690800,
            percent: 93.4,
          },
          {
            grade: 'Grade 11',
            students: 756,
            collected: 702100,
            total: 756000,
            percent: 92.9,
          },
          {
            grade: 'Grade 12',
            students: 690,
            collected: 725600,
            total: 777700,
            percent: 93.3,
          },
        ]}
      />
    ),
  },
  {
    name: 'Transactions',
    content: <TransactionsTab />,
  },
];

const FinanceOverview = () => {
  return (
    <div className='space-y-6'>
      <SectionTitle level={1} text='Finance Overview' />
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
};

export default FinanceOverview;
