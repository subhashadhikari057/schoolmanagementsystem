'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import { Users, DollarSign, GraduationCap, Briefcase } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import SalaryTable from './SalaryTable';

const stats = [
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
    name: 'Teachers',
    icon: <GraduationCap className='h-4 w-4 mr-2' />,
    content: <SalaryTable employeeType='teacher' />,
  },
  {
    name: 'Staff',
    icon: <Briefcase className='h-4 w-4 mr-2' />,
    content: <SalaryTable employeeType='staff' />,
  },
];

const ExpensesandSalaries = () => {
  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='pt-3'>
        <div className='w-full'>
          <h1 className='text-xl font-bold text-gray-900'>Salary Management</h1>
          <p className='text-sm text-gray-600 mt-1'>
            Manage All Salary Related Information Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='mt-3'>
        <div className='w-full'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {stats.map(stat => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className='mt-4'>
        <div className='w-full'>
          <GenericTabs tabs={tabs} defaultIndex={0} />
        </div>
      </div>
    </div>
  );
};

export default ExpensesandSalaries;
