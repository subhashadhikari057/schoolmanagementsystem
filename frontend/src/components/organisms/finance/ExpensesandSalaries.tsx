'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import ExpensesTab from './ExpensesTab';
import SalaryTab from './SalaryTab';

const stats = [
  {
    label: 'Total Expenses',
    value: '$1.2M',
    icon: DollarSign,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    change: '+$50K',
    isPositive: false,
  },
  {
    label: 'Monthly Average',
    value: '$100K',
    icon: TrendingUp,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    change: '+$5K',
    isPositive: true,
  },
  {
    label: 'Total Salaries',
    value: '$900K',
    icon: DollarSign,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    change: '+$20K',
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
