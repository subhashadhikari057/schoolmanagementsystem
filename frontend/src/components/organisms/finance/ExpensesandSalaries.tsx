'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import AssetTab from './AssetTab';
import ExpensesTab from './ExpensesTab';
import SalaryTab from './SalaryTab';

const stats = [
  {
    label: 'Total Expenses',
    value: 'NPR 12M',
    icon: DollarSign,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    change: '+NPR 500K',
    isPositive: false,
  },
  {
    label: 'Monthly Average',
    value: 'NPR 1M',
    icon: TrendingUp,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    change: '+NPR 50K',
    isPositive: true,
  },
  {
    label: 'Total Salaries',
    value: 'NPR 9M',
    icon: DollarSign,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    change: '+NPR 200K',
    isPositive: true,
  },
  {
    label: 'Staff Count',
    value: '120',
    icon: Users,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    change: '+5',
    isPositive: true,
  },
];

const tabs = [
  {
    name: 'Expenses',
    content: <ExpensesTab />,
  },
  {
    name: 'Salaries',
    content: <SalaryTab />,
  },
  {
    name: 'Asset Management',
    content: <AssetTab />,
  },
];

const ExpensesandSalaries = () => {
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

export default ExpensesandSalaries;
