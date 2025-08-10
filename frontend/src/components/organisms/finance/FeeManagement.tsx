'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react';
import GenericList from '@/components/templates/GenericList';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { getListConfig } from '@/components/templates/listConfigurations';
import Tabs from '../tabs/GenericTabs';
import FeeTable from './Feetable';
const stats = [
  {
    label: 'Fee Structures',
    value: 12,
    icon: FileText,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    change: '+2',
    isPositive: true,
  },
  {
    label: 'Active Students',
    value: '2,847',
    icon: Users,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    change: '+120',
    isPositive: true,
  },
  {
    label: 'Total Fees/Year',
    value: '$2.8M',
    icon: DollarSign,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    change: '+$100K',
    isPositive: true,
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

const FeeManagement = () => {
  const listConfig = getListConfig('fee-management');

  const tabs = [
    {
      name: 'Fee Structure',
      content: <FeeTable />,
    },
    {
      name: 'Security',
      content: <div>coming soon</div>,
    },
    {
      name: 'Notifications',
      content: <div>coming soon</div>,
    },
  ]; // You will need to add this config in listConfigurations

  // Mock data for demonstration
  const mockData = [
    {
      id: 1,
      structureName: 'Grade 10 - Annual Fee Structure',
      grade: 'Grade 10',
      year: '2024-25',
      total: 12500,
      components: 6,
      assignment: 285,
      revenue: 3562500,
      schedule: '4 installments',
      nextPayment: '2024-04-15',
      lateFee: 50,
      status: 'Active',
    },
    {
      id: 2,
      structureName: 'Grade 11 - Science Stream',
      grade: 'Grade 11',
      year: '2024-25',
      total: 15000,
      components: 5,
      assignment: 156,
      revenue: 2340000,
      schedule: '4 installments',
      nextPayment: '2024-04-15',
      lateFee: 75,
      status: 'Active',
    },
    {
      id: 3,
      structureName: 'Grade 12 - Final Year Package',
      grade: 'Grade 12',
      year: '2024-25',
      total: 18000,
      components: 6,
      assignment: 0,
      revenue: 0,
      schedule: '4 installments',
      nextPayment: '2024-04-15',
      lateFee: 100,
      status: 'Draft',
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
};

export default FeeManagement;
