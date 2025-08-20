import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import ExpensesTable from './ExpensesTable';

const expenseStats = [
  {
    label: 'Total Expenses',
    value: '$1.2M',
    icon: StatCard,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    change: '+$50K',
    isPositive: false,
  },
  {
    label: 'Monthly Average',
    value: '$100K',
    icon: StatCard,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    change: '+$5K',
    isPositive: true,
  },
];

const expenseData = [
  {
    id: 1,
    category: 'Utilities',
    amount: 12000,
    date: '2025-08-01',
    status: 'Paid',
  },
  {
    id: 2,
    category: 'Maintenance',
    amount: 8000,
    date: '2025-08-05',
    status: 'Pending',
  },
  {
    id: 3,
    category: 'Supplies',
    amount: 5000,
    date: '2025-08-10',
    status: 'Paid',
  },
];

const ExpensesTab = () => {
  return (
    <div className='space-y-6'>
      {/* StatCards moved to parent component */}
      <ExpensesTable />
    </div>
  );
};

export default ExpensesTab;
