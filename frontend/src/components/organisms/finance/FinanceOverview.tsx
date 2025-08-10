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
    content: <OverviewTab />,
  },
  {
    name: 'Transactions',
    content: <TransactionsTab />,
  },
  {
    name: 'Analytics',
    content: <div>Dues content coming soon</div>,
  },
  {
    name: 'Reports',
    content: <div>Dues content coming soon</div>,
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
