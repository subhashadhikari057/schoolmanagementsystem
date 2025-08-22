import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import SalaryTable from './SalaryTable';

const salaryStats = [
  {
    label: 'Total Salaries',
    value: '$900K',
    icon: StatCard,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    change: '+$20K',
    isPositive: true,
  },
  {
    label: 'Staff Count',
    value: '120',
    icon: StatCard,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    change: '+5',
    isPositive: true,
  },
];

const salaryData = [
  {
    id: 1,
    name: 'John Doe',
    role: 'Teacher',
    amount: 7500,
    date: '2025-08-01',
    status: 'Paid',
  },
  {
    id: 2,
    name: 'Jane Smith',
    role: 'Accountant',
    amount: 6500,
    date: '2025-08-01',
    status: 'Paid',
  },
  {
    id: 3,
    name: 'Sam Wilson',
    role: 'Staff',
    amount: 5000,
    date: '2025-08-01',
    status: 'Pending',
  },
];

const SalaryTab = () => {
  return (
    <div className='space-y-6'>
      <SalaryTable />
    </div>
  );
};

export default SalaryTab;
