'use client';

import React, { useState, useMemo } from 'react';
import GenericList, { BaseItem } from '@/components/templates/GenericList';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';

interface ExpenseData extends BaseItem {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  vendor?: string;
  reference?: string;
  [key: string]: unknown;
}

const allExpenseData: ExpenseData[] = [
  {
    id: 1,
    category: 'Utilities',
    description: 'Electricity bill for main building',
    amount: 12000,
    date: '2025-08-01',
    status: 'Paid',
    vendor: 'Power Company Ltd',
    reference: 'INV-2025-001',
  },
  {
    id: 2,
    category: 'Maintenance',
    description: 'Plumbing repair in classroom block',
    amount: 8000,
    date: '2025-08-05',
    status: 'Pending',
    vendor: 'ABC Plumbing Services',
    reference: 'REP-2025-045',
  },
  {
    id: 3,
    category: 'Supplies',
    description: 'Office stationery and printing materials',
    amount: 5000,
    date: '2025-08-10',
    status: 'Paid',
    vendor: 'Office Depot',
    reference: 'ORD-2025-123',
  },
];

const ExpensesTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const expenseListConfig = {
    title: 'Expenses',
    searchPlaceholder: 'Search expenses...',
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    primaryFilter: {
      title: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: 'All' },
        { value: 'paid', label: 'Paid' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    secondaryFilter: {
      title: 'Category',
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: [
        { value: 'all', label: 'All' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'transport', label: 'Transport' },
        { value: 'equipment', label: 'Equipment' },
      ],
    },
    columns: [
      { key: 'description', header: 'Description' },
      { key: 'category', header: 'Category' },
      {
        key: 'amount',
        header: 'Amount',
        render: (item: ExpenseData) => (
          <span className='font-semibold text-green-600'>
            ${item.amount.toLocaleString()}
          </span>
        ),
      },
      { key: 'date', header: 'Date' },
      {
        key: 'status',
        header: 'Status',
        render: (item: ExpenseData) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.status === 'Paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {item.status}
          </span>
        ),
      },
    ],
    emptyMessage: 'No expenses found.',
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filtered = allExpenseData;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        expense =>
          expense.description.toLowerCase().includes(searchLower) ||
          expense.category.toLowerCase().includes(searchLower) ||
          expense.vendor?.toLowerCase().includes(searchLower) ||
          expense.reference?.toLowerCase().includes(searchLower) ||
          expense.status.toLowerCase().includes(searchLower) ||
          expense.amount.toString().includes(searchLower),
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        expense => expense.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        expense =>
          expense.category.toLowerCase() === categoryFilter.toLowerCase(),
      );
    }

    return filtered;
  }, [searchTerm, statusFilter, categoryFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  return (
    <div className='space-y-6 bg-white'>
      <GenericList
        config={expenseListConfig}
        data={paginatedData}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        customActions={<ActionButtons pageType='expenses' />}
      />
    </div>
  );
};

export default ExpensesTable;
