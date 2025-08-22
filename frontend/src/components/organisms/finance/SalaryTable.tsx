import React from 'react';
import GenericList from '@/components/templates/GenericList';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';

const salaryListConfig = {
  title: 'Salaries',
  searchPlaceholder: 'Search salaries...',
  primaryFilter: {
    title: 'Status',
    options: [
      { value: 'all', label: 'All' },
      { value: 'paid', label: 'Paid' },
      { value: 'pending', label: 'Pending' },
    ],
  },
  secondaryFilter: {
    title: 'Role',
    options: [
      { value: 'all', label: 'All' },
      { value: 'teacher', label: 'Teacher' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'staff', label: 'Staff' },
    ],
  },
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' },
    { key: 'amount', header: 'Amount' },
    { key: 'date', header: 'Date' },
    { key: 'status', header: 'Status' },
  ],
  emptyMessage: 'No salaries found.',
};

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

const SalaryTable = () => (
  <div className='space-y-6 bg-white'>
    <GenericList
      config={salaryListConfig}
      data={salaryData}
      currentPage={1}
      totalPages={1}
      totalItems={salaryData.length}
      itemsPerPage={10}
      customActions={<ActionButtons pageType='fee-management' />}
    />
  </div>
);

export default SalaryTable;
