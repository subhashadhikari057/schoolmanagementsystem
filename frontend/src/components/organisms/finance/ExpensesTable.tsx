import React from 'react';
import GenericList from '@/components/templates/GenericList';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';

const expenseListConfig = {
  title: 'Expenses',
  searchPlaceholder: 'Search expenses...',
  primaryFilter: {
    title: 'Status',
    options: [
      { value: 'all', label: 'All' },
      { value: 'paid', label: 'Paid' },
      { value: 'pending', label: 'Pending' },
    ],
  },
  secondaryFilter: {
    title: 'Category',
    options: [
      { value: 'all', label: 'All' },
      { value: 'utilities', label: 'Utilities' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'supplies', label: 'Supplies' },
    ],
  },
  columns: [
    { key: 'category', header: 'Category' },
    { key: 'amount', header: 'Amount' },
    { key: 'date', header: 'Date' },
    { key: 'status', header: 'Status' },
  ],
  emptyMessage: 'No expenses found.',
};

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

const ExpensesTable = () => (
  <div className='space-y-6 bg-white'>
    <GenericList
      config={expenseListConfig}
      data={expenseData}
      currentPage={1}
      totalPages={1}
      totalItems={expenseData.length}
      itemsPerPage={10}
      customActions={<ActionButtons pageType='fee-management' />}
    />
  </div>
);

export default ExpensesTable;
